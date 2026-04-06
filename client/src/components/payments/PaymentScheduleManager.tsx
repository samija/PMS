import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { scheduleAPI } from '../../services/api';
import { PaymentSchedule } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import PaymentScheduleForm from './PaymentScheduleForm';

const recurrenceLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  one_time: 'One Time',
};

const typeColors: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-700',
  utility: 'bg-green-100 text-green-700',
  maintenance: 'bg-orange-100 text-orange-700',
  custom: 'bg-purple-100 text-purple-700',
};

export default function PaymentScheduleManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentSchedule | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payment-schedules'],
    queryFn: () => scheduleAPI.getAll({ limit: 100 }),
  });

  const schedules = data?.data?.data?.schedules || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => scheduleAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => scheduleAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      setEditingSchedule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (id: string) => scheduleAPI.generatePayments(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdate = async (data: any) => {
    if (editingSchedule) {
      await updateMutation.mutateAsync({ id: editingSchedule._id, data });
    }
  };

  const handleToggleActive = async (schedule: PaymentSchedule) => {
    await updateMutation.mutateAsync({
      id: schedule._id,
      data: { isActive: !schedule.isActive },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleGenerate = async (id: string) => {
    await generateMutation.mutateAsync(id);
  };

  const formatCurrency = (amount: number) => `ETB ${amount.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Schedules</h1>
          <p className="text-gray-500 mt-1">
            Manage recurring payment schedules for your tenants
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Schedules list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium">No payment schedules</p>
            <p className="text-sm mt-1">Create a schedule to automate payment generation</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule: PaymentSchedule) => {
            const tenant = typeof schedule.tenantId === 'object' ? schedule.tenantId : null;
            const property = typeof schedule.propertyId === 'object' ? schedule.propertyId : null;
            const unit = typeof schedule.unitId === 'object' ? schedule.unitId : null;

            return (
              <Card key={schedule._id} padding="none">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[schedule.type]}`}>
                          {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                        </span>
                        <Badge variant={schedule.isActive ? 'success' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {schedule.autoGenerate && (
                          <Badge variant="info">Auto-generate</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        {schedule.name}
                      </h3>

                      {tenant && (
                        <p className="text-sm text-gray-500 mt-1">
                          {(tenant as any).userId?.name || 'Tenant'} - {(property as any)?.name} Unit {(unit as any)?.unitNumber}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(schedule.amount)}
                        </span>
                        <span>{recurrenceLabels[schedule.recurrence]}</span>
                        <span>Due on day {schedule.dayOfMonth}</span>
                        <span>Started {formatDate(schedule.startDate)}</span>
                      </div>
                    </div>

                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === schedule._id ? null : schedule._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>

                      {activeMenu === schedule._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                          <button
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleToggleActive(schedule);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {schedule.isActive ? (
                              <>
                                <Pause className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              handleGenerate(schedule._id);
                              setActiveMenu(null);
                            }}
                            disabled={generateMutation.isPending}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                            Generate Payments
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(schedule._id);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule info */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-sm">
                    {schedule.lastGeneratedDate && (
                      <span className="text-gray-500">
                        Last generated: {formatDate(schedule.lastGeneratedDate)}
                      </span>
                    )}
                    {schedule.endDate && (
                      <span className="text-gray-500">
                        Ends: {formatDate(schedule.endDate)}
                      </span>
                    )}
                    {schedule.autoGenerate && (
                      <span className="text-gray-500">
                        Generates {schedule.generateAheadMonths} months ahead
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit form modal */}
      {(showForm || editingSchedule) && (
        <PaymentScheduleForm
          schedule={editingSchedule || undefined}
          onSubmit={editingSchedule ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Close menu on click outside */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
