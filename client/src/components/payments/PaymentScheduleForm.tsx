import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { PaymentSchedule, ScheduleType, RecurrenceType, Tenant } from '../../types';
import { tenantAPI } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PaymentScheduleFormProps {
  schedule?: PaymentSchedule;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const scheduleTypes: { value: ScheduleType; label: string }[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'utility', label: 'Utility' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'custom', label: 'Custom' },
];

const recurrenceTypes: { value: RecurrenceType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One Time' },
];

export default function PaymentScheduleForm({
  schedule,
  onSubmit,
  onCancel,
  isLoading = false,
}: PaymentScheduleFormProps) {
  const isEditing = !!schedule;

  const [formData, setFormData] = useState({
    tenantId: '',
    type: 'rent' as ScheduleType,
    name: '',
    amount: '',
    recurrence: 'monthly' as RecurrenceType,
    dayOfMonth: '1',
    startDate: '',
    endDate: '',
    autoGenerate: true,
    generateAheadMonths: '3',
  });

  const [error, setError] = useState('');

  // Fetch tenants for selection
  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants-active'],
    queryFn: () => tenantAPI.getAll({ status: 'active', limit: 100 }),
    enabled: !isEditing,
  });

  const tenants = tenantsData?.data?.data?.tenants || [];

  useEffect(() => {
    if (schedule) {
      const tenant = typeof schedule.tenantId === 'object' ? schedule.tenantId : null;
      setFormData({
        tenantId: tenant?._id || (schedule.tenantId as string),
        type: schedule.type,
        name: schedule.name,
        amount: schedule.amount.toString(),
        recurrence: schedule.recurrence,
        dayOfMonth: schedule.dayOfMonth.toString(),
        startDate: schedule.startDate.split('T')[0],
        endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
        autoGenerate: schedule.autoGenerate,
        generateAheadMonths: schedule.generateAheadMonths.toString(),
      });
    }
  }, [schedule]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((t: Tenant) => t._id === tenantId);
    if (tenant) {
      setFormData((prev) => ({
        ...prev,
        tenantId,
        // Auto-fill amount with monthly rent if creating rent schedule
        amount: prev.type === 'rent' ? tenant.leaseAgreement.monthlyRent.toString() : prev.amount,
      }));
    }
  };

  const handleTypeChange = (type: ScheduleType) => {
    const defaultNames: Record<ScheduleType, string> = {
      rent: 'Monthly Rent',
      utility: 'Utility Bill',
      maintenance: 'Maintenance Fee',
      custom: '',
    };

    setFormData((prev) => ({
      ...prev,
      type,
      name: defaultNames[type] || prev.name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isEditing && !formData.tenantId) {
      setError('Please select a tenant');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter a schedule name');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const dayOfMonth = parseInt(formData.dayOfMonth);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
      setError('Day of month must be between 1 and 28');
      return;
    }

    if (!formData.startDate) {
      setError('Please select a start date');
      return;
    }

    const selectedTenant = tenants.find((t: Tenant) => t._id === formData.tenantId);

    const submitData = {
      tenantId: formData.tenantId,
      propertyId: selectedTenant?.propertyId?._id || (schedule?.propertyId as string),
      unitId: selectedTenant?.unitId?._id || (schedule?.unitId as string),
      type: formData.type,
      name: formData.name.trim(),
      amount,
      recurrence: formData.recurrence,
      dayOfMonth,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      autoGenerate: formData.autoGenerate,
      generateAheadMonths: parseInt(formData.generateAheadMonths),
    };

    await onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Payment Schedule' : 'Create Payment Schedule'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Tenant selection (only for new schedules) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant *
              </label>
              {loadingTenants ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading tenants...</span>
                </div>
              ) : (
                <select
                  value={formData.tenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant: Tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.userId.name} - {(tenant.propertyId as any)?.name || 'Property'} Unit {(tenant.unitId as any)?.unitNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as ScheduleType)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {scheduleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <Input
            label="Schedule Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Monthly Rent"
          />

          {/* Amount */}
          <Input
            label="Amount (ETB) *"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurrence
            </label>
            <select
              name="recurrence"
              value={formData.recurrence}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {recurrenceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Month */}
          <Input
            label="Due Day of Month *"
            name="dayOfMonth"
            type="number"
            value={formData.dayOfMonth}
            onChange={handleChange}
            min="1"
            max="28"
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
            <Input
              label="End Date (Optional)"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>

          {/* Auto-generate settings */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="autoGenerate"
                checked={formData.autoGenerate}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-generate payment records
              </span>
            </label>

            {formData.autoGenerate && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Generate ahead (months)
                </label>
                <select
                  name="generateAheadMonths"
                  value={formData.generateAheadMonths}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {[1, 2, 3, 6, 12].map((months) => (
                    <option key={months} value={months}>
                      {months} month{months > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Schedule' : 'Create Schedule'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
