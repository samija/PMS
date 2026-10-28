import Badge from '../ui/Badge';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> =
  {
    not_started: { label: 'Not Started', variant: 'default' },
    pending: { label: 'Pending', variant: 'warning' },
    in_review: { label: 'In Review', variant: 'info' },
    verified: { label: 'Verified', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    expired: { label: 'Expired', variant: 'danger' },
    requires_resubmission: { label: 'Resubmit', variant: 'warning' },
  };

export default function VerificationStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
