// BookVerse — Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navbar-root').innerHTML = getNavbarHTML('');
    document.getElementById('footer-root').innerHTML = getFooterHTML();
    initNavbar();
    renderStats();
    showAdminTab('books', document.getElementById('tab-books'));
});

async function renderStats() {
    const statsContainer = document.getElementById('statsCards');
    statsContainer.innerHTML = `<div class="loading-shimmer" style="height:100px;border-radius:12px;grid-column:1/-1"></div>`;
    
    try {
        const [books, ordersRes] = await Promise.all([
            BookStore.init().then(() => BookStore.refresh()), // Refresh to get latest
            fetch(`${API_BASE_URL}/orders`).then(r => r.json())
        ]);
        
        const totalRevenue = ordersRes.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalBooks = BookStore.books.length;
        const totalOrders = ordersRes.length;
        const totalCustomers = new Set(ordersRes.map(o => o.user?.id)).size || 0;

        const stats = [
            { icon: '📚', iconBg: 'rgba(139,92,246,0.15)', label: 'Total Books', value: totalBooks, change: '+12%', positive: true },
            { icon: '📦', iconBg: 'rgba(6,182,212,0.15)', label: 'Total Orders', value: totalOrders, change: '+8%', positive: true },
            { icon: '💰', iconBg: 'rgba(16,185,129,0.15)', label: 'Revenue', value: formatPrice(totalRevenue), change: '+23%', positive: true },
            { icon: '👥', iconBg: 'rgba(236,72,153,0.15)', label: 'Customers', value: totalCustomers + 54, change: '+5%', positive: true } // +54 for legacy/placeholder
        ];

        statsContainer.innerHTML = stats.map(s => `
        <div class="stat-card animate-fade-up">
          <div class="stat-icon" style="background:${s.iconBg}">${s.icon}</div>
          <p style="color:var(--text-muted);font-size:0.85rem">${s.label}</p>
          <h3>${s.value}</h3>
          <span class="stat-change ${s.positive ? 'positive' : 'negative'}">${s.change} from last month</span>
        </div>`).join('');
    } catch (e) {
        console.error('Failed to render stats', e);
    }
}

function showAdminTab(tab, btn) {
    document.querySelectorAll('[id^="tab-"]').forEach(b => { b.className = 'btn btn-secondary btn-sm'; });
    if (btn) btn.className = 'btn btn-primary btn-sm';

    const content = document.getElementById('adminContent');
    switch (tab) {
        case 'books': renderBooksTab(content); break;
        case 'orders': renderOrdersTab(content); break;
        case 'categories': renderCategoriesTab(content); break;
        case 'analytics': renderAnalyticsTab(content); break;
    }
}

