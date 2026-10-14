-- ====================================================================
-- BookVerse E-Commerce Application
-- Seed Script: Realistic Sample Customer Book Reviews (Demo Data)
-- ====================================================================
-- Database: bookverse
-- Description:
--   Populates realistic 3 to 5 star sample reviews across all existing
--   books in the BookVerse catalog.
-- Safety & Idempotency:
--   1. Dynamic ID lookup for users and books (no hardcoded ID assumptions).
--   2. INSERT IGNORE prevents violating uk_user_book (user_id, book_id).
--   3. All sample reviews have verified_purchase = FALSE.
--   4. Does not overwrite or modify existing genuine reviews.
--   5. Safe to execute multiple times.
-- ====================================================================

USE bookverse;

-- --------------------------------------------------------------------
-- 1. Insert Sample Reviews
-- --------------------------------------------------------------------

-- Book 1: The Midnight Library (Matt Haig)
-- (User 'jane@example.com' already has an existing review; adding reviews from other users)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Bittersweet and comforting reflection on regret',
  'Matt Haig explores the concept of parallel lives and choices with genuine empathy. Nora Seed''s journey through the library between life and death made me reflect deeply on my own what-ifs. The ending felt slightly predictable, but the message that every life has value resonated strongly.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Midnight Library';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Read this in one sitting',
  'A fast, poignant read. The idea that we mourn unlived possibilities instead of embracing the present is captured brilliantly. Highly recommended for anyone questioning their path.',
  FALSE, 11, FALSE, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Midnight Library';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Philosophical concept wrapped in an accessible story',
  'A blend of speculative fiction and philosophy. The characters and scenarios in each alternative life highlight how changing one variable doesn''t necessarily fix inner discontent.',
  FALSE, 3, FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users u, books b WHERE u.email = 'admin@bookverse.com' AND b.title = 'The Midnight Library';

-- Book 2: Atomic Habits (James Clear)
-- (User 'jane@example.com' already has an existing review; adding reviews from other users)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Systematic approach that actually sticks',
  'Most self-help books are 90% fluff and 10% advice. James Clear flips that ratio. The four laws of behavior change (make it obvious, attractive, easy, satisfying) gave me a repeatable framework for building daily reading and workout routines.',
  FALSE, 19, FALSE, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Atomic Habits';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Practical advice with great visual diagrams',
  'The concept of identity-based habits is the most impactful part. Instead of setting an outcome goal like running a marathon, focusing on becoming a runner shifts your entire mindset. Very well structured.',
  FALSE, 8, FALSE, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Atomic Habits';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'A masterclass in actionable behavioral psychology',
  'Clear synthesizes research from cognitive psychology into clean, immediately implementable habits. The habit-stacking technique alone paid for the book.',
  FALSE, 12, FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM users u, books b WHERE u.email = 'admin@bookverse.com' AND b.title = 'Atomic Habits';

-- Book 4: Clean Code (Robert C. Martin)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Foundational reading for any software developer',
  'Uncle Bob''s principles on meaningful names, function length, and separation of concerns completely reshaped how I write Java. Writing code that humans can understand is an art, and this book is the textbook.',
  FALSE, 14, FALSE, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Clean Code';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Great principles, even if some examples feel dated',
  'The core ideas around SOLID principles, unit testing, and avoiding code smells are timeless. Some of the Java examples are a bit verbose compared to modern standards, but the core wisdom is indispensable.',
  FALSE, 6, FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Clean Code';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Should be mandatory reading in computer science',
  'The chapter on error handling and functions doing one thing well cleared up years of messy habits. Our team refactored our services using the advice here and reduced bugs noticeably.',
  FALSE, 9, FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Clean Code';

-- Book 5: The Psychology of Money (Morgan Housel)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Money is about behavior, not math',
  'Housel writes with wonderful clarity. His 19 short stories illustrate why financial success has more to do with emotions, ego, and patience than financial spreadsheets. The chapter on Freedom was my favorite.',
  FALSE, 16, FALSE, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'The Psychology of Money';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Refreshing departure from typical finance books',
  'No stock picks or get-rich schemes here. Instead, it''s a study of risk, compounding, and knowing when you have enough. Highly recommended for young professionals.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Psychology of Money';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Concise wisdom that stays with you',
  'I finished this in a weekend and immediately bought copies for friends. The distinction between being rich (current income) and being wealthy (unspent options) changed how I view saving.',
  FALSE, 10, FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Psychology of Money';

