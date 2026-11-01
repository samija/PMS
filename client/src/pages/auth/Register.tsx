import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const VALUE_PROPS = [
  'Manage unlimited properties',
  'Collect rent online with ease',
  'Track maintenance requests',
  'Free forever plan — no credit card',
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      const { user, token } = response.data.data;

      setAuth(user, token);
      toast.success('Registration successful!');
      navigate('/owner');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen flex" style={{ backgroundColor: '#0c0a09', fontFamily: "'Outfit', sans-serif" }}>
        {/* ── LEFT PANEL (hidden on mobile) ── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1200&fit=crop&q=80"
            alt="Luxury property"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark overlay gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(12,10,9,0.85) 0%, rgba(12,10,9,0.55) 60%, rgba(12,10,9,0.75) 100%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-2">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Enderase
              </span>
            </Link>

            {/* Headline + bullets */}
            <div className="space-y-8">
              <div>
                <h1
                  className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Your properties,
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    perfectly managed.
                  </span>
                </h1>
                <p className="text-stone-300 text-lg leading-relaxed">
                  Everything you need to run your rental portfolio — from one elegant dashboard.
                </p>
              </div>

              <ul className="space-y-4">
                {VALUE_PROPS.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="shrink-0 h-5 w-5 text-amber-500" />
                    <span className="text-stone-200 text-base">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom tagline */}
            <p className="text-stone-500 text-sm">© {new Date().getFullYear()} Enderase. Built for landlords.</p>
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile brand */}
            <div className="lg:hidden text-center">
              <Link to="/">
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Enderase
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Create your account
              </h2>
              <p className="mt-2 text-stone-400 text-sm">Start managing your properties today — it's free.</p>
            </div>

            {/* Glassmorphism card */}
            <div
              className="rounded-2xl p-8 space-y-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Google button */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-400"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }}
                title="Google Sign-In is not available yet"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
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
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                </svg>
                Google Sign-In (Coming Soon)
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-stone-500 shrink-0">or register with email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Abebe Girma"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/40"
                    style={{
                      background: 'rgba(41,37,36,0.8)',
                      border: '1px solid rgba(87,83,78,0.5)',
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/40"
                    style={{
                      background: 'rgba(41,37,36,0.8)',
                      border: '1px solid rgba(87,83,78,0.5)',
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 911 123 456"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/40"
                    style={{
                      background: 'rgba(41,37,36,0.8)',
                      border: '1px solid rgba(87,83,78,0.5)',
                    }}
                  />
                </div>

                {/* Password row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="••••••"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/40"
                      style={{
                        background: 'rgba(41,37,36,0.8)',
                        border: '1px solid rgba(87,83,78,0.5)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wider"
                    >
                      Confirm
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/40"
                      style={{
                        background: 'rgba(41,37,36,0.8)',
                        border: '1px solid rgba(87,83,78,0.5)',
                      }}
                    />
                  </div>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-amber-500 cursor-pointer"
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <label htmlFor="terms" className="text-xs text-stone-400 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(to right, #f59e0b, #ea580c)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>
            </div>

            {/* Sign-in link */}
            <p className="text-center text-sm text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
