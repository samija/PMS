import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Wrench,
  Calendar,
  Building,
  MapPin,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PaymentReminders from '../../components/payments/PaymentReminders';
import PaymentCalendar from '../../components/payments/PaymentCalendar';
import { tenantAPI, paymentAPI, maintenanceAPI } from '../../services/api';

export default function TenantDashboard() {
  const { data: tenancyData, isLoading: tenancyLoading } = useQuery({
    queryKey: ['my-tenancy'],
    queryFn: () => tenantAPI.getMyTenancy(),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentAPI.getAll({ limit: 5 }),
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['my-maintenance'],
    queryFn: () => maintenanceAPI.getAll({ limit: 5 }),
  });

  const tenancy = tenancyData?.data?.data;
  const payments = paymentsData?.data?.data?.payments || [];
  const maintenanceRequests = maintenanceData?.data?.data?.requests || [];

  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const activeMaintenanceRequests = maintenanceRequests.filter(
    (m: any) => m.status !== 'completed' && m.status !== 'cancelled'
  );

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return variants[status] || 'default';
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      submitted: 'info',
      acknowledged: 'warning',
      assigned: 'warning',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  if (tenancyLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-48 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="text-center py-12">
        <Home className="h-16 w-16 text-gray-400 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">No Active Tenancy</h2>
        <p className="mt-2 text-gray-600">
          You don't have an active tenancy. Browse listings to find your next home.
        </p>
        <Link to="/listings">
          <Button className="mt-4">Browse Listings</Button>
        </Link>
      </div>
    );
  }

  const leaseEndDate = new Date(tenancy.leaseAgreement.endDate);
  const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Home</h1>
        <p className="text-gray-600">Here's an overview of your tenancy.</p>
      </div>

      {/* Lease Expiry Warning */}
      {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Lease Expiring Soon</p>
              <p className="text-sm text-yellow-700">
                Your lease expires in {daysUntilExpiry} days ({leaseEndDate.toLocaleDateString()}).
                Contact your landlord to discuss renewal.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Property Info */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              {tenancy.propertyId?.images?.[0] ? (
                <img
                  src={tenancy.propertyId.images[0]}
                  alt={tenancy.propertyId.name}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Building className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {tenancy.propertyId?.name}
              </h2>
              <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1 text-sm sm:text-base">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{tenancy.propertyId?.address?.street}, {tenancy.propertyId?.address?.city}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Unit:</span>{' '}
                  <span className="font-medium">{tenancy.unitId?.unitNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Floor:</span>{' '}
                  <span className="font-medium">{tenancy.unitId?.floor}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className="font-medium capitalize">{tenancy.unitId?.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>{' '}
                  <span className="font-medium">{tenancy.unitId?.size} sqm</span>
                </div>
              </div>
            </div>
          </div>

          {tenancy.propertyId?.amenities?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {tenancy.propertyId.amenities.map((amenity: string) => (
                  <Badge key={amenity} variant="default">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Lease Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="text-2xl font-bold text-primary-600">
                {tenancy.leaseAgreement.monthlyRent.toLocaleString()} ETB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lease Period</p>
              <p className="font-medium">
                {new Date(tenancy.leaseAgreement.startDate).toLocaleDateString()} -{' '}
                {new Date(tenancy.leaseAgreement.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Landlord Contact</p>
              <p className="font-medium">{tenancy.ownerId?.name}</p>
              <p className="text-sm text-gray-600">{tenancy.ownerId?.email}</p>
              {tenancy.ownerId?.phone && (
                <p className="text-sm text-gray-600">{tenancy.ownerId.phone}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Link to="/tenant/payments">
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/tenant/maintenance">
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Requests</p>
                <p className="text-2xl font-bold text-blue-600">{activeMaintenanceRequests.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Payment Reminders & Calendar */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PaymentReminders
          limit={4}
          onPayNow={() => window.location.href = '/tenant/payments'}
        />
        <PaymentCalendar />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Payments</h3>
            <Link to="/tenant/payments" className="text-primary-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No payment history</p>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment: any) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{payment.type}</p>
                    <p className="text-sm text-gray-500">
                      {payment.month}/{payment.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{payment.amount.toLocaleString()} ETB</p>
                    <Badge variant={getPaymentStatusBadge(payment.status)} className="mt-1">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Maintenance */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Maintenance Requests</h3>
            <Link to="/tenant/maintenance" className="text-primary-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {maintenanceRequests.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No maintenance requests</p>
              <Link to="/tenant/maintenance">
                <Button variant="secondary" size="sm" className="mt-2">
                  Submit Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenanceRequests.slice(0, 5).map((request: any) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-gray-500 capitalize">{request.category}</p>
                  </div>
                  <Badge variant={getMaintenanceStatusBadge(request.status)}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
