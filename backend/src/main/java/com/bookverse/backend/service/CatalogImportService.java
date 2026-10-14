package com.bookverse.backend.service;

import com.bookverse.backend.entity.Book;
import com.bookverse.backend.entity.Category;
import com.bookverse.backend.repository.BookRepository;
import com.bookverse.backend.repository.CategoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;

@Service
public class CatalogImportService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Search external books (Google Books + Open Library) with advanced query, category, and language filters.
     * Returns structured candidates with deduplication flags checked against MySQL.
     */
    public List<Map<String, Object>> searchExternalCatalog(String keyword, String category, String language, int startIndex, int maxResults) {
        List<Map<String, Object>> candidates = new ArrayList<>();
        int limit = Math.min(Math.max(maxResults, 10), 40);

        // Build Google Books query
        StringBuilder qBuilder = new StringBuilder();
        if (keyword != null && !keyword.trim().isEmpty()) {
            qBuilder.append(keyword.trim());
        }

        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) {
            if (qBuilder.length() > 0) qBuilder.append(" ");
            qBuilder.append("subject:\"").append(category.trim()).append("\"");
        }

        if (qBuilder.length() == 0) {
            qBuilder.append("bestseller");
        }

        String langCode = mapLanguageNameToCode(language);

        try {
            String encodedQ = URLEncoder.encode(qBuilder.toString(), StandardCharsets.UTF_8);
            String apiKey = System.getenv("GOOGLE_BOOKS_API_KEY");
            String url = "https://www.googleapis.com/books/v1/volumes?q=" + encodedQ +
                    "&startIndex=" + Math.max(0, startIndex) +
                    "&maxResults=" + limit +
                    "&printType=books" +
                    (langCode != null && !langCode.isEmpty() ? "&langRestrict=" + langCode : "") +
                    (apiKey != null && !apiKey.isEmpty() ? "&key=" + apiKey : "");

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "BookVerse-Catalog-Service/1.0")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        JsonNode vol = item.path("volumeInfo");
                        Map<String, Object> candidate = parseGoogleVolume(vol, category, language);
                        if (candidate != null) {
                            enrichCandidateWithDuplicateStatus(candidate);
                            candidates.add(candidate);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[CatalogImportService] Google Books search failed: " + e.getMessage());
        }

        // Fallback / supplement with Open Library if candidates are fewer than requested
        if (candidates.size() < limit / 2) {
            try {
                String olQuery = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : (category != null ? category : "fiction");
                String encodedOl = URLEncoder.encode(olQuery, StandardCharsets.UTF_8);
                int page = (startIndex / limit) + 1;
                String olUrl = "https://openlibrary.org/search.json?q=" + encodedOl + "&page=" + page + "&limit=" + limit;

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(olUrl))
                        .header("User-Agent", "BookVerse-Catalog-Service/1.0")
                        .timeout(Duration.ofSeconds(8))
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(resp.body());
                    JsonNode docs = root.path("docs");
                    if (docs.isArray()) {
                        for (JsonNode doc : docs) {
                            if (candidates.size() >= limit) break;
                            Map<String, Object> candidate = parseOpenLibraryDoc(doc, category, language);
                            if (candidate != null) {
                                enrichCandidateWithDuplicateStatus(candidate);
                                candidates.add(candidate);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[CatalogImportService] Open Library search failed: " + e.getMessage());
            }
        }

        return candidates;
    }

    private void enrichCandidateWithDuplicateStatus(Map<String, Object> candidate) {
        String isbn = (String) candidate.get("isbn");
        String title = (String) candidate.get("title");
        String author = (String) candidate.get("author");

        boolean existsByIsbn = isbn != null && !isbn.trim().isEmpty() && bookRepository.existsByIsbn(isbn.trim());
        boolean existsByTitleAndAuthor = title != null && author != null &&
                bookRepository.existsByTitleIgnoreCaseAndAuthorIgnoreCase(title.trim(), author.trim());

        candidate.put("isDuplicate", existsByIsbn || existsByTitleAndAuthor);
    }

    /**
     * Batch import a list of candidates approved by admin or automated pipeline.
     * Inserts valid new books into MySQL, prevents duplicates, sets safe e-commerce defaults.
     */
    @Transactional
    public Map<String, Object> importCandidates(List<Map<String, Object>> candidates) {
        int totalRequested = candidates.size();
        int importedCount = 0;
        int skippedCount = 0;
        int failedCount = 0;
        List<String> errors = new ArrayList<>();
        List<Integer> newlyImportedIds = new ArrayList<>();

        Map<String, Category> categoryCache = new HashMap<>();
        List<Category> allCategories = categoryRepository.findAll();
        for (Category c : allCategories) {
            categoryCache.put(c.getName().toLowerCase(), c);
            if (c.getSlug() != null) {
                categoryCache.put(c.getSlug().toLowerCase(), c);
            }
        }
        Category fallbackCategory = !allCategories.isEmpty() ? allCategories.get(0) : null;

        for (Map<String, Object> item : candidates) {
            try {
                String title = item.get("title") != null ? item.get("title").toString().trim() : null;
                String author = item.get("author") != null ? item.get("author").toString().trim() : null;
                String isbn = item.get("isbn") != null ? item.get("isbn").toString().trim() : null;

                if (title == null || title.isEmpty() || author == null || author.isEmpty()) {
                    failedCount++;
                    errors.add("Skipped record missing title or author");
                    continue;
                }

                // Check duplicate
                if (isbn != null && !isbn.isEmpty() && bookRepository.existsByIsbn(isbn)) {
                    skippedCount++;
                    continue;
                }
                if (bookRepository.existsByTitleIgnoreCaseAndAuthorIgnoreCase(title, author)) {
                    skippedCount++;
                    continue;
                }

                // Match Category
                String rawCategory = item.get("category") != null ? item.get("category").toString() : "Fiction";
                Category resolvedCategory = resolveCategory(rawCategory, categoryCache, fallbackCategory);

                Book book = new Book();
                book.setTitle(title.length() > 490 ? title.substring(0, 487) + "..." : title);
                book.setAuthor(author.length() > 490 ? author.substring(0, 487) + "..." : author);
                book.setCategory(resolvedCategory);
                book.setIsbn(isbn != null && !isbn.isEmpty() ? isbn : null);

                if (item.get("subtitle") != null) {
                    String sub = item.get("subtitle").toString().trim();
                    book.setSubtitle(sub.length() > 490 ? sub.substring(0, 487) + "..." : sub);
                }
                if (item.get("description") != null) {
                    String desc = item.get("description").toString().trim();
                    book.setDescription(desc);
                    book.setShortDescription(desc.length() > 250 ? desc.substring(0, 247) + "..." : desc);
                }
                if (item.get("language") != null) {
                    book.setLanguage(item.get("language").toString().trim());
                } else {
                    book.setLanguage("English");
                }
                if (item.get("publisher") != null) {
                    String pub = item.get("publisher").toString().trim();
                    book.setPublisher(pub.length() > 280 ? pub.substring(0, 277) + "..." : pub);
                }
                if (item.get("publishDate") != null) {
                    try {
                        String pDate = item.get("publishDate").toString().trim();
                        if (pDate.length() == 4) {
                            book.setPublishDate(LocalDate.of(Integer.parseInt(pDate), 1, 1));
                        } else if (pDate.length() >= 10) {
                            book.setPublishDate(LocalDate.parse(pDate.substring(0, 10)));
                        }
                    } catch (Exception ignored) {}
                }
                if (item.get("pages") != null) {
                    try {
                        book.setPages(Integer.parseInt(item.get("pages").toString()));
                    } catch (Exception ignored) {
                        book.setPages(320);
                    }
                } else {
                    book.setPages(320);
                }

                // Cover Image
                String coverUrl = item.get("coverUrl") != null ? item.get("coverUrl").toString().trim() : null;
                if (coverUrl != null && !coverUrl.isEmpty() && !coverUrl.contains("placeholder.com")) {
                    book.setCoverUrl(coverUrl.replace("http://", "https://"));
                } else {
                    book.setCoverUrl(null);
                }

                // Realistic E-Commerce Pricing & Inventory Defaults
                BigDecimal price = new BigDecimal("499.00");
                if (item.get("price") != null) {
                    try {
                        price = new BigDecimal(item.get("price").toString().replaceAll("[^0-9.]", ""));
                    } catch (Exception ignored) {}
                } else {
                    // Derive realistic price from page count
                    int p = book.getPages() != null ? book.getPages() : 300;
                    if (p > 500) price = new BigDecimal("799.00");
                    else if (p > 350) price = new BigDecimal("599.00");
                    else if (p > 200) price = new BigDecimal("449.00");
                    else price = new BigDecimal("349.00");
                }

                book.setPrice(price);
                book.setOriginalPrice(price.multiply(BigDecimal.valueOf(1.25)));
                book.setDiscount(BigDecimal.valueOf(20.0));
                book.setStock(45);
                book.setFormat("Paperback");
                book.setIsActive(true);
                book.setRating(4.5);
                book.setReviewCount(12);

                Book saved = bookRepository.save(book);
                newlyImportedIds.add(saved.getId());
                importedCount++;

            } catch (Exception e) {
                failedCount++;
                errors.add("Error saving: " + e.getMessage());
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRequested", totalRequested);
        summary.put("importedCount", importedCount);
        summary.put("skippedCount", skippedCount);
        summary.put("failedCount", failedCount);
        summary.put("errors", errors);
        summary.put("newlyImportedCount", newlyImportedIds.size());
        return summary;
    }

    /**
     * Automated Batch Import: Queries multiple pages from Google Books / Open Library and imports them.
     * Respects rate limits with small pauses between external batches.
     */
    public Map<String, Object> executeAutomatedBatchImport(String category, String language, String keyword, int targetCount) {
        int totalImported = 0;
        int totalSkipped = 0;
        int totalFailed = 0;
        List<String> allErrors = new ArrayList<>();

        int batchSize = 40;
        int startIndex = 0;
        int target = Math.min(Math.max(targetCount, 10), 500);

        while (totalImported < target && startIndex < 400) {
            List<Map<String, Object>> candidates = searchExternalCatalog(keyword, category, language, startIndex, batchSize);
            if (candidates.isEmpty()) {
                break;
            }

            Map<String, Object> batchResult = importCandidates(candidates);
            int batchImported = (int) batchResult.getOrDefault("importedCount", 0);
            int batchSkipped = (int) batchResult.getOrDefault("skippedCount", 0);
            int batchFailed = (int) batchResult.getOrDefault("failedCount", 0);

            totalImported += batchImported;
            totalSkipped += batchSkipped;
            totalFailed += batchFailed;

            startIndex += batchSize;

            // Small pause between external batches to respect rate limits
            try {
                Thread.sleep(250);
            } catch (InterruptedException ignored) {}
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("category", category);
        report.put("language", language);
        report.put("targetCount", target);
        report.put("importedCount", totalImported);
        report.put("skippedCount", totalSkipped);
        report.put("failedCount", totalFailed);
        report.put("currentTotalDatabaseBooks", bookRepository.count());
        return report;
    }

    public Map<String, Object> getCatalogStats() {
        long total = bookRepository.count();
        long withCovers = bookRepository.countByCoverUrlIsNotNull();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBooks", total);
        stats.put("booksWithCovers", withCovers);
        stats.put("booksWithoutCovers", total - withCovers);
        stats.put("coverAvailabilityRate", total > 0 ? String.format("%.1f%%", ((double) withCovers / total) * 100) : "0%");

        return stats;
    }

    private Category resolveCategory(String raw, Map<String, Category> cache, Category fallback) {
        if (raw == null || raw.trim().isEmpty()) return fallback;
        String lower = raw.toLowerCase().trim();

        if (cache.containsKey(lower)) return cache.get(lower);

        // Intelligent category resolver to existing 64 categories
        if (lower.contains("comic") || lower.contains("manga") || lower.contains("graphic novel")) {
            if (cache.containsKey("comics & manga")) return cache.get("comics & manga");
            if (cache.containsKey("manga")) return cache.get("manga");
        }
        if (lower.contains("computer") || lower.contains("program") || lower.contains("software")) {
            if (cache.containsKey("programming")) return cache.get("programming");
            if (cache.containsKey("computer science")) return cache.get("computer science");
        }
        if (lower.contains("fiction")) {
            if (lower.contains("science fiction")) {
                if (cache.containsKey("science fiction")) return cache.get("science fiction");
            }
            if (lower.contains("fantasy")) {
                if (cache.containsKey("fantasy")) return cache.get("fantasy");
            }
            if (lower.contains("historical")) {
                if (cache.containsKey("historical fiction")) return cache.get("historical fiction");
            }
            if (cache.containsKey("fiction")) return cache.get("fiction");
        }
        if (lower.contains("business") || lower.contains("economic") || lower.contains("finance")) {
            if (cache.containsKey("business & economics")) return cache.get("business & economics");
            if (cache.containsKey("finance")) return cache.get("finance");
        }
        if (lower.contains("science")) {
            if (cache.containsKey("science & technology")) return cache.get("science & technology");
            if (cache.containsKey("science")) return cache.get("science");
        }
        if (lower.contains("history")) {
            if (cache.containsKey("history")) return cache.get("history");
        }
        if (lower.contains("biography") || lower.contains("memoir")) {
            if (cache.containsKey("biography")) return cache.get("biography");
        }
        if (lower.contains("psychology")) {
            if (cache.containsKey("psychology")) return cache.get("psychology");
        }
        if (lower.contains("philosophy")) {
            if (cache.containsKey("philosophy")) return cache.get("philosophy");
        }
        if (lower.contains("self-help") || lower.contains("personal")) {
            if (cache.containsKey("self-help")) return cache.get("self-help");
        }
        if (lower.contains("children") || lower.contains("juvenile") || lower.contains("young adult")) {
            if (cache.containsKey("children & young adult")) return cache.get("children & young adult");
        }
        if (lower.contains("romance")) {
            if (cache.containsKey("romance")) return cache.get("romance");
        }
        if (lower.contains("mystery") || lower.contains("crime") || lower.contains("detective")) {
            if (cache.containsKey("mystery")) return cache.get("mystery");
        }
        if (lower.contains("thriller") || lower.contains("suspense")) {
            if (cache.containsKey("thriller")) return cache.get("thriller");
        }

        return fallback;
    }

    private Map<String, Object> parseGoogleVolume(JsonNode vol, String defaultCategory, String defaultLanguage) {
        String title = vol.path("title").asText(null);
        if (title == null || title.trim().isEmpty()) return null;

        Map<String, Object> book = new LinkedHashMap<>();
        book.put("source", "Google Books");
        book.put("title", title.trim());
        book.put("subtitle", vol.path("subtitle").asText(null));

        List<String> authors = new ArrayList<>();
        JsonNode authorsNode = vol.path("authors");
        if (authorsNode.isArray()) {
            for (JsonNode a : authorsNode) {
                authors.add(a.asText());
            }
        }
        book.put("author", !authors.isEmpty() ? String.join(", ", authors) : "Unknown Author");

        book.put("publisher", vol.path("publisher").asText(null));
        book.put("publishDate", vol.path("publishedDate").asText(null));
        book.put("description", vol.path("description").asText(null));
        book.put("pages", vol.path("pageCount").asInt(320));

        // Language
        String langCode = vol.path("language").asText(null);
        if (langCode != null && !langCode.isEmpty()) {
            book.put("language", mapLanguageCodeToName(langCode));
        } else {
            book.put("language", defaultLanguage != null && !defaultLanguage.equalsIgnoreCase("all") ? defaultLanguage : "English");
        }

        // ISBN
        String isbn = null;
        JsonNode idList = vol.path("industryIdentifiers");
        if (idList.isArray()) {
            for (JsonNode idItem : idList) {
                String type = idItem.path("type").asText("");
                String val = idItem.path("identifier").asText("");
                if ("ISBN_13".equalsIgnoreCase(type)) {
                    isbn = val;
                    break;
                } else if ("ISBN_10".equalsIgnoreCase(type) && isbn == null) {
                    isbn = val;
                }
            }
        }
        book.put("isbn", isbn);

        // Category
        String category = defaultCategory != null && !defaultCategory.equalsIgnoreCase("all") ? defaultCategory : "Fiction";
        JsonNode catNode = vol.path("categories");
        if (catNode.isArray() && catNode.size() > 0) {
            category = catNode.get(0).asText();
        }
        book.put("category", category);

        // High Resolution Cover
        JsonNode imgNode = vol.path("imageLinks");
        String coverUrl = null;
        if (imgNode.has("extraLarge")) coverUrl = imgNode.path("extraLarge").asText(null);
        else if (imgNode.has("large")) coverUrl = imgNode.path("large").asText(null);
        else if (imgNode.has("medium")) coverUrl = imgNode.path("medium").asText(null);
        else if (imgNode.has("thumbnail")) coverUrl = imgNode.path("thumbnail").asText(null);
        else if (imgNode.has("smallThumbnail")) coverUrl = imgNode.path("smallThumbnail").asText(null);

        if (coverUrl != null) {
            coverUrl = coverUrl.replace("http://", "https://");
            // Improve resolution parameter if applicable
            coverUrl = coverUrl.replace("&edge=curl", "");
        }
        book.put("coverUrl", coverUrl);

        return book;
    }

    private Map<String, Object> parseOpenLibraryDoc(JsonNode doc, String defaultCategory, String defaultLanguage) {
        String title = doc.path("title").asText(null);
        if (title == null || title.trim().isEmpty()) return null;

        Map<String, Object> book = new LinkedHashMap<>();
        book.put("source", "Open Library");
        book.put("title", title.trim());
        book.put("subtitle", doc.path("subtitle").asText(null));

        List<String> authors = new ArrayList<>();
        JsonNode authorsNode = doc.path("author_name");
        if (authorsNode.isArray()) {
            for (JsonNode a : authorsNode) authors.add(a.asText());
        }
        book.put("author", !authors.isEmpty() ? String.join(", ", authors) : "Unknown Author");

        JsonNode pubNode = doc.path("publisher");
        if (pubNode.isArray() && pubNode.size() > 0) {
            book.put("publisher", pubNode.get(0).asText());
        }
        book.put("publishDate", doc.path("first_publish_year").asText(null));
        book.put("pages", doc.path("number_of_pages_median").asInt(320));

        // Language
        JsonNode langNode = doc.path("language");
        String lang = defaultLanguage != null && !defaultLanguage.equalsIgnoreCase("all") ? defaultLanguage : "English";
        if (langNode.isArray() && langNode.size() > 0) {
            lang = mapLanguageCodeToName(langNode.get(0).asText());
        }
        book.put("language", lang);

        // ISBN
        String isbn = null;
        JsonNode isbnNode = doc.path("isbn");
        if (isbnNode.isArray() && isbnNode.size() > 0) {
            isbn = isbnNode.get(0).asText();
        }
        book.put("isbn", isbn);

        // Cover
        int coverId = doc.path("cover_i").asInt(0);
        if (coverId > 0) {
            book.put("coverUrl", "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg");
        } else if (isbn != null) {
            book.put("coverUrl", "https://covers.openlibrary.org/b/isbn/" + isbn + "-L.jpg?default=false");
        } else {
            book.put("coverUrl", null);
        }

        book.put("category", defaultCategory != null && !defaultCategory.equalsIgnoreCase("all") ? defaultCategory : "Fiction");
        return book;
    }

    private String mapLanguageNameToCode(String lang) {
        if (lang == null || lang.equalsIgnoreCase("all")) return null;
        String lower = lang.toLowerCase().trim();
        switch (lower) {
            case "hindi": return "hi";
            case "english": return "en";
            case "tamil": return "ta";
            case "telugu": return "te";
            case "bengali": return "bn";
            case "marathi": return "mr";
            case "gujarati": return "gu";
            case "kannada": return "kn";
            case "malayalam": return "ml";
            case "punjabi": return "pa";
            case "odia": return "or";
            case "assamese": return "as";
            case "urdu": return "ur";
            case "sanskrit": return "sa";
            case "spanish": return "es";
            case "french": return "fr";
            case "german": return "de";
            case "portuguese": return "pt";
            case "italian": return "it";
            case "arabic": return "ar";
            case "chinese": return "zh";
            case "japanese": return "ja";
            case "korean": return "ko";
            case "russian": return "ru";
            default: return null;
        }
    }

    private String mapLanguageCodeToName(String code) {
        if (code == null) return "English";
        String lower = code.toLowerCase().trim();
        switch (lower) {
            case "hi": case "hin": return "Hindi";
            case "en": case "eng": return "English";
            case "ta": case "tam": return "Tamil";
            case "te": case "tel": return "Telugu";
            case "bn": case "ben": return "Bengali";
            case "mr": case "mar": return "Marathi";
            case "gu": case "guj": return "Gujarati";
            case "kn": case "kan": return "Kannada";
            case "ml": case "mal": return "Malayalam";
            case "pa": case "pan": return "Punjabi";
            case "or": case "ori": return "Odia";
            case "as": case "asm": return "Assamese";
            case "ur": case "urd": return "Urdu";
            case "sa": case "san": return "Sanskrit";
            case "kok": return "Konkani";
            case "ne": case "nep": return "Nepali";
            case "es": case "spa": return "Spanish";
            case "fr": case "fra": case "fre": return "French";
            case "de": case "deu": case "ger": return "German";
            case "pt": case "por": return "Portuguese";
            case "it": case "ita": return "Italian";
            case "ar": case "ara": return "Arabic";
            case "zh": case "zho": case "chi": return "Chinese";
            case "ja": case "jpn": return "Japanese";
            case "ko": case "kor": return "Korean";
            case "ru": case "rus": return "Russian";
            default: return "English";
        }
    }
}
