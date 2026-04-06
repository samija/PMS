import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingDown,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePropertyContext } from '../../hooks/usePropertyContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import api from '../../services/api';

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

function formatETB(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthName(month: number): string {
  const names = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month] || '';
}

export default function Payroll() {
  usePropertyContext();
  const { id: propertyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [paymentMethodDropdown, setPaymentMethodDropdown] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    status: '',
    page: 1,
  });
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const limit = 10;

  // Fetch payroll records
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payroll', propertyId, filters],
    queryFn: () =>
      api.get(`/properties/${propertyId}/payroll`, {
        params: {
          month: filters.month || undefined,
          year: filters.year || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit,
        },
      }),
    enabled: !!propertyId,
  });

  const payrolls = payrollData?.data?.data?.payrolls || payrollData?.data?.data || [];
  const pagination = payrollData?.data?.data?.pagination || {};
  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / limit) || 1;

  // Summary calculations
  const summary = {
    totalPayroll: payrolls.reduce((sum: number, p: any) => sum + (p.baseSalary || 0), 0),
    totalDeductions: payrolls.reduce((sum: number, p: any) => sum + (p.deductions || 0), 0),
    totalNetPay: payrolls.reduce((sum: number, p: any) => sum + (p.netPay || 0), 0),
    paidCount: payrolls.filter((p: any) => p.status === 'paid').length,
  };

  // Generate payroll mutation
  const generateMutation = useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      api.post(`/properties/${propertyId}/payroll/generate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', propertyId] });
      toast.success('Payroll generated successfully');
      setShowGenerateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    },
  });

  // Approve payroll mutation
  const approveMutation = useMutation({
    mutationFn: (payrollId: string) =>
      api.patch(`/properties/${propertyId}/payroll/${payrollId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', propertyId] });
      toast.success('Payroll approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve payroll');
    },
  });

  // Pay payroll mutation
  const payMutation = useMutation({
    mutationFn: ({ payrollId, paymentMethod }: { payrollId: string; paymentMethod: string }) =>
      api.patch(`/properties/${propertyId}/payroll/${payrollId}/pay`, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', propertyId] });
      toast.success('Payroll marked as paid');
      setPaymentMethodDropdown(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark payroll as paid');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate(generateForm);
  };

  const handleApprove = (payrollId: string) => {
    approveMutation.mutate(payrollId);
  };

  const handlePay = (payrollId: string) => {
    payMutation.mutate({ payrollId, paymentMethod: selectedPaymentMethod });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'approved':
        return <Badge variant="info">Approved</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: '', label: 'All Years' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];

  const generateYearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i + 1),
    label: String(currentYear - i + 1),
  }));

  const generateMonthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: getMonthName(i + 1),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-1">Manage employee payroll and payments</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-lg font-semibold text-gray-900">{formatETB(summary.totalPayroll)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="text-lg font-semibold text-gray-900">{formatETB(summary.totalDeductions)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Net Pay</p>
              <p className="text-lg font-semibold text-gray-900">{formatETB(summary.totalNetPay)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Count</p>
              <p className="text-lg font-semibold text-gray-900">{summary.paidCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Month"
              options={MONTHS}
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
            />
            <Select
              label="Year"
              options={yearOptions}
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            />
          </div>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading payroll data...</div>
          ) : payrolls.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payroll records found</p>
              <p className="text-sm text-gray-400 mt-1">Generate payroll to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonuses
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll: any) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payroll.employeeId?.userId?.name || payroll.employeeName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payroll.employeeId?.employeeId || payroll.employeeId?.department || ''}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {getMonthName(payroll.month)} {payroll.year}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-right">
                      {formatETB(payroll.baseSalary || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-red-600 text-right">
                      {formatETB(payroll.deductions || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600 text-right">
                      {formatETB(payroll.bonuses || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                      {formatETB(payroll.netPay || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 relative">
                        {payroll.status === 'draft' && (
                          <button
                            onClick={() => handleApprove(payroll._id)}
                            disabled={approveMutation.isPending}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {payroll.status === 'approved' && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setPaymentMethodDropdown(
                                  paymentMethodDropdown === payroll._id ? null : payroll._id
                                )
                              }
                              className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md font-medium transition-colors"
                            >
                              Mark as Paid
                            </button>
                            {paymentMethodDropdown === payroll._id && (
                              <div className="absolute right-0 top-full mt-1 z-10 bg-white rounded-lg shadow-lg border p-3 w-56">
                                <p className="text-xs font-medium text-gray-700 mb-2">
                                  Payment Method
                                </p>
                                <select
                                  className="w-full text-sm border rounded-md px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  value={selectedPaymentMethod}
                                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                >
                                  {PAYMENT_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                      {m.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handlePay(payroll._id)}
                                    disabled={payMutation.isPending}
                                    className="flex-1 text-xs bg-green-600 text-white px-2 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setPaymentMethodDropdown(null)}
                                    className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {payroll.status === 'paid' && (
                          <span className="text-xs text-gray-400">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Page {filters.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
                className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Payroll"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Month"
            options={generateMonthOptions}
            value={String(generateForm.month)}
            onChange={(e) => setGenerateForm({ ...generateForm, month: Number(e.target.value) })}
          />
          <Select
            label="Year"
            options={generateYearOptions}
            value={String(generateForm.year)}
            onChange={(e) => setGenerateForm({ ...generateForm, year: Number(e.target.value) })}
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              This will generate payroll records for all active employees for{' '}
              <strong>
                {getMonthName(generateForm.month)} {generateForm.year}
              </strong>
              .
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
