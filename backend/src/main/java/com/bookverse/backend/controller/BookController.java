package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Book;
import com.bookverse.backend.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {
    @Autowired
    private BookService bookService;

    @GetMapping
    public List<Book> getAll() { return bookService.getAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getById(@PathVariable Integer id) {
        return bookService.getById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/featured")
    public List<Book> getFeatured() { return bookService.getFeatured(); }

    @GetMapping("/category/{categoryId}")
    public List<Book> getByCategory(@PathVariable Integer categoryId) { return bookService.getByCategory(categoryId); }

    @GetMapping("/search")
    public List<Book> search(@RequestParam String query) { return bookService.search(query); }

    @PostMapping
    public Book create(@RequestBody Book book) { return bookService.saveBook(book); }

    @PutMapping("/{id}")
    public Book update(@PathVariable Integer id, @RequestBody Book book) { return bookService.updateBook(id, book); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }
}
