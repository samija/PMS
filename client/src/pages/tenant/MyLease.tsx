import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import EmptyState from '../../components/ui/EmptyState';
import SignLeaseDialog from '../../components/leases/SignLeaseDialog';
import { tenantAPI, leaseAPI } from '../../services/api';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'default',
  pending_owner_signature: 'warning',
  pending_tenant_signature: 'warning',
  active: 'success',
  expiring_soon: 'warning',
  expired: 'danger',
  renewed: 'info',
  terminated: 'danger',
};

export default function MyLease() {
  const [signDialogLeaseId, setSignDialogLeaseId] = useState<string | null>(null);

  const { data: tenancyData } = useQuery({
    queryKey: ['my-tenancy'],
    queryFn: () => tenantAPI.getMyTenancy(),
  });

  const tenantId = tenancyData?.data?.data?._id;

  const {
    data: leasesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['my-leases'],
    queryFn: () => leaseAPI.getAll(),
    enabled: !!tenantId,
  });

  const leases = leasesData?.data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Lease Agreements</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : isError ? (
        <ErrorDisplay message="Could not load lease agreements." onRetry={() => refetch()} />
      ) : leases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No lease agreements"
          description="Your property owner will create a lease agreement for you to review and sign."
        />
      ) : (
        leases.map((lease: any) => (
          <Card key={lease._id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Lease v{lease.version}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(lease.startDate).toLocaleDateString()} &mdash;{' '}
                  {new Date(lease.endDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_COLORS[lease.status] || 'default'}>{lease.status.replace(/_/g, ' ')}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Monthly Rent</span>
                <p className="font-medium">
                  {lease.monthlyRent?.toLocaleString()} {lease.currency}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Deposit</span>
                <p className="font-medium">
                  {lease.depositAmount?.toLocaleString()} {lease.currency}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Owner Signed</span>
                <p className="font-medium">{lease.ownerSignature ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-gray-500">Tenant Signed</span>
                <p className="font-medium">{lease.tenantSignature ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {lease.status === 'pending_tenant_signature' && (
                <Button size="sm" onClick={() => setSignDialogLeaseId(lease._id)}>
                  Sign Lease
                </Button>
              )}
              {lease.generatedPdfDocumentId && (
                <Button size="sm" variant="secondary">
                  <Download className="h-4 w-4 mr-1" /> Download PDF
                </Button>
              )}
            </div>
          </Card>
        ))
      )}

      {signDialogLeaseId && (
        <SignLeaseDialog
          leaseId={signDialogLeaseId}
          side="tenant"
          isOpen={!!signDialogLeaseId}
          onClose={() => setSignDialogLeaseId(null)}
        />
      )}
    </div>
  );
}
