package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Order> findAllByOrderByCreatedAtDesc();
}
