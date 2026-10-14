import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import userService from '../services/userService';
import { formatPrice } from '../utils/formatters';
import { Package, UserRound, Truck, Heart, Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, userName, userInitials, logout, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';
  const paramOrderId = searchParams.get('orderId');
  const toast = useToast();
  const navigate = useNavigate();

  const { wishlistItems, removeFromWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Selected order for tracking tab
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [customTrackOrder, setCustomTrackOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Profile editable form state
  const [profileData, setProfileData] = useState({
    name: user?.fullName || user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    address: user?.address || '',
    state: user?.state || '',
    zip: user?.zipCode || '',
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchUserOrders() {
      if (!user?.id) return;
      try {
        setLoadingOrders(true);
        const data = await orderService.getByUserId(user.id);
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }

    fetchUserOrders();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Keep profileData synced if user object updates
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.fullName || user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        address: user.address || '',
        state: user.state || '',
        zip: user.zipCode || '',
      });
    }
  }, [user]);

  const switchTab = (tab, orderId = null) => {
    const params = { tab };
    if (orderId) params.orderId = orderId;
    setSearchParams(params);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const map = {
      DELIVERED: 'badge-success',
      SHIPPED: 'badge-info',
      PROCESSING: 'badge-warning',
      PENDING: 'badge-purple',
      CANCELLED: 'badge-danger',
    };
    return (
      <span className={`badge ${map[s] || 'badge-info'}`}>
        {s.charAt(0) + s.slice(1).toLowerCase()}
      </span>
    );
  };

  // Real backend profile save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await userService.updateProfile(user.id, {
        fullName: profileData.name,
        phone: profileData.phone,
        city: profileData.city,
        address: profileData.address,
        state: profileData.state,
        zipCode: profileData.zip,
      });

      // Update local auth context
      updateUser({
        fullName: updated.fullName,
        name: updated.fullName,
        phone: updated.phone,
        city: updated.city,
        address: updated.address,
        state: updated.state,
        zipCode: updated.zipCode,
      });

      toast.success('Profile updated and saved to account successfully!');
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error(err.response?.data?.error || 'Failed to save profile changes');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTrackByNumber = async (e) => {
    e.preventDefault();
    if (!selectedOrderNumber.trim()) return;
    try {
      setTrackingLoading(true);
      const res = await orderService.trackOrder(selectedOrderNumber.trim());
      setCustomTrackOrder(res);
    } catch (err) {
      toast.error('Order not found with that order number');
      setCustomTrackOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const renderOrdersTab = () => {
    if (loadingOrders) {
      return (
        <div className="loading-shimmer" style={{ height: '240px', borderRadius: '12px' }}></div>
      );
    }

    if (orders.length === 0) {
      return (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
            📦 My Orders
          </h2>
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>You haven't placed any orders yet.</p>
            <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Start Shopping
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          📦 My Orders ({orders.length})
        </h2>
        <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id || o.orderNumber} className="animate-fade-up">
                  <td>
                    <strong>{o.orderNumber || 'BV-' + o.id}</strong>
                  </td>
                  <td>
                    {new Date(o.orderDate || o.createdAt || Date.now()).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(o.total)}</td>
                  <td>{getStatusBadge(o.status)}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => switchTab('tracking', o.id)}
                    >
                      Track Order 🚚
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          👤 Profile Settings
        </h2>
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div
              className="user-avatar"
              style={{ width: '80px', height: '80px', fontSize: '1.8rem' }}
            >
              {userInitials}
            </div>
            <div>
              <h3>{userName}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  className="form-input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  className="form-input"
                  placeholder="+1 234 567 890"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  className="form-input"
                  placeholder="New York"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                className="form-input"
                placeholder="123 Main Street"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <input
                  className="form-input"
                  placeholder="NY"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  className="form-input"
                  placeholder="10001"
                  value={profileData.zip}
                  onChange={(e) => setProfileData({ ...profileData, zip: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }} disabled={savingProfile}>
              {savingProfile ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderTrackingTab = () => {
    // Determine which order to track:
    // 1. If customTrackOrder is set from manual search
    // 2. If paramOrderId is in URL
    // 3. Default to most recent order (orders[0])
    let orderToTrack = null;
    if (customTrackOrder) {
      orderToTrack = customTrackOrder;
    } else if (paramOrderId && orders.length > 0) {
      orderToTrack = orders.find((o) => String(o.id) === String(paramOrderId)) || orders[0];
    } else if (orders.length > 0) {
      orderToTrack = orders[0];
    }

    if (loadingOrders && !orderToTrack) {
      return (
        <div className="loading-shimmer" style={{ height: '300px', borderRadius: '12px' }}></div>
      );
    }

    const steps = [
      { id: 'pending', label: 'Order Placed' },
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'processing', label: 'Processing' },
      { id: 'shipped', label: 'Shipped' },
      { id: 'out_for_delivery', label: 'Out for Delivery' },
      { id: 'delivered', label: 'Delivered' },
    ];
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

    const currentStatus = (orderToTrack?.status || 'pending').toLowerCase();
    const currentIndex = statusOrder.indexOf(currentStatus) >= 0 ? statusOrder.indexOf(currentStatus) : 0;

    const estDelivery = orderToTrack?.estimatedDelivery
      ? new Date(orderToTrack.estimatedDelivery).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'In Transit (2-4 Business Days)';

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            🚚 Order Tracking
          </h2>

          {/* Quick select order from dropdown */}
          {orders.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Order:</label>
              <select
                value={orderToTrack?.id || ''}
                onChange={(e) => {
                  setCustomTrackOrder(null);
                  switchTab('tracking', e.target.value);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber || 'BV-' + o.id} ({formatPrice(o.total)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search by Order Number Form */}
        <form
          onSubmit={handleTrackByNumber}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            background: 'var(--card-bg)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <input
            type="text"
            placeholder="Enter Order Number (e.g. BV-1718293)"
            value={selectedOrderNumber}
            onChange={(e) => setSelectedOrderNumber(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg, rgba(255,255,255,0.05))',
              color: 'var(--text-primary)',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={trackingLoading}>
            {trackingLoading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {!orderToTrack ? (
          <div className="empty-state">
            <div className="empty-icon">🚚</div>
            <h3>No orders found to track</h3>
            <p>Enter an order number above or place an order from our library.</p>
            <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Browse Books
            </Link>
          </div>
        ) : currentStatus === 'cancelled' ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
            <h3 style={{ color: 'var(--accent-4)' }}>Order Cancelled</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Order {orderToTrack.orderNumber || 'BV-' + orderToTrack.id} has been cancelled.
            </p>
            <div className="summary-row" style={{ maxWidth: '300px', margin: '0 auto' }}>
              <span>Order Number:</span>
              <span>{orderToTrack.orderNumber}</span>
            </div>
            <div className="summary-row" style={{ maxWidth: '300px', margin: '0 auto', marginBottom: '24px' }}>
              <span>Total:</span>
              <span>{formatPrice(orderToTrack.total)}</span>
            </div>
            <Link to="/books" className="btn btn-secondary">
              Order Again
            </Link>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '32px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.3rem' }}>{orderToTrack.orderNumber || 'BV-' + orderToTrack.id}</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Placed on{' '}
                  {new Date(orderToTrack.orderDate || orderToTrack.createdAt || Date.now()).toLocaleDateString()}
                </p>
                {orderToTrack.shippingAddress && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                    Shipping to: <strong>{orderToTrack.shippingName || userName}</strong> ({orderToTrack.shippingCity}, {orderToTrack.shippingState})
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  className={`badge ${currentStatus === 'delivered' ? 'badge-success' : 'badge-info'}`}
                  style={{ marginBottom: '8px', display: 'inline-block' }}
                >
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Est. Delivery: <strong>{estDelivery}</strong>
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary, #6366f1)', marginTop: '4px' }}>
                  Total: {formatPrice(orderToTrack.total)}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline">
              {steps.map((step, index) => {
                let className = 'timeline-item';
                if (index < currentIndex) className += ' completed';
                if (index === currentIndex) className += ' active';

                let details = '';
                if (index === 0)
                  details = new Date(orderToTrack.createdAt || Date.now()).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                else if (index === currentIndex)
                  details =
                    'Currently updated at ' +
                    new Date(orderToTrack.updatedAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                else if (index > currentIndex) details = 'Estimated: ' + estDelivery;

                return (
                  <div key={step.id} className={className}>
                    <h4>{step.label}</h4>
                    <p>{details}</p>
                  </div>
                );
              })}
            </div>

            {/* Order Items Summary */}
            {Array.isArray(orderToTrack.items) && orderToTrack.items.length > 0 && (
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>Books in this Shipment:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orderToTrack.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <strong>{it.book?.title || 'Book Title'}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '10px' }}>
                          Qty: {it.quantity} × {formatPrice(it.price)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600 }}>{formatPrice(it.total || (it.price * it.quantity))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderWishlistTab = () => {
    if (wishlistItems.length === 0) {
      return (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
            ❤️ My Wishlist (0)
          </h2>
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <h3>Your wishlist is empty</h3>
            <p>Explore our library and click the heart icon on books you'd love to read later.</p>
            <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Browse Books
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            ❤️ My Wishlist ({wishlistItems.length})
          </h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              wishlistItems.forEach((b) => addToCart(b.id, 1, false));
              toast.success(`Moved all ${wishlistItems.length} books to cart!`);
            }}
          >
            🛒 Move All to Cart
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {wishlistItems.map((b) => (
            <div
              key={b.id}
              className="glass-card animate-fade-up"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '14px',
              }}
            >
              <div>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <img
                    src={b.cover}
                    alt={b.title}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x300?text=Book+Cover';
                    }}
                  />
                </div>
                <span className="card-category" style={{ fontSize: '0.75rem' }}>{b.category || 'General'}</span>
                <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', fontWeight: 600 }}>{b.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>by {b.author}</p>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary, #6366f1)', marginBottom: '14px' }}>
                  {formatPrice(b.price)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    addToCart(b.id, 1, true);
                  }}
                >
                  🛒 Add to Cart
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--accent-4)' }}
                  onClick={() => removeFromWishlist(b.id)}
                  title="Remove from wishlist"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          ⚙️ Account Settings
        </h2>
        <div className="glass-card" style={{ padding: '32px' }}>
          <h4 style={{ marginBottom: '16px' }}>Notification Preferences</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Receive order status email notifications</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Receive weekly deals & new book alerts</span>
          </label>
          <button className="btn btn-primary" onClick={() => toast.success('Settings updated!')}>
            Save Preferences
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <div className="dashboard-layout" id="dashboardContainer">
        {/* Sidebar */}
        <aside className="dash-sidebar animate-fade-up">
          <div className="user-info">
            <div className="user-avatar">{userInitials}</div>
            <h4 className="user-name">{userName}</h4>
            <p className="user-email">{user?.email || ''}</p>
          </div>
          <nav className="account-menu">
            <button
              type="button"
              className={`account-menu__item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => switchTab('orders')}
            >
              <Package size={17} className="account-menu__icon" />
              <span className="account-menu__label">My Orders ({orders.length})</span>
            </button>

            <button
              type="button"
              className={`account-menu__item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => switchTab('profile')}
            >
              <UserRound size={17} className="account-menu__icon" />
              <span className="account-menu__label">Profile</span>
            </button>

            <button
              type="button"
              className={`account-menu__item ${activeTab === 'tracking' ? 'active' : ''}`}
              onClick={() => switchTab('tracking')}
            >
              <Truck size={17} className="account-menu__icon" />
              <span className="account-menu__label">Order Tracking</span>
            </button>

            <button
              type="button"
              className={`account-menu__item ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => switchTab('wishlist')}
            >
              <Heart size={17} className="account-menu__icon" />
              <span className="account-menu__label">Wishlist ({wishlistCount})</span>
            </button>

            <button
              type="button"
              className={`account-menu__item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => switchTab('settings')}
            >
              <Settings size={17} className="account-menu__icon" />
              <span className="account-menu__label">Settings</span>
            </button>

            <button
              type="button"
              className="account-menu__item account-menu__item--logout"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={17} className="account-menu__icon" />
              <span className="account-menu__label">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dash-content" id="dashContent">
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'tracking' && renderTrackingTab()}
          {activeTab === 'wishlist' && renderWishlistTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
