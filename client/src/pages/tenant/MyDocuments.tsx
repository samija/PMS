import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Upload, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorDisplay from '../../components/ui/ErrorDisplay';
import EmptyState from '../../components/ui/EmptyState';
import { tenantAPI, documentV2API } from '../../services/api';

const DOC_TYPE_LABELS: Record<string, string> = {
  agreement: 'Lease Agreement',
  national_id: 'National ID',
  passport: 'Passport',
  proof_of_address: 'Proof of Address',
  proof_of_income: 'Proof of Income',
  guarantor_id: 'Guarantor ID',
  selfie: 'Selfie',
  power_of_attorney: 'Power of Attorney',
  business_registration: 'Business Registration',
  other: 'Other',
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: typeof CheckCircle }
> = {
  pending: { label: 'Pending Review', variant: 'warning', icon: Clock },
  pending_scan: { label: 'Scanning', variant: 'info', icon: Clock },
  in_review: { label: 'In Review', variant: 'info', icon: Eye },
  verified: { label: 'Verified', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  expired: { label: 'Expired', variant: 'danger', icon: XCircle },
  scan_failed: { label: 'Scan Failed', variant: 'danger', icon: XCircle },
};

const UPLOAD_TYPES = [
  'national_id',
  'passport',
  'proof_of_address',
  'proof_of_income',
  'guarantor_id',
  'selfie',
  'business_registration',
  'other',
];

export default function MyDocuments() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState('national_id');
  const [uploadName, setUploadName] = useState('');

  const { data: tenancyData } = useQuery({
    queryKey: ['my-tenancy'],
    queryFn: () => tenantAPI.getMyTenancy(),
  });

  const tenantId = tenancyData?.data?.data?._id;

  const {
    data: docsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['my-documents-v2', tenantId],
    queryFn: () => documentV2API.list(tenantId!),
    enabled: !!tenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentV2API.upload(tenantId!, file, { type: uploadType, name: uploadName || file.name }),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['my-documents-v2', tenantId] });
      setShowUpload(false);
      setUploadName('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const docs = docsData?.data?.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      {showUpload && (
        <Card>
          <h3 className="font-semibold mb-3">Upload Document</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                {UPLOAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. My National ID"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                onChange={handleFileSelect}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Accepted: PDF, JPEG, PNG, WebP, HEIC. Max 10 MB.</p>
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : isError ? (
        <ErrorDisplay message="Could not load documents." onRetry={() => refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents uploaded"
          description="Upload your identity documents to complete verification."
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-1" /> Upload First Document
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {docs.map((doc: any) => {
            const statusCfg = STATUS_CONFIG[doc.verificationStatus] || STATUS_CONFIG.pending;
            return (
              <Card key={doc._id} className="hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {DOC_TYPE_LABELS[doc.type] || doc.type} &middot; v{doc.version} &middot;{' '}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                        {doc.expiryDate && <> &middot; Expires: {new Date(doc.expiryDate).toLocaleDateString()}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                </div>
                {doc.rejectionReasonText && doc.verificationStatus === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2 ml-13">Reason: {doc.rejectionReasonText}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