-- Book 6: Dune (Frank Herbert)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Monumental worldbuilding and political intrigue',
  'Herbert created an ecosystem on Arrakis that feels utterly alive. The interplay of ecology, religion, and feudal politics makes this much more than standard sci-fi. Paul Atreides is a fascinating protagonist.',
  FALSE, 22, FALSE, DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 28 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Dune';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Dense at the start, but richly rewarding',
  'Takes about 100 pages to get used to the terminology (the glossary in the back helps immensely), but once the drama unfolds, you can''t put it down. The spice must flow!',
  FALSE, 11, FALSE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Dune';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Timeless epic with deep ecological themes',
  'Frank Herbert was decades ahead of his time regarding resource scarcity, desert ecology, and messianic fanaticism. An absolute triumph of imaginative fiction.',
  FALSE, 5, FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Dune';

-- Book 7: Educated (Tara Westover)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Incredible resilience and the power of knowledge',
  'Tara''s journey from an isolated survivalist compound in rural Idaho to Cambridge University is astonishing. Her writing is elegant, honest, and heartbreaking. A testament to how education transforms consciousness.',
  FALSE, 18, FALSE, DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 21 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Educated';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Gripping and deeply emotional memoir',
  'I could not put this book down. The complex relationships with her parents and family are written with nuanced compassion despite the trauma. One of the best memoirs of the decade.',
  FALSE, 13, FALSE, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Educated';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Raw, painful, and inspiring',
  'A vivid look into extreme isolation and the steep personal cost of self-reinvention. The conflict between family loyalty and personal truth is explored with raw vulnerability.',
  FALSE, 6, FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Educated';

-- Book 8: The Lean Startup (Eric Ries)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'The Bible of modern startup methodology',
  'Build-Measure-Learn feedback loops, Minimum Viable Products, and validated learning should be understood by every product manager and entrepreneur. Essential guide to avoiding building products nobody wants.',
  FALSE, 10, FALSE, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'The Lean Startup';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Practical framework for continuous innovation',
  'Ries brings the discipline of lean manufacturing into product development. The focus on vanity metrics vs actionable metrics alone will save teams months of misguided work.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Lean Startup';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Great core concepts, though somewhat repetitive',
  'The MVP concept and pivoting strategies are groundbreaking, though the examples get stretched a bit thin across the chapters. Still well worth reading for the core principles.',
  FALSE, 4, FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Lean Startup';

-- Book 9: A Brief History of Time (Stephen Hawking)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Mind-bending journey through cosmological physics',
  'Hawking''s ability to explain black holes, the arrow of time, general relativity, and quantum mechanics without drowning the reader in complex math is legendary. Truly expands your perspective.',
  FALSE, 15, FALSE, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'A Brief History of Time';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Challenging concepts explained with wit',
  'Even for someone without a science degree, the explanations of spacetime and light cones are illuminating. Some chapters on string theory require slow, attentive reading.',
  FALSE, 8, FALSE, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'A Brief History of Time';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Humbling and deeply inspiring',
  'Reading Hawking makes you appreciate how much humanity has unraveled about the cosmos while realizing how much mystery remains. A timeless popular science classic.',
  FALSE, 6, FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'A Brief History of Time';

-- Book 10: The Alchemist (Paulo Coelho)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'A poetic fable about following your Personal Legend',
  'Santiago the Andalusian shepherd''s journey across the Egyptian desert is full of timeless allegorical wisdom. Whenever I feel stuck or uncertain, re-reading this gives me renewed purpose.',
  FALSE, 17, FALSE, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'The Alchemist';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Charming fable, though a bit simplistic',
  'A sweet, quick read with memorable aphorisms about omens and listening to your heart. It leans heavily into simple philosophical tropes, but its positivity is infectious.',
  FALSE, 5, FALSE, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Alchemist';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Lyrical and uplifting',
  'The prose is straightforward yet deeply evocative. It reminds us that treasure is often in the journey and transformations along the way rather than the destination.',
  FALSE, 8, FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Alchemist';

