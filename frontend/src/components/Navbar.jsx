import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { isLoggedIn, isAdmin, userName, userInitials, logout } = useAuth();
  const { getCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const cartCount = getCount();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container flex-between">
          <Link to="/home" className="nav-logo-link" title="BookVerse">
            <img src="/logo.png" alt="BookVerse — Discover a Larger World" className="nav-logo-img" />
          </Link>

          <div className="nav-links editorial-nav-center">
            <NavLink
              to="/home"
              className={({ isActive }) => `editorial-nav-link ${isActive || location.pathname === '/store' ? 'active' : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/books?sort=bestseller"
              className={({ isActive }) => `editorial-nav-link ${isActive && location.search.includes('bestseller') ? 'active' : ''}`}
            >
              Popular Lists
            </NavLink>
            <NavLink
              to="/books"
              className={({ isActive }) => `editorial-nav-link ${isActive && !location.search.includes('bestseller') ? 'active' : ''}`}
            >
              Library
            </NavLink>
            <NavLink
              to="/landing"
              className="editorial-nav-link"
              title="Experience 3D Book Cyclone"
              style={{ color: '#F0B90B' }}
            >
              ✦ 3D Cyclone
            </NavLink>
            <a
              href="#categories"
              className="editorial-nav-link"
              onClick={(e) => {
                if (location.pathname !== '/home' && location.pathname !== '/store') {
                  e.preventDefault();
                  navigate('/books');
                }
              }}
            >
              Browse
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nav-search" style={{ maxWidth: '240px', margin: 0 }}>
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{ padding: '8px 36px 8px 14px', fontSize: '0.84rem' }}
              />
              <span
                className="search-icon"
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
                style={{ cursor: 'pointer', right: '12px', fontSize: '0.85rem' }}
              >
                🔍
              </span>
            </div>

            <NavLink
              to="/dashboard?tab=wishlist"
              className="editorial-icon-btn"
              style={{ position: 'relative', color: '#B7B7B7', fontSize: '1.05rem', textDecoration: 'none' }}
              title="My Wishlist"
            >
              ♡
              {wishlistCount > 0 && (
                <span className="nav-cart-badge cart-count" style={{ background: '#f43f5e' }}>
                  {wishlistCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/cart"
              className="editorial-icon-btn"
              style={{ position: 'relative', color: '#B7B7B7', fontSize: '1.05rem', textDecoration: 'none' }}
              title="Shopping Cart"
            >
              🛒
              {cartCount > 0 && (
                <span className="nav-cart-badge cart-count" style={{ background: '#F0B90B', color: '#050505', fontWeight: 700 }}>
                  {cartCount}
                </span>
              )}
            </NavLink>

            <div className="auth-links">
              {isLoggedIn ? (
                <div className="user-dropdown" ref={dropdownRef}>
                  <div
                    className="user-trigger"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                  >
                    <div className="nav-avatar">{userInitials}</div>
                    <span className="nav-user-name">
                      {userName.split(' ')[0]}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </div>

                  {dropdownOpen && (
                    <div className="dropdown-content">
                      <div className="dropdown-header">
                        <p className="welcome">Welcome back,</p>
                        <p className="name">{userName}</p>
                      </div>
                      <hr />
                      {isAdmin ? (
                        <Link to="/admin">📊 Admin Dashboard</Link>
                      ) : (
                        <Link to="/dashboard">📊 Dashboard</Link>
                      )}
                      <Link to="/dashboard?tab=orders">📦 My Orders</Link>
                      <Link to="/dashboard?tab=wishlist">❤️ Wishlist ({wishlistCount})</Link>
                      <Link to="/dashboard?tab=profile">👤 Profile Settings</Link>
                      <hr />
                      <button onClick={handleLogout} className="logout-btn">
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            className="mobile-menu-btn"
            aria-label="Menu"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileNavOpen ? 'active' : ''}`}>
        <Link to="/home" onClick={() => setMobileNavOpen(false)}>
          Home
        </Link>
        <Link to="/landing" onClick={() => setMobileNavOpen(false)} style={{ color: '#F0B90B' }}>
          ✦ 3D Cyclone
        </Link>
        <Link to="/books?sort=bestseller" onClick={() => setMobileNavOpen(false)}>
          Popular Lists
        </Link>
        <Link to="/books" onClick={() => setMobileNavOpen(false)}>
          Library
        </Link>
        <Link to="/dashboard?tab=wishlist" onClick={() => setMobileNavOpen(false)}>
          Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
        </Link>
        <Link to="/cart" onClick={() => setMobileNavOpen(false)}>
          Cart {cartCount > 0 ? `(${cartCount})` : ''}
        </Link>
        {isLoggedIn ? (
          <>
            {isAdmin ? (
              <Link to="/admin" onClick={() => setMobileNavOpen(false)}>
                Admin Dashboard
              </Link>
            ) : (
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)}>
                My Account
              </Link>
            )}
            <button
              onClick={() => {
                setMobileNavOpen(false);
                handleLogout();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-4)',
                textAlign: 'left',
                padding: '12px 0',
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" onClick={() => setMobileNavOpen(false)}>
            Login
          </Link>
        )}
      </div>
    </>
  );
};

export default Navbar;
