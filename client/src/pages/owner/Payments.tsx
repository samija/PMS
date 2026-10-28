import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Download, Calendar, Clock, CheckCircle, XCircle, Eye, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { paymentAPI, tenantAPI } from '../../services/api';
import type { Payment, Tenant } from '../../types';

interface PaymentStat {
  _id: string;
  total: number;
  count: number;
}

interface CreateManualPaymentData {
  tenantId: string;
  amount: number;
  type: string;
  month: number;
  year: number;
}

export default function Payments() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_approval'>('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    month: '',
    year: new Date().getFullYear().toString(),
    page: 1,
  });

  const [formData, setFormData] = useState({
    tenantId: '',
    amount: 0,
    type: 'rent',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentAPI.getAll(filters),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['active-tenants'],
    queryFn: () => tenantAPI.getAll({ status: 'active', limit: 100 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['payment-stats', filters.year],
    queryFn: () => paymentAPI.getStats(Number(filters.year)),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => paymentAPI.getPendingApproval({ limit: 50 }),
  });

  const pendingPayments = pendingData?.data?.data?.payments || [];
  const pendingCount = pendingData?.data?.data?.pagination?.total || 0;

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => paymentAPI.approvePayment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      toast.success('Payment approved successfully');
      setShowApprovalModal(false);
      setSelectedPayment(null);
      setApprovalNotes('');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => paymentAPI.rejectPayment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      toast.success('Payment rejected');
      setShowApprovalModal(false);
      setSelectedPayment(null);
      setApprovalNotes('');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    },
  });

  const createManualMutation = useMutation({
    mutationFn: (data: CreateManualPaymentData) =>
      paymentAPI.createManual(data as Parameters<typeof paymentAPI.createManual>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      toast.success('Payment recorded successfully');
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const payments = data?.data?.data?.payments || [];
  const pagination = data?.data?.data?.pagination;
  const tenants = tenantsData?.data?.data?.tenants || [];
  const stats = statsData?.data?.data?.summary || [];

  const completedTotal = stats.find((s: PaymentStat) => s._id === 'completed')?.total || 0;
  const pendingTotal = stats.find((s: PaymentStat) => s._id === 'pending')?.total || 0;

  const resetForm = () => {
    setFormData({
      tenantId: '',
      amount: 0,
      type: 'rent',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createManualMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'info',
    };
    return variants[status] || 'default';
  };

  const paymentTypes = [
    { value: '', label: 'All Types' },
    { value: 'rent', label: 'Rent' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utility', label: 'Utility' },
    { value: 'penalty', label: 'Penalty' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  const months = [
    { value: '', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage tenant payments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Collected ({filters.year})</p>
              <p className="text-2xl font-bold text-green-600">{completedTotal.toLocaleString()} ETB</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTotal.toLocaleString()} ETB</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${pendingCount > 0 ? 'ring-2 ring-orange-300' : ''}`}
          onClick={() => setActiveTab('pending_approval')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Awaiting Approval</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Download className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'pending_approval'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approval
            {pendingCount > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'all' ? (
        <>
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4">
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-40"
              />
              <Select
                options={paymentTypes}
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                className="w-40"
              />
              <Select
                options={months}
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                className="w-40"
              />
              <Input
                type="number"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                className="w-32"
              />
            </div>
          </Card>

          {/* Payments Table */}
          <Card padding="none">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                    <div className="h-4 bg-gray-200 rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No payments found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tenant</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment: Payment) => (
                        <tr key={payment._id} className="border-t hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium">{payment.tenantId?.userId?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">Unit {payment.unitId?.unitNumber}</p>
                          </td>
                          <td className="py-3 px-4 capitalize">{payment.type}</td>
                          <td className="py-3 px-4">
                            {payment.month}/{payment.year}
                          </td>
                          <td className="py-3 px-4 font-medium">{payment.amount.toLocaleString()} ETB</td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}
                          </td>
                          <td className="py-3 px-4">
                            {payment.receipt?.number && (
                              <span className="text-sm text-primary-600">{payment.receipt.number}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                  {payments.map((payment: Payment) => (
                    <div key={payment._id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{payment.tenantId?.userId?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">Unit {payment.unitId?.unitNumber}</p>
                        </div>
                        <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 capitalize">{payment.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-1">
                            {payment.month}/{payment.year}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-1 font-medium">{payment.amount.toLocaleString()} ETB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-1">
                            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}
                          </span>
                        </div>
                      </div>
                      {payment.receipt?.number && (
                        <p className="text-sm">
                          <span className="text-gray-500">Receipt:</span>
                          <span className="ml-1 text-primary-600">{payment.receipt.number}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                disabled={filters.page === pagination.pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Pending Approval Tab */
        <Card padding="none">
          {pendingLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="mt-2 text-gray-600">No payments pending approval.</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingPayments.map((payment: Payment) => (
                <div key={payment._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">{payment.tenantId?.userId?.name || 'N/A'}</p>
                        <Badge variant="warning">Pending Approval</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Unit {payment.unitId?.unitNumber} • {payment.propertyId?.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600 capitalize">{payment.type}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {payment.month}/{payment.year}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="font-medium text-gray-900">{payment.amount.toLocaleString()} ETB</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.bankTransferReceipt && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowReceiptModal(true);
                          }}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          View Receipt
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowApprovalModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Manual Payment Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record Manual Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tenant"
            options={[
              { value: '', label: 'Select Tenant' },
              ...tenants.map((t: Tenant) => ({
                value: t._id,
                label: `${t.userId?.name} - Unit ${t.unitId?.unitNumber}`,
              })),
            ]}
            value={formData.tenantId}
            onChange={(e) => {
              const tenant = tenants.find((t: Tenant) => t._id === e.target.value);
              setFormData({
                ...formData,
                tenantId: e.target.value,
                amount: tenant?.leaseAgreement?.monthlyRent || 0,
              });
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Payment Type"
              options={paymentTypes.filter((t) => t.value)}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <Input
              label="Amount (ETB)"
              type="number"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Month"
              options={months.filter((m) => m.value)}
              value={formData.month.toString()}
              onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
            />
            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" loading={createManualMutation.isPending} className="w-full sm:w-auto">
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt View Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedPayment(null);
        }}
        title="Bank Transfer Receipt"
      >
        {selectedPayment?.bankTransferReceipt && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <img src={selectedPayment.bankTransferReceipt} alt="Bank transfer receipt" className="w-full h-auto" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={selectedPayment.bankTransferReceipt}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Open in new tab
              </a>
              <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedPayment(null);
          setApprovalNotes('');
        }}
        title="Review Bank Transfer"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Tenant</p>
                  <p className="font-medium">{selectedPayment.tenantId?.userId?.name || 'N/A'}</p>
                </div>
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Unit</p>
                  <p className="font-medium">{selectedPayment.unitId?.unitNumber}</p>
                </div>
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium">{selectedPayment.amount.toLocaleString()} ETB</p>
                </div>
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Period</p>
                  <p className="font-medium">
                    {selectedPayment.month}/{selectedPayment.year}
                  </p>
                </div>
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium capitalize">{selectedPayment.type}</p>
                </div>
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {selectedPayment.bankTransferReceipt && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Receipt</p>
                <div className="border rounded-lg overflow-hidden max-h-64">
                  <img
                    src={selectedPayment.bankTransferReceipt}
                    alt="Bank transfer receipt"
                    className="w-full h-auto object-contain cursor-pointer"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setShowReceiptModal(true);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Click image to view full size</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedPayment(null);
                  setApprovalNotes('');
                }}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => rejectMutation.mutate({ id: selectedPayment._id, notes: approvalNotes })}
                loading={rejectMutation.isPending}
                className="w-full sm:w-auto order-2"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ id: selectedPayment._id, notes: approvalNotes })}
                loading={approveMutation.isPending}
                className="w-full sm:w-auto order-1 sm:order-3"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
