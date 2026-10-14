package com.bookverse.backend.service;

import com.bookverse.backend.entity.*;
import com.bookverse.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;

    public List<Review> getByBookId(Integer bookId, String sort) {
        switch (sort != null ? sort : "newest") {
            case "highest": return reviewRepository.findByBookIdOrderByRatingDesc(bookId);
            case "lowest":  return reviewRepository.findByBookIdOrderByRatingAsc(bookId);
            case "helpful": return reviewRepository.findByBookIdOrderByHelpfulCountDesc(bookId);
            default:        return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
        }
    }

    public List<Review> getByUserId(Integer userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Review> getUserReviewForBook(Integer userId, Integer bookId) {
        return reviewRepository.findByUserIdAndBookId(userId, bookId);
    }

    @Transactional
    public Review createOrUpdate(Integer userId, Integer bookId, Review reviewData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (reviewData.getRating() < 1 || reviewData.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        // Check if user already has a review — update if so
        Optional<Review> existing = reviewRepository.findByUserIdAndBookId(userId, bookId);
        Review review = existing.orElse(new Review());
        review.setUser(user);
        review.setBook(book);
        review.setRating(reviewData.getRating());
        review.setTitle(reviewData.getTitle());
        review.setBody(reviewData.getBody());

        // Check verified purchase
        boolean hasPurchased = orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .anyMatch(o -> o.getItems() != null &&
                        o.getItems().stream().anyMatch(i -> i.getBook().getId().equals(bookId)) &&
                        (o.getStatus() == Order.Status.delivered || o.getStatus() == Order.Status.shipped));
        review.setVerifiedPurchase(hasPurchased);

        Review saved = reviewRepository.save(review);

        // Update book aggregate rating
        updateBookRating(bookId);

        return saved;
    }

    @Transactional
    public void deleteReview(Integer reviewId, Integer requestingUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        // Only reviewer or admin can delete
        User user = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!review.getUser().getId().equals(requestingUserId) && user.getRole() != User.Role.admin) {
            throw new RuntimeException("Not authorized to delete this review");
        }
        Integer bookId = review.getBook().getId();
        reviewRepository.delete(review);
        updateBookRating(bookId);
    }

    @Transactional
    public Review markHelpful(Integer reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setHelpfulCount((review.getHelpfulCount() == null ? 0 : review.getHelpfulCount()) + 1);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review report(Integer reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setReported(true);
        return reviewRepository.save(review);
    }

    public Map<String, Object> getStats(Integer bookId) {
        Double avg = reviewRepository.findAverageRatingByBookId(bookId);
        Long count = reviewRepository.countByBookId(bookId);
        List<Object[]> dist = reviewRepository.findRatingDistributionByBookId(bookId);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) distribution.put(i, 0L);
        for (Object[] row : dist) {
            distribution.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        result.put("totalReviews", count);
        result.put("distribution", distribution);
        return result;
    }

    private void updateBookRating(Integer bookId) {
        Double avg = reviewRepository.findAverageRatingByBookId(bookId);
        Long count = reviewRepository.countByBookId(bookId);
        bookRepository.findById(bookId).ifPresent(book -> {
            book.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            book.setReviewCount(count != null ? count.intValue() : 0);
            bookRepository.save(book);
        });
    }

    // Admin: get all reviews
    public List<Review> getAllReviews() {
        return reviewRepository.findAll().stream()
                .sorted(Comparator.comparing(Review::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    // Admin: get reported reviews
    public List<Review> getReportedReviews() {
        return reviewRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getReported()))
                .sorted(Comparator.comparing(Review::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }
}
