/* ========================================
   BookVerse — Core Application JavaScript
   Theme, Toast, Modal, Data Store, Cart
   ======================================== */
// Set this to your deployed Render backend URL (e.g., https://bookverse-backend.onrender.com)
const RENDER_BACKEND_URL = 'https://YOUR-RENDER-BACKEND.onrender.com';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : `${RENDER_BACKEND_URL}/api`;

// ============ DATA STORE ============
const BookStore = {
    books: [],
    categories: [],
    ready: null,

    init() {
        if (this.ready) return this.ready;
        this.ready = (async () => {
            try {
            const [booksRes, catsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/books`),
                fetch(`${API_BASE_URL}/categories`)
            ]);
            this.books = await booksRes.json();
            this.categories = await catsRes.json();
            // Transform cover to coverUrl if needed (backend uses coverUrl, but frontend uses cover)
            this.books.forEach(b => {
                b.cover = b.coverUrl || b.cover;
                // Map category name from object if backend returns object
                if (b.category && typeof b.category === 'object') {
                    b.categoryId = b.category.id;
                    b.categoryName = b.category.name;
                    b.category = b.category.name;
                }
            });
            console.log('BookStore initialized', this.books);
        } catch (e) {
            console.error('Failed to load store data', e);
        }
    })();
    return this.ready;
},

async refresh() {
    this.ready = null;
    return this.init();
},

getBook(id) { 
        // We can keep this sync if we init the store first, 
        // or return a promise. Let's keep it simple: find in local array.
        return this.books.find(b => b.id === parseInt(id)); 
    },
    
    getFeatured() { return this.books.filter(b => b.isFeatured || b.featured); },
    
    getByCategory(catId) { return this.books.filter(b => b.categoryId === parseInt(catId)); },
    
    async search(q) {
        const res = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(q)}`);
        const results = await res.json();
        results.forEach(b => b.cover = b.coverUrl || b.cover);
        return results;
    },
    
    getTopRated(n = 8) { return [...this.books].sort((a, b) => b.rating - a.rating).slice(0, n); }
};

// ============ CART STATE ============
const Cart = {
    items: JSON.parse(localStorage.getItem('bv_cart') || '[]'),

    save() { localStorage.setItem('bv_cart', JSON.stringify(this.items)); this.updateBadge(); },

    add(bookId, qty = 1) {
        const existing = this.items.find(i => i.bookId === bookId);
        if (existing) { existing.qty += qty; } else { this.items.push({ bookId, qty }); }
        this.save();
        Toast.success('Added to cart!');
    },

    update(bookId, qty) {
        const item = this.items.find(i => i.bookId === bookId);
        if (item) { item.qty = Math.max(1, qty); this.save(); }
    },

    remove(bookId) {
        this.items = this.items.filter(i => i.bookId !== bookId);
        this.save();
        Toast.info('Item removed from cart');
    },

    clear() { this.items = []; this.save(); },

    getTotal() {
        return this.items.reduce((sum, item) => {
            const book = BookStore.getBook(item.bookId);
            return sum + (book ? book.price * item.qty : 0);
        }, 0);
    },

    getCount() { return this.items.reduce((sum, i) => sum + i.qty, 0); },

    getDetailedItems() {
        return this.items.map(item => {
            const book = BookStore.getBook(item.bookId);
            return book ? { ...book, qty: item.qty, subtotal: book.price * item.qty } : null;
        }).filter(Boolean);
    },

    updateBadge() {
        document.querySelectorAll('.cart-count').forEach(el => {
            const count = this.getCount();
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }
};

// ============ AUTH STATE ============
const Auth = {
    user: JSON.parse(localStorage.getItem('bv_user') || 'null'),
    
    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const user = await res.json();
                this.user = user;
                localStorage.setItem('bv_user', JSON.stringify(user));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Login failed', e);
            return false;
        }
    },
    
    async register(name, email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (res.ok) {
                const user = await res.json();
                this.user = user;
                localStorage.setItem('bv_user', JSON.stringify(user));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Registration failed', e);
            return false;
        }
    },
    
    logout() { this.user = null; localStorage.removeItem('bv_user'); window.location.href = 'login.html'; },
    isLoggedIn() { return !!this.user; },
    isAdmin() { return this.user?.role === 'admin'; },
    getName() { return this.user?.fullName || this.user?.name || 'Guest'; },
    getInitials() { 
        const name = this.getName();
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'; 
    }
};

// ============ THEME TOGGLE ============
const Theme = {
    init() {
        const saved = localStorage.getItem('bv_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateIcon(saved);
    },
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('bv_theme', next);
        this.updateIcon(next);
    },
    updateIcon(theme) {
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        });
    }
};

// ============ TOAST NOTIFICATIONS ============
const Toast = {
    container: null,
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    show(message, type = 'info', duration = 3000) {
        this.init();
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); },
    warning(msg) { this.show(msg, 'warning'); }
};

