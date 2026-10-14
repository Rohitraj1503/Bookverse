package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Coupon;
import com.bookverse.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
public class CouponController {

    @Autowired
    private CouponService couponService;

    /** GET /api/coupons (admin) */
    @GetMapping
    public List<Coupon> getAll() {
        return couponService.getAll();
    }

    /** POST /api/coupons/validate */
    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody Map<String, Object> body) {
        try {
            String code = (String) body.get("code");
            BigDecimal orderTotal = new BigDecimal(body.get("orderTotal").toString());
            Map<String, Object> result = couponService.validate(code, orderTotal);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/coupons (admin) */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Coupon coupon) {
        try {
            return ResponseEntity.ok(couponService.create(coupon));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /api/coupons/{id} (admin) */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Coupon coupon) {
        try {
            return ResponseEntity.ok(couponService.update(id, coupon));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/coupons/{id} (admin) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        couponService.deactivate(id);
        return ResponseEntity.ok().build();
    }
}
