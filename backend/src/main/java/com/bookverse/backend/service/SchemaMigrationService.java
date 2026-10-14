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

    private boolean columnExists(String table, String column) {
        try {
            List<String> cols = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                "WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()",
                String.class, table, column);
            return !cols.isEmpty();
        } catch (Exception e) { return false; }
    }

    private boolean tableExists(String table) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES " +
                "WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()",
                Integer.class, table);
            return count != null && count > 0;
        } catch (Exception e) { return false; }
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== BookVerse Schema Migration ===");

        // ── 1. Seed initial data if empty ─────────────────────────────────────
        try {
            Integer categoryCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM categories", Integer.class);
            if (categoryCount == null || categoryCount == 0) {
                System.out.println("Seeding categories, users, and books...");

                jdbcTemplate.execute("INSERT INTO categories (name, slug, description, icon) VALUES " +
                    "('Fiction', 'fiction', 'Novels, short stories, and literary fiction', '📖'), " +
                    "('Non-Fiction', 'non-fiction', 'Biographies, essays, and factual works', '📚'), " +
                    "('Science & Technology', 'science-technology', 'Scientific discoveries and tech innovations', '🔬'), " +
                    "('Business & Economics', 'business-economics', 'Entrepreneurship, finance, and management', '💼'), " +
                    "('Self-Help', 'self-help', 'Personal development and motivational books', '🌟'), " +
                    "('Children & Young Adult', 'children-young-adult', 'Stories and learning for young readers', '🧒'), " +
                    "('History', 'history', 'Historical events, civilizations, and eras', '🏛️')");

                jdbcTemplate.execute("INSERT INTO users (full_name, email, password_hash, `role`, phone) VALUES " +
                    "('Admin User', 'admin@bookverse.com', 'admin123', 'admin', '+1234567890'), " +
                    "('Jane Reader', 'jane@example.com', 'password123', 'customer', '+1987654321')");

                jdbcTemplate.execute("INSERT INTO books (title, author, isbn, description, price, original_price, stock, category_id, cover_url, rating, review_count, pages, publisher, publish_date, is_featured) VALUES " +
                    "('The Midnight Library', 'Matt Haig', '9780525559474', 'Between life and death there is a library...', 1199.20, 1599.20, 45, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg', 4.2, 1250, 304, 'Viking', '2020-09-29', TRUE), " +
                    "('Atomic Habits', 'James Clear', '9780735211292', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.', 1359.20, 1999.20, 120, 5, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg', 4.8, 3400, 320, 'Avery', '2018-10-16', TRUE), " +
                    "('Sapiens', 'Yuval Noah Harari', '9780062316097', 'A groundbreaking narrative of humanitys creation and evolution.', 1519.20, 2240.00, 85, 2, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329519i/23692271.jpg', 4.4, 2800, 498, 'Harper', '2015-02-10', TRUE), " +
                    "('Clean Code', 'Robert C. Martin', '9780132350884', 'A Handbook of Agile Software Craftsmanship.', 2799.20, 3999.20, 60, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg', 4.5, 1900, 464, 'Prentice Hall', '2008-08-01', TRUE), " +
                    "('The Psychology of Money', 'Morgan Housel', '9780857197689', 'Timeless lessons on wealth, greed, and happiness.', 1279.20, 1760.00, 95, 4, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg', 4.6, 2100, 256, 'Harriman House', '2020-09-08', TRUE), " +
                    "('The Alchemist', 'Paulo Coelho', '9780062315007', 'A magical fable about following your dream.', 959.20, 1359.20, 100, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg', 4.2, 3100, 197, 'HarperOne', '1988-01-01', TRUE)");

                System.out.println("Seeding completed.");
            }
        } catch (Exception e) {
            System.err.println("Seeding error: " + e.getMessage());
        }

        // ── 2. Add estimated_delivery column to orders if missing ───────────
        try {
            if (!columnExists("orders", "estimated_delivery")) {
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN estimated_delivery DATE AFTER notes");
                System.out.println("Added: orders.estimated_delivery");
            }
        } catch (Exception e) {
            System.out.println("Skip orders migration: " + e.getMessage());
        }

        // ── 3. Create reviews table if not exists ────────────────────────────
        try {
            if (!tableExists("reviews")) {
                jdbcTemplate.execute(
                    "CREATE TABLE reviews (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  user_id INT NOT NULL," +
                    "  book_id INT NOT NULL," +
                    "  rating TINYINT NOT NULL," +
                    "  title VARCHAR(200)," +
                    "  body TEXT," +
                    "  verified_purchase BOOLEAN DEFAULT FALSE," +
                    "  helpful_count INT DEFAULT 0," +
                    "  reported BOOLEAN DEFAULT FALSE," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "  UNIQUE KEY uk_user_book (user_id, book_id)," +
                    "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE," +
                    "  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                );
                System.out.println("Created: reviews table");
            }
        } catch (Exception e) {
            System.out.println("Skip reviews table: " + e.getMessage());
        }

        // ── 4. Create wishlist table if not exists ───────────────────────────
        try {
            if (!tableExists("wishlist")) {
                jdbcTemplate.execute(
                    "CREATE TABLE wishlist (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  user_id INT NOT NULL," +
                    "  book_id INT NOT NULL," +
                    "  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "  UNIQUE KEY uk_user_book (user_id, book_id)," +
                    "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE," +
                    "  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                );
                System.out.println("Created: wishlist table");
            }
        } catch (Exception e) {
            System.out.println("Skip wishlist table: " + e.getMessage());
        }

        // ── 5. Create coupons table if not exists ────────────────────────────
        try {
            if (!tableExists("coupons")) {
                jdbcTemplate.execute(
                    "CREATE TABLE coupons (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  code VARCHAR(50) NOT NULL UNIQUE," +
                    "  type ENUM('percentage','fixed') NOT NULL," +
                    "  value DECIMAL(10,2) NOT NULL," +
                    "  min_order_value DECIMAL(10,2) DEFAULT 0," +
                    "  max_discount DECIMAL(10,2)," +
                    "  expires_at DATETIME," +
                    "  usage_limit INT DEFAULT NULL," +
                    "  used_count INT DEFAULT 0," +
                    "  is_active BOOLEAN DEFAULT TRUE," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                );
                System.out.println("Created: coupons table");

                // Seed sample coupons
                jdbcTemplate.execute("INSERT INTO coupons (code, type, value, min_order_value, max_discount, usage_limit) VALUES " +
                    "('WELCOME10', 'percentage', 10, 500, 200, 100), " +
                    "('SAVE50', 'fixed', 50, 300, NULL, 200), " +
                    "('BOOKVERSE20', 'percentage', 20, 1000, 500, 50)");
                System.out.println("Seeded: sample coupons");
            }
        } catch (Exception e) {
            System.out.println("Skip coupons table: " + e.getMessage());
        }

        // ── 6. Create languages table if not exists ──────────────────────────
        try {
            if (!tableExists("languages")) {
                jdbcTemplate.execute(
                    "CREATE TABLE languages (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  code VARCHAR(10) NOT NULL UNIQUE," +
                    "  name VARCHAR(100) NOT NULL," +
                    "  native_name VARCHAR(100)," +
                    "  script VARCHAR(50)," +
                    "  is_active BOOLEAN DEFAULT TRUE," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                );
                System.out.println("Created: languages table");
            }

            Integer langCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM languages", Integer.class);
            if (langCount == null || langCount == 0) {
                jdbcTemplate.execute("INSERT INTO languages (code, name, native_name, script) VALUES " +
                    "('hi', 'Hindi', 'हिन्दी', 'Devanagari'), " +
                    "('en', 'English', 'English', 'Latin'), " +
                    "('ta', 'Tamil', 'தமிழ்', 'Tamil'), " +
                    "('te', 'Telugu', 'తెలుగు', 'Telugu'), " +
                    "('bn', 'Bengali', 'বাংলা', 'Bengali'), " +
                    "('mr', 'Marathi', 'मराठी', 'Devanagari'), " +
                    "('gu', 'Gujarati', 'ગુજરાતી', 'Gujarati'), " +
                    "('kn', 'Kannada', 'ಕನ್ನಡ', 'Kannada'), " +
                    "('ml', 'Malayalam', 'മലയാളം', 'Malayalam'), " +
                    "('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'Gurmukhi'), " +
                    "('or', 'Odia', 'ଓଡ଼ିଆ', 'Odia'), " +
                    "('as', 'Assamese', 'অসমীয়া', 'Bengali'), " +
                    "('ur', 'Urdu', 'اردو', 'Arabic-Persian'), " +
                    "('sa', 'Sanskrit', 'संस्कृतम्', 'Devanagari'), " +
                    "('kok', 'Konkani', 'कोंकणी', 'Devanagari'), " +
                    "('ne', 'Nepali', 'नेपाली', 'Devanagari'), " +
                    "('es', 'Spanish', 'Español', 'Latin'), " +
                    "('fr', 'French', 'Français', 'Latin'), " +
                    "('de', 'German', 'Deutsch', 'Latin'), " +
                    "('pt', 'Portuguese', 'Português', 'Latin'), " +
                    "('it', 'Italian', 'Italiano', 'Latin'), " +
                    "('ar', 'Arabic', 'العربية', 'Arabic'), " +
                    "('zh', 'Chinese', '中文', 'Simplified Chinese'), " +
                    "('ja', 'Japanese', '日本語', 'Japanese'), " +
                    "('ko', 'Korean', '한국어', 'Hangul'), " +
                    "('ru', 'Russian', 'Русский', 'Cyrillic')");
                System.out.println("Seeded: 26 languages");
            }
        } catch (Exception e) {
            System.out.println("Skip languages table: " + e.getMessage());
        }

        // ── 7. Safe books table column extensions ─────────────────────────────
        try {
            String[][] colsToAdd = {
                {"subtitle", "VARCHAR(255) NULL AFTER title"},
                {"short_description", "TEXT NULL AFTER description"},
                {"edition", "VARCHAR(50) NULL AFTER publisher"},
                {"format", "VARCHAR(50) DEFAULT 'Paperback' AFTER edition"},
                {"genre", "VARCHAR(100) NULL AFTER format"},
                {"discount", "DECIMAL(5,2) DEFAULT 0.00 AFTER original_price"},
                {"is_bestseller", "BOOLEAN DEFAULT FALSE AFTER is_featured"},
                {"is_new_arrival", "BOOLEAN DEFAULT FALSE AFTER is_bestseller"},
                {"series_name", "VARCHAR(255) NULL AFTER is_new_arrival"},
                {"volume_number", "VARCHAR(50) NULL AFTER series_name"},
                {"issue_number", "VARCHAR(50) NULL AFTER volume_number"},
                {"illustrator", "VARCHAR(255) NULL AFTER issue_number"},
                {"artist", "VARCHAR(255) NULL AFTER illustrator"},
                {"publisher_imprint", "VARCHAR(255) NULL AFTER artist"},
                {"reading_direction", "VARCHAR(50) DEFAULT 'Left-to-Right' AFTER publisher_imprint"},
                {"age_recommendation", "VARCHAR(50) NULL AFTER reading_direction"}
            };

            for (String[] colDef : colsToAdd) {
                if (!columnExists("books", colDef[0])) {
                    jdbcTemplate.execute("ALTER TABLE books ADD COLUMN " + colDef[0] + " " + colDef[1]);
                    System.out.println("Added column to books: " + colDef[0]);
                }
            }
        } catch (Exception e) {
            System.out.println("Skip books columns extension: " + e.getMessage());
        }

        // ── 8. Clean up category icons (eliminate question marks) ──────────────
        try {
            System.out.println("Cleaning up category icons...");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookOpen' WHERE name = 'Novels' OR slug = 'novels'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Heart' WHERE name = 'Romance' OR slug = 'romance'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Search' WHERE name = 'Mystery' OR slug = 'mystery'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'ShieldAlert' WHERE name = 'Thriller' OR slug = 'thriller'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Ghost' WHERE name = 'Horror' OR slug = 'horror'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'WandSparkles' WHERE name = 'Fantasy' OR slug = 'fantasy'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Rocket' WHERE name = 'Science Fiction' OR slug = 'science-fiction'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Landmark' WHERE name = 'Historical Fiction' OR slug = 'historical-fiction'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookOpen' WHERE name = 'Short Stories' OR slug = 'short-stories'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Compass' WHERE name = 'Adventure' OR slug = 'adventure'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Search' WHERE name = 'Crime Fiction' OR slug = 'crime-fiction'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'UserRound' WHERE name = 'Biography' OR slug = 'biography'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'UserRound' WHERE name = 'Autobiography' OR slug = 'autobiography'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Sprout' WHERE name = 'Personal Development' OR slug = 'personal-development'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Brain' WHERE name = 'Psychology' OR slug = 'psychology'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Brain' WHERE name = 'Philosophy' OR slug = 'philosophy'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Scale' WHERE name = 'Politics' OR slug = 'politics'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'ChartNoAxesCombined' WHERE name = 'Finance' OR slug = 'finance'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Lightbulb' WHERE name = 'Entrepreneurship' OR slug = 'entrepreneurship'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Compass' WHERE name = 'Travel' OR slug = 'travel'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'GraduationCap' WHERE name LIKE '%Textbook%'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'FlaskConical' WHERE name IN ('Computer Science', 'Science', 'Mathematics')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Lightbulb' WHERE name = 'Programming'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Brain' WHERE name IN ('Artificial Intelligence', 'Machine Learning')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BriefcaseBusiness' WHERE name = 'Engineering'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'GraduationCap' WHERE name LIKE '%Exam%'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookOpen' WHERE name = 'Language Learning'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookImage' WHERE name LIKE '%Comic%' OR name IN ('Manga', 'Manhwa', 'Manhua', 'Graphic Novels', 'Webtoon Collections')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Palette' WHERE name IN ('Picture Books', 'Activity Books')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'WandSparkles' WHERE name IN ('Fairy Tales', 'Spirituality')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Baby' WHERE name IN ('Bedtime Stories', 'Children\\'s Comics')");
            jdbcTemplate.execute("UPDATE categories SET icon = 'GraduationCap' WHERE name = 'Educational Stories'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookOpen' WHERE name = 'Young Adult Fiction'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Brain' WHERE name LIKE '%Philosophy%'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'Landmark' WHERE name LIKE '%Literature%' OR name = 'Mythology'");
            jdbcTemplate.execute("UPDATE categories SET icon = 'BookOpen' WHERE icon LIKE '%?%' OR icon IS NULL OR icon = ''");
            System.out.println("Cleaned up category icons successfully.");
        } catch (Exception e) {
            System.out.println("Skip category icons cleanup: " + e.getMessage());
        }

        // ── 9. Fix book cover URLs with authentic covers ─────────────────────
        try {
            System.out.println("Fixing authentic book cover URLs...");
            jdbcTemplate.execute("UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/13892736-L.jpg' " +
                "WHERE (title LIKE '%Premchand%' OR title LIKE '%Premacanda%') AND (cover_url LIKE '%placeholder%' OR cover_url IS NULL)");
            jdbcTemplate.execute("UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/13311821-L.jpg' " +
                "WHERE (title LIKE '%Madhushala%' OR title LIKE '%मधुशाला%') AND (cover_url LIKE '%unsplash%' OR cover_url LIKE '%placeholder%' OR cover_url IS NULL)");
            jdbcTemplate.execute("UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/1020563-L.jpg' " +
                "WHERE title LIKE '%One Piece%' AND (cover_url LIKE '%placeholder%' OR cover_url IS NULL)");
            System.out.println("Book cover URLs updated.");
        } catch (Exception e) {
            System.out.println("Skip book covers fix: " + e.getMessage());
        }

        // ── 10. Fix language native names with UTF-8 scripts ─────────────────
        try {
            jdbcTemplate.execute("UPDATE languages SET native_name = 'हिन्दी' WHERE code = 'hi'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'தமிழ்' WHERE code = 'ta'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'తెలుగు' WHERE code = 'te'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'বাংলা' WHERE code = 'bn'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'मराठी' WHERE code = 'mr'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'ગુજરાતી' WHERE code = 'gu'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'ಕನ್ನಡ' WHERE code = 'kn'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'മലയാളം' WHERE code = 'ml'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'ਪੰਜਾਬੀ' WHERE code = 'pa'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'ଓଡ଼ିଆ' WHERE code = 'or'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'অসমীয়া' WHERE code = 'as'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'اردو' WHERE code = 'ur'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'संस्कृतम्' WHERE code = 'sa'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'कोंकणी' WHERE code = 'kok'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'नेपाली' WHERE code = 'ne'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'العربية' WHERE code = 'ar'");
            jdbcTemplate.execute("UPDATE languages SET native_name = '中文' WHERE code = 'zh'");
            jdbcTemplate.execute("UPDATE languages SET native_name = '日本語' WHERE code = 'ja'");
            jdbcTemplate.execute("UPDATE languages SET native_name = '한국어' WHERE code = 'ko'");
            jdbcTemplate.execute("UPDATE languages SET native_name = 'Русский' WHERE code = 'ru'");
            System.out.println("Language native names updated.");
        } catch (Exception e) {
            System.out.println("Skip language native names fix: " + e.getMessage());
        }

        System.out.println("=== Schema Migration Complete ===");
    }
}
