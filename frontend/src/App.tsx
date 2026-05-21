import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Toast } from './components/Toast';
import { getMe } from './services/authService';
import type { User, ToastMessage } from './types';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show a toast message helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Remove toast helper
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check auth session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getMe();
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        }
      } catch (err) {
        // Ignored, user is just not authenticated
        console.log('Session check: Not logged in.');
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner spinner-lg" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          showToast={showToast}
        />
      ) : (
        <Auth
          onAuthSuccess={handleAuthSuccess}
          showToast={showToast}
        />
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default App;
