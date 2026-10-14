package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Book;
import com.bookverse.backend.service.BookService;
import com.bookverse.backend.service.ExternalBookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    @Autowired
    private BookService bookService;

    @Autowired
    private ExternalBookService externalBookService;

    @Autowired
    private com.bookverse.backend.service.CatalogImportService catalogImportService;

    @GetMapping
    public List<Book> getAll() {
        return bookService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getById(@PathVariable Integer id) {
        return bookService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/featured")
    public List<Book> getFeatured() {
        return bookService.getFeatured();
    }

    @GetMapping("/bestsellers")
    public List<Book> getBestsellers() {
        return bookService.getBestsellers();
    }

    @GetMapping("/new-arrivals")
    public List<Book> getNewArrivals() {
        return bookService.getNewArrivals();
    }

    @GetMapping("/language/{language}")
    public List<Book> getByLanguage(@PathVariable String language) {
        return bookService.getByLanguage(language);
    }

    @GetMapping("/category/{categoryId}")
    public List<Book> getByCategory(@PathVariable Integer categoryId) {
        return bookService.getByCategory(categoryId);
    }

    @GetMapping("/search")
    public List<Book> search(@RequestParam(required = false) String query) {
        return bookService.search(query);
    }

    @GetMapping("/low-stock")
    public List<Book> getLowStock(@RequestParam(defaultValue = "10") int threshold) {
        return bookService.getLowStock(threshold);
    }

    @GetMapping("/{id}/related")
    public List<Book> getRelated(@PathVariable Integer id, @RequestParam Integer categoryId) {
        return bookService.getRelated(id, categoryId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Book book) {
        try {
            Book saved = bookService.saveBook(book);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to create book"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Book book) {
        try {
            Book updated = bookService.updateBook(id, book);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to update book"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<?> bulkImport(@RequestBody List<Map<String, String>> rows) {
        if (rows == null || rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No book rows provided for import"));
        }
        try {
            Map<String, Object> summary = bookService.bulkImport(rows);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Bulk import failed: " + e.getMessage()));
        }
    }

    @GetMapping("/external-lookup")
    public ResponseEntity<?> externalLookup(@RequestParam(required = false) String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        try {
            List<Map<String, Object>> candidates = externalBookService.searchExternal(query.trim());
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/catalog-stats")
    public ResponseEntity<?> getCatalogStats() {
        return ResponseEntity.ok(catalogImportService.getCatalogStats());
    }

    @GetMapping("/catalog-search")
    public ResponseEntity<?> catalogSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "0") int startIndex,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<Map<String, Object>> candidates = catalogImportService.searchExternalCatalog(query, category, language, startIndex, limit);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/catalog-import")
    public ResponseEntity<?> catalogImport(@RequestBody List<Map<String, Object>> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No candidates provided for import"));
        }
        try {
            Map<String, Object> result = catalogImportService.importCandidates(candidates);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Import failed: " + e.getMessage()));
        }
    }

    @PostMapping("/auto-import")
    public ResponseEntity<?> autoImport(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "50") int targetCount) {
        try {
            String effectiveKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword : query;
            Map<String, Object> report = catalogImportService.executeAutomatedBatchImport(category, language, effectiveKeyword, targetCount);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Batch import failed: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-cover")
    public ResponseEntity<?> uploadCover(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No image file provided"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files (JPG, PNG, WebP) are allowed"));
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size cannot exceed 5MB"));
        }

        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("./uploads/covers");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String originalName = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            }

            String fileName = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path filePath = uploadDir.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/covers/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save uploaded image: " + e.getMessage()));
        }
    }
}
