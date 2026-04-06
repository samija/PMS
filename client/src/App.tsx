import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import Properties from './pages/owner/Properties';
import PropertyDetail from './pages/owner/PropertyDetail';
import Tenants from './pages/owner/Tenants';
import TenantDetail from './pages/owner/TenantDetail';
import Payments from './pages/owner/Payments';
import PaymentSchedules from './pages/owner/PaymentSchedules';
import WaitingList from './pages/owner/WaitingList';
import OwnerMaintenance from './pages/owner/Maintenance';
import OwnerSettings from './pages/owner/Settings';

// Employee & HR Pages
import Employees from './pages/owner/Employees';
import EmployeeDetail from './pages/owner/EmployeeDetail';
import EmployeeForm from './pages/owner/EmployeeForm';

// Guard & Security Pages
import GuardManagement from './pages/owner/GuardManagement';
import AttendanceTracker from './pages/owner/AttendanceTracker';
import Incidents from './pages/owner/Incidents';
import IncidentDetail from './pages/owner/IncidentDetail';

// Leave, Payroll, Performance Pages
import LeaveManagement from './pages/owner/LeaveManagement';
import Payroll from './pages/owner/Payroll';
import PerformanceReviews from './pages/owner/PerformanceReviews';

// Common Pages
import NotificationsPage from './pages/common/NotificationsPage';

// Tenant Pages
import TenantDashboard from './pages/tenant/Dashboard';
import TenantPayments from './pages/tenant/Payments';
import TenantMaintenance from './pages/tenant/Maintenance';

// Public Pages
import Home from './pages/public/Home';
import Listings from './pages/public/Listings';
import ListingDetail from './pages/public/ListingDetail';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'owner' ? '/owner' : '/tenant'} /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={user?.role === 'owner' ? '/owner' : '/tenant'} /> : <Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OwnerDashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="schedules" element={<PaymentSchedules />} />
        <Route path="waitlist" element={<WaitingList />} />
        <Route path="maintenance" element={<OwnerMaintenance />} />
        <Route path="settings" element={<OwnerSettings />} />

        {/* Employee Management */}
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />

        {/* Guard & Security Management */}
        <Route path="properties/:id/guards" element={<GuardManagement />} />
        <Route path="properties/:id/attendance" element={<AttendanceTracker />} />
        <Route path="properties/:id/incidents" element={<Incidents />} />
        <Route path="properties/:id/incidents/:incidentId" element={<IncidentDetail />} />

        {/* Leave Management */}
        <Route path="leave" element={<LeaveManagement />} />

        {/* Payroll & Performance */}
        <Route path="properties/:id/payroll" element={<Payroll />} />
        <Route path="properties/:id/reviews" element={<PerformanceReviews />} />
      </Route>

      {/* Common Routes (accessible to all authenticated users) */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NotificationsPage />} />
      </Route>

      {/* Tenant Routes */}
      <Route
        path="/tenant"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TenantDashboard />} />
        <Route path="payments" element={<TenantPayments />} />
        <Route path="maintenance" element={<TenantMaintenance />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
