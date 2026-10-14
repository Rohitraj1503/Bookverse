package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByBookIdOrderByCreatedAtDesc(Integer bookId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Integer userId);
    Optional<Review> findByUserIdAndBookId(Integer userId, Integer bookId);
    boolean existsByUserIdAndBookId(Integer userId, Integer bookId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.book.id = :bookId")
    Double findAverageRatingByBookId(@Param("bookId") Integer bookId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.book.id = :bookId")
    Long countByBookId(@Param("bookId") Integer bookId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.book.id = :bookId GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> findRatingDistributionByBookId(@Param("bookId") Integer bookId);

    List<Review> findByBookIdOrderByRatingDesc(Integer bookId);
    List<Review> findByBookIdOrderByRatingAsc(Integer bookId);
    List<Review> findByBookIdOrderByHelpfulCountDesc(Integer bookId);
}