// ============ MODAL SYSTEM ============
const Modal = {
    show(title, content, actions = '') {
        let overlay = document.querySelector('.modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="Modal.hide()">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${actions ? `<div class="modal-actions" style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end;">${actions}</div>` : ''}
      </div>`;
        requestAnimationFrame(() => overlay.classList.add('active'));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) Modal.hide(); });
    },
    hide() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) { overlay.classList.remove('active'); }
    },
    confirm(title, message) {
        return new Promise(resolve => {
            this.show(title, `<p style="color:var(--text-secondary)">${message}</p>`,
                `<button class="btn btn-secondary" onclick="Modal.hide();window._modalResolve(false)">Cancel</button>
         <button class="btn btn-primary" onclick="Modal.hide();window._modalResolve(true)">Confirm</button>`);
            window._modalResolve = resolve;
        });
    }
};

// ============ UTILITY FUNCTIONS ============
function renderStars(rating) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= Math.round(rating) ? '' : 'empty'}">★</span>`;
    }
    return html + '</div>';
}

function formatPrice(price) { return '₹' + Number(price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }

function getDiscountPercent(original, current) {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
}

function createBookCard(book) {
    const discount = getDiscountPercent(book.originalPrice, book.price);
    return `
    <div class="book-card animate-fade-up" data-id="${book.id}">
      <div class="card-img">
        <img src="${book.cover}" alt="${book.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=Book+Cover'">
        ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ''}
        <div class="card-wishlist" onclick="event.stopPropagation();Toast.info('Added to wishlist!')">♡</div>
      </div>
      <div class="card-body">
        <span class="card-category">${book.category}</span>
        <h3 class="card-title">${book.title}</h3>
        <p class="card-author">by ${book.author}</p>
        <div class="card-footer">
          <span class="card-price">
            ${formatPrice(book.price)}
            ${discount > 0 ? `<span class="original">${formatPrice(book.originalPrice)}</span>` : ''}
          </span>
          <span class="card-rating">${renderStars(book.rating)} ${book.rating}</span>
        </div>
        <button class="add-to-cart-btn" onclick="event.stopPropagation();addToCartAnim(this, ${book.id})">
          🛒 Add to Cart
        </button>
      </div>
    </div>`;
}

function addToCartAnim(btn, bookId) {
    Cart.add(bookId);
    btn.classList.add('added');
    btn.innerHTML = '✓ Added!';
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = '🛒 Add to Cart'; }, 1500);
}

function createSkeletonCard() {
    return `
    <div class="book-card">
      <div class="skeleton skeleton-img"></div>
      <div class="card-body">
        <div class="skeleton skeleton-text" style="width:40%"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text" style="width:60%"></div>
        <div class="skeleton skeleton-text" style="width:50%;margin-top:16px"></div>
      </div>
    </div>`;
}

// ============ NAVBAR ============
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Mobile menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => mobileNav.classList.toggle('active'));
        mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('active')));
    }

    // Search
    const searchInput = document.querySelector('.nav-search input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                window.location.href = `books.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // Update auth UI
    updateAuthUI();
}

