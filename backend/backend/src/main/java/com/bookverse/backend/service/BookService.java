package com.bookverse.backend.service;

import com.bookverse.backend.entity.Book;
import com.bookverse.backend.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BookService {
    @Autowired
    private BookRepository bookRepository;

    public List<Book> getAll() { return bookRepository.findAll(); }
    public Optional<Book> getById(Integer id) { return bookRepository.findById(id); }
    public List<Book> getFeatured() { return bookRepository.findByIsFeaturedTrue(); }
    public List<Book> getByCategory(Integer catId) { return bookRepository.findByCategoryId(catId); }
    public List<Book> search(String query) { return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query); }

    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }

    public Book updateBook(Integer id, Book bookDetails) {
        Book book = bookRepository.findById(id).orElseThrow(() -> new RuntimeException("Book not found"));
        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setIsbn(bookDetails.getIsbn());
        book.setCategory(bookDetails.getCategory());
        book.setPrice(bookDetails.getPrice());
        book.setOriginalPrice(bookDetails.getOriginalPrice());
        book.setStock(bookDetails.getStock());
        book.setDescription(bookDetails.getDescription());
        book.setCoverUrl(bookDetails.getCoverUrl());
        book.setRating(bookDetails.getRating());
        book.setIsFeatured(bookDetails.getIsFeatured());
        return bookRepository.save(book);
    }

    public void deleteBook(Integer id) {
        bookRepository.deleteById(id);
    }
}
