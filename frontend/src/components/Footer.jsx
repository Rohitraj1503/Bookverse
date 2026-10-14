import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="editorial-footer">
      <div className="container">
        <div className="editorial-footer-grid">
          <div className="editorial-footer-brand">
            <Link to="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
              <img src="/logo.png" alt="BookVerse — Discover a Larger World" className="footer-logo-img" />
            </Link>
            <p>
              An immersive digital sanctuary for literature, celebrating authors,
              publishers, and the timeless art of the written word.
            </p>
          </div>
          <div className="editorial-footer-col">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/books">Library</Link>
            <Link to="/books?sort=bestseller">Popular Lists</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div className="editorial-footer-col">
            <h4>Collections</h4>
            <Link to="/books?cat=Fiction">Fiction</Link>
            <Link to="/books?cat=Non-Fiction">Non-Fiction</Link>
            <Link to="/books?cat=Science">Science & Tech</Link>
            <Link to="/books?lang=Hindi">Hindi Literature</Link>
          </div>
          <div className="editorial-footer-col">
            <h4>Support</h4>
            <Link to="/dashboard">My Account</Link>
            <Link to="/dashboard?tab=orders">Track Orders</Link>
            <Link to="/dashboard?tab=wishlist">Saved Wishlist</Link>
            <a href="#help" onClick={(e) => e.preventDefault()}>Help & Terms</a>
          </div>
        </div>
        <div className="editorial-footer-bottom">
          <span>© 2024–2026 BookVerse Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Conditions of Use</span>
            <span>•</span>
            <span>Privacy Notice</span>
            <span>•</span>
            <span>Interest-Based Ads</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
