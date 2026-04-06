import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Building,
  Users,
  CreditCard,
  ClipboardList,
  Wrench,
  LogOut,
  Menu,
  X,
  User,
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

  const globalNavItems = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { name: 'Properties', path: '/owner/properties', icon: Building },
    { name: 'Tenants', path: '/owner/tenants', icon: Users },
    { name: 'Employees', path: '/owner/employees', icon: UserCheck },
    { name: 'Leave', path: '/owner/leave', icon: Calendar },
    { name: 'Payments', path: '/owner/payments', icon: CreditCard },
    { name: 'Schedules', path: '/owner/schedules', icon: Calendar },
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
    { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
    { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItem = (item: { name: string; path: string; icon: any }) => {
    const isActive = item.path === basePath
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors min-h-[44px] ${
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <item.icon className="h-5 w-5" />
        <span className="font-medium text-sm">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          <Link to={basePath} className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">PMS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Property Switcher (owner only) */}
        {isOwner && <PropertySwitcher onSelect={() => setSidebarOpen(false)} />}

        {/* Scrollable nav area */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {isOwner ? (
            <>
              {/* Global Section */}
              <p className="px-4 pt-1 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                General
              </p>
              {globalNavItems.map(renderNavItem)}

              {/* Property Section */}
              {selectedProperty && (
                <>
                  <div className="my-3 border-t border-gray-200" />
                  <p className="px-4 pt-1 pb-2 text-xs font-semibold text-primary-500 uppercase tracking-wider truncate">
                    {selectedProperty.name}
                  </p>
                  {propertyNavItems.map(renderNavItem)}
                </>
              )}
            </>
          ) : (
            tenantNavItems.map(renderNavItem)
          )}
        </nav>

        <div className="flex-shrink-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors min-h-[48px]"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            {/* Notification bell */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                  <Link
                    to={`${basePath}/profile`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
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
