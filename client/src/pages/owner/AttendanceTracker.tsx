import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, LogIn, LogOut, Download, Users, Calendar } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import type { AttendanceRecord, AttendanceStatus } from '../../types';
import { usePropertyContext } from '../../hooks/usePropertyContext';

const STATUS_COLORS: Record<AttendanceStatus, { variant: 'success' | 'danger' | 'warning' | 'default' | 'info'; label: string }> = {
  present: { variant: 'success', label: 'Present' },
  absent: { variant: 'danger', label: 'Absent' },
  late: { variant: 'warning', label: 'Late' },
  half_day: { variant: 'default', label: 'Half Day' },
  on_leave: { variant: 'info', label: 'On Leave' },
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
}));

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - 2 + i),
  label: String(currentYear - 2 + i),
}));

export default function AttendanceTracker() {
  usePropertyContext();
  const { id: propertyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Daily attendance state
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [employeeId, setEmployeeId] = useState('');

  // Monthly report state
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(currentYear));

  // Fetch daily attendance
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', propertyId, selectedDate],
    queryFn: () => api.get(`/properties/${propertyId}/attendance`, { params: { date: selectedDate } }),
    enabled: !!propertyId,
  });

  // Fetch monthly report
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['attendance-report', propertyId, reportMonth, reportYear],
    queryFn: () =>
      api.get(`/properties/${propertyId}/attendance/report`, {
        params: { month: reportMonth, year: reportYear },
      }),
    enabled: !!propertyId,
  });

  const attendance: AttendanceRecord[] =
    attendanceData?.data?.data?.records || attendanceData?.data?.data || [];
  const report = reportData?.data?.data?.report || reportData?.data?.data || [];

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (empId: string) =>
      api.post(`/properties/${propertyId}/attendance/check-in`, {
        employeeId: empId,
        date: selectedDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', propertyId, selectedDate] });
      setEmployeeId('');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (empId: string) =>
      api.patch(`/properties/${propertyId}/attendance/check-out`, {
        employeeId: empId,
        date: selectedDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', propertyId, selectedDate] });
      setEmployeeId('');
    },
  });

  const handleCheckIn = () => {
    if (!employeeId.trim()) return;
    checkInMutation.mutate(employeeId.trim());
  };

  const handleCheckOut = () => {
    if (!employeeId.trim()) return;
    checkOutMutation.mutate(employeeId.trim());
  };

  const handleDownloadReport = () => {
    // Placeholder for report download functionality
    alert(`Download report for ${MONTH_OPTIONS[Number(reportMonth) - 1]?.label} ${reportYear} - feature coming soon.`);
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const formatHours = (hours?: number): string => {
    if (hours === undefined || hours === null) return '--';
    return `${hours.toFixed(1)}h`;
  };

  const getEmployeeName = (employee: any): string => {
    if (!employee) return 'Unknown';
    if (typeof employee === 'string') return employee;
    return employee.name || employee.userId?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
        <p className="text-gray-500 mt-1">Track employee check-ins, check-outs, and generate reports</p>
      </div>

      {/* Check-in/Check-out Section */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <Input
            label="Date"
            id="attendanceDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-48"
          />
          <Input
            label="Employee ID"
            id="employeeId"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            className="w-full sm:w-64"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCheckIn}
              loading={checkInMutation.isPending}
              disabled={!employeeId.trim()}
              className="flex-1 sm:flex-initial"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Check In
            </Button>
            <Button
              variant="secondary"
              onClick={handleCheckOut}
              loading={checkOutMutation.isPending}
              disabled={!employeeId.trim()}
              className="flex-1 sm:flex-initial"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          </div>
        </div>

        {/* Error messages */}
        {checkInMutation.isError && (
          <p className="mt-3 text-sm text-red-600">
            Check-in failed: {(checkInMutation.error as any)?.response?.data?.message || 'An error occurred'}
          </p>
        )}
        {checkOutMutation.isError && (
          <p className="mt-3 text-sm text-red-600">
            Check-out failed: {(checkOutMutation.error as any)?.response?.data?.message || 'An error occurred'}
          </p>
        )}
        {checkInMutation.isSuccess && (
          <p className="mt-3 text-sm text-green-600">Employee checked in successfully.</p>
        )}
        {checkOutMutation.isSuccess && (
          <p className="mt-3 text-sm text-green-600">Employee checked out successfully.</p>
        )}
      </Card>

      {/* Daily Attendance Table */}
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Daily Attendance — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
          </div>
        </div>

        {attendanceLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
            <p className="text-gray-500">No attendance data found for the selected date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Hours
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => {
                  const statusInfo = STATUS_COLORS[record.status] || STATUS_COLORS.present;
                  return (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {getEmployeeName(record.employeeId)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTime(record.checkIn)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTime(record.checkOut)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                        {formatHours(record.hoursWorked)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {record.notes || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Monthly Report Section */}
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Report</h3>
              <p className="text-sm text-gray-500 mt-1">Attendance summary for the selected month</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Month"
                id="reportMonth"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                options={MONTH_OPTIONS}
              />
              <Select
                label="Year"
                id="reportYear"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                options={YEAR_OPTIONS}
              />
              <Button variant="secondary" onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : !Array.isArray(report) || report.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No report data</h3>
            <p className="text-gray-500">No attendance data available for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Total Hours
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Overtime
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.map((row: any, index: number) => (
                  <tr key={row._id || row.employeeId || index} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {getEmployeeName(row.employee || row.employeeId)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        {row.present ?? row.presentDays ?? 0}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                        {row.absent ?? row.absentDays ?? 0}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                        {row.late ?? row.lateDays ?? 0}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 hidden sm:table-cell">
                      {formatHours(row.totalHours ?? row.hoursWorked)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 hidden md:table-cell">
                      {formatHours(row.overtime ?? row.overtimeHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
