// BookVerse — Cart Page
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('cart');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();
    BookStore.init().then(() => {
        renderCart();
    });
});

function renderCart() {
    const container = document.getElementById('cartContainer');
    const items = Cart.getDetailedItems();

    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🛒</div><h3>Your cart is empty</h3><p>Looks like you haven't added any books yet</p><a href="books.html" class="btn btn-primary">Start Shopping</a></div>`;
        document.getElementById('cartInfo').textContent = '0 items in your cart';
        return;
    }

    document.getElementById('cartInfo').textContent = `${Cart.getCount()} item${Cart.getCount() !== 1 ? 's' : ''} in your cart`;

    const subtotal = Cart.getTotal();
    const shipping = subtotal >= 4000 ? 0 : 400;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    container.innerHTML = `
    <div class="cart-items">
      ${items.map((item, i) => `
        <div class="cart-item" id="cart-item-${item.id}" style="animation-delay:${i * 0.06}s">
          <img src="${item.cover}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/72x100?text=Book'">
          <div class="item-info">
            <h4 class="item-title">${item.title}</h4>
            <p class="item-author">by ${item.author}</p>
            <p class="item-price">${formatPrice(item.subtotal)}</p>
            <div class="qty-control">
              <button onclick="updateQty(${item.id}, ${item.qty - 1})" aria-label="Decrease quantity">−</button>
              <span>${item.qty}</span>
              <button onclick="updateQty(${item.id}, ${item.qty + 1})" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <span class="remove-btn" onclick="removeItem(${item.id})" title="Remove item">✕</span>
        </div>
      `).join('')}
    </div>
    <div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:#34d399;font-weight:600">FREE</span>' : formatPrice(shipping)}</span></div>
        <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
        ${subtotal < 4000 ? `<div class="free-ship-hint">🎁 Add ${formatPrice(4000 - subtotal)} more for free shipping!</div>` : ''}
        <div class="summary-row total"><span>Total</span><span class="text-gradient">${formatPrice(total)}</span></div>
        <a href="checkout.html" class="checkout-btn">Proceed to Checkout →</a>
        <button class="clear-cart-btn" onclick="clearCartConfirm()">Clear Cart</button>
        <div class="secure-badge">🔒 Secure checkout</div>
      </div>
    </div>`;
}

function updateQty(bookId, qty) {
    if (qty <= 0) { removeItem(bookId); return; }
    Cart.update(bookId, qty);
    renderCart();
}

async function removeItem(bookId) {
    const el = document.getElementById(`cart-item-${bookId}`);
    if (el) {
        el.style.transition = 'all 0.3s ease';
        el.style.transform = 'translateX(60px)';
        el.style.opacity = '0';
        el.style.maxHeight = el.offsetHeight + 'px';
        setTimeout(() => { el.style.maxHeight = '0'; el.style.padding = '0'; el.style.margin = '0'; }, 200);
    }
    setTimeout(() => { Cart.remove(bookId); renderCart(); }, 400);
}

async function clearCartConfirm() {
    const ok = await Modal.confirm('Clear Cart', 'Are you sure you want to remove all items from your cart?');
    if (ok) { Cart.clear(); renderCart(); }
}
