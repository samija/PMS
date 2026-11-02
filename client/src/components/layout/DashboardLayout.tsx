import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  Users,
  CreditCard,
  ClipboardList,
  Wrench,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Calendar,
  UserCheck,
  Shield,
  Clock,
  AlertTriangle,
  DollarSign,
  Star,
  Eye,
  FileText,
  Fingerprint,
  FolderOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { NotificationBell } from '../notifications';
import PropertySwitcher from './PropertySwitcher';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { selectedProperty } = usePropertyStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const basePath = isOwner ? '/owner' : '/tenant';

  // Close user menu on route change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);

  const globalNavItems = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { name: 'Properties', path: '/owner/properties', icon: Building },
    { name: 'Tenants', path: '/owner/tenants', icon: Users },
    { name: 'Employees', path: '/owner/employees', icon: UserCheck },
    { name: 'Leave', path: '/owner/leave', icon: Calendar },
    { name: 'Payments', path: '/owner/payments', icon: CreditCard },
    { name: 'Schedules', path: '/owner/schedules', icon: Calendar },
    { name: 'Leases', path: '/owner/leases', icon: FileText },
    { name: 'Waiting List', path: '/owner/waitlist', icon: ClipboardList },
    { name: 'Maintenance', path: '/owner/maintenance', icon: Wrench },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  const propertyNavItems = selectedProperty
    ? [
        { name: 'Overview', path: `/owner/properties/${selectedProperty.id}`, icon: Eye },
        { name: 'Guards', path: `/owner/properties/${selectedProperty.id}/guards`, icon: Shield },
        { name: 'Attendance', path: `/owner/properties/${selectedProperty.id}/attendance`, icon: Clock },
        { name: 'Incidents', path: `/owner/properties/${selectedProperty.id}/incidents`, icon: AlertTriangle },
        { name: 'Payroll', path: `/owner/properties/${selectedProperty.id}/payroll`, icon: DollarSign },
        { name: 'Reviews', path: `/owner/properties/${selectedProperty.id}/reviews`, icon: Star },
      ]
    : [];

  const tenantNavItems = [
    { name: 'Dashboard', path: '/tenant', icon: LayoutDashboard },
    { name: 'My Identity', path: '/tenant/identity', icon: Fingerprint },
    { name: 'My Documents', path: '/tenant/documents', icon: FolderOpen },
    { name: 'My Lease', path: '/tenant/lease', icon: FileText },
    { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
    { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItem = (item: { name: string; path: string; icon: any }) => {
    const isActive =
      item.path === basePath
        ? location.pathname === item.path
        : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        aria-label={item.name}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[42px] group ${
          isActive ? 'bg-amber-500/10 text-amber-400' : 'text-stone-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <item.icon
          className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-300'}`}
          aria-hidden="true"
        />
        <span className="font-medium text-[13px]">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-stone-100" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-stone-950 transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col border-r border-white/5 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 flex-shrink-0">
          <Link to={basePath} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-stone-950"
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
            <span style={{ fontFamily: "'DM Serif Display', serif" }} className="text-lg text-white">
              Enderase
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property Switcher (owner only) */}
        {isOwner && (
          <div className="px-3 py-2">
            <PropertySwitcher onSelect={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Scrollable nav */}
        <nav role="navigation" aria-label="Sidebar navigation" className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {isOwner ? (
            <>
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold text-stone-600 uppercase tracking-[0.15em]">
                General
              </p>
              {globalNavItems.map(renderNavItem)}

              {selectedProperty && (
                <>
                  <div className="my-3 mx-3 border-t border-white/5" />
                  <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-amber-600/80 uppercase tracking-[0.15em] truncate">
                    {selectedProperty.name}
                  </p>
                  {propertyNavItems.map(renderNavItem)}
                </>
              )}
            </>
          ) : (
            <>
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold text-stone-600 uppercase tracking-[0.15em]">
                Menu
              </p>
              {tenantNavItems.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div className="flex-shrink-0 p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-bold text-xs flex-shrink-0">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-stone-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 min-h-[42px]"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="font-medium text-[13px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-stone-500 hover:text-stone-700 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              {/* Page breadcrumb */}
              <div className="hidden sm:block">
                <p className="text-sm text-stone-500">
                  {location.pathname === basePath
                    ? 'Welcome back'
                    : location.pathname
                        .split('/')
                        .pop()
                        ?.replace(/-/g, ' ')
                        .replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <NotificationBell />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label={`User menu for ${user?.name}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-bold text-xs">
                    {user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-stone-800">{user?.name}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-stone-400 hidden sm:block" aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div
                      role="menu"
                      aria-label="User account menu"
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200/60 py-1.5 z-20"
                    >
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-sm font-medium text-stone-800">{user?.name}</p>
                        <p className="text-xs text-stone-400">{user?.email}</p>
                      </div>
                      <Link
                        to={`${basePath}/settings`}
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
