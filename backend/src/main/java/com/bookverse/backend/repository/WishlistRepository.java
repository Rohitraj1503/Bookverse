package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Integer> {
    List<Wishlist> findByUserIdOrderByAddedAtDesc(Integer userId);
    Optional<Wishlist> findByUserIdAndBookId(Integer userId, Integer bookId);
    boolean existsByUserIdAndBookId(Integer userId, Integer bookId);
    void deleteByUserIdAndBookId(Integer userId, Integer bookId);
}
