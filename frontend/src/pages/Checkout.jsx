import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import orderService from '../services/orderService';
import couponService from '../services/couponService';
import { formatPrice } from '../utils/formatters';

const Checkout = () => {
  const { getDetailedItems, getTotal, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.fullName || user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zipCode || '',
    email: user?.email || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [errors, setErrors] = useState({});

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const items = getDetailedItems();
  const subtotal = getTotal();
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shipping = discountedSubtotal >= 4000 ? 0 : 400;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + shipping + tax;

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      toast.warning('Please enter a coupon code');
      return;
    }
    try {
      setValidatingCoupon(true);
      const res = await couponService.validateCoupon(code, subtotal, user?.id);
      if (res && res.valid) {
        setAppliedCoupon(res);
        setCouponInput(res.code);
        toast.success(`Coupon ${res.code} applied! You saved ${formatPrice(res.discountAmount)}`);
      } else {
        toast.error(res?.message || 'Invalid coupon');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Coupon cannot be applied');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    toast.info('Coupon removed');
  };

  const handleInputChange = (field, value) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (!isLoggedIn) {
      toast.error('Please login to place an order');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const newErrors = {};
    if (!shippingInfo.name.trim()) newErrors.name = true;
    if (!shippingInfo.address.trim()) newErrors.address = true;
    if (!shippingInfo.city.trim()) newErrors.city = true;
    if (!shippingInfo.zip.trim()) newErrors.zip = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      const orderNumber =
        'BV-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      const orderPayload = {
        user: { id: user.id },
        orderNumber: orderNumber,
        subtotal: subtotal,
        shippingCost: shipping,
        tax: tax,
        total: total,
        shippingName: shippingInfo.name,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingState: shippingInfo.state,
        shippingZip: shippingInfo.zip,
        shippingPhone: shippingInfo.phone,
        paymentMethod: paymentMethod,
        notes: appliedCoupon ? `Coupon ${appliedCoupon.code} applied (-${formatPrice(discountAmount)})` : null,
        items: items.map((item) => ({
          book: { id: item.id },
          quantity: item.qty,
          price: item.price,
          total: item.subtotal,
        })),
      };

      const result = await orderService.placeOrder(orderPayload);
      clearCart();
      setPlacedOrder(result || { orderNumber });
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error('Order placement failed:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="checkout-page container">
        <div className="checkout-progress">
          <div className="checkout-progress__step completed">
            <span className="step-dot">✓</span>
            <span className="step-label">Cart</span>
          </div>
          <div className="checkout-progress__line active"></div>
          <div className="checkout-progress__step completed">
            <span className="step-dot">✓</span>
            <span className="step-label">Checkout</span>
          </div>
          <div className="checkout-progress__line active"></div>
          <div className="checkout-progress__step active">
            <span className="step-dot">3</span>
            <span className="step-label">Confirmation</span>
          </div>
        </div>

        <div
          className="empty-state animate-fade-up"
          style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'scaleIn 0.5s ease' }}>
            ✅
          </div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            Order Placed Successfully!
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Order Number:{' '}
            <strong className="text-gradient">
              {placedOrder.orderNumber || 'BV-CONFIRMED'}
            </strong>
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Thank you for shopping with BookVerse. You'll receive a confirmation
            email shortly.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/dashboard?tab=orders" className="btn btn-primary">
              View Orders
            </Link>
            <Link to="/books" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page container">
        <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 20px' }}>
          <div className="empty-icon">🛒</div>
          <h3>Nothing to checkout</h3>
          <p>Your cart is empty</p>
          <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      {/* Progress Indicator */}
      <div className="checkout-progress">
        <div className="checkout-progress__step completed">
          <span className="step-dot">✓</span>
          <span className="step-label">Cart</span>
        </div>
        <div className="checkout-progress__line active"></div>
        <div className="checkout-progress__step active">
          <span className="step-dot">2</span>
          <span className="step-label">Checkout</span>
        </div>
        <div className="checkout-progress__line"></div>
        <div className="checkout-progress__step">
          <span className="step-dot">3</span>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      <div className="checkout-layout" id="checkoutContainer">
        <div>
          {/* Shipping Form */}
          <div className="checkout-section animate-fade-up">
            <h3>📦 Shipping Information</h3>
            <div className="form-row-2">
              <div className="floating-group">
                <input
                  type="text"
                  id="shipName"
                  placeholder=" "
                  value={shippingInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={[errors.name ? 'error' : '', shippingInfo.name ? 'has-value' : ''].filter(Boolean).join(' ')}
                  required
                />
                <label htmlFor="shipName">Full Name *</label>
              </div>
              <div className="floating-group">
                <input
                  type="tel"
                  id="shipPhone"
                  placeholder=" "
                  value={shippingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={shippingInfo.phone ? 'has-value' : ''}
                />
                <label htmlFor="shipPhone">Phone</label>
              </div>
            </div>

            <div className="floating-group">
              <input
                type="text"
                id="shipAddress"
                placeholder=" "
                value={shippingInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={[errors.address ? 'error' : '', shippingInfo.address ? 'has-value' : ''].filter(Boolean).join(' ')}
                required
              />
              <label htmlFor="shipAddress">Street Address *</label>
            </div>

            <div className="form-row-2">
              <div className="floating-group">
                <input
                  type="text"
                  id="shipCity"
                  placeholder=" "
                  value={shippingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={[errors.city ? 'error' : '', shippingInfo.city ? 'has-value' : ''].filter(Boolean).join(' ')}
                  required
                />
                <label htmlFor="shipCity">City *</label>
              </div>
              <div className="floating-group">
                <input
                  type="text"
                  id="shipState"
                  placeholder=" "
                  value={shippingInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={shippingInfo.state ? 'has-value' : ''}
                />
                <label htmlFor="shipState">State</label>
              </div>
            </div>

            <div className="form-row-2">
              <div className="floating-group">
                <input
                  type="text"
                  id="shipZip"
                  placeholder=" "
                  value={shippingInfo.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  className={[errors.zip ? 'error' : '', shippingInfo.zip ? 'has-value' : ''].filter(Boolean).join(' ')}
                  required
                />
                <label htmlFor="shipZip">ZIP Code *</label>
              </div>
              <div className="floating-group">
                <input
                  type="email"
                  id="shipEmail"
                  placeholder=" "
                  value={shippingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={shippingInfo.email ? 'has-value' : ''}
                />
                <label htmlFor="shipEmail">Email</label>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="checkout-section animate-fade-up stagger-2" style={{ marginTop: '24px' }}>
            <h3>💳 Payment Method</h3>
            <div className="payment-grid">
              <div
                className={`pay-card ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <span className="pay-card__icon">💳</span>
                <span className="pay-card__name">Credit Card</span>
              </div>
              <div
                className={`pay-card ${paymentMethod === 'debit_card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('debit_card')}
              >
                <span className="pay-card__icon">🏦</span>
                <span className="pay-card__name">Debit Card</span>
              </div>
              <div
                className={`pay-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <span className="pay-card__icon">📱</span>
                <span className="pay-card__name">UPI</span>
              </div>
              <div
                className={`pay-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <span className="pay-card__icon">💵</span>
                <span className="pay-card__name">Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div>
          <div className="order-summary-card animate-fade-up stagger-3">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="order-item">
                <img
                  src={item.cover}
                  alt={item.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/44x60?text=B';
                  }}
                />
                <div className="order-item__info">
                  <p className="order-item__title">{item.title}</p>
                  <p className="order-item__qty">Qty: {item.qty}</p>
                </div>
                <span className="order-item__price">{formatPrice(item.subtotal)}</span>
              </div>
            ))}

            {/* Promo / Coupon Section */}
            <div style={{ margin: '18px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', paddingTop: '14px', paddingBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                HAVE A COUPON CODE?
              </label>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', padding: '10px 14px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>🏷️ {appliedCoupon.code}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      (-{formatPrice(discountAmount)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. BOOK10, FLAT100"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--input-bg, rgba(255,255,255,0.05))',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        textTransform: 'uppercase',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleApplyCoupon()}
                      disabled={validatingCoupon}
                      style={{ padding: '8px 16px' }}
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Popular:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('BOOK10')}
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      BOOK10 (10% off)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('FLAT100')}
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      FLAT100 (₹100 off)
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="summary-row" style={{ marginTop: '10px' }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-row" style={{ color: '#10b981', fontWeight: 600 }}>
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span style={{ color: '#34d399', fontWeight: 600 }}>FREE</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="text-gradient">{formatPrice(total)}</span>
            </div>

            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span style={{ animation: 'pulse 1s infinite' }}>Processing...</span>
              ) : (
                `Place Order — ${formatPrice(total)}`
              )}
            </button>

            <div className="secure-badge">🔒 Secure 256-bit SSL checkout</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