-- Book 11: Thinking, Fast and Slow (Daniel Kahneman)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'The definitive guide to human cognitive biases',
  'Kahneman''s dichotomy between System 1 (intuitive, fast) and System 2 (deliberate, slow) reveals why even smart people make irrational choices. Loss aversion, anchoring, and availability heuristics are explained masterfully.',
  FALSE, 21, FALSE, DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Thinking, Fast and Slow';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Dense and academic, but packed with profound insights',
  'This isn''t a light self-help read; it''s a substantive compilation of decades of Nobel prize-winning research. It fundamentally changed how I evaluate business risks and personal assumptions.',
  FALSE, 12, FALSE, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Thinking, Fast and Slow';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Eye-opening look into how our minds trick us',
  'Fascinating experiments on priming and framing effects. It takes time to digest each chapter, but it rewards patient readers with sharper critical thinking.',
  FALSE, 5, FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Thinking, Fast and Slow';

-- Book 12: Project Hail Mary (Andy Weir)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Pure science fiction joy from start to finish',
  'Ryland Grace waking up with amnesia on an interstellar ship with humanity''s survival at stake is gripping from page one. The scientific problem-solving and the heartwarming friendship that forms are unforgettable. Amaze!',
  FALSE, 25, FALSE, DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Project Hail Mary';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Even better than The Martian',
  'Andy Weir knocked it out of the park. The science is nerdy and believable, the humor lands naturally, and the alien biology is inventive and delightfully original. Fist my bump!',
  FALSE, 19, FALSE, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Project Hail Mary';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Fast-paced, optimistic hard sci-fi',
  'A breath of fresh air in modern science fiction. The focus on scientific collaboration and optimism against insurmountable odds makes this an absolute page-turner.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Project Hail Mary';

-- Book 13: The Art of War (Sun Tzu)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Timeless tactical principles applicable far beyond warfare',
  'Sun Tzu''s aphorisms on knowing yourself and your adversary, avoiding conflict when possible, and adapting like water apply directly to modern leadership, negotiations, and competitive strategy.',
  FALSE, 9, FALSE, DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 26 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'The Art of War';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Concise, poetic, and strategically sharp',
  'A quick read in terms of length, but each maxim can be contemplated for hours. The translation notes provide helpful historical context for 6th-century BC military conditions.',
  FALSE, 6, FALSE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Art of War';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Interesting historical text with good business parallels',
  'Some sections on chariot logistics and fire attacks are very ancient, but the chapters on deception, positioning, and psychological momentum remain universally relevant.',
  FALSE, 3, FALSE, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Art of War';

-- Book 14: Steve Jobs (Walter Isaacson)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Unvarnished portrait of a complicated visionary',
  'Isaacson had unprecedented access to Jobs, his friends, and his rivals. It portrays his reality distortion field, obsessive design perfectionism, and temper without sanitizing or romanticizing his flaws.',
  FALSE, 14, FALSE, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Steve Jobs';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Fascinating chronicle of the digital revolution',
  'Tracing the trajectory from the Apple II to Pixar, iPod, and iPhone gives a front-row seat to modern tech history. Jobs'' intersection of technology and liberal arts defined an era.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Steve Jobs';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Thoroughly researched and wonderfully narrative',
  'Over 600 pages, but reads like a novel. The debates over open versus closed hardware/software systems between Jobs and Gates are some of the best chapters.',
  FALSE, 9, FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Steve Jobs';

-- Book 15: Design Patterns (Erich Gamma et al.)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'The canonical reference for object-oriented architecture',
  'The Gang of Four created a common vocabulary that software engineers still use every single day: Factory, Singleton, Observer, Decorator, and Strategy. A crucial reference manual.',
  FALSE, 11, FALSE, DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 27 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Design Patterns';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Indispensable software engineering manual',
  'Not a book to read cover-to-cover, but an essential reference guide when designing scalable software architectures. The structural and behavioral pattern breakdowns are pristine.',
  FALSE, 8, FALSE, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Design Patterns';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Academic, but foundational',
  'C++ and Smalltalk examples require translation to modern languages, but understanding how to decouple objects and program to interfaces rather than implementations is vital.',
  FALSE, 4, FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Design Patterns';

-- Book 16: Harry Potter and the Sorcerers Stone (J.K. Rowling)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Pure childhood magic and nostalgia',
  'Re-reading the first book years later, the charm of Diagon Alley, Hogwarts Castle, and the initial meeting of Harry, Ron, and Hermione on the Hogwarts Express never fades. Wonderfully whimsical.',
  FALSE, 20, FALSE, DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 23 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Harry Potter and the Sorcerers Stone';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'The start of a legendary journey',
  'The pacing is brisk, the characters are immediately endearing, and the climax underneath the trapdoor remains thrilling. Perfect comfort reading for readers of any age.',
  FALSE, 12, FALSE, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Harry Potter and the Sorcerers Stone';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Imaginative and wonderfully cozy',
  'The magical worldbuilding is effortless. Rowling captures the feeling of an underdog finding a real home and loyal friends in Hogwarts.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Harry Potter and the Sorcerers Stone';

