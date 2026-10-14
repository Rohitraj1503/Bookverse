package com.bookverse.backend.service;

import com.bookverse.backend.entity.Coupon;
import com.bookverse.backend.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CouponService {
    @Autowired private CouponRepository couponRepository;

    public List<Coupon> getAll() {
        return couponRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    public Map<String, Object> validate(String code, BigDecimal orderTotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new RuntimeException("Coupon code not found"));

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new RuntimeException("This coupon is no longer active");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This coupon has expired");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new RuntimeException("This coupon has reached its usage limit");
        }
        if (coupon.getMinOrderValue() != null && orderTotal.compareTo(coupon.getMinOrderValue()) < 0) {
            throw new RuntimeException("Minimum order value for this coupon is ₹" + coupon.getMinOrderValue());
        }

        BigDecimal discount;
        if (coupon.getType() == Coupon.CouponType.percentage) {
            discount = orderTotal.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getValue();
            if (discount.compareTo(orderTotal) > 0) discount = orderTotal;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("valid", true);
        result.put("couponId", coupon.getId());
        result.put("code", coupon.getCode());
        result.put("type", coupon.getType());
        result.put("discount", discount);
        result.put("message", "Coupon applied! You save ₹" + discount);
        return result;
    }

    @Transactional
    public Coupon create(Coupon coupon) {
        if (couponRepository.findByCodeIgnoreCase(coupon.getCode()).isPresent()) {
            throw new RuntimeException("Coupon code already exists");
        }
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon update(Integer id, Coupon data) {
        Coupon existing = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Coupon not found"));
        existing.setCode(data.getCode());
        existing.setType(data.getType());
        existing.setValue(data.getValue());
        existing.setMinOrderValue(data.getMinOrderValue());
        existing.setMaxDiscount(data.getMaxDiscount());
        existing.setExpiresAt(data.getExpiresAt());
        existing.setUsageLimit(data.getUsageLimit());
        existing.setIsActive(data.getIsActive());
        return couponRepository.save(existing);
    }

    @Transactional
    public void deactivate(Integer id) {
        couponRepository.findById(id).ifPresent(c -> {
            c.setIsActive(false);
            couponRepository.save(c);
        });
    }

    @Transactional
    public void incrementUsage(Integer couponId) {
        couponRepository.findById(couponId).ifPresent(c -> {
            c.setUsedCount((c.getUsedCount() == null ? 0 : c.getUsedCount()) + 1);
            couponRepository.save(c);
        });
    }
}
