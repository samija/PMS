import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, ExternalLink, Clock, CheckCircle, Upload, Building2, AlertCircle, Calendar, List } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import PaymentCalendar from '../../components/payments/PaymentCalendar';
import PaymentReminders from '../../components/payments/PaymentReminders';
import { paymentAPI, tenantAPI, settingsAPI } from '../../services/api';

export default function TenantPayments() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank_transfer'>('online');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [paymentForm, setPaymentForm] = useState({
    type: 'rent',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const { data: tenancyData } = useQuery({
    queryKey: ['my-tenancy'],
    queryFn: () => tenantAPI.getMyTenancy(),
  });

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentAPI.getAll({ limit: 50 }),
  });

  const tenancy = tenancyData?.data?.data;

  // Fetch owner's payment settings
  const { data: ownerPaymentInfoData } = useQuery({
    queryKey: ['owner-payment-info', tenancy?.ownerId?._id],
    queryFn: () => settingsAPI.getOwnerPaymentInfo(tenancy?.ownerId?._id),
    enabled: !!tenancy?.ownerId?._id,
  });

  const ownerPaymentInfo = ownerPaymentInfoData?.data?.data;

  const initPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentAPI.initialize(data),
    onSuccess: (response) => {
      const checkoutUrl = response.data.data.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Failed to get payment URL');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    },
  });

  const bankTransferMutation = useMutation({
    mutationFn: ({ data, file }: { data: any; file: File }) =>
      paymentAPI.submitBankTransfer(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      toast.success('Bank transfer submitted for approval');
      setShowPayModal(false);
      setReceiptFile(null);
      setPaymentMethod('online');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit bank transfer');
    },
  });

  const payments = paymentsData?.data?.data?.payments || [];

  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const completedPayments = payments.filter((p: any) => p.status === 'completed');

  const totalPaid = completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'info',
    };
    return variants[status] || 'default';
  };

  const getApprovalStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return variants[status] || 'default';
  };

  const getApprovalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  };

  const handlePayNow = () => {
    if (!tenancy) return;

    if (paymentMethod === 'bank_transfer') {
      if (!receiptFile) {
        toast.error('Please upload the bank transfer receipt');
        return;
      }
      bankTransferMutation.mutate({
        data: {
          tenantId: tenancy._id,
          amount: paymentForm.amount,
          type: paymentForm.type,
          month: paymentForm.month,
          year: paymentForm.year,
        },
        file: receiptFile,
      });
    } else {
      initPaymentMutation.mutate({
        tenantId: tenancy._id,
        amount: paymentForm.amount,
        type: paymentForm.type,
        month: paymentForm.month,
        year: paymentForm.year,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setReceiptFile(file);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
  }));

  const paymentTypes = [
    { value: 'rent', label: 'Rent' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'utility', label: 'Utility' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-sm sm:text-base text-gray-600">View and make payments</p>
          </div>
          <Button
            onClick={() => {
              if (tenancy) {
                setPaymentForm({
                  ...paymentForm,
                  amount: tenancy.leaseAgreement.monthlyRent,
                });
                setShowPayModal(true);
              }
            }}
            disabled={!tenancy}
            className="w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              viewMode === 'calendar'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Calendar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenancy?.leaseAgreement.monthlyRent.toLocaleString() || '---'} ETB
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {totalPaid.toLocaleString()} ETB
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Reminders */}
      <PaymentReminders
        limit={3}
        onPayNow={() => {
          if (tenancy) {
            setPaymentForm({
              ...paymentForm,
              amount: tenancy.leaseAgreement.monthlyRent,
            });
            setShowPayModal(true);
          }
        }}
      />

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <PaymentCalendar />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Pending Payments</h2>
          <div className="space-y-4">
            {pendingPayments.map((payment: any) => (
              <div
                key={payment._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 gap-3"
              >
                <div>
                  <p className="font-medium capitalize">{payment.type} Payment</p>
                  <p className="text-sm text-gray-600">
                    {payment.month}/{payment.year} | Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <p className="text-lg font-bold">{payment.amount.toLocaleString()} ETB</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      initPaymentMutation.mutate({
                        tenantId: tenancy?._id,
                        amount: payment.amount,
                        type: payment.type,
                        month: payment.month,
                        year: payment.year,
                      });
                    }}
                    loading={initPaymentMutation.isPending}
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card padding="none">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No payment history</h3>
            <p className="mt-2 text-gray-600">Your payments will appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment._id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 capitalize">{payment.type}</td>
                      <td className="py-3 px-4">
                        {payment.month}/{payment.year}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {payment.amount.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                          {payment.paymentMethod === 'bank_transfer' && payment.bankTransferApprovalStatus && (
                            <Badge variant={getApprovalStatusBadge(payment.bankTransferApprovalStatus)}>
                              {getApprovalStatusLabel(payment.bankTransferApprovalStatus)}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : 'Pending'}
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
              {payments.map((payment: any) => (
                <div key={payment._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="font-medium capitalize">{payment.type}</p>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      {payment.paymentMethod === 'bank_transfer' && payment.bankTransferApprovalStatus && (
                        <Badge variant={getApprovalStatusBadge(payment.bankTransferApprovalStatus)}>
                          {getApprovalStatusLabel(payment.bankTransferApprovalStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Period:</span>
                      <span className="ml-1">{payment.month}/{payment.year}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-1 font-medium">{payment.amount.toLocaleString()} ETB</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-1">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}</span>
                    </div>
                    {payment.receipt?.number && (
                      <div>
                        <span className="text-gray-500">Receipt:</span>
                        <span className="ml-1 text-primary-600">{payment.receipt.number}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
        </>
      )}

      {/* Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setPaymentMethod('online');
          setReceiptFile(null);
        }}
        title="Make Payment"
      >
        <div className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  paymentMethod === 'online'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                <span className="font-medium block">Online Payment</span>
                <span className="text-xs text-gray-500">Pay via Chapa</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5 mb-1" />
                <span className="font-medium block">Bank Transfer</span>
                <span className="text-xs text-gray-500">Upload receipt</span>
              </button>
            </div>
          </div>

          <Select
            label="Payment Type"
            options={paymentTypes}
            value={paymentForm.type}
            onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Month"
              options={months}
              value={paymentForm.month.toString()}
              onChange={(e) => setPaymentForm({ ...paymentForm, month: Number(e.target.value) })}
            />
            <Input
              label="Year"
              type="number"
              value={paymentForm.year}
              onChange={(e) => setPaymentForm({ ...paymentForm, year: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Amount (ETB)"
            type="number"
            value={paymentForm.amount || ''}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
          />

          {paymentMethod === 'online' ? (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              You will be redirected to Chapa to complete the payment securely.
            </div>
          ) : (
            <>
              {/* Bank Details */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Bank Transfer Details</h4>
                {ownerPaymentInfo?.bankDetails ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Bank:</span> {ownerPaymentInfo.bankDetails.bankName}</p>
                    <p><span className="text-gray-500">Account Name:</span> {ownerPaymentInfo.bankDetails.accountHolderName}</p>
                    <p><span className="text-gray-500">Account Number:</span> {ownerPaymentInfo.bankDetails.accountNumber}</p>
                    {ownerPaymentInfo.paymentInstructions && (
                      <p className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-500">Instructions:</span>{' '}
                        <span className="text-gray-700">{ownerPaymentInfo.paymentInstructions}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>Contact your landlord for bank transfer details.</p>
                    {tenancy?.ownerId?.email && (
                      <p className="mt-1">Email: {tenancy.ownerId.email}</p>
                    )}
                    {tenancy?.ownerId?.phone && (
                      <p>Phone: {tenancy.ownerId.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Receipt *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                >
                  {receiptFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-gray-700">{receiptFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload receipt</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or PDF (max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your payment will be reviewed and approved by the property owner.</span>
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPayModal(false);
                setPaymentMethod('online');
                setReceiptFile(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayNow}
              loading={initPaymentMutation.isPending || bankTransferMutation.isPending}
              disabled={!paymentForm.amount || (paymentMethod === 'bank_transfer' && !receiptFile)}
              className="w-full sm:w-auto"
            >
              {paymentMethod === 'online' ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pay with Chapa
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