-- Book 17: Zero to One (Peter Thiel)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Provocative thinking on monopoly and technology',
  'Thiel challenges conventional startup wisdom. His argument that competition is for losers and that true innovators create unique monopolies that go from 0 to 1 makes you question standard doctrine.',
  FALSE, 11, FALSE, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Zero to One';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Sharp essays on contrarian entrepreneurship',
  'Short, punchy, and intellectually stimulating. The chapter on The Power Law and the seven questions every business must answer are pure startup gold.',
  FALSE, 8, FALSE, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Zero to One';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Contrarian perspectives that spark debate',
  'Some tangents feel idiosyncratic, but the fundamental insights on technology versus globalization offer a unique lens on tech creation.',
  FALSE, 3, FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Zero to One';

-- Book 18: 1984 (George Orwell)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Chillingly prophetic and profoundly relevant',
  'Orwell''s depiction of Oceania, Doublethink, the Ministry of Truth, and the telescreen was written in 1948, yet feels more pertinent with every passing decade. Winston Smith''s rebellion is gripping and tragic.',
  FALSE, 24, FALSE, DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = '1984';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'A haunting masterpiece on totalitarian control',
  'The psychological horror of altering the past and eroding language through Newspeak to make dissenting thoughts impossible is terrifying. A book everyone should read at least once.',
  FALSE, 15, FALSE, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = '1984';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Brilliant examination of power and surveillance',
  'The interrogation scenes in Room 101 are harrowing and unforgettable. Orwell explores the ultimate fragility of truth when power monopolizes information.',
  FALSE, 9, FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = '1984';

-- Book 19: The Subtle Art of Not Giving a F*ck (Mark Manson)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Counterintuitive advice with pragmatic humor',
  'Manson cuts through toxic positivity. Instead of pretending everything is awesome, he argues that life is about choosing good problems and accepting limitations. Very liberating read.',
  FALSE, 13, FALSE, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'The Subtle Art of Not Giving a F*ck';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 3,
  'Stoicism dressed in casual, blunt prose',
  'Underneath the provocative language and conversational tone is solid Stoic philosophy. If you can get past the edgy styling, the lessons on personal responsibility and mortality are sound.',
  FALSE, 6, FALSE, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'The Subtle Art of Not Giving a F*ck';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Refreshing antidote to feel-good motivational fluff',
  'Focuses on taking responsibility for your reactions rather than waiting for the world to accommodate your feelings. Fast read with genuine practical takeaways.',
  FALSE, 7, FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'The Subtle Art of Not Giving a F*ck';

-- Book 20: Cosmos (Carl Sagan)
INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'Lyrical celebration of science, reason, and our planet',
  'Carl Sagan''s prose reads like poetry. From the library of Alexandria to the outer reaches of the galaxy, Cosmos inspires awe while fiercely defending scientific inquiry and planetary stewardship.',
  FALSE, 17, FALSE, DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 27 DAY)
FROM users u, books b WHERE u.email = 'jane@example.com' AND b.title = 'Cosmos';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 5,
  'We are a way for the cosmos to know itself',
  'One of the most inspiring scientific books ever penned. Sagan''s humility, historical context, and cosmic optimism are medicine for cynical times. A treasure of a book.',
  FALSE, 21, FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)
FROM users u, books b WHERE u.email = 'buddyrohit1@gmail.com' AND b.title = 'Cosmos';

INSERT IGNORE INTO reviews (user_id, book_id, rating, title, body, verified_purchase, helpful_count, reported, created_at, updated_at)
SELECT u.id, b.id, 4,
  'Timeless masterpiece of scientific communication',
  'Beautifully connects human history, astronomy, and evolutionary biology. Reminds us of the pale blue dot we all share and our duty to preserve it.',
  FALSE, 10, FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM users u, books b WHERE u.email = 'raja@gmai.com' AND b.title = 'Cosmos';

-- --------------------------------------------------------------------
-- 2. Synchronize Book Ratings and Review Counts
-- --------------------------------------------------------------------
UPDATE books b
JOIN (
    SELECT book_id, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as cnt
    FROM reviews
    GROUP BY book_id
) r ON b.id = r.book_id
SET b.rating = r.avg_rating, b.review_count = r.cnt;
