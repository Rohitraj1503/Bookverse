package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer> {
    List<Book> findByIsFeaturedTrue();
    List<Book> findByCategoryId(Integer categoryId);
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);
}
