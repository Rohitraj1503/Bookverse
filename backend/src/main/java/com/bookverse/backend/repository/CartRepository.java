package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Integer> {
    List<Cart> findByUserId(Integer userId);
    Optional<Cart> findByUserIdAndBookId(Integer userId, Integer bookId);
    void deleteByUserId(Integer userId);
}
