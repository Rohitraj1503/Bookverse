package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Wishlist;
import com.bookverse.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    /** GET /api/wishlist/{userId} */
    @GetMapping("/{userId}")
    public List<Wishlist> getByUser(@PathVariable Integer userId) {
        return wishlistService.getByUserId(userId);
    }

    /** GET /api/wishlist/check?userId=&bookId= */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> check(@RequestParam Integer userId,
                                                       @RequestParam Integer bookId) {
        boolean wishlisted = wishlistService.isWishlisted(userId, bookId);
        return ResponseEntity.ok(Map.of("wishlisted", wishlisted));
    }

    /** POST /api/wishlist/{userId}/{bookId} */
    @PostMapping("/{userId}/{bookId}")
    public ResponseEntity<?> add(@PathVariable Integer userId, @PathVariable Integer bookId) {
        try {
            Wishlist w = wishlistService.addToWishlist(userId, bookId);
            return ResponseEntity.ok(w);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/wishlist/{userId}/{bookId} */
    @DeleteMapping("/{userId}/{bookId}")
    public ResponseEntity<Void> remove(@PathVariable Integer userId, @PathVariable Integer bookId) {
        wishlistService.removeFromWishlist(userId, bookId);
        return ResponseEntity.ok().build();
    }

    /** POST /api/wishlist/{userId}/{bookId}/toggle */
    @PostMapping("/{userId}/{bookId}/toggle")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable Integer userId,
                                                        @PathVariable Integer bookId) {
        boolean wasWishlisted = wishlistService.isWishlisted(userId, bookId);
        wishlistService.toggleWishlist(userId, bookId);
        boolean nowWishlisted = !wasWishlisted;
        return ResponseEntity.ok(Map.of("wishlisted", nowWishlisted,
                "message", nowWishlisted ? "Added to wishlist" : "Removed from wishlist"));
    }
}
