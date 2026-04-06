import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Star,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

type TabType = 'info' | 'attendance' | 'leave' | 'payroll' | 'reviews';

const TABS: { key: TabType; label: string; icon: any }[] = [
  { key: 'info', label: 'Info', icon: User },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'leave', label: 'Leave', icon: Calendar },
  { key: 'payroll', label: 'Payroll', icon: DollarSign },
  { key: 'reviews', label: 'Reviews', icon: Star },
];

const STATUS_OPTIONS = ['active', 'on_leave', 'suspended', 'terminated'];

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`),
    enabled: !!id,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => api.get(`/employees/${id}/attendance`),
    enabled: !!id && activeTab === 'attendance',
  });

  const { data: leaveData } = useQuery({
    queryKey: ['employee-leave', id],
    queryFn: () => api.get(`/employees/${id}/leave`),
    enabled: !!id && activeTab === 'leave',
  });

  const { data: payrollData } = useQuery({
    queryKey: ['employee-payroll', id],
    queryFn: () => api.get(`/employees/${id}/payroll`),
    enabled: !!id && activeTab === 'payroll',
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['employee-reviews', id],
    queryFn: () => api.get(`/employees/${id}/reviews`),
    enabled: !!id && activeTab === 'reviews',
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/employees/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee status updated successfully');
      setShowStatusDropdown(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const employee = data?.data?.data;
  const attendance = attendanceData?.data?.data?.attendance || [];
  const leaveRequests = leaveData?.data?.data?.requests || [];
  const leaveBalance = leaveData?.data?.data?.balance || {};
  const payrollHistory = payrollData?.data?.data?.payroll || [];
  const reviews = reviewsData?.data?.data?.reviews || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceStatusBadge = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      present: 'success',
      late: 'warning',
      absent: 'danger',
      half_day: 'warning',
      on_leave: 'info' as any,
    };
    return map[status] || 'default';
  };

  const getLeaveStatusBadge = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      approved: 'success',
      pending: 'warning',
      rejected: 'danger',
    };
    return map[status] || 'default';
  };

  const formatStatus = (status: string) =>
    status
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Employee not found</h3>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/owner/employees')}>
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/owner/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors self-start"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {employee.userId?.name}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                employee.status
              )}`}
            >
              {formatStatus(employee.status || 'active')}
            </span>
          </div>
          <p className="text-gray-600">
            {employee.position} - {employee.department}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/owner/employees/${id}/edit`)}
          >
            Edit
          </Button>
          {/* Status Change Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              Change Status
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                {STATUS_OPTIONS.filter((s) => s !== employee.status).map((status) => (
                  <button
                    key={status}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to change status to "${formatStatus(status)}"?`
                        )
                      ) {
                        statusMutation.mutate(status);
                      }
                    }}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        status
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Personal Info */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{employee.userId?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{employee.userId?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{employee.userId?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {employee.dateOfBirth
                      ? new Date(employee.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{employee.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">National ID</p>
                  <p className="font-medium">{employee.nationalId || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {employee.address
                      ? `${employee.address}, ${employee.city || ''}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Emergency Contact</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{employee.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Relationship</p>
                    <p className="font-medium">{employee.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Employment & Salary Details */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Employment Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium font-mono">
                    {employee.employeeId || employee._id?.slice(-6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{employee.position || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{employee.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="font-medium capitalize">
                    {employee.employmentType?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {employee.startDate
                      ? new Date(employee.startDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">Salary Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Base Salary</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {employee.salary?.baseSalary
                      ? `${employee.salary.baseSalary.toLocaleString()} ETB`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Frequency</p>
                  <p className="font-medium capitalize">
                    {employee.salary?.paymentFrequency || 'Monthly'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank</p>
                  <p className="font-medium">{employee.salary?.bankName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium font-mono">
                    {employee.salary?.accountNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Documents */}
            <Card>
              <h2 className="text-lg font-semibold mb-4">Documents</h2>
              {employee.documents && employee.documents.length > 0 ? (
                <div className="space-y-3">
                  {employee.documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                        </div>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Attendance History</h2>
          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check Out</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record: any) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {record.hoursWorked ? `${record.hoursWorked}h` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getAttendanceStatusBadge(record.status)}>
                          {formatStatus(record.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Leave Balance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Annual', value: leaveBalance.annual ?? '-', color: 'bg-blue-50 text-blue-700' },
              { label: 'Sick', value: leaveBalance.sick ?? '-', color: 'bg-green-50 text-green-700' },
              { label: 'Personal', value: leaveBalance.personal ?? '-', color: 'bg-purple-50 text-purple-700' },
              { label: 'Used', value: leaveBalance.used ?? '-', color: 'bg-gray-50 text-gray-700' },
            ].map((item) => (
              <Card key={item.label} className={item.color}>
                <p className="text-sm font-medium opacity-75">{item.label} Leave</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
                <p className="text-xs opacity-60 mt-1">days remaining</p>
              </Card>
            ))}
          </div>

          {/* Leave Requests */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Leave Requests</h2>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-4 text-gray-600">No leave requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">From</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">To</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Days</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((leave: any) => (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm capitalize">{leave.type}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(leave.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{leave.days}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getLeaveStatusBadge(leave.status)}>
                            {formatStatus(leave.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'payroll' && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Payroll History</h2>
          {payrollHistory.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Base Salary</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deductions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bonuses</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net Pay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollHistory.map((record: any) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">
                        {record.month}/{record.year}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.baseSalary?.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600">
                        -{record.deductions?.toLocaleString() || 0} ETB
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600">
                        +{record.bonuses?.toLocaleString() || 0} ETB
                      </td>
                      <td className="py-3 px-4 text-sm font-bold">
                        {record.netPay?.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={record.status === 'paid' ? 'success' : 'warning'}>
                          {formatStatus(record.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {record.paidAt
                          ? new Date(record.paidAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'reviews' && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Performance Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No performance reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{review.title || 'Performance Review'}</h3>
                      <p className="text-sm text-gray-500">
                        {review.period || new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm font-medium ml-1">{review.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {review.comments && (
                    <p className="text-sm text-gray-600">{review.comments}</p>
                  )}
                  {review.reviewer && (
                    <p className="text-xs text-gray-400 mt-2">
                      Reviewed by: {review.reviewer?.name || review.reviewer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
