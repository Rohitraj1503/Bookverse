// BookVerse — User Dashboard
let activeTab = 'orders';

const sampleOrders = [
    { id: 1, number: 'BV-A3F8K29D', date: '2026-02-15', total: 46.97, status: 'delivered', items: 3, payment: 'credit_card' },
    { id: 2, number: 'BV-B7G2M41P', date: '2026-02-10', total: 34.99, status: 'shipped', items: 2, payment: 'upi' },
    { id: 3, number: 'BV-C1H5N63R', date: '2026-01-28', total: 52.48, status: 'processing', items: 4, payment: 'debit_card' },
    { id: 4, number: 'BV-D9J7Q85T', date: '2026-01-15', total: 19.99, status: 'delivered', items: 1, payment: 'cod' },
];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();

    if (!Auth.isLoggedIn()) {
        Toast.warning('Please login to view your dashboard');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }
    renderDashboard();
});

function renderDashboard() {
    const container = document.getElementById('dashboardContainer');
    container.innerHTML = `
    <aside class="dash-sidebar animate-fade-up">
      <div class="user-info">
        <div class="user-avatar">${Auth.getInitials()}</div>
        <h4 class="user-name">${Auth.getName()}</h4>
        <p class="user-email">${Auth.user?.email || ''}</p>
      </div>
      <nav class="dash-nav">
        <a href="#" class="active" onclick="switchTab('orders',this);return false">📦 My Orders</a>
        <a href="#" onclick="switchTab('profile',this);return false">👤 Profile</a>
        <a href="#" onclick="switchTab('tracking',this);return false">🚚 Order Tracking</a>
        <a href="#" onclick="switchTab('wishlist',this);return false">♡ Wishlist</a>
        <a href="#" onclick="switchTab('settings',this);return false">⚙️ Settings</a>
        <a href="#" onclick="Auth.logout()" style="color:var(--accent-4)">🚪 Logout</a>
      </nav>
    </aside>
    <main class="dash-content" id="dashContent"></main>`;
    showTab('orders');
}

