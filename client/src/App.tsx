import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts (static imports - small, always needed)
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages (lazy)
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const AuthCallback = React.lazy(() => import('./pages/auth/AuthCallback'));

// Owner Pages (lazy)
const OwnerDashboard = React.lazy(() => import('./pages/owner/Dashboard'));
const Properties = React.lazy(() => import('./pages/owner/Properties'));
const PropertyDetail = React.lazy(() => import('./pages/owner/PropertyDetail'));
const Tenants = React.lazy(() => import('./pages/owner/Tenants'));
const TenantDetail = React.lazy(() => import('./pages/owner/TenantDetail'));
const Payments = React.lazy(() => import('./pages/owner/Payments'));
const PaymentSchedules = React.lazy(() => import('./pages/owner/PaymentSchedules'));
const WaitingList = React.lazy(() => import('./pages/owner/WaitingList'));
const OwnerMaintenance = React.lazy(() => import('./pages/owner/Maintenance'));
const OwnerSettings = React.lazy(() => import('./pages/owner/Settings'));

// Employee & HR Pages (lazy)
const Employees = React.lazy(() => import('./pages/owner/Employees'));
const EmployeeDetail = React.lazy(() => import('./pages/owner/EmployeeDetail'));
const EmployeeForm = React.lazy(() => import('./pages/owner/EmployeeForm'));

// Guard & Security Pages (lazy)
const GuardManagement = React.lazy(() => import('./pages/owner/GuardManagement'));
const AttendanceTracker = React.lazy(() => import('./pages/owner/AttendanceTracker'));
const Incidents = React.lazy(() => import('./pages/owner/Incidents'));
const IncidentDetail = React.lazy(() => import('./pages/owner/IncidentDetail'));

// Leave, Payroll, Performance Pages (lazy)
const LeaveManagement = React.lazy(() => import('./pages/owner/LeaveManagement'));
const Payroll = React.lazy(() => import('./pages/owner/Payroll'));
const PerformanceReviews = React.lazy(() => import('./pages/owner/PerformanceReviews'));

// Common Pages (lazy)
const NotificationsPage = React.lazy(() => import('./pages/common/NotificationsPage'));

// Tenant Pages (lazy)
const TenantDashboard = React.lazy(() => import('./pages/tenant/Dashboard'));
const TenantPayments = React.lazy(() => import('./pages/tenant/Payments'));
const TenantMaintenance = React.lazy(() => import('./pages/tenant/Maintenance'));
const MyIdentity = React.lazy(() => import('./pages/tenant/MyIdentity'));
const MyDocuments = React.lazy(() => import('./pages/tenant/MyDocuments'));
const MyLease = React.lazy(() => import('./pages/tenant/MyLease'));

// Lease Pages - Owner (lazy)
const LeaseList = React.lazy(() => import('./pages/owner/LeaseList'));

// Public Pages (lazy)
const Home = React.lazy(() => import('./pages/public/Home'));
const NotFound = React.lazy(() => import('./pages/public/NotFound'));
const Listings = React.lazy(() => import('./pages/public/Listings'));
const ListingDetail = React.lazy(() => import('./pages/public/ListingDetail'));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-stone-950 gap-5">
    {/* Branded logo mark */}
    <div className="animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-9 h-9 text-stone-950"
        >
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
          <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </svg>
      </div>
    </div>

    {/* Loading label */}
    <span className="text-stone-400 text-sm tracking-wide" style={{ fontFamily: '"Outfit", sans-serif' }}>
      Loading...
    </span>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
        </Route>

        {/* Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={user?.role === 'owner' ? '/owner' : '/tenant'} /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to={user?.role === 'owner' ? '/owner' : '/tenant'} /> : <Register />}
        />
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

          {/* Lease Management */}
          <Route path="leases" element={<LeaseList />} />

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
          <Route path="identity" element={<MyIdentity />} />
          <Route path="documents" element={<MyDocuments />} />
          <Route path="lease" element={<MyLease />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
