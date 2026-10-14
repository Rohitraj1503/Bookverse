package com.bookverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class ExternalBookService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Search external sources (Google Books and Open Library) for book metadata.
     * Returns normalized list of candidates for admin review before saving.
     */
    public List<Map<String, Object>> searchExternal(String query) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) {
            return results;
        }

        String trimmedQuery = query.trim();

        String cleanDigits = trimmedQuery.replaceAll("[^0-9X]", "");
        boolean isIsbn = cleanDigits.length() == 10 || cleanDigits.length() == 13;

        // 1. Try Google Books API
        try {
            String searchQuery = isIsbn ? "isbn:" + cleanDigits : trimmedQuery;
            String encoded = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            String apiKey = System.getenv("GOOGLE_BOOKS_API_KEY");
            String url = "https://www.googleapis.com/books/v1/volumes?q=" + encoded + "&maxResults=8" +
                    (apiKey != null && !apiKey.isEmpty() ? "&key=" + apiKey : "");

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "BookVerse-Catalog/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        JsonNode vol = item.path("volumeInfo");
                        Map<String, Object> candidate = parseGoogleVolume(vol);
                        if (candidate != null) {
                            results.add(candidate);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[ExternalBookService] Google Books lookup failed: " + e.getMessage());
        }

        // 2. Try Open Library API if Google returned few or no results
        if (results.size() < 4) {
            try {
                String olUrl;
                if (isIsbn) {
                    olUrl = "https://openlibrary.org/search.json?isbn=" + cleanDigits + "&limit=6";
                } else {
                    String encoded = URLEncoder.encode(trimmedQuery, StandardCharsets.UTF_8);
                    olUrl = "https://openlibrary.org/search.json?q=" + encoded + "&limit=6";
                }

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(olUrl))
                        .header("User-Agent", "BookVerse-Catalog/1.0")
                        .timeout(Duration.ofSeconds(6))
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(resp.body());
                    JsonNode docs = root.path("docs");
                    if (docs.isArray()) {
                        for (JsonNode doc : docs) {
                            Map<String, Object> candidate = parseOpenLibraryDoc(doc);
                            if (candidate != null) {
                                results.add(candidate);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[ExternalBookService] Open Library lookup failed: " + e.getMessage());
            }
        }

        return results;
    }

    private Map<String, Object> parseGoogleVolume(JsonNode vol) {
        String title = vol.path("title").asText(null);
        if (title == null || title.trim().isEmpty()) {
            return null;
        }

        Map<String, Object> book = new LinkedHashMap<>();
        book.put("source", "Google Books");
        book.put("title", title);
        book.put("subtitle", vol.path("subtitle").asText(null));

        // Authors
        List<String> authors = new ArrayList<>();
        JsonNode authorsNode = vol.path("authors");
        if (authorsNode.isArray()) {
            for (JsonNode a : authorsNode) {
                authors.add(a.asText());
            }
        }
        book.put("author", !authors.isEmpty() ? String.join(", ", authors) : "Unknown Author");

        // Publisher & Date
        book.put("publisher", vol.path("publisher").asText(null));
        book.put("publishDate", vol.path("publishedDate").asText(null));
        book.put("description", vol.path("description").asText(null));
        book.put("pages", vol.path("pageCount").asInt(300));

        // Language code conversion
        String langCode = vol.path("language").asText("en");
        book.put("language", mapLanguageCodeToName(langCode));

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
        String category = "Fiction";
        JsonNode catNode = vol.path("categories");
        if (catNode.isArray() && catNode.size() > 0) {
            category = catNode.get(0).asText();
        }
        book.put("category", category);

        // Thumbnail cover image - check highest resolution first
        JsonNode imgNode = vol.path("imageLinks");
        String coverUrl = null;
        if (imgNode.has("large")) {
            coverUrl = imgNode.path("large").asText(null);
        } else if (imgNode.has("medium")) {
            coverUrl = imgNode.path("medium").asText(null);
        } else if (imgNode.has("thumbnail")) {
            coverUrl = imgNode.path("thumbnail").asText(null);
        } else if (imgNode.has("smallThumbnail")) {
            coverUrl = imgNode.path("smallThumbnail").asText(null);
        }
        if (coverUrl != null) {
            coverUrl = coverUrl.replace("http://", "https://");
        }
        book.put("coverUrl", coverUrl);

        // Suggested defaults for admin review
        book.put("price", 599.00);
        book.put("originalPrice", 799.00);
        book.put("stock", 50);
        book.put("format", "Paperback");

        return book;
    }

    private Map<String, Object> parseOpenLibraryDoc(JsonNode doc) {
        String title = doc.path("title").asText(null);
        if (title == null || title.trim().isEmpty()) {
            return null;
        }

        Map<String, Object> book = new LinkedHashMap<>();
        book.put("source", "Open Library");
        book.put("title", title);
        book.put("subtitle", doc.path("subtitle").asText(null));

        // Authors
        List<String> authors = new ArrayList<>();
        JsonNode authorsNode = doc.path("author_name");
        if (authorsNode.isArray()) {
            for (JsonNode a : authorsNode) {
                authors.add(a.asText());
            }
        }
        book.put("author", !authors.isEmpty() ? String.join(", ", authors) : "Unknown Author");

        // Publisher & Date
        JsonNode pubNode = doc.path("publisher");
        if (pubNode.isArray() && pubNode.size() > 0) {
            book.put("publisher", pubNode.get(0).asText());
        }
        book.put("publishDate", doc.path("first_publish_year").asText(null));
        book.put("pages", doc.path("number_of_pages_median").asInt(320));

        // Language
        JsonNode langNode = doc.path("language");
        String lang = "English";
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

        book.put("category", "General");
        book.put("price", 549.00);
        book.put("originalPrice", 749.00);
        book.put("stock", 40);
        book.put("format", "Paperback");

        return book;
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