function renderBooksTab(el) {
    el.innerHTML = `
    <div class="glass-card" style="padding:0;overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr><th>Cover</th><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${BookStore.books.map(b => `
            <tr>
              <td><img src="${b.cover}" style="width:40px;height:55px;border-radius:4px;object-fit:cover" onerror="this.src='https://via.placeholder.com/40x55?text=B'"></td>
              <td><strong>${b.title}</strong></td>
              <td style="color:var(--text-secondary)">${b.author}</td>
              <td><span class="badge badge-purple">${b.category}</span></td>
              <td style="font-weight:600">${formatPrice(b.price)}</td>
              <td><span class="badge ${b.stock > 20 ? 'badge-success' : b.stock > 0 ? 'badge-warning' : 'badge-danger'}">${b.stock}</span></td>
              <td>${renderStars(b.rating)} ${b.rating}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-sm" onclick="editBook(${b.id})">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id})">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function renderOrdersTab(el) {
    el.innerHTML = `<div class="loading-shimmer" style="height:200px;border-radius:12px"></div>`;
    
    try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        const orders = await res.json();
        
        const statusBadge = s => {
            const map = { DELIVERED: 'badge-success', SHIPPED: 'badge-info', PROCESSING: 'badge-warning', PENDING: 'badge-purple', CANCELLED: 'badge-danger' };
            const status = s || 'PENDING';
            return `<span class="badge ${map[status.toUpperCase()] || 'badge-info'}">${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>`;
        };

        el.innerHTML = `
        <div class="glass-card" style="padding:0;overflow-x:auto">
          <table class="data-table">
            <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>${o.orderNumber || 'BV-' + o.id}</strong></td>
                  <td style="color:var(--text-secondary)">${new Date(o.orderDate || Date.now()).toLocaleDateString()}</td>
                  <td style="font-weight:600">${formatPrice(o.total)}</td>
                  <td>${statusBadge(o.status || 'PENDING')}</td>
                  <td>
                    <select class="form-input" style="padding:6px 10px;font-size:0.8rem;width:auto;cursor:pointer" data-prev="${(o.status || 'PENDING').toUpperCase()}" onchange="updateOrderStatus(${o.id}, this)">
                      <option value="PENDING" ${(o.status || '').toUpperCase() === 'PENDING' ? 'selected' : ''}>PENDING</option>
                      <option value="PROCESSING" ${(o.status || '').toUpperCase() === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
                      <option value="SHIPPED" ${(o.status || '').toUpperCase() === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
                      <option value="DELIVERED" ${(o.status || '').toUpperCase() === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                      <option value="CANCELLED" ${(o.status || '').toUpperCase() === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (e) {
        console.error('Failed to fetch admin orders', e);
        el.innerHTML = `<div class="empty-state"><h3>Failed to load orders</h3></div>`;
    }
}

function renderCategoriesTab(el) {
    el.innerHTML = `
    <div class="glass-card" style="padding:24px">
      <div class="flex-between mb-3">
        <h3>Manage Categories</h3>
        <button class="btn btn-primary btn-sm" onclick="Toast.info('Add category modal coming soon!')">+ Add Category</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
        ${BookStore.categories.map(c => `
          <div class="glass-card" style="padding:20px;display:flex;align-items:center;gap:16px">
            <span style="font-size:2rem">${c.icon}</span>
            <div style="flex:1">
              <h4 style="font-size:0.95rem;font-weight:600">${c.name}</h4>
              <p style="font-size:0.8rem;color:var(--text-muted)">${c.count} books</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Toast.info('Edit category')">✏️</button>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderAnalyticsTab(el) {
    el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div class="chart-container">
        <h3 style="margin-bottom:16px;font-size:1rem">Revenue Overview</h3>
        <canvas id="revenueChart"></canvas>
      </div>
      <div class="chart-container">
        <h3 style="margin-bottom:16px;font-size:1rem">Orders by Category</h3>
        <canvas id="categoryChart"></canvas>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
      <div class="chart-container">
        <h3 style="margin-bottom:16px;font-size:1rem">Monthly Sales</h3>
        <canvas id="salesChart"></canvas>
      </div>
      <div class="glass-card" style="padding:24px">
        <h3 style="margin-bottom:16px;font-size:1rem">Top Selling Books</h3>
        ${BookStore.getTopRated(5).map((b, i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i < 4 ? 'border-bottom:var(--border-glass)' : ''}">
            <span style="font-weight:700;color:var(--text-muted);width:20px">#${i + 1}</span>
            <img src="${b.cover}" style="width:36px;height:48px;border-radius:4px;object-fit:cover" onerror="this.src='https://via.placeholder.com/36x48?text=B'">
            <div style="flex:1"><p style="font-size:0.85rem;font-weight:500">${b.title}</p><p style="font-size:0.75rem;color:var(--text-muted)">${b.author}</p></div>
            <span style="font-weight:600;color:var(--accent-1)">${formatPrice(b.price)}</span>
          </div>`).join('')}
      </div>
    </div>`;

    setTimeout(initCharts, 100);
}

function initCharts() {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8';
    const gridColor = 'rgba(255,255,255,0.05)';
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    // Revenue Chart
    const revCtx = document.getElementById('revenueChart');
    if (revCtx) {
        new Chart(revCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [4200, 5100, 4800, 6200, 7300, 6900, 8100, 7500, 9200, 8800, 10500, 12458],
                    borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)',
                    fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#8b5cf6'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor } } } }
        });
    }

    // Category Chart
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: ['Fiction', 'Non-Fiction', 'Science', 'Business', 'Self-Help', 'Other'],
                datasets: [{ data: [35, 20, 18, 15, 8, 4], backgroundColor: ['#8b5cf6', '#06b6d4', '#3b82f6', '#ec4899', '#f59e0b', '#10b981'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 12 } } }, cutout: '65%' }
        });
    }

    // Sales Chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{ label: 'Orders', data: [45, 62, 58, 73, 85, 92], backgroundColor: 'rgba(6,182,212,0.6)', borderRadius: 8 }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor } } } }
        });
    }
}

function showAddBookModal() {
    Modal.show('Add New Book', `
    <div class="form-group"><label>Title</label><input class="form-input" id="newBookTitle" placeholder="Book title"></div>
    <div class="form-row">
      <div class="form-group"><label>Author</label><input class="form-input" id="newBookAuthor" placeholder="Author name"></div>
      <div class="form-group"><label>ISBN</label><input class="form-input" id="newBookIsbn" placeholder="ISBN"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Price (₹)</label><input type="number" class="form-input" id="newBookPrice" placeholder="0.00"></div>
      <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="newBookStock" placeholder="0"></div>
    </div>
    <div class="form-group"><label>Category</label><select class="form-input" id="newBookCat">${BookStore.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="form-group"><label>Cover URL</label><input class="form-input" id="newBookCover" placeholder="https://..."></div>
    <div class="form-group"><label>Description</label><textarea class="form-input" id="newBookDesc" rows="3" placeholder="Book description"></textarea></div>`,
        `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewBook()">Add Book</button>`);
}

async function saveNewBook() {
    const data = {
        title: document.getElementById('newBookTitle').value,
        author: document.getElementById('newBookAuthor').value,
        isbn: document.getElementById('newBookIsbn').value,
        price: parseFloat(document.getElementById('newBookPrice').value),
        stock: parseInt(document.getElementById('newBookStock').value),
        category: { id: parseInt(document.getElementById('newBookCat').value) },
        coverUrl: document.getElementById('newBookCover').value,
        description: document.getElementById('newBookDesc').value,
        rating: 4.5, // Default rating
        isFeatured: false
    };

    try {
        const res = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            Modal.hide();
            Toast.success('Book added successfully!');
            await BookStore.refresh();
            showAdminTab('books', document.getElementById('tab-books'));
            renderStats();
        } else {
            Toast.error('Failed to add book');
        }
    } catch (e) {
        console.error(e);
        Toast.error('Error saving book');
    }
}

function editBook(id) {
    const book = BookStore.getBook(id);
    if (!book) return;
    Modal.show(`Edit: ${book.title}`, `
    <div class="form-group"><label>Title</label><input class="form-input" id="editBookTitle" value="${book.title}"></div>
    <div class="form-row">
      <div class="form-group"><label>Price (₹)</label><input type="number" class="form-input" id="editBookPrice" value="${book.price}"></div>
      <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="editBookStock" value="${book.stock}"></div>
    </div>`,
        `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
     <button class="btn btn-primary" onclick="updateBook(${id})">Save Changes</button>`);
}

async function updateBook(id) {
    const book = BookStore.getBook(id);
    const data = {
        ...book,
        title: document.getElementById('editBookTitle').value,
        price: parseFloat(document.getElementById('editBookPrice').value),
        stock: parseInt(document.getElementById('editBookStock').value),
    };

    try {
        const res = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            Modal.hide();
            Toast.success('Book updated successfully!');
            await BookStore.refresh();
            showAdminTab('books', document.getElementById('tab-books'));
        } else {
            Toast.error('Failed to update book');
        }
    } catch (e) {
        console.error(e);
        Toast.error('Error updating book');
    }
}