function updateAuthUI() {
    const authLinks = document.querySelector('.auth-links');
    if (!authLinks) return;
    if (Auth.isLoggedIn()) {
        const dashboardUrl = Auth.isAdmin() ? 'admin.html' : 'dashboard.html';
        authLinks.innerHTML = `
      <div class="user-dropdown">
        <div class="user-trigger">
          <div class="nav-avatar">${Auth.getInitials()}</div>
          <span class="nav-user-name">${Auth.getName().split(' ')[0]}</span>
          <span class="dropdown-arrow">▼</span>
        </div>
        <div class="dropdown-content">
          <div class="dropdown-header">
            <p class="welcome">Welcome back,</p>
            <p class="name">${Auth.getName()}</p>
          </div>
          <hr>
          <a href="${dashboardUrl}">📊 Dashboard</a>
          <a href="dashboard.html?tab=orders">📦 My Orders</a>
          <a href="dashboard.html?tab=profile">👤 Profile Settings</a>
          <hr>
          <button onclick="Auth.logout()" class="logout-btn">🚪 Logout</button>
        </div>
      </div>`;
    } else {
        authLinks.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>`;
    }
}

function getNavbarHTML(activePage = '') {
    return `
  <nav class="navbar">
    <div class="container flex-between">
      <a href="index.html" class="nav-logo">
        <span class="logo-icon">📚</span>
        <span class="text-gradient">BookVerse</span>
      </a>
      <div class="nav-search">
        <input type="text" placeholder="Search books, authors, genres...">
        <span class="search-icon">🔍</span>
      </div>
      <div class="nav-links">
        <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="books.html" class="${activePage === 'books' ? 'active' : ''}">Books</a>
        <a href="cart.html" class="${activePage === 'cart' ? 'active' : ''}" style="position:relative">
          🛒<span class="nav-cart-badge cart-count" style="display:none">0</span>
        </a>
        <div class="theme-toggle" onclick="Theme.toggle()">🌙</div>
        <div class="auth-links"></div>
      </div>
      <button class="mobile-menu-btn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-nav">
    <a href="index.html">Home</a>
    <a href="books.html">Books</a>
    <a href="cart.html">Cart</a>
    <a href="login.html">Login</a>
  </div>
  <div class="bg-orbs"><div class="orb"></div><div class="orb"></div><div class="orb"></div></div>`;
}

function getFooterHTML() {
    return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>📚 <span class="text-gradient">BookVerse</span></h3>
          <p>Your premium destination for books across every genre. Discover, explore, and immerse yourself in the world of literature.</p>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a href="index.html">Home</a>
          <a href="books.html">All Books</a>
          <a href="cart.html">My Cart</a>
          <a href="dashboard.html">My Account</a>
        </div>
        <div class="footer-col">
          <h4>Categories</h4>
          <a href="books.html?cat=1">Fiction</a>
          <a href="books.html?cat=2">Non-Fiction</a>
          <a href="books.html?cat=3">Science</a>
          <a href="books.html?cat=4">Business</a>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Shipping Info</a>
          <a href="#">Returns</a>
          <a href="#">Contact Us</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 BookVerse. All rights reserved.</span>
        <span>Made with ❤️ for book lovers</span>
      </div>
    </div>
  </footer>`;
}

// ============ SCROLL REVEAL ============
const ScrollReveal = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('visible'), i * 60);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.book-card, .category-card, .stat-card, .cart-item, .section-header, .glass-card, .checkout-section').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }
};

// ============ FLOATING PARTICLES ============
const Particles = {
    init(container) {
        if (!container || window.innerWidth < 768) return;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0.4';
        container.style.position = 'relative';
        container.prepend(canvas);
        const ctx = canvas.getContext('2d');
        let particles = [], raf;
        const resize = () => { canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        for (let i = 0; i < 30; i++) {
            particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, o: Math.random() * 0.5 + 0.1 });
        }
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(124,58,237,${p.o})`; ctx.fill();
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
    }
};

// ============ CURSOR GLOW ============
const CursorGlow = {
    init() {
        if (window.innerWidth < 1024) return;
        const glow = document.createElement('div');
        glow.style.cssText = 'position:fixed;width:400px;height:400px;border-radius:50%;pointer-events:none;z-index:-1;background:radial-gradient(circle,rgba(124,58,237,0.04),transparent 70%);transition:transform 0.15s ease-out;will-change:transform';
        document.body.appendChild(glow);
        document.addEventListener('mousemove', e => {
            glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
        });
    }
};

// ============ MAGNETIC BUTTONS ============
function initMagneticButtons() {
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

// ============ SMOOTH PAGE LOAD ============
function pageTransition() {
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(8px)';
    document.body.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)';
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    });
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    BookStore.init().then(() => {
        Cart.updateBadge();
        initNavbar();
    });
    pageTransition();

    // Scroll reveal
    setTimeout(() => ScrollReveal.init(), 100);

    // Cursor glow on desktop
    CursorGlow.init();

    // Particles in hero
    const hero = document.querySelector('.hero');
    if (hero) Particles.init(hero);

    // Magnetic buttons
    setTimeout(initMagneticButtons, 500);

    // Book card click navigation
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.book-card');
        if (card && !e.target.closest('.add-to-cart-btn') && !e.target.closest('.card-wishlist')) {
            window.location.href = `book-detail.html?id=${card.dataset.id}`;
        }
    });
});
