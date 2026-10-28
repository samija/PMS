import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import IdentityForm from '../../components/identity/IdentityForm';
import VerificationStatusBadge from '../../components/identity/VerificationStatusBadge';
import { identityAPI, tenantAPI } from '../../services/api';

export default function MyIdentity() {
  const {
    data: tenancyData,
    isLoading: tenancyLoading,
    isError: tenancyError,
    refetch: refetchTenancy,
  } = useQuery({
    queryKey: ['my-tenancy'],
    queryFn: () => tenantAPI.getMyTenancy(),
  });

  const tenantId = tenancyData?.data?.data?._id;

  const {
    data: identityData,
    isLoading: identityLoading,
    isError: identityError,
    refetch: refetchIdentity,
  } = useQuery({
    queryKey: ['tenant-identity', tenantId],
    queryFn: () => identityAPI.get(tenantId!),
    enabled: !!tenantId,
  });

  if (tenancyLoading || identityLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (tenancyError) {
    return <ErrorDisplay message="Could not load your tenancy information." onRetry={() => refetchTenancy()} />;
  }

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No active tenancy found. Contact your property owner.</p>
      </div>
    );
  }

  if (identityError) {
    return <ErrorDisplay message="Could not load your identity profile." onRetry={() => refetchIdentity()} />;
  }

  const identity = identityData?.data?.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Identity Profile</h1>
        </div>
        <VerificationStatusBadge status={identity?.verification?.status || 'not_started'} />
      </div>

      {identity?.verification?.status === 'rejected' && identity?.verification?.reasonText && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-700">
            <strong>Rejection reason:</strong> {identity.verification.reasonText}
          </p>
        </Card>
      )}

      {identity?.verification?.status === 'requires_resubmission' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-700">
            <strong>Action needed:</strong> Your identity profile was modified after verification. Please review and
            resubmit.
          </p>
        </Card>
      )}

      <IdentityForm tenantId={tenantId} initialData={identity?.profile || {}} />
    </div>
  );
}
