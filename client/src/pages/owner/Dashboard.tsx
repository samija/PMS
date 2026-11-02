import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building, Users, CreditCard, Wrench, BarChart3, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { StatCard, PropertyHealthGrid, ActivityFeed, QuickActions } from '../../components/dashboard';
import { RevenueChart, OccupancyChart, MaintenanceOverview, TenantSummary } from '../../components/analytics';
import { propertyAPI, tenantAPI, paymentAPI, maintenanceAPI } from '../../services/api';

type DashboardView = 'overview' | 'analytics';

export default function OwnerDashboard() {
  const [view, setView] = useState<DashboardView>('overview');
  const { user } = useAuthStore();

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantAPI.getAll({ limit: 5, status: 'active' }),
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceAPI.getAll({ limit: 100 }),
  });

  const { data: paymentStats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentAPI.getStats(),
  });

  const properties = propertiesData?.data?.data?.properties || [];
  const maintenanceRequests = maintenanceData?.data?.data?.requests || [];
  const stats = paymentStats?.data?.data?.summary || [];

  const completedPayments = stats.find((s: { _id: string; total: number }) => s._id === 'completed');
  const totalProperties = propertiesData?.data?.data?.pagination?.total || 0;
  const totalTenants = tenantsData?.data?.data?.pagination?.total || 0;
  const pendingRequests = maintenanceRequests.filter(
    (m: { status: string }) => m.status !== 'completed' && m.status !== 'cancelled'
  ).length;

  const totalUnits = properties.reduce((sum: number, p: any) => sum + (p.totalUnits || 0), 0);
  const occupiedUnits = properties.reduce((sum: number, p: any) => sum + (p.occupiedUnits || 0), 0);

  const statCards = [
    {
      title: 'Total Properties',
      value: totalProperties,
      icon: Building,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/owner/properties',
      progress: { current: totalProperties, max: Math.max(totalProperties, 1) },
    },
    {
      title: 'Active Tenants',
      value: totalTenants,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/owner/tenants',
      progress: totalUnits > 0 ? { current: occupiedUnits, max: totalUnits } : undefined,
    },
    {
      title: 'Revenue (This Year)',
      value: `${(completedPayments?.total || 0).toLocaleString()} ETB`,
      icon: CreditCard,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      link: '/owner/payments',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: Wrench,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      link: '/owner/maintenance',
      progress:
        maintenanceRequests.length > 0
          ? { current: maintenanceRequests.length - pendingRequests, max: maintenanceRequests.length }
          : undefined,
    },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Subtle geometric pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-amber-400"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-stone-400 mt-1">Here's what's happening across your properties today.</p>
          </div>
          <QuickActions />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <div className="flex items-center bg-stone-200/60 rounded-lg p-1">
          <button
            onClick={() => setView('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'overview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'analytics' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {view === 'analytics' ? (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <RevenueChart />
            <OccupancyChart />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <MaintenanceOverview />
            <TenantSummary />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Property Health + Activity Feed */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PropertyHealthGrid />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed />
            </div>
          </div>

          {/* Charts below the fold */}
          <div className="grid lg:grid-cols-2 gap-6">
            <RevenueChart />
            <OccupancyChart />
          </div>
        </div>
      )}
    </div>
  );
}
