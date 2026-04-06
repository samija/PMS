import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Calendar, MapPin, Edit2, Trash2, Clock } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import type { GuardShift, ShiftType, GuardPost } from '../../types';
import { usePropertyContext } from '../../hooks/usePropertyContext';

type Tab = 'shifts' | 'schedule' | 'posts';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SHIFT_TYPE_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
];

const GUARD_POST_OPTIONS = [
  { value: 'main_gate', label: 'Main Gate' },
  { value: 'back_gate', label: 'Back Gate' },
  { value: 'parking', label: 'Parking' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'patrol', label: 'Patrol' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'basement', label: 'Basement' },
];

const POST_LABELS: Record<string, string> = {
  main_gate: 'Main Gate',
  back_gate: 'Back Gate',
  parking: 'Parking',
  lobby: 'Lobby',
  patrol: 'Patrol',
  rooftop: 'Rooftop',
  basement: 'Basement',
};

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

interface ShiftFormData {
  guardId: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  guardPost: GuardPost;
  effectiveFrom: string;
  notes: string;
}

const defaultFormData: ShiftFormData = {
  guardId: '',
  shiftType: 'morning',
  startTime: '06:00',
  endTime: '14:00',
  daysOfWeek: [],
  guardPost: 'main_gate',
  effectiveFrom: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function GuardManagement() {
  usePropertyContext();
  const { id: propertyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('shifts');
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<GuardShift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>(defaultFormData);

  // Fetch shifts
  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['guard-shifts', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/guards/shifts`),
    enabled: !!propertyId,
  });

  // Fetch schedule
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['guard-schedule', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/guards/schedule`),
    enabled: !!propertyId && activeTab === 'schedule',
  });

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['guard-posts', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/guards/posts`),
    enabled: !!propertyId && activeTab === 'posts',
  });

  // Fetch guards list for dropdown
  const { data: guardsData } = useQuery({
    queryKey: ['property-guards', propertyId],
    queryFn: () => api.get(`/employees`, { params: { department: 'security', propertyId } }),
    enabled: !!propertyId,
  });

  const shifts: GuardShift[] = shiftsData?.data?.data || [];
  const schedule = scheduleData?.data?.data || {};
  const posts = postsData?.data?.data || {};
  const guards = guardsData?.data?.data?.data || [];

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: (data: ShiftFormData) =>
      api.post(`/properties/${propertyId}/guards/shifts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guard-shifts', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-schedule', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-posts', propertyId] });
      closeModal();
    },
  });

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: ShiftFormData }) =>
      api.put(`/properties/${propertyId}/guards/shifts/${shiftId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guard-shifts', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-schedule', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-posts', propertyId] });
      closeModal();
    },
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: (shiftId: string) =>
      api.delete(`/properties/${propertyId}/guards/shifts/${shiftId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guard-shifts', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-schedule', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['guard-posts', propertyId] });
    },
  });

  const openCreateModal = () => {
    setEditingShift(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const openEditModal = (shift: GuardShift) => {
    setEditingShift(shift);
    setFormData({
      guardId: typeof shift.guardId === 'string' ? shift.guardId : shift.guardId?.id || '',
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      daysOfWeek: shift.daysOfWeek || [],
      guardPost: shift.guardPost,
      effectiveFrom: shift.effectiveFrom?.split('T')[0] || '',
      notes: shift.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      updateShiftMutation.mutate({ shiftId: editingShift._id, data: formData });
    } else {
      createShiftMutation.mutate(formData);
    }
  };

  const handleDelete = (shiftId: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      deleteShiftMutation.mutate(shiftId);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter((d) => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex].sort(),
    }));
  };

  const getShiftBadgeVariant = (type: string): 'success' | 'warning' | 'info' | 'default' => {
    const variants: Record<string, 'success' | 'warning' | 'info'> = {
      morning: 'success',
      afternoon: 'warning',
      night: 'info',
    };
    return variants[type] || 'default';
  };

  const getGuardName = (guard: any): string => {
    if (!guard) return 'Unknown';
    if (typeof guard === 'string') return guard;
    return guard.name || guard.userId?.name || 'Unknown';
  };

  const formatDays = (days: number[]): string => {
    if (!days || days.length === 0) return 'None';
    return days.map((d) => DAYS_OF_WEEK[d] || '').join(', ');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'shifts', label: 'Shifts', icon: <Clock className="h-4 w-4" /> },
    { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
    { key: 'posts', label: 'Posts', icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guard Management</h1>
          <p className="text-gray-500 mt-1">Manage guard shifts, schedules, and post assignments</p>
        </div>
        {activeTab === 'shifts' && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'shifts' && (
        <ShiftsTab
          shifts={shifts}
          loading={shiftsLoading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          getGuardName={getGuardName}
          formatDays={formatDays}
          getShiftBadgeVariant={getShiftBadgeVariant}
        />
      )}

      {activeTab === 'schedule' && (
        <ScheduleTab
          schedule={schedule}
          loading={scheduleLoading}
          getGuardName={getGuardName}
        />
      )}

      {activeTab === 'posts' && (
        <PostsTab
          posts={posts}
          loading={postsLoading}
          getGuardName={getGuardName}
        />
      )}

      {/* Shift Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Guard"
            id="guardId"
            value={formData.guardId}
            onChange={(e) => setFormData({ ...formData, guardId: e.target.value })}
            options={[
              { value: '', label: 'Select a guard' },
              ...guards.map((g: any) => ({
                value: g.userId?._id || g.userId?.id || g._id,
                label: g.userId?.name || g.name || 'Unknown Guard',
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Shift Type"
              id="shiftType"
              value={formData.shiftType}
              onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as ShiftType })}
              options={SHIFT_TYPE_OPTIONS}
              required
            />
            <Select
              label="Guard Post"
              id="guardPost"
              value={formData.guardPost}
              onChange={(e) => setFormData({ ...formData, guardPost: e.target.value as GuardPost })}
              options={GUARD_POST_OPTIONS}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Time"
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              label="End Time"
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                    formData.daysOfWeek.includes(index)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Effective From"
            id="effectiveFrom"
            type="date"
            value={formData.effectiveFrom}
            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            required
          />

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              placeholder="Optional notes about this shift..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createShiftMutation.isPending || updateShiftMutation.isPending}
            >
              {editingShift ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==================== Shifts Tab ====================
function ShiftsTab({
  shifts,
  loading,
  onEdit,
  onDelete,
  getGuardName,
  formatDays,
  getShiftBadgeVariant,
}: {
  shifts: GuardShift[];
  loading: boolean;
  onEdit: (shift: GuardShift) => void;
  onDelete: (id: string) => void;
  getGuardName: (guard: any) => string;
  formatDays: (days: number[]) => string;
  getShiftBadgeVariant: (type: string) => 'success' | 'warning' | 'info' | 'default';
}) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts configured</h3>
          <p className="text-gray-500">Add guard shifts to get started with scheduling.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guard
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift Type
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Time
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Days
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Post
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift._id} className="hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {getGuardName(shift.guardId)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <Badge variant={getShiftBadgeVariant(shift.shiftType)}>
                    {SHIFT_LABELS[shift.shiftType] || shift.shiftType}
                  </Badge>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                  {shift.startTime} - {shift.endTime}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                  {formatDays(shift.daysOfWeek)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                  {POST_LABELS[shift.guardPost] || shift.guardPost}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <Badge variant={shift.isActive ? 'success' : 'default'}>
                    {shift.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(shift)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Edit shift"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(shift._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Delete shift"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ==================== Schedule Tab ====================
function ScheduleTab({
  schedule,
  loading,
  getGuardName,
}: {
  schedule: any;
  loading: boolean;
  getGuardName: (guard: any) => string;
}) {
  const shiftTypes: ShiftType[] = ['morning', 'afternoon', 'night'];
  const shiftColors: Record<string, string> = {
    morning: 'bg-amber-50 border-amber-200',
    afternoon: 'bg-orange-50 border-orange-200',
    night: 'bg-indigo-50 border-indigo-200',
  };

  // Normalize schedule data -- handle both array-based and object-based formats
  const getCell = (shiftType: string, dayIndex: number): any[] => {
    if (Array.isArray(schedule)) {
      return schedule.filter(
        (s: any) =>
          s.shiftType === shiftType && s.daysOfWeek?.includes(dayIndex)
      );
    }
    return schedule?.[shiftType]?.[dayIndex] || schedule?.[dayIndex]?.[shiftType] || [];
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="p-4 sm:p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
        <p className="text-sm text-gray-500 mt-1">Overview of guard assignments for the week</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Shift
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shiftTypes.map((shiftType) => (
              <tr key={shiftType}>
                <td className="px-4 py-4">
                  <Badge variant={shiftType === 'morning' ? 'success' : shiftType === 'afternoon' ? 'warning' : 'info'}>
                    {SHIFT_LABELS[shiftType]}
                  </Badge>
                </td>
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const cellData = getCell(shiftType, dayIndex);
                  const items = Array.isArray(cellData) ? cellData : [];
                  return (
                    <td key={dayIndex} className="px-2 py-3">
                      {items.length > 0 ? (
                        <div className="space-y-1">
                          {items.map((entry: any, idx: number) => (
                            <div
                              key={idx}
                              className={`rounded-lg border p-2 text-xs ${shiftColors[shiftType] || 'bg-gray-50 border-gray-200'}`}
                            >
                              <p className="font-medium text-gray-900 truncate">
                                {getGuardName(entry.guardId || entry.guard || entry)}
                              </p>
                              <p className="text-gray-500 truncate">
                                {POST_LABELS[entry.guardPost || entry.post] || entry.guardPost || ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 text-xs py-2">--</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ==================== Posts Tab ====================
function PostsTab({
  posts,
  loading,
  getGuardName,
}: {
  posts: any[];
  loading: boolean;
  getGuardName: (guard: any) => string;
}) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  // Posts come as an object { post_name: [shifts...] } or an array
  const postItems = Array.isArray(posts)
    ? (posts.length > 0 ? posts : Object.entries(POST_LABELS).map(([key, label]) => ({ post: key, name: label, guards: [] })))
    : Object.entries(posts).length > 0
      ? Object.entries(posts).map(([key, shifts]) => ({ post: key, name: POST_LABELS[key] || key, guards: shifts as any[] }))
      : Object.entries(POST_LABELS).map(([key, label]) => ({ post: key, name: label, guards: [] }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {postItems.map((post: any, index: number) => {
        const postKey = post.post || post.guardPost || post._id || index;
        const postLabel = POST_LABELS[post.post || post.guardPost] || post.name || post.post || 'Unknown Post';
        const assignedGuards: any[] = post.guards || post.assignedGuards || [];

        return (
          <Card key={postKey}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{postLabel}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {assignedGuards.length} guard{assignedGuards.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
            </div>

            {assignedGuards.length > 0 ? (
              <div className="mt-4 space-y-2">
                {assignedGuards.map((guard: any, gIdx: number) => (
                  <div
                    key={gIdx}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getGuardName(guard.guardId || guard.guard || guard)}
                      </p>
                      {(guard.shiftType || guard.shift) && (
                        <p className="text-xs text-gray-500">
                          {SHIFT_LABELS[guard.shiftType || guard.shift] || guard.shiftType || ''}
                          {guard.startTime && guard.endTime
                            ? ` (${guard.startTime} - ${guard.endTime})`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-400">No guards assigned</p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
