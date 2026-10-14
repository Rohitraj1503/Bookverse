package com.bookverse.backend.service;

import com.bookverse.backend.entity.Book;
import com.bookverse.backend.entity.Category;
import com.bookverse.backend.repository.BookRepository;
import com.bookverse.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class BookService {
    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Book> getAll() {
        return bookRepository.findAll();
    }

    public Optional<Book> getById(Integer id) {
        return bookRepository.findById(id);
    }

    public List<Book> getFeatured() {
        return bookRepository.findByIsFeaturedTrue();
    }

    public List<Book> getBestsellers() {
        return bookRepository.findByIsBestsellerTrue();
    }

    public List<Book> getNewArrivals() {
        return bookRepository.findByIsNewArrivalTrue();
    }

    public List<Book> getByCategory(Integer catId) {
        return bookRepository.findByCategoryId(catId);
    }

    public List<Book> getByLanguage(String language) {
        if (language == null || language.equalsIgnoreCase("all")) {
            return getAll();
        }
        return bookRepository.findByLanguageIgnoreCase(language);
    }

    public List<Book> getByFormat(String format) {
        return bookRepository.findByFormatIgnoreCase(format);
    }

    public List<Book> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAll();
        }
        return bookRepository.searchMultilingual(query.trim());
    }

    public List<Book> getLowStock(int threshold) {
        return bookRepository.findByStockLessThan(threshold);
    }

    public List<Book> getRelated(Integer bookId, Integer categoryId) {
        return bookRepository.findByCategoryIdAndIdNot(categoryId, bookId);
    }

    @Transactional
    public Book saveBook(Book book) {
        validateBookData(book);

        // Ensure category is attached
        if (book.getCategory() == null || book.getCategory().getId() == null) {
            Category defaultCategory = categoryRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No categories available"));
            book.setCategory(defaultCategory);
        } else {
            Category managedCategory = categoryRepository.findById(book.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found with ID: " + book.getCategory().getId()));
            book.setCategory(managedCategory);
        }

        // Check duplicate ISBN
        if (book.getIsbn() != null && !book.getIsbn().trim().isEmpty()) {
            String trimmedIsbn = book.getIsbn().trim();
            bookRepository.findByIsbn(trimmedIsbn).ifPresent(existing -> {
                if (book.getId() == null || !existing.getId().equals(book.getId())) {
                    throw new RuntimeException("A book with ISBN '" + trimmedIsbn + "' already exists: " + existing.getTitle());
                }
            });
            book.setIsbn(trimmedIsbn);
        }

        // Clean defaults
        if (book.getLanguage() == null || book.getLanguage().trim().isEmpty()) {
            book.setLanguage("English");
        }
        if (book.getFormat() == null || book.getFormat().trim().isEmpty()) {
            book.setFormat("Paperback");
        }
        if (book.getCoverUrl() != null && (book.getCoverUrl().trim().isEmpty() || book.getCoverUrl().contains("placeholder.com"))) {
            book.setCoverUrl(null);
        }

        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Integer id, Book bookDetails) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with ID: " + id));

        validateBookData(bookDetails);

        book.setTitle(bookDetails.getTitle());
        book.setSubtitle(bookDetails.getSubtitle());
        book.setAuthor(bookDetails.getAuthor());

        if (bookDetails.getIsbn() != null && !bookDetails.getIsbn().trim().isEmpty()) {
            String trimmedIsbn = bookDetails.getIsbn().trim();
            bookRepository.findByIsbn(trimmedIsbn).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("A book with ISBN '" + trimmedIsbn + "' already exists: " + existing.getTitle());
                }
            });
            book.setIsbn(trimmedIsbn);
        } else {
            book.setIsbn(null);
        }

        if (bookDetails.getCategory() != null && bookDetails.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(bookDetails.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            book.setCategory(cat);
        }

        book.setPrice(bookDetails.getPrice());
        book.setOriginalPrice(bookDetails.getOriginalPrice());
        book.setDiscount(bookDetails.getDiscount());
        book.setStock(bookDetails.getStock());
        book.setDescription(bookDetails.getDescription());
        book.setShortDescription(bookDetails.getShortDescription());
        book.setCoverUrl(bookDetails.getCoverUrl());
        book.setRating(bookDetails.getRating());
        book.setIsFeatured(bookDetails.getIsFeatured());
        book.setIsBestseller(bookDetails.getIsBestseller());
        book.setIsNewArrival(bookDetails.getIsNewArrival());
        book.setPages(bookDetails.getPages());
        book.setPublisher(bookDetails.getPublisher());
        book.setPublishDate(bookDetails.getPublishDate());
        book.setEdition(bookDetails.getEdition());
        book.setFormat(bookDetails.getFormat());
        book.setGenre(bookDetails.getGenre());
        book.setLanguage(bookDetails.getLanguage() != null ? bookDetails.getLanguage() : "English");

        // Comic & Manga metadata
        book.setSeriesName(bookDetails.getSeriesName());
        book.setVolumeNumber(bookDetails.getVolumeNumber());
        book.setIssueNumber(bookDetails.getIssueNumber());
        book.setIllustrator(bookDetails.getIllustrator());
        book.setArtist(bookDetails.getArtist());
        book.setPublisherImprint(bookDetails.getPublisherImprint());
        book.setReadingDirection(bookDetails.getReadingDirection());
        book.setAgeRecommendation(bookDetails.getAgeRecommendation());

        return bookRepository.save(book);
    }

    public void deleteBook(Integer id) {
        bookRepository.deleteById(id);
    }

    private void validateBookData(Book book) {
        if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Book title is required");
        }
        if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
            throw new RuntimeException("Book author is required");
        }
        if (book.getPrice() == null || book.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Price must be a valid non-negative amount");
        }
        if (book.getStock() == null || book.getStock() < 0) {
            throw new RuntimeException("Stock must be a non-negative number");
        }
    }

    /**
     * Bulk import books from list of parsed row maps.
     * Controlled row-level validation: invalid rows or duplicate ISBNs are reported
     * while valid rows are saved without crashing.
     */
    @Transactional
    public Map<String, Object> bulkImport(List<Map<String, String>> rows) {
        int totalRows = rows.size();
        int importedCount = 0;
        int skippedDuplicatesCount = 0;
        int failedValidationCount = 0;
        List<String> errors = new ArrayList<>();
        List<Book> newlyImportedBooks = new ArrayList<>();

        Set<String> seenIsbnsInBatch = new HashSet<>();

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = rows.get(i);
            int rowNum = i + 1;

            String title = row.get("title");
            String author = row.get("author");
            String priceStr = row.get("selling_price");
            if (priceStr == null || priceStr.trim().isEmpty()) {
                priceStr = row.get("price");
            }
            String isbn = row.get("isbn");

            if (title == null || title.trim().isEmpty()) {
                errors.add("Row " + rowNum + ": Missing required title");
                failedValidationCount++;
                continue;
            }
            if (author == null || author.trim().isEmpty()) {
                errors.add("Row " + rowNum + " ('" + title + "'): Missing required author");
                failedValidationCount++;
                continue;
            }
            if (priceStr == null || priceStr.trim().isEmpty()) {
                errors.add("Row " + rowNum + " ('" + title + "'): Missing price");
                failedValidationCount++;
                continue;
            }

            BigDecimal price;
            try {
                price = new BigDecimal(priceStr.trim().replaceAll("[^0-9.]", ""));
                if (price.compareTo(BigDecimal.ZERO) < 0) throw new NumberFormatException();
            } catch (Exception e) {
                errors.add("Row " + rowNum + " ('" + title + "'): Invalid price '" + priceStr + "'");
                failedValidationCount++;
                continue;
            }

            // Check duplicate ISBN in batch or in database
            if (isbn != null && !isbn.trim().isEmpty()) {
                String cleanIsbn = isbn.trim();
                if (seenIsbnsInBatch.contains(cleanIsbn) || bookRepository.existsByIsbn(cleanIsbn)) {
                    skippedDuplicatesCount++;
                    errors.add("Row " + rowNum + " ('" + title + "'): Skipped duplicate ISBN " + cleanIsbn);
                    continue;
                }
                seenIsbnsInBatch.add(cleanIsbn);
            }

            // Resolve Category by name, slug, or ID
            String categoryStr = row.get("category");
            Category category = null;
            if (categoryStr != null && !categoryStr.trim().isEmpty()) {
                category = categoryRepository.findByNameIgnoreCase(categoryStr.trim())
                        .or(() -> categoryRepository.findBySlug(categoryStr.trim().toLowerCase()))
                        .orElse(null);
            }
            if (category == null) {
                category = categoryRepository.findAll().stream().findFirst().orElse(null);
            }

            Book book = new Book();
            book.setTitle(title.trim());
            book.setAuthor(author.trim());
            book.setPrice(price);
            book.setCategory(category);
            book.setIsbn(isbn != null && !isbn.trim().isEmpty() ? isbn.trim() : null);

            // Optional fields
            if (row.containsKey("subtitle")) book.setSubtitle(row.get("subtitle"));
            if (row.containsKey("short_description")) book.setShortDescription(row.get("short_description"));
            if (row.containsKey("full_description")) book.setDescription(row.get("full_description"));
            else if (row.containsKey("description")) book.setDescription(row.get("description"));

            if (row.containsKey("language") && row.get("language") != null && !row.get("language").trim().isEmpty()) {
                book.setLanguage(row.get("language").trim());
            } else {
                book.setLanguage("English");
            }

            if (row.containsKey("publisher")) book.setPublisher(row.get("publisher"));
            if (row.containsKey("edition")) book.setEdition(row.get("edition"));
            if (row.containsKey("format")) book.setFormat(row.get("format"));

            // Stock
            int stock = 50;
            String stockStr = row.get("stock_quantity") != null ? row.get("stock_quantity") : row.get("stock");
            if (stockStr != null && !stockStr.trim().isEmpty()) {
                try {
                    stock = Integer.parseInt(stockStr.trim());
                } catch (Exception ignored) {}
            }
            book.setStock(stock);

            // Original Price
            String origPriceStr = row.get("original_price");
            if (origPriceStr != null && !origPriceStr.trim().isEmpty()) {
                try {
                    book.setOriginalPrice(new BigDecimal(origPriceStr.trim().replaceAll("[^0-9.]", "")));
                } catch (Exception ignored) {}
            } else {
                book.setOriginalPrice(price.multiply(BigDecimal.valueOf(1.25)));
            }

            // Page count
            String pageStr = row.get("page_count") != null ? row.get("page_count") : row.get("pages");
            if (pageStr != null && !pageStr.trim().isEmpty()) {
                try {
                    book.setPages(Integer.parseInt(pageStr.trim()));
                } catch (Exception ignored) {}
            }

            // Cover URL
            String coverUrl = row.get("cover_image_url") != null ? row.get("cover_image_url") : row.get("cover_url");
            if (coverUrl != null && !coverUrl.trim().isEmpty()) {
                book.setCoverUrl(coverUrl.trim());
            } else {
                book.setCoverUrl("https://via.placeholder.com/200x300?text=" + urlEncode(book.getTitle()));
            }

            // Comic/Manga metadata
            if (row.containsKey("series_name")) book.setSeriesName(row.get("series_name"));
            if (row.containsKey("volume_number")) book.setVolumeNumber(row.get("volume_number"));
            if (row.containsKey("issue_number")) book.setIssueNumber(row.get("issue_number"));
            if (row.containsKey("illustrator")) book.setIllustrator(row.get("illustrator"));
            if (row.containsKey("artist")) book.setArtist(row.get("artist"));
            if (row.containsKey("publisher_imprint")) book.setPublisherImprint(row.get("publisher_imprint"));
            if (row.containsKey("reading_direction")) book.setReadingDirection(row.get("reading_direction"));
            if (row.containsKey("age_recommendation")) book.setAgeRecommendation(row.get("age_recommendation"));

            book.setIsActive(true);
            book.setRating(4.5);
            book.setReviewCount(0);

            try {
                Book saved = bookRepository.save(book);
                newlyImportedBooks.add(saved);
                importedCount++;
            } catch (Exception e) {
                failedValidationCount++;
                errors.add("Row " + rowNum + " ('" + title + "'): " + e.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", totalRows);
        result.put("importedCount", importedCount);
        result.put("skippedDuplicatesCount", skippedDuplicatesCount);
        result.put("failedValidationCount", failedValidationCount);
        result.put("errors", errors);
        result.put("importedBooksCount", newlyImportedBooks.size());
        return result;
    }

    private String urlEncode(String text) {
        try {
            return java.net.URLEncoder.encode(text, java.nio.charset.StandardCharsets.UTF_8.toString());
        } catch (Exception e) {
            return "Book";
        }
    }
}
