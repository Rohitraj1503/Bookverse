// BookVerse — Books Listing Page
const ITEMS_PER_PAGE = 8;
let currentPage = 1;
let filteredBooks = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('books');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();

    BookStore.init().then(() => {
        loadCategoryFilters();
        parseURLParams();
        applyFilters();
    });

    document.getElementById('searchInput').addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));
});

function parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) document.getElementById('searchInput').value = params.get('search');
    if (params.get('cat')) {
        const cb = document.querySelector(`#categoryFilters input[value="${params.get('cat')}"]`);
        if (cb) cb.checked = true;
    }
    if (params.get('sort')) document.getElementById('sortSelect').value = params.get('sort');
}

function loadCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = BookStore.categories.filter(c => c.count > 0).map(cat =>
        `<label class="filter-chip"><input type="checkbox" value="${cat.id}" onchange="currentPage=1;applyFilters()"><span class="filter-chip__label">${cat.icon} ${cat.name}</span></label>`
    ).join('');
}

function applyFilters() {
    let books = [...BookStore.books];
    // Search
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    if (q) books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    // Category
    const cats = [...document.querySelectorAll('#categoryFilters input:checked')].map(c => parseInt(c.value));
    if (cats.length) books = books.filter(b => cats.includes(b.categoryId));
    // Price
    const min = parseFloat(document.getElementById('priceMin').value) || 0;
    const max = parseFloat(document.getElementById('priceMax').value) || Infinity;
    books = books.filter(b => b.price >= min && b.price <= max);
    // Rating
    const rating = parseFloat(document.querySelector('input[name="rating"]:checked')?.value || 0);
    if (rating > 0) books = books.filter(b => b.rating >= rating);
    // Sort
    const sort = document.getElementById('sortSelect').value;
    switch (sort) {
        case 'price-asc': books.sort((a, b) => a.price - b.price); break;
        case 'price-desc': books.sort((a, b) => b.price - a.price); break;
        case 'rating': books.sort((a, b) => b.rating - a.rating); break;
        case 'title': books.sort((a, b) => a.title.localeCompare(b.title)); break;
        case 'newest': books.sort((a, b) => b.year - a.year); break;
    }
    filteredBooks = books;
    document.getElementById('resultsCount').textContent = `Showing ${books.length} book${books.length !== 1 ? 's' : ''}`;
    renderPage();
}

function renderPage() {
    const grid = document.getElementById('bookGrid');
    const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const page = filteredBooks.slice(start, start + ITEMS_PER_PAGE);

    if (page.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📭</div><h3>No books found</h3><p>Try adjusting your filters or search terms</p><button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button></div>`;
    } else {
        grid.innerHTML = page.map(createBookCard).join('');
    }
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">›</button>`;
    container.innerHTML = html;
}

function goToPage(p) { currentPage = p; renderPage(); window.scrollTo({ top: 200, behavior: 'smooth' }); }
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.querySelectorAll('#categoryFilters input').forEach(c => c.checked = false);
    document.querySelector('input[name="rating"][value="0"]').checked = true;
    document.getElementById('sortSelect').value = 'default';
    currentPage = 1;
    applyFilters();
}

function debounce(fn, delay) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; }
