import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@softhub.io');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>SH</div>
          <div>
            <div style={styles.logoName}>SoftHub CRM</div>
            <div style={styles.logoSub}>B2B Sales Platform</div>
          </div>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={styles.input}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={styles.input}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={styles.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={styles.hint}>
          <strong>Default admin:</strong> admin@softhub.io
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--bg-card)',
    borderRadius: 20,
    padding: '40px 36px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #6B7FD7, #5A6EC7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
  },
  logoName: { fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.3px' },
  logoSub: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 },
  title: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  subtitle: { fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' },
  input: {
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'var(--font)',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    borderRadius: 8,
    fontSize: '0.84rem',
    fontWeight: 500,
  },
  submitBtn: {
    padding: '12px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '0.92rem',
    fontFamily: 'var(--font)',
    transition: 'opacity 0.15s',
    boxShadow: '0 2px 10px rgba(107,127,215,0.35)',
  },
  hint: {
    marginTop: 20,
    padding: '10px 14px',
    background: 'var(--bg-hover)',
    borderRadius: 8,
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
};
