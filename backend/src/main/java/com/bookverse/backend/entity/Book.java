package com.bookverse.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    private String subtitle;

    @Column(nullable = false)
    private String author;

    @Column(unique = true)
    private String isbn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", columnDefinition = "TEXT")
    private String shortDescription;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "original_price")
    private BigDecimal originalPrice;

    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer stock = 0;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "cover_url")
    private String coverUrl;

    private Double rating = 0.0;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    private Integer pages;
    private String publisher;

    @Column(name = "publish_date")
    private LocalDate publishDate;

    private String edition;

    private String format = "Paperback";

    private String genre;

    private String language = "English";

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "is_bestseller")
    private Boolean isBestseller = false;

    @Column(name = "is_new_arrival")
    private Boolean isNewArrival = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Optional Comic / Manga metadata
    @Column(name = "series_name")
    private String seriesName;

    @Column(name = "volume_number")
    private String volumeNumber;

    @Column(name = "issue_number")
    private String issueNumber;

    private String illustrator;
    private String artist;

    @Column(name = "publisher_imprint")
    private String publisherImprint;

    @Column(name = "reading_direction")
    private String readingDirection = "Left to Right";

    @Column(name = "age_recommendation")
    private String ageRecommendation;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
