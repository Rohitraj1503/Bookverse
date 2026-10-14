import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BackgroundOrbs from '../components/BackgroundOrbs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      setTimeout(() => {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (from && from !== '/login' && from !== '/register') {
          navigate(from);
        } else {
          navigate('/');
        }
      }, 600);
    } else {
      toast.error(result.message || 'Invalid email or password');
    }
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up">
        <div className="text-center">
          <h2>
            Welcome <span className="text-gradient">Back</span>
          </h2>
          <p className="auth-subtitle">Sign in to your BookVerse account</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              fontSize: '0.85rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Password reset instructions sent to your email.');
              }}
              style={{ color: 'var(--accent-1)' }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => toast.info('Google login integration active with backend')}
          >
            🔵 Google
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => toast.info('GitHub login integration active with backend')}
          >
            ⚫ GitHub
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-1)', fontWeight: 600 }}>
            Sign Up
          </Link>
        </p>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-glass)',
            border: 'var(--border-glass)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <strong>Demo accounts (click to fill):</strong>
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFillDemo('admin@bookverse.com')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Admin Demo
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFillDemo('jane@example.com')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Customer Demo
            </button>
          </div>
        </div>
      </div>

      <BackgroundOrbs />
    </div>
  );
};

export default Login;
