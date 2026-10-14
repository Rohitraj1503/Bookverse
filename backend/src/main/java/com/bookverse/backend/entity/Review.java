package com.bookverse.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reviews",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "book_id"}))
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Book book;

    @Column(nullable = false)
    private Integer rating; // 1-5

    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "verified_purchase")
    private Boolean verifiedPurchase = false;

    @Column(name = "helpful_count")
    private Integer helpfulCount = 0;

    private Boolean reported = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
