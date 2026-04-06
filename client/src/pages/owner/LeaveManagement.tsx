import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import api from '../../services/api';

interface LeaveRequest {
  _id: string;
  employee: { _id: string; name: string } | string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

const LEAVE_TYPE_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  annual: 'info',
  sick: 'danger',
  personal: 'warning',
  maternity: 'success',
  paternity: 'success',
  unpaid: 'default',
  bereavement: 'default',
  other: 'default',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LeaveManagement() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'requests' | 'calendar'>('requests');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Calendar state
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests', filters.status],
    queryFn: () =>
      api.get('/leave/requests', {
        params: { ...(filters.status && { status: filters.status }) },
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leave/requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request approved');
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/leave/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });

  const requests: LeaveRequest[] = data?.data?.data?.requests || data?.data?.data || [];

  const getEmployeeName = (employee: LeaveRequest['employee']) => {
    if (typeof employee === 'object' && employee !== null) return employee.name;
    return employee || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Filter requests client-side for search
  const filteredRequests = useMemo(() => {
    if (!filters.search) return requests;
    const term = filters.search.toLowerCase();
    return requests.filter((r) => {
      const name = getEmployeeName(r.employee).toLowerCase();
      return name.includes(term);
    });
  }, [requests, filters.search]);

  // Approved leaves for calendar view
  const approvedLeavesForMonth = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== 'approved') return false;
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const monthStart = new Date(calendarYear, calendarMonth, 1);
      const monthEnd = new Date(calendarYear, calendarMonth + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });
  }, [requests, calendarMonth, calendarYear]);

  const handleReject = (id: string) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (!selectedRequestId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ id: selectedRequestId, reason: rejectionReason });
  };

  const navigateMonth = (direction: number) => {
    let newMonth = calendarMonth + direction;
    let newYear = calendarYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const tabs = [
    { id: 'requests' as const, label: 'Requests', icon: ClipboardList },
    { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500 mt-1">Manage employee leave requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Employee
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name..."
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] text-base sm:text-sm"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No leave requests</h3>
              <p className="text-gray-500">No leave requests match the current filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {getEmployeeName(request.employee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={LEAVE_TYPE_BADGE[request.leaveType] || 'default'}>
                            {formatType(request.leaveType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(request.startDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(request.endDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {request.days}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                          {request.reason || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={STATUS_BADGE[request.status] || 'default'}>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {request.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => approveMutation.mutate(request._id)}
                                disabled={approveMutation.isPending}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReject(request._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {MONTHS[calendarMonth]} {calendarYear}
              </h2>
              <Button variant="secondary" size="sm" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Approved Leaves List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : approvedLeavesForMonth.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No approved leaves</h3>
              <p className="text-gray-500">
                No approved leaves for {MONTHS[calendarMonth]} {calendarYear}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedLeavesForMonth.map((leave) => (
                <div
                  key={leave._id}
                  className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getEmployeeName(leave.employee)}
                      </p>
                      <Badge variant={LEAVE_TYPE_BADGE[leave.leaveType] || 'default'}>
                        {formatType(leave.leaveType)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 sm:text-right">
                    <div>
                      <p className="text-xs text-gray-400">Dates</p>
                      <p>
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Days</p>
                      <p className="font-medium">{leave.days}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedRequestId(null);
        }}
        title="Reject Leave Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this leave request.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              rows={4}
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              onClick={submitRejection}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
