import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data.data;

      setAuth(user, token);
      toast.success('Login successful!');
      navigate(user.role === 'owner' ? '/owner' : '/tenant');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
        .login-root { font-family: 'Outfit', sans-serif; }
        .login-heading { font-family: 'DM Serif Display', serif; }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .dark-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .dark-input::placeholder { color: rgba(255,255,255,0.3); }
        .dark-input:focus { border-color: rgba(245,158,11,0.5); box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .amber-btn {
          width: 100%;
          padding: 0.8125rem 1rem;
          border-radius: 0.625rem;
          background: linear-gradient(to right, #f59e0b, #ea580c);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9375rem;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .amber-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .amber-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .google-btn {
          width: 100%;
          padding: 0.8125rem 1rem;
          border-radius: 0.625rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.85);
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          transition: background 0.2s;
        }
        .google-btn:hover { background: rgba(255,255,255,0.10); }
        .divider-line { border-color: rgba(255,255,255,0.08); }
        .input-label { color: rgba(255,255,255,0.55); font-size: 0.8125rem; margin-bottom: 0.375rem; display: block; }
      `}</style>

      <div
        className="login-root"
        style={{
          minHeight: '100vh',
          display: 'flex',
          background: '#0c0a09' /* stone-950 */,
        }}
      >
        {/* Left panel — property image */}
        <div
          style={{
            display: 'none',
            flex: '1',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="lg-left-panel"
        >
          <style>{`
            @media (min-width: 1024px) {
              .lg-left-panel { display: flex !important; flex-direction: column; justify-content: flex-end; padding: 3rem; }
              .login-right { max-width: 480px; }
            }
            @media (min-width: 1024px) {
              .login-right-wrap { justify-content: center; padding: 3rem 4rem; }
            }
          `}</style>
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=1200&fit=crop&q=80"
            alt="Luxury property"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(12,10,9,0.90) 0%, rgba(12,10,9,0.30) 50%, rgba(12,10,9,0.10) 100%)',
            }}
          />
          {/* Branding */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {/* Logo */}
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span
                style={{
                  color: '#fff',
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '1.375rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Enderase
              </span>
            </div>
            <h2
              className="login-heading"
              style={{ color: '#fff', fontSize: '2.25rem', lineHeight: 1.15, marginBottom: '0.75rem', fontWeight: 400 }}
            >
              Your home,
              <br />
              perfectly managed.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem', maxWidth: '26rem' }}>
              A modern platform for property owners and tenants to manage every detail with ease.
            </p>
          </div>
        </div>

        {/* Right panel — login form */}
        <div
          className="login-right-wrap"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.25rem',
          }}
        >
          <div className="login-right" style={{ width: '100%', maxWidth: '420px' }}>
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem' }}>
                  Enderase
                </span>
              </Link>
            </div>

            {/* Heading */}
            <h1
              className="login-heading"
              style={{ color: '#fff', fontSize: '2rem', fontWeight: 400, marginBottom: '0.375rem' }}
            >
              Welcome back
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
              Sign in to your account to continue
            </p>

            {/* Glass card */}
            <div className="glass-card" style={{ borderRadius: '1rem', padding: '2rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="input-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="dark-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="input-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="dark-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {/* Remember me + forgot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#f59e0b', width: '1rem', height: '1rem' }} />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Remember me</span>
                  </label>
                  <a
                    href="#"
                    style={{ color: '#fbbf24', fontSize: '0.875rem', textDecoration: 'none' }}
                    onMouseOver={(e) => (e.currentTarget.style.color = '#f59e0b')}
                    onMouseOut={(e) => (e.currentTarget.style.color = '#fbbf24')}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <button type="submit" className="amber-btn" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ position: 'relative', margin: '1.5rem 0' }}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(12,10,9,0.01)',
                    padding: '0 0.75rem',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.8125rem',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  Or continue with
                </span>
              </div>

              {/* Google */}
              <button
                type="button"
                className="google-btn"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="Google Sign-In is not available yet"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </svg>
                Google Sign-In (Coming Soon)
              </button>
            </div>

            {/* Sign up link */}
            <p
              style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{ color: '#fbbf24', fontWeight: 500, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#f59e0b')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#fbbf24')}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
