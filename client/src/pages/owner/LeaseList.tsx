import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import EmptyState from '../../components/ui/EmptyState';
import SignLeaseDialog from '../../components/leases/SignLeaseDialog';
import { leaseAPI } from '../../services/api';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'default',
  pending_owner_signature: 'warning',
  pending_tenant_signature: 'info',
  active: 'success',
  expiring_soon: 'warning',
  expired: 'danger',
  renewed: 'info',
  terminated: 'danger',
};

export default function LeaseList() {
  const [signDialogLeaseId, setSignDialogLeaseId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leases'],
    queryFn: () => leaseAPI.getAll(),
  });

  const leases = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Lease Agreements</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> New Lease
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : isError ? (
        <ErrorDisplay message="Could not load lease agreements." onRetry={() => refetch()} />
      ) : leases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No lease agreements yet"
          description="Create a lease from a tenant's detail page to get started."
        />
      ) : (
        <div className="grid gap-4">
          {leases.map((lease: any) => (
            <Card key={lease._id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Lease v{lease.version}</h3>
                    <Badge variant={STATUS_COLORS[lease.status] || 'default'}>{lease.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(lease.startDate).toLocaleDateString()} &mdash;{' '}
                    {new Date(lease.endDate).toLocaleDateString()} | {lease.monthlyRent?.toLocaleString()}{' '}
                    {lease.currency}/mo
                  </p>
                </div>
                <div className="flex gap-2">
                  {lease.status === 'pending_owner_signature' && (
                    <Button size="sm" onClick={() => setSignDialogLeaseId(lease._id)}>
                      Sign as Owner
                    </Button>
                  )}
                  {lease.status === 'draft' && (
                    <Button size="sm" variant="secondary">
                      Edit Draft
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {signDialogLeaseId && (
        <SignLeaseDialog
          leaseId={signDialogLeaseId}
          side="owner"
          isOpen={!!signDialogLeaseId}
          onClose={() => setSignDialogLeaseId(null)}
        />
      )}
    </div>
  );
}