function switchTab(tab, el) {
    activeTab = tab;
    document.querySelectorAll('.dash-nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    showTab(tab);
}

function showTab(tab) {
    const content = document.getElementById('dashContent');
    switch (tab) {
        case 'orders': renderOrders(content); break;
        case 'profile': renderProfile(content); break;
        case 'tracking': renderTracking(content); break;
        default: content.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Coming Soon</h3><p>This section is under development</p></div>`;
    }
}

async function renderOrders(el) {
    el.innerHTML = `<div class="loading-shimmer" style="height:200px;border-radius:12px"></div>`;
    
    try {
        const res = await fetch(`${API_BASE_URL}/orders/${Auth.user.id}`);
        const orders = await res.json();
        
        const statusBadge = (s) => {
            const map = { DELIVERED: 'badge-success', SHIPPED: 'badge-info', PROCESSING: 'badge-warning', PENDING: 'badge-purple', CANCELLED: 'badge-danger' };
            const status = s || 'PENDING';
            return `<span class="badge ${map[status.toUpperCase()] || 'badge-info'}">${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>`;
        };

        if (orders.length === 0) {
            el.innerHTML = `
            <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">📦 My Orders</h2>
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="books.html" class="btn btn-primary">Start Shopping</a>
            </div>`;
            return;
        }

        el.innerHTML = `
        <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">📦 My Orders</h2>
        <div class="glass-card" style="overflow-x:auto;padding:0">
          <table class="data-table">
            <thead>
              <tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr class="animate-fade-up">
                  <td><strong>${o.orderNumber || 'BV-' + o.id}</strong></td>
                  <td>${new Date(o.orderDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style="font-weight:600">${formatPrice(o.total)}</td>
                  <td>${statusBadge(o.status || 'PENDING')}</td>
                  <td><button class="btn btn-secondary btn-sm" onclick="Toast.info('Details coming soon!')">View</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (e) {
        console.error('Failed to fetch orders', e);
        el.innerHTML = `<div class="empty-state"><h3>Failed to load orders</h3><p>Please try again later.</p></div>`;
    }
}

function renderProfile(el) {
    el.innerHTML = `
    <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">👤 Profile Settings</h2>
    <div class="glass-card" style="padding:32px">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:32px">
        <div class="user-avatar" style="width:80px;height:80px;font-size:1.8rem">${Auth.getInitials()}</div>
        <div><h3>${Auth.getName()}</h3><p style="color:var(--text-muted)">${Auth.user?.email}</p></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input class="form-input" value="${Auth.getName()}"></div>
        <div class="form-group"><label>Email</label><input class="form-input" value="${Auth.user?.email || ''}" disabled></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Phone</label><input class="form-input" placeholder="+1 234 567 890"></div>
        <div class="form-group"><label>City</label><input class="form-input" placeholder="New York"></div>
      </div>
      <div class="form-group"><label>Address</label><input class="form-input" placeholder="123 Main Street"></div>
      <div class="form-row">
        <div class="form-group"><label>State</label><input class="form-input" placeholder="NY"></div>
        <div class="form-group"><label>ZIP Code</label><input class="form-input" placeholder="10001"></div>
      </div>
      <button class="btn btn-primary mt-3" onclick="Toast.success('Profile updated successfully!')">Save Changes</button>
    </div>`;
}

async function renderTracking(el) {
    el.innerHTML = `<div class="loading-shimmer" style="height:300px;border-radius:12px"></div>`;
    
    try {
        const res = await fetch(`${API_BASE_URL}/orders/${Auth.user.id}`);
        const orders = await res.json();
        
        if (orders.length === 0) {
            el.innerHTML = `
            <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">🚚 Order Tracking</h2>
            <div class="empty-state">
                <div class="empty-icon">🚚</div>
                <h3>No active orders</h3>
                <p>Place an order to see its tracking status here.</p>
                <a href="books.html" class="btn btn-primary">Browse Books</a>
            </div>`;
            return;
        }

        const order = orders[0]; // Most recent order
        const status = (order.status || 'pending').toLowerCase();
        
        // Define timeline steps and their highlight logic
        const steps = [
            { id: 'pending', label: 'Order Placed', icon: '📝' },
            { id: 'confirmed', label: 'Confirmed', icon: '✅' },
            { id: 'processing', label: 'Processing', icon: '📦' },
            { id: 'shipped', label: 'Shipped', icon: '🚚' },
            { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🏠' },
            { id: 'delivered', label: 'Delivered', icon: '🎁' }
        ];

        // Status hierarchy for highlighting
        const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
        const currentIndex = statusOrder.indexOf(status);

        if (status === 'cancelled') {
            el.innerHTML = `
            <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">🚚 Order Tracking</h2>
            <div class="glass-card" style="padding:40px;text-align:center">
                <div style="font-size:4rem;margin-bottom:16px">🚫</div>
                <h3 style="color:var(--accent-4)">Order Cancelled</h3>
                <p style="color:var(--text-muted);margin-bottom:24px">Order ${order.orderNumber || 'BV-'+order.id} has been cancelled.</p>
                <div class="summary-row" style="max-width:300px;margin:0 auto"><span>Order Number:</span><span>${order.orderNumber}</span></div>
                <div class="summary-row" style="max-width:300px;margin:0 auto"><span>Items:</span><span>${order.items?.length || 0}</span></div>
                <div class="summary-row" style="max-width:300px;margin:0 auto;margin-bottom:24px"><span>Total:</span><span>${formatPrice(order.total)}</span></div>
                <a href="books.html" class="btn btn-secondary">Order Again</a>
            </div>`;
            return;
        }

        const estDelivery = order.estimatedDelivery 
            ? new Date(order.estimatedDelivery).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
            : 'Processing...';

        el.innerHTML = `
        <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">🚚 Order Tracking</h2>
        <div class="glass-card" style="padding:32px">
          <div style="display:flex;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px">
            <div>
              <h3 style="font-size:1.3rem">${order.orderNumber || 'BV-'+order.id}</h3>
              <p style="color:var(--text-muted)">Placed on ${new Date(order.orderDate || order.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
            <div style="text-align:right">
              <span class="badge ${status === 'delivered' ? 'badge-success' : 'badge-info'}" style="margin-bottom:8px;display:inline-block">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <p style="font-size:0.85rem;color:var(--text-muted)">Est. Delivery: <strong>${estDelivery}</strong></p>
            </div>
          </div>
          
          <div class="timeline">
            ${steps.map((step, index) => {
                let className = 'timeline-item';
                if (index < currentIndex) className += ' completed';
                if (index === currentIndex) className += ' active';
                
                let details = '';
                if (index === 0) details = new Date(order.createdAt || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                else if (index === currentIndex) details = 'Currently updated at ' + new Date(order.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                else if (index > currentIndex) details = 'Estimated: ' + estDelivery;

                return `
                <div class="${className}">
                  <h4>${step.label}</h4>
                  <p>${details}</p>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    } catch (e) {
        console.error('Failed to render tracking', e);
        el.innerHTML = `<div class="empty-state"><h3>Failed to load tracking data</h3><p>Please try again later.</p></div>`;
    }
}
