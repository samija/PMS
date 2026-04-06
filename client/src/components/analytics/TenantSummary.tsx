import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Calendar,
  ArrowRight,
  Building
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { tenantAPI } from '../../services/api';

interface Tenant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  propertyId: {
    _id: string;
    name: string;
  };
  unitId: {
    _id: string;
    unitNumber: string;
  };
  leaseAgreement: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
  };
  status: 'active' | 'pending' | 'terminated';
  createdAt: string;
}

interface TenantSummaryProps {
  className?: string;
}

export default function TenantSummary({ className = '' }: TenantSummaryProps) {
  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['tenants', 'active'],
    queryFn: () => tenantAPI.getAll({ status: 'active', limit: 100 }),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['tenants', 'pending'],
    queryFn: () => tenantAPI.getAll({ status: 'pending', limit: 10 }),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['tenants', 'recent'],
    queryFn: () => tenantAPI.getAll({ limit: 5 }),
  });

  const activeTenants: Tenant[] = activeData?.data?.data?.tenants || [];
  const recentTenants: Tenant[] = recentData?.data?.data?.tenants || [];

  const totalActive = activeData?.data?.data?.pagination?.total || 0;
  const totalPending = pendingData?.data?.data?.pagination?.total || 0;

  const isLoading = activeLoading || pendingLoading || recentLoading;

  // Calculate tenants with expiring leases (within 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringLeases = activeTenants.filter((tenant) => {
    const endDate = new Date(tenant.leaseAgreement?.endDate);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  });

  // Calculate total monthly rent
  const totalMonthlyRent = activeTenants.reduce(
    (sum, tenant) => sum + (tenant.leaseAgreement?.monthlyRent || 0),
    0
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Days until lease expiry
  const daysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tenant Summary</h3>
            <p className="text-sm text-gray-500">Overview of your tenants</p>
          </div>
        </div>
        <Link
          to="/owner/tenants"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600">{totalActive}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <UserPlus className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-yellow-600">{totalPending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-xl font-bold text-orange-600">{expiringLeases.length}</p>
              <p className="text-xs text-gray-500">Expiring Soon</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-purple-600">
                {(totalMonthlyRent / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500">Monthly Rent</p>
            </div>
          </div>

          {/* Expiring Leases Alert */}
          {expiringLeases.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <p className="font-medium text-orange-800">Leases Expiring Soon</p>
              </div>
              <div className="space-y-2">
                {expiringLeases.slice(0, 3).map((tenant) => {
                  const days = daysUntilExpiry(tenant.leaseAgreement.endDate);
                  return (
                    <Link
                      key={tenant._id}
                      to={`/owner/tenants/${tenant._id}`}
                      className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-orange-700">
                            {getInitials(tenant.userId?.name || 'T')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tenant.userId?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Unit {tenant.unitId?.unitNumber}
                          </p>
                        </div>
                      </div>
                      <Badge variant="warning">
                        {days} days left
                      </Badge>
                    </Link>
                  );
                })}
                {expiringLeases.length > 3 && (
                  <p className="text-xs text-orange-600 text-center pt-1">
                    +{expiringLeases.length - 3} more expiring
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Tenants */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Recent Tenants</p>
            {recentTenants.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tenants yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTenants.map((tenant) => (
                  <Link
                    key={tenant._id}
                    to={`/owner/tenants/${tenant._id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {getInitials(tenant.userId?.name || 'T')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tenant.userId?.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{tenant.propertyId?.name}</span>
                          <span className="text-gray-300">|</span>
                          <span>Unit {tenant.unitId?.unitNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tenant.status === 'active' ? 'success' :
                          tenant.status === 'pending' ? 'warning' : 'danger'
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info Footer */}
          {totalActive > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                {totalActive} active tenant{totalActive !== 1 ? 's' : ''} generating{' '}
                <span className="font-medium text-gray-700">
                  {totalMonthlyRent.toLocaleString()} ETB
                </span>{' '}
                in monthly rent
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
