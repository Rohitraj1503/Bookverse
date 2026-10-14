package com.bookverse.backend.controller;

import com.bookverse.backend.entity.Review;
import com.bookverse.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /** GET /api/reviews/book/{bookId}?sort=newest|highest|lowest|helpful */
    @GetMapping("/book/{bookId}")
    public List<Review> getByBook(@PathVariable Integer bookId,
                                   @RequestParam(defaultValue = "newest") String sort) {
        return reviewService.getByBookId(bookId, sort);
    }

    /** GET /api/reviews/book/{bookId}/stats */
    @GetMapping("/book/{bookId}/stats")
    public Map<String, Object> getStats(@PathVariable Integer bookId) {
        return reviewService.getStats(bookId);
    }

    /** GET /api/reviews/user/{userId} */
    @GetMapping("/user/{userId}")
    public List<Review> getByUser(@PathVariable Integer userId) {
        return reviewService.getByUserId(userId);
    }

    /** GET /api/reviews/check?userId=&bookId= */
    @GetMapping("/check")
    public ResponseEntity<Review> checkUserReview(@RequestParam Integer userId,
                                                    @RequestParam Integer bookId) {
        return reviewService.getUserReviewForBook(userId, bookId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** POST /api/reviews */
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Map<String, Object> payload) {
        try {
            Integer userId = ((Number) payload.get("userId")).intValue();
            Integer bookId = ((Number) payload.get("bookId")).intValue();
            Review review = new Review();
            review.setRating(((Number) payload.get("rating")).intValue());
            review.setTitle((String) payload.get("title"));
            review.setBody((String) payload.get("body"));
            Review saved = reviewService.createOrUpdate(userId, bookId, review);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/reviews/book/{bookId}/user/{userId} */
    @PostMapping("/book/{bookId}/user/{userId}")
    public ResponseEntity<?> createOrUpdate(@PathVariable Integer bookId,
                                             @PathVariable Integer userId,
                                             @RequestBody Review review) {
        try {
            Review saved = reviewService.createOrUpdate(userId, bookId, review);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/reviews/{reviewId}?userId= */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> delete(@PathVariable Integer reviewId,
                                     @RequestParam Integer userId) {
        try {
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/reviews/{reviewId}/helpful */
    @PostMapping("/{reviewId}/helpful")
    public Review markHelpful(@PathVariable Integer reviewId) {
        return reviewService.markHelpful(reviewId);
    }

    /** POST /api/reviews/{reviewId}/report */
    @PostMapping("/{reviewId}/report")
    public Review report(@PathVariable Integer reviewId) {
        return reviewService.report(reviewId);
    }

    /** GET /api/reviews/admin/all */
    @GetMapping("/admin/all")
    public List<Review> getAllForAdmin() {
        return reviewService.getAllReviews();
    }

    /** DELETE /api/reviews/admin/{reviewId} */
    @DeleteMapping("/admin/{reviewId}")
    public ResponseEntity<?> adminDelete(@PathVariable Integer reviewId) {
        try {
            reviewService.deleteReview(reviewId, 1); // admin user id 1
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/reviews/admin/reported (admin only) */
    @GetMapping("/admin/reported")
    public List<Review> getReported() {
        return reviewService.getReportedReviews();
    }
}
