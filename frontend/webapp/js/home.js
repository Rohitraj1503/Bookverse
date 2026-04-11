// BookVerse — Home Page Logic
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('home');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();

    BookStore.init().then(() => {
        // Hero slider
        initHeroSlider();
        // Counter animation
        animateCounters();
        // Load sections
        loadTrending();
        loadCategories();
        loadTopRated();
    });
});

function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    const featured = BookStore.getFeatured().slice(0, 5);
    if (!slider || !featured.length) return;

    featured.forEach((book, i) => {
        const card = document.createElement('div');
        card.className = `slide-card ${i === 0 ? 'active' : i === featured.length - 1 ? 'prev' : i === 1 ? 'next' : ''}`;
        card.innerHTML = `<img src="${book.cover}" alt="${book.title}"><div style="padding:12px;background:var(--bg-card)"><p style="font-weight:600;font-size:0.85rem">${book.title}</p><p style="font-size:0.75rem;color:var(--text-muted)">${book.author}</p></div>`;
        slider.appendChild(card);
    });

    let current = 0;
    setInterval(() => {
        const cards = slider.querySelectorAll('.slide-card');
        cards.forEach(c => c.className = 'slide-card');
        current = (current + 1) % cards.length;
        const prev = (current - 1 + cards.length) % cards.length;
        const next = (current + 1) % cards.length;
        cards[current].classList.add('active');
        cards[prev].classList.add('prev');
        cards[next].classList.add('next');
    }, 3000);
}

function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.floor(current).toLocaleString() + (target >= 1000 ? '+' : '+');
        }, 16);
    });
}

function loadTrending() {
    const grid = document.getElementById('trendingGrid');
    if (!grid) return;
    // Show skeletons
    grid.innerHTML = Array(4).fill(createSkeletonCard()).join('');
    setTimeout(() => {
        const featured = BookStore.getFeatured().slice(0, 8);
        grid.innerHTML = featured.map(createBookCard).join('');
    }, 600);
}

function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = BookStore.categories.map(cat => `
    <a href="books.html?cat=${cat.id}" class="category-card animate-fade-up">
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-name">${cat.name}</div>
      <div class="cat-count">${cat.count} books</div>
    </a>
  `).join('');
}

function loadTopRated() {
    const grid = document.getElementById('topRatedGrid');
    if (!grid) return;
    grid.innerHTML = Array(4).fill(createSkeletonCard()).join('');
    setTimeout(() => {
        const top = BookStore.getTopRated(4);
        grid.innerHTML = top.map(createBookCard).join('');
    }, 900);
}
