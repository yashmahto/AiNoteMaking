import React, { useState } from 'react';
import { signup, login } from '../services/authService';
import type { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('All fields are required');
          setIsLoading(false);
          return;
        }
        const response = await login(email, password);
        if (response.data.success) {
          showToast('Successfully logged in!', 'success');
          onAuthSuccess(response.data.user);
        } else {
          setError(response.data.message || 'Login failed');
          showToast(response.data.message || 'Login failed', 'error');
        }
      } else {
        if (!name || !email || !password) {
          setError('All fields are required');
          setIsLoading(false);
          return;
        }
        const response = await signup(name, email, password);
        if (response.data.success) {
          showToast('Account created successfully!', 'success');
          onAuthSuccess(response.data.user);
        } else {
          setError(response.data.message || 'Signup failed');
          showToast(response.data.message || 'Signup failed', 'error');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errMsg = err.response?.data?.message || 'Authentication error. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.1), transparent 40%)'
    }}>
      <div className="card glass" style={{ width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-float)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            AiNoteMaking
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isLogin ? 'Welcome back! Manage notes with your voice & AI.' : 'Get started with your AI-powered workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name</label>
              <input
                className={`input ${error && !name ? 'input-error' : ''}`}
                type="text"
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input
              className={`input ${error && !email ? 'input-error' : ''}`}
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              className={`input ${error && !password ? 'input-error' : ''}`}
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="field-error" style={{ textAlign: 'center', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="btn-ghost"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--violet-light)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={isLoading}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
