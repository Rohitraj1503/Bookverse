// BookVerse — Book Detail Page
let selectedQty = 1;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('books');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();
    BookStore.init().then(() => {
        loadBookDetail();
    });
});

function loadBookDetail() {
    const id = new URLSearchParams(window.location.search).get('id');
    const book = BookStore.getBook(id);
    const container = document.getElementById('bookDetail');

    if (!book) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding-top:80px"><div class="empty-icon">📖</div><h3>Book not found</h3><p>The book you\'re looking for doesn\'t exist.</p><a href="books.html" class="btn btn-primary">Browse Books</a></div>';
        return;
    }

    document.title = `${book.title} — BookVerse`;
    const discount = getDiscountPercent(book.originalPrice, book.price);
    const stockClass = book.stock > 20 ? 'in-stock' : book.stock > 0 ? 'low-stock' : 'out-of-stock';
    const stockText = book.stock > 20 ? 'In Stock' : book.stock > 0 ? `Only ${book.stock} left` : 'Out of Stock';

    container.innerHTML = `
    <div class="book-detail-img animate-fade-up">
      <div class="img-wrapper">
        <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x400?text=Book'">
      </div>
    </div>
    <div class="book-detail-info animate-fade-up stagger-2">
      <span class="book-category">${book.category}</span>
      <h1>${book.title}</h1>
      <p class="book-author">by <strong>${book.author}</strong></p>
      <div class="book-rating-row">
        ${renderStars(book.rating)}
        <span style="font-weight:600">${book.rating}</span>
        <span style="color:var(--text-muted);font-size:0.85rem">(${book.reviews.toLocaleString()} reviews)</span>
      </div>
      <div class="book-price">
        ${formatPrice(book.price)}
        ${book.originalPrice > book.price ? `<span class="original">${formatPrice(book.originalPrice)}</span><span class="discount-badge">-${discount}% OFF</span>` : ''}
      </div>
      <div class="stock-indicator ${stockClass}">
        <span class="dot"></span>
        <span>${stockText}</span>
      </div>
      <p style="color:var(--text-secondary);line-height:1.8;margin:16px 0">${book.description}</p>
      <div class="book-meta">
        <div class="meta-item"><div class="label">Pages</div><div class="value">${book.pages}</div></div>
        <div class="meta-item"><div class="label">Publisher</div><div class="value">${book.publisher}</div></div>
        <div class="meta-item"><div class="label">Year</div><div class="value">${book.year}</div></div>
      </div>
      <div class="add-to-cart-section">
        <div class="qty-selector">
          <button onclick="changeQty(-1)">−</button>
          <span class="qty-value" id="qtyValue">1</span>
          <button onclick="changeQty(1)">+</button>
        </div>
        <button class="btn btn-primary btn-lg" id="addToCartBtn" onclick="addDetailToCart(${book.id})" ${book.stock === 0 ? 'disabled' : ''} style="flex:1">
          🛒 Add to Cart — ${formatPrice(book.price)}
        </button>
      </div>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="Toast.info('Added to wishlist!')">♡ Add to Wishlist</button>
    </div>`;

    // Related books
    const related = BookStore.getByCategory(book.categoryId).filter(b => b.id !== book.id).slice(0, 4);
    document.getElementById('relatedBooks').innerHTML = related.length ? related.map(createBookCard).join('') : '<p style="color:var(--text-muted)">No related books found</p>';
}

function changeQty(delta) {
    selectedQty = Math.max(1, Math.min(10, selectedQty + delta));
    document.getElementById('qtyValue').textContent = selectedQty;
    const book = BookStore.getBook(new URLSearchParams(window.location.search).get('id'));
    if (book) document.getElementById('addToCartBtn').innerHTML = `🛒 Add to Cart — ${formatPrice(book.price * selectedQty)}`;
}

function addDetailToCart(bookId) {
    Cart.add(bookId, selectedQty);
    const btn = document.getElementById('addToCartBtn');
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    btn.innerHTML = '✓ Added to Cart!';
    setTimeout(() => {
        btn.style.background = '';
        const book = BookStore.getBook(bookId);
        btn.innerHTML = `🛒 Add to Cart — ${formatPrice(book.price * selectedQty)}`;
    }, 1500);
}
