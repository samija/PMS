import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-stone-950">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-stone-950/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
            : isHome
              ? 'bg-transparent'
              : 'bg-stone-950/90 backdrop-blur-xl border-b border-white/5'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:shadow-amber-600/40 transition-shadow">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-stone-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-xl text-white">
                  Enderase
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-amber-400' : 'text-stone-400 hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/listings"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/listings') ? 'text-amber-400' : 'text-stone-400 hover:text-white'
                }`}
              >
                Listings
              </Link>

              <div className="w-px h-6 bg-stone-700 mx-3" />

              {isAuthenticated ? (
                <Link
                  to={user?.role === 'owner' ? '/owner' : '/tenant'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-600/20"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-semibold text-sm hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-600/20"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-stone-400 hover:text-white p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-6 border-t border-white/5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <div className="flex flex-col gap-1 pt-4">
                <Link
                  to="/"
                  className="text-stone-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/listings"
                  className="text-stone-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors font-medium"
                >
                  Listings
                </Link>
                <div className="h-px bg-white/5 my-2" />
                {isAuthenticated ? (
                  <Link
                    to={user?.role === 'owner' ? '/owner' : '/tenant'}
                    className="text-center py-3 px-3 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-semibold"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-stone-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors font-medium"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="text-center py-3 px-3 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 rounded-xl font-semibold mt-1"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 bg-stone-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-stone-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-xl text-white">
                  Enderase
                </span>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
                Ethiopia's modern property management platform. Simplifying the relationship between landlords and
                tenants.
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-2">
              <h4 className="font-semibold text-stone-300 text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3 text-stone-500 text-sm">
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/listings" className="hover:text-amber-400 transition-colors">
                    Listings
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-amber-400 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-stone-300 text-sm uppercase tracking-wider mb-4">Features</h4>
              <ul className="space-y-3 text-stone-500 text-sm">
                <li>
                  <span className="hover:text-amber-400 transition-colors cursor-default">Payments</span>
                </li>
                <li>
                  <span className="hover:text-amber-400 transition-colors cursor-default">Maintenance</span>
                </li>
                <li>
                  <span className="hover:text-amber-400 transition-colors cursor-default">Analytics</span>
                </li>
              </ul>
            </div>
            <div className="md:col-span-4">
              <h4 className="font-semibold text-stone-300 text-sm uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3 text-stone-500 text-sm">
                <li>support@enderase.com</li>
                <li>+251 911 123 456</li>
                <li>Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-stone-600 text-sm">&copy; {new Date().getFullYear()} Enderase. All rights reserved.</p>
            <p className="text-stone-700 text-xs">Built in Ethiopia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