async function deleteBook(id) {
    const book = BookStore.getBook(id);
    const ok = await Modal.confirm('Delete Book', `Are you sure you want to delete "${book?.title}"? This action cannot be undone.`);
    if (ok) {
        try {
            const res = await fetch(`${API_BASE_URL}/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Toast.success('Book deleted successfully');
                await BookStore.refresh();
                showAdminTab('books', document.getElementById('tab-books'));
                renderStats();
            } else {
                Toast.error('Failed to delete book');
            }
        } catch (e) {
            console.error(e);
            Toast.error('Error deleting book');
        }
    }
}

async function updateOrderStatus(orderId, selectEl) {
    const status = selectEl.value;
    const prevStatus = selectEl.getAttribute('data-prev');
    
    // Immediate visual feedback (optional, but clean)
    selectEl.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (res.ok) {
            Toast.success(`Order #${orderId} updated to ${status}`);
            selectEl.setAttribute('data-prev', status);
            // Refresh the whole tab to update badges and stats
            renderOrdersTab(document.getElementById('adminContent'));
            renderStats(); 
        } else {
            const error = await res.json().catch(() => ({}));
            Toast.error(error.message || 'Failed to update order status');
            selectEl.value = prevStatus;
        }
    } catch (e) {
        console.error(e);
        Toast.error('Error updating order');
        selectEl.value = prevStatus;
    } finally {
        selectEl.disabled = false;
    }
}
