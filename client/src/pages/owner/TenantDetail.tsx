import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { tenantAPI, paymentAPI } from '../../services/api';
import { DocumentUpload, DocumentList, DocumentViewer, Document, DocumentType } from '../../components/documents';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantAPI.getOne(id!),
    enabled: !!id,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['tenant-payments', id],
    queryFn: () => paymentAPI.getAll({ tenantId: id, limit: 12 }),
    enabled: !!id,
  });

  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['tenant-documents', id],
    queryFn: () => tenantAPI.getDocuments(id!),
    enabled: !!id,
  });

  const handleUploadDocument = async (file: File, type: DocumentType, name: string) => {
    setIsUploadingDoc(true);
    try {
      await tenantAPI.uploadDocument(id!, file, type, name);
      queryClient.invalidateQueries({ queryKey: ['tenant-documents', id] });
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
      throw error;
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setDeletingDocId(documentId);
    try {
      await tenantAPI.deleteDocument(id!, documentId);
      queryClient.invalidateQueries({ queryKey: ['tenant-documents', id] });
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const terminateMutation = useMutation({
    mutationFn: () => tenantAPI.terminate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant terminated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to terminate tenant');
    },
  });

  const tenant = data?.data?.data;
  const payments = paymentsData?.data?.data?.payments || [];
  const documents: Document[] = documentsData?.data?.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      pending: 'warning',
      terminated: 'danger',
    };
    return variants[status] || 'default';
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Tenant not found</h3>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/owner/tenants')}>
          Back to Tenants
        </Button>
      </div>
    );
  }

  const leaseEndDate = new Date(tenant.leaseAgreement.endDate);
  const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/owner/tenants')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tenant.userId?.name}</h1>
            <Badge variant={getStatusBadge(tenant.status)}>{tenant.status}</Badge>
          </div>
          <p className="text-gray-600">{tenant.userId?.email}</p>
        </div>
        {tenant.status === 'active' && (
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Are you sure you want to terminate this tenant?')) {
                terminateMutation.mutate();
              }
            }}
            loading={terminateMutation.isPending}
          >
            Terminate Lease
          </Button>
        )}
      </div>

      {/* Lease Expiry Warning */}
      {tenant.status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Lease Expiring Soon</p>
              <p className="text-sm text-yellow-700">
                This lease expires in {daysUntilExpiry} days ({leaseEndDate.toLocaleDateString()})
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tenant Info */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Tenant Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{tenant.userId?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{tenant.userId?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{tenant.userId?.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Property & Unit</p>
                <p className="font-medium">
                  {tenant.propertyId?.name} - Unit {tenant.unitId?.unitNumber}
                </p>
              </div>
            </div>
          </div>

          {tenant.emergencyContact && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Emergency Contact</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{tenant.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{tenant.emergencyContact.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Relationship</p>
                  <p className="font-medium">{tenant.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Lease Details */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Lease Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="text-2xl font-bold text-primary-600">
                {tenant.leaseAgreement.monthlyRent.toLocaleString()} ETB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Security Deposit</p>
              <p className="font-medium">{tenant.leaseAgreement.deposit.toLocaleString()} ETB</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lease Period</p>
              <p className="font-medium">
                {new Date(tenant.leaseAgreement.startDate).toLocaleDateString()} -{' '}
                {new Date(tenant.leaseAgreement.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit Details</p>
              <p className="font-medium">
                Floor {tenant.unitId?.floor} | {tenant.unitId?.type} | {tenant.unitId?.size} sqm
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 capitalize">{payment.type}</td>
                    <td className="py-3 px-4">
                      {payment.month}/{payment.year}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {payment.amount.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getPaymentStatusBadge(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Documents */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {documentsLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onView={setViewingDocument}
            onDelete={handleDeleteDocument}
            isDeleting={!!deletingDocId}
            deletingId={deletingDocId}
          />
        )}
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <DocumentUpload
          onUpload={handleUploadDocument}
          isUploading={isUploadingDoc}
        />
      </Modal>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          url={viewingDocument.url}
          name={viewingDocument.name}
        />
      )}
    </div>
  );
}
