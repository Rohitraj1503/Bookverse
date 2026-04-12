-- =============================================
-- BookVerse E-Commerce Database Schema
-- MySQL 8.0+ | Normalized to 3NF
-- =============================================

CREATE DATABASE IF NOT EXISTS bookverse;
USE bookverse;

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. BOOKS TABLE
-- =============================================
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(200) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10, 2) CHECK (original_price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INT NOT NULL,
    cover_url VARCHAR(500),
    rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INT DEFAULT 0,
    pages INT,
    publisher VARCHAR(200),
    publish_date DATE,
    language VARCHAR(50) DEFAULT 'English',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_featured (is_featured),
    INDEX idx_rating (rating),
    FULLTEXT idx_search (title, author, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. CART TABLE
-- =============================================
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_user_book (user_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. ORDERS TABLE
-- =============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_name VARCHAR(100) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_zip VARCHAR(20) NOT NULL,
    shipping_phone VARCHAR(20),
    payment_method ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'cod') NOT NULL,
    notes TEXT,
    estimated_delivery DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. ORDER ITEMS TABLE
-- =============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. PAYMENTS TABLE
-- =============================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'cod') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SEED DATA — Categories
-- =============================================
INSERT INTO categories (name, slug, description, icon) VALUES
('Fiction', 'fiction', 'Novels, short stories, and literary fiction', '📖'),
('Non-Fiction', 'non-fiction', 'Biographies, essays, and factual works', '📚'),
('Science & Technology', 'science-technology', 'Scientific discoveries and tech innovations', '🔬'),
('Business & Economics', 'business-economics', 'Entrepreneurship, finance, and management', '💼'),
('Self-Help', 'self-help', 'Personal development and motivational books', '🌟'),
('Children & Young Adult', 'children-young-adult', 'Stories and learning for young readers', '🧒'),
('History', 'history', 'Historical events, civilizations, and eras', '🏛️'),
('Arts & Photography', 'arts-photography', 'Visual arts, design, and photography', '🎨'),
('Comics & Manga', 'comics-manga', 'Graphic novels, comics, and manga series', '💥'),
('Academic & Textbooks', 'academic-textbooks', 'University-level textbooks and references', '🎓');

-- =============================================
-- SEED DATA — Admin user (password: admin123)
-- =============================================
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Admin User', 'admin@bookverse.com', 'admin123', 'admin', '+1234567890'),
('Jane Reader', 'jane@example.com', 'password123', 'customer', '+1987654321');

-- =============================================
-- SEED DATA — Books
-- =============================================
INSERT INTO books (title, author, isbn, description, price, original_price, stock, category_id, cover_url, rating, review_count, pages, publisher, publish_date, is_featured) VALUES
('The Midnight Library', 'Matt Haig', '9780525559474', 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.', 1199.20, 1599.20, 45, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg', 4.2, 1250, 304, 'Viking', '2020-09-29', TRUE),
('Atomic Habits', 'James Clear', '9780735211292', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.', 1359.20, 1999.20, 120, 5, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg', 4.8, 3400, 320, 'Avery', '2018-10-16', TRUE),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'From a renowned historian comes a groundbreaking narrative of humanitys creation and evolution.', 1519.20, 2240.00, 85, 2, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329519i/23692271.jpg', 4.4, 2800, 498, 'Harper', '2015-02-10', TRUE),
('Clean Code', 'Robert C. Martin', '9780132350884', 'A Handbook of Agile Software Craftsmanship. Even bad code can function, but clean code is the path to mastery.', 2799.20, 3999.20, 60, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg', 4.5, 1900, 464, 'Prentice Hall', '2008-08-01', TRUE),
('The Psychology of Money', 'Morgan Housel', '9780857197689', 'Timeless lessons on wealth, greed, and happiness. Doing well with money has little to do with how smart you are.', 1279.20, 1760.00, 95, 4, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg', 4.6, 2100, 256, 'Harriman House', '2020-09-08', TRUE),
('Dune', 'Frank Herbert', '9780441013593', 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family.', 1039.20, 1519.20, 70, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg', 4.3, 1650, 688, 'Ace', '1965-08-01', FALSE),
('Educated', 'Tara Westover', '9780399590504', 'A memoir about a young girl who leaves her survivalist family and goes on to earn a PhD from Cambridge.', 1119.20, 1599.20, 40, 2, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1506026635i/35133922.jpg', 4.5, 1800, 352, 'Random House', '2018-02-20', FALSE),
('The Lean Startup', 'Eric Ries', '9780307887894', 'How Todays Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses.', 1599.20, 2399.20, 55, 4, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333576876i/10127019.jpg', 4.1, 1400, 336, 'Crown Business', '2011-09-13', FALSE),
('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'From the Big Bang to black holes, Stephen Hawking explores the mysteries of the universe.', 1239.20, 1760.00, 35, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333578746i/3869.jpg', 4.3, 2200, 212, 'Bantam', '1988-04-01', TRUE),
('The Alchemist', 'Paulo Coelho', '9780062315007', 'A magical fable about following your dream, by the Brazilian storyteller Paulo Coelho.', 959.20, 1359.20, 100, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg', 4.2, 3100, 197, 'HarperOne', '1988-01-01', TRUE),
('Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Nobel laureate Daniel Kahneman takes us on a tour of the mind and explains the two systems that drive the way we think.', 1439.20, 2000.00, 65, 5, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1317793965i/11468377.jpg', 4.1, 1600, 499, 'Farrar Straus Giroux', '2011-10-25', FALSE),
('Project Hail Mary', 'Andy Weir', '9780593135204', 'A lone astronaut must save the earth from disaster in this propulsive interstellar adventure.', 1319.20, 1999.20, 50, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1597695864i/54493401.jpg', 4.7, 2500, 496, 'Ballantine Books', '2021-05-04', TRUE),
('The Art of War', 'Sun Tzu', '9781590302255', 'The definitive translation of the timeless classic of military strategy and philosophy.', 799.20, 1199.20, 80, 7, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1453417993i/10534.jpg', 4.0, 900, 273, 'Shambhala', '2005-01-11', FALSE),
('Steve Jobs', 'Walter Isaacson', '9781451648539', 'The exclusive biography of Steve Jobs based on more than forty interviews with Jobs over two years.', 1159.20, 1600.00, 45, 2, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1511288482i/11084145.jpg', 4.2, 1300, 656, 'Simon & Schuster', '2011-10-24', FALSE),
('Design Patterns', 'Erich Gamma', '9780201633610', 'Elements of Reusable Object-Oriented Software. The bible of software design patterns.', 3199.20, 4399.20, 30, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348027904i/85009.jpg', 4.3, 800, 395, 'Addison-Wesley', '1994-10-31', FALSE),
('Harry Potter and the Sorcerers Stone', 'J.K. Rowling', '9780590353427', 'The first book in the beloved Harry Potter series about a young wizards adventures at Hogwarts.', 1039.20, 1439.20, 150, 6, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg', 4.7, 5000, 309, 'Scholastic', '1997-06-26', TRUE),
('Zero to One', 'Peter Thiel', '9780804139298', 'Notes on Startups, or How to Build the Future. Every moment in business happens only once.', 1359.20, 1920.00, 70, 4, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1414347376i/18050143.jpg', 4.2, 1700, 224, 'Crown Business', '2014-09-16', FALSE),
('1984', 'George Orwell', '9780451524935', 'A dystopian masterpiece about totalitarianism, surveillance, and the power of language.', 879.20, 1279.20, 90, 1, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg', 4.4, 4200, 328, 'Signet Classic', '1949-06-08', FALSE),
('The Subtle Art of Not Giving a F*ck', 'Mark Manson', '9780062457714', 'A counterintuitive approach to living a good life by choosing what truly matters.', 1199.20, 1760.00, 85, 5, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1465761302i/28257707.jpg', 3.9, 2800, 224, 'Harper', '2016-09-13', FALSE),
('Cosmos', 'Carl Sagan', '9780345539434', 'Explores 15 billion years of cosmic evolution and the development of science and civilization.', 1119.20, 1599.20, 40, 3, 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388620656i/55030.jpg', 4.6, 1500, 396, 'Ballantine Books', '1980-10-12', FALSE);
