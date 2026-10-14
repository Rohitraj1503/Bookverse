import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BackgroundOrbs from '../components/BackgroundOrbs';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { width: '0%', color: 'transparent', text: '' };
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    const levels = [
      { width: '0%', color: 'transparent', text: '' },
      { width: '20%', color: '#ef4444', text: 'Very weak' },
      { width: '40%', color: '#f59e0b', text: 'Weak' },
      { width: '60%', color: '#eab308', text: 'Fair' },
      { width: '80%', color: '#22c55e', text: 'Strong' },
      { width: '100%', color: '#10b981', text: 'Very strong' },
    ];
    return levels[strength] || levels[0];
  };

  const strengthInfo = getPasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }

    setSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Account created successfully!');
      setTimeout(() => {
        navigate('/');
      }, 800);
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up">
        <div className="text-center">
          <h2>
            Create Your <span className="text-gradient">Account</span>
          </h2>
          <p className="auth-subtitle">Join thousands of book lovers on BookVerse</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+1 234 567 890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="password-strength">
              <div
                className="bar"
                style={{
                  width: strengthInfo.width,
                  backgroundColor: strengthInfo.color,
                  transition: 'all 0.3s ease',
                }}
              ></div>
            </div>
            {strengthInfo.text && (
              <p
                className="form-error"
                style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.75rem' }}
              >
                {strengthInfo.text}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              className={`form-input ${confirmPassword && password !== confirmPassword ? 'error' : ''}`}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '24px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
              style={{ marginTop: '3px' }}
            />
            <span>
              I agree to the{' '}
              <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-1)' }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-1)' }}>
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-1)', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>

      <BackgroundOrbs />
    </div>
  );
};

export default Register;
