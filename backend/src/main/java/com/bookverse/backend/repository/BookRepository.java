package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Integer> {
    List<Book> findByIsFeaturedTrue();
    List<Book> findByIsBestsellerTrue();
    List<Book> findByIsNewArrivalTrue();
    List<Book> findByCategoryId(Integer categoryId);
    List<Book> findByLanguageIgnoreCase(String language);
    List<Book> findByFormatIgnoreCase(String format);

    Optional<Book> findByIsbn(String isbn);
    boolean existsByIsbn(String isbn);

    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrIsbnContainingIgnoreCase(String title, String author, String isbn);

    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "(b.isbn IS NOT NULL AND LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%'))) OR " +
           "(b.publisher IS NOT NULL AND LOWER(b.publisher) LIKE LOWER(CONCAT('%', :q, '%'))) OR " +
           "(b.language IS NOT NULL AND LOWER(b.language) LIKE LOWER(CONCAT('%', :q, '%'))) OR " +
           "(b.category IS NOT NULL AND LOWER(b.category.name) LIKE LOWER(CONCAT('%', :q, '%'))) OR " +
           "(b.seriesName IS NOT NULL AND LOWER(b.seriesName) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Book> searchMultilingual(@Param("q") String query);

    List<Book> findByIsActiveTrue();
    List<Book> findByStockLessThan(Integer threshold);
    List<Book> findByCategoryIdAndIdNot(Integer categoryId, Integer excludeId);
}
