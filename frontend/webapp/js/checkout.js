// BookVerse — Checkout Page
let selectedPayment = 'credit_card';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();
    BookStore.init().then(() => {
        renderCheckout();
    });
});

function renderCheckout() {
    const container = document.getElementById('checkoutContainer');
    const items = Cart.getDetailedItems();

    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🛒</div><h3>Nothing to checkout</h3><p>Your cart is empty</p><a href="books.html" class="btn btn-primary">Browse Books</a></div>`;
        return;
    }

    const subtotal = Cart.getTotal();
    const shipping = subtotal >= 4000 ? 0 : 400;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    container.innerHTML = `
    <div>
      <div class="checkout-section animate-fade-up">
        <h3>📦 Shipping Information</h3>
        <div class="form-row-2">
          <div class="floating-group">
            <input type="text" id="shipName" placeholder=" " required>
            <label>Full Name *</label>
          </div>
          <div class="floating-group">
            <input type="tel" id="shipPhone" placeholder=" ">
            <label>Phone</label>
          </div>
        </div>
        <div class="floating-group">
          <input type="text" id="shipAddress" placeholder=" " required>
          <label>Street Address *</label>
        </div>
        <div class="form-row-2">
          <div class="floating-group">
            <input type="text" id="shipCity" placeholder=" " required>
            <label>City *</label>
          </div>
          <div class="floating-group">
            <input type="text" id="shipState" placeholder=" ">
            <label>State</label>
          </div>
        </div>
        <div class="form-row-2">
          <div class="floating-group">
            <input type="text" id="shipZip" placeholder=" " required>
            <label>ZIP Code *</label>
          </div>
          <div class="floating-group">
            <input type="email" id="shipEmail" placeholder=" ">
            <label>Email</label>
          </div>
        </div>
      </div>

      <div class="checkout-section animate-fade-up stagger-2">
        <h3>💳 Payment Method</h3>
        <div class="payment-grid">
          <div class="pay-card selected" onclick="selectPayment(this,'credit_card')">
            <span class="pay-card__icon">💳</span>
            <span class="pay-card__name">Credit Card</span>
          </div>
          <div class="pay-card" onclick="selectPayment(this,'debit_card')">
            <span class="pay-card__icon">🏦</span>
            <span class="pay-card__name">Debit Card</span>
          </div>
          <div class="pay-card" onclick="selectPayment(this,'upi')">
            <span class="pay-card__icon">📱</span>
            <span class="pay-card__name">UPI</span>
          </div>
          <div class="pay-card" onclick="selectPayment(this,'cod')">
            <span class="pay-card__icon">💵</span>
            <span class="pay-card__name">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="order-summary-card animate-fade-up stagger-3">
        <h3>Order Summary</h3>
        ${items.map(item => `
          <div class="order-item">
            <img src="${item.cover}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/44x60?text=B'">
            <div class="order-item__info">
              <p class="order-item__title">${item.title}</p>
              <p class="order-item__qty">Qty: ${item.qty}</p>
            </div>
            <span class="order-item__price">${formatPrice(item.subtotal)}</span>
          </div>`).join('')}
        <div class="summary-row" style="margin-top:8px"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:#34d399;font-weight:600">FREE</span>' : formatPrice(shipping)}</span></div>
        <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
        <div class="summary-row total"><span>Total</span><span class="text-gradient">${formatPrice(total)}</span></div>
        <button class="place-order-btn" onclick="placeOrder()">Place Order — ${formatPrice(total)}</button>
        <div class="secure-badge">🔒 Secure 256-bit SSL checkout</div>
      </div>
    </div>`;
}

function selectPayment(el, method) {
    document.querySelectorAll('.pay-card').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedPayment = method;
}

async function placeOrder() {
    const name = document.getElementById('shipName').value.trim();
    const address = document.getElementById('shipAddress').value.trim();
    const city = document.getElementById('shipCity').value.trim();
    const zip = document.getElementById('shipZip').value.trim();
    const phone = document.getElementById('shipPhone')?.value.trim();
    const state = document.getElementById('shipState')?.value.trim() || '';

    if (!name || !address || !city || !zip) {
        Toast.error('Please fill in all required fields');
        ['shipName', 'shipAddress', 'shipCity', 'shipZip'].forEach(id => {
            const input = document.getElementById(id);
            if (input && !input.value.trim()) {
                input.classList.add('error');
                input.addEventListener('input', () => input.classList.remove('error'), { once: true });
            }
        });
        return;
    }

    if (!Auth.isLoggedIn()) {
        Toast.error('Please login to place an order');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const btn = document.querySelector('.place-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<span style="animation:pulse 1s infinite">Processing...</span>';

    try {
        const subtotal = Cart.getTotal();
        const shipping = subtotal >= 4000 ? 0 : 400;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;
        const orderNumber = 'BV-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        const orderData = {
            user: { id: Auth.user.id },
            orderNumber: orderNumber,
            subtotal: subtotal,
            shippingCost: shipping,
            tax: tax,
            total: total,
            shippingName: name,
            shippingAddress: address,
            shippingCity: city,
            shippingState: state,
            shippingZip: zip,
            shippingPhone: phone,
            paymentMethod: selectedPayment,
            items: Cart.getDetailedItems().map(item => ({
                book: { id: item.id },
                quantity: item.qty,
                price: item.price,
                total: item.subtotal
            }))
        };

        console.log('Final Order Payload:', orderData);
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            Cart.clear();
            const steps = document.querySelectorAll('.checkout-progress__step');
            const lines = document.querySelectorAll('.checkout-progress__line');
            if (steps[1]) { steps[1].classList.remove('active'); steps[1].classList.add('completed'); }
            if (steps[2]) { steps[2].classList.add('active'); }
            if (lines[1]) { lines[1].classList.add('active'); }

            document.getElementById('checkoutContainer').innerHTML = `
          <div class="empty-state animate-fade-up" style="grid-column:1/-1;padding:60px 20px">
            <div style="font-size:5rem;margin-bottom:16px;animation:scaleIn 0.5s ease">✅</div>
            <h3 style="font-size:1.8rem;margin-bottom:8px">Order Placed Successfully!</h3>
            <p style="color:var(--text-secondary);margin-bottom:8px">Order Number: <strong class="text-gradient">${orderNumber}</strong></p>
            <p style="color:var(--text-muted);margin-bottom:24px">Thank you for shopping with BookVerse. You'll receive a confirmation email shortly.</p>
            <div style="display:flex;gap:12px;justify-content:center">
              <a href="dashboard.html" class="btn btn-primary">View Orders</a>
              <a href="books.html" class="btn btn-secondary">Continue Shopping</a>
            </div>
          </div>`;
            Toast.success('Order placed successfully!');
        } else {
            const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errorData.error || 'Failed to place order');
        }
    } catch (e) {
        console.error('CRITICAL: Order placement failed', e);
        Toast.error(e.message || 'Failed to place order. Please try again.');
        btn.disabled = false;
        btn.innerHTML = `Place Order — ${formatPrice(Cart.getTotal() + (Cart.getTotal() >= 4000 ? 0 : 400) + Cart.getTotal() * 0.08)}`;
    }
}
