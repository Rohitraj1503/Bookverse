package com.bookverse.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SchemaMigrationService implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Checking database schema for missing columns and seed data...");
        
        // 1. Seed database if empty
        try {
            Integer categoryCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM categories", Integer.class);
            if (categoryCount == null || categoryCount == 0) {
                System.out.println("Database is empty. Seeding categories, users, and books...");
                
                // Seed Categories
                jdbcTemplate.execute("INSERT INTO categories (name, slug, description, icon) VALUES " +
                    "('Fiction', 'fiction', 'Novels, short stories, and literary fiction', '📖'), " +
                    "('Non-Fiction', 'non-fiction', 'Biographies, essays, and factual works', '📚'), " +
                    "('Science & Technology', 'science-technology', 'Scientific discoveries and tech innovations', '🔬'), " +
                    "('Business & Economics', 'business-economics', 'Entrepreneurship, finance, and management', '💼'), " +
                    "('Self-Help', 'self-help', 'Personal development and motivational books', '🌟'), " +
                    "('Children & Young Adult', 'children-young-adult', 'Stories and learning for young readers', '🧒'), " +
                    "('History', 'history', 'Historical events, civilizations, and eras', '🏛️')");
                
                // Seed Users
                jdbcTemplate.execute("INSERT INTO users (full_name, email, password_hash, role, phone) VALUES " +
                    "('Admin User', 'admin@bookverse.com', 'admin123', 'admin', '+1234567890'), " +
                    "('Jane Reader', 'jane@example.com', 'password123', 'customer', '+1987654321')");
                
                // Seed Books
                jdbcTemplate.execute("INSERT INTO books (title, author, isbn, description, price, original_price, stock, category_id, cover_url, rating, review_count, pages, publisher, publish_date, is_featured) VALUES " +
                    "('The Midnight Library', 'Matt Haig', '9780525559474', 'Between life and death there is a library...', 1199.20, 1599.20, 45, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg', 4.2, 1250, 304, 'Viking', '2020-09-29', TRUE), " +
                    "('Atomic Habits', 'James Clear', '9780735211292', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.', 1359.20, 1999.20, 120, 5, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg', 4.8, 3400, 320, 'Avery', '2018-10-16', TRUE), " +
                    "('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'From a renowned historian comes a groundbreaking narrative of humanitys creation.', 1519.20, 2240.00, 85, 2, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329519i/23692271.jpg', 4.4, 2800, 498, 'Harper', '2015-02-10', TRUE), " +
                    "('Clean Code', 'Robert C. Martin', '9780132350884', 'A Handbook of Agile Software Craftsmanship.', 2799.20, 3999.20, 60, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg', 4.5, 1900, 464, 'Prentice Hall', '2008-08-01', TRUE), " +
                    "('The Psychology of Money', 'Morgan Housel', '9780857197689', 'Timeless lessons on wealth, greed, and happiness.', 1279.20, 1760.00, 95, 4, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg', 4.6, 2100, 256, 'Harriman House', '2020-09-08', TRUE), " +
                    "('The Alchemist', 'Paulo Coelho', '9780062315007', 'A magical fable about following your dream.', 959.20, 1359.20, 100, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg', 4.2, 3100, 197, 'HarperOne', '1988-01-01', TRUE)");
                
                System.out.println("Database seeding completed successfully.");
            }
        } catch (Exception e) {
            System.err.println("Error seeding database: " + e.getMessage());
        }

        // 2. Schema Migration for orders table
        try {
            List<String> columns = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'estimated_delivery' AND TABLE_SCHEMA = DATABASE()",
                String.class
            );

            if (columns.isEmpty()) {
                System.out.println("Adding missing column 'estimated_delivery' to 'orders' table...");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN estimated_delivery DATE AFTER notes");
                System.out.println("Column 'estimated_delivery' added successfully.");
            }
        } catch (Exception e) {
            System.out.println("Skip column schema check/migration: " + e.getMessage());
        }
    }
}
