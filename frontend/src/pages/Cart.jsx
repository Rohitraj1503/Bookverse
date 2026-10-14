import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatters';
import Modal from '../components/Modal';

const Cart = () => {
  const { getDetailedItems, getCount, getTotal, updateQty, removeFromCart, clearCart } = useCart();
  const [showClearModal, setShowClearModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const navigate = useNavigate();

  const items = getDetailedItems();
  const count = getCount();
  const subtotal = getTotal();
  const shipping = subtotal >= 4000 ? 0 : subtotal > 0 ? 400 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleRemove = (bookId) => {
    setRemovingId(bookId);
    setTimeout(() => {
      removeFromCart(bookId, true);
      setRemovingId(null);
    }, 300);
  };

  const handleConfirmClear = () => {
    clearCart();
    setShowClearModal(false);
  };

  return (
    <div className="cart-page container">
      <div className="cart-page__header">
        <h1 className="cart-page__title">
          Shopping <span className="text-gradient">Cart</span>
        </h1>
        <p className="cart-page__subtitle" id="cartInfo">
          {count === 0 ? '0 items in your cart' : `${count} item${count !== 1 ? 's' : ''} in your cart`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '60px 20px' }}>
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any books yet</p>
          <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout" id="cartContainer">
          <div className="cart-items">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="cart-item"
                id={`cart-item-${item.id}`}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  transition: 'all 0.3s ease',
                  opacity: removingId === item.id ? 0 : 1,
                  transform: removingId === item.id ? 'translateX(60px)' : 'none',
                }}
              >
                <img
                  src={item.cover}
                  alt={item.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/72x100?text=Book';
                  }}
                />
                <div className="item-info">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-author">by {item.author}</p>
                  <p className="item-price">{formatPrice(item.subtotal)}</p>
                  <div className="qty-control">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span
                  className="remove-btn"
                  onClick={() => handleRemove(item.id)}
                  title="Remove item"
                  role="button"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>

          <div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
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

              {subtotal < 4000 && subtotal > 0 && (
                <div className="free-ship-hint">
                  🎁 Add {formatPrice(4000 - subtotal)} more for free shipping!
                </div>
              )}

              <div className="summary-row total">
                <span>Total</span>
                <span className="text-gradient">{formatPrice(total)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', border: 'none', cursor: 'pointer' }}
              >
                Proceed to Checkout →
              </button>

              <button
                className="clear-cart-btn"
                onClick={() => setShowClearModal(true)}
              >
                Clear Cart
              </button>

              <div className="secure-badge">🔒 Secure checkout</div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Cart"
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmClear}>
              Clear Cart
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to remove all items from your cart?
        </p>
      </Modal>
    </div>
  );
};

export default Cart;
