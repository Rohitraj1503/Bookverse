package com.bookverse.backend.repository;

import com.bookverse.backend.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CouponRepository extends JpaRepository<Coupon, Integer> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    List<Coupon> findByIsActiveTrueOrderByCreatedAtDesc();
}
