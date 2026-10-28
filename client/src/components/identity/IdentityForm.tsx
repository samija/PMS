import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { identityAPI } from '../../services/api';

interface Props {
  tenantId: string;
  initialData?: Record<string, any>;
  readOnly?: boolean;
}

export default function IdentityForm({ tenantId, initialData, readOnly = false }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>(initialData || {});

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => identityAPI.update(tenantId, data),
    onSuccess: () => {
      toast.success('Identity profile updated');
      queryClient.invalidateQueries({ queryKey: ['tenant-identity', tenantId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update identity');
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      permanentAddress: { ...(prev.permanentAddress || {}), [field]: value },
    }));
  };

  const handleNextOfKinChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      nextOfKin: { ...(prev.nextOfKin || {}), [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input
              type="date"
              className={inputClass}
              disabled={readOnly}
              value={form.dateOfBirth?.split('T')[0] || ''}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Nationality</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={100}
              value={form.nationality || ''}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="Ethiopian"
            />
          </div>
          <div>
            <label className={labelClass}>National ID Number</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={30}
              value={form.nationalIdNumber || ''}
              onChange={(e) => handleChange('nationalIdNumber', e.target.value)}
              placeholder="Enter national ID"
            />
          </div>
          <div>
            <label className={labelClass}>Passport Number (optional)</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={30}
              value={form.passportNumber || ''}
              onChange={(e) => handleChange('passportNumber', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Passport Country</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={100}
              value={form.passportCountry || ''}
              onChange={(e) => handleChange('passportCountry', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="text-lg font-semibold mb-4">Employment & Income</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Occupation</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={100}
              value={form.occupation || ''}
              onChange={(e) => handleChange('occupation', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Employer</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={200}
              value={form.employer || ''}
              onChange={(e) => handleChange('employer', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Monthly Income</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={30}
              value={form.incomeAmount || ''}
              onChange={(e) => handleChange('incomeAmount', e.target.value)}
              placeholder="e.g. 25000"
            />
          </div>
          <div>
            <label className={labelClass}>Income Source</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={100}
              value={form.incomeSource || ''}
              onChange={(e) => handleChange('incomeSource', e.target.value)}
              placeholder="e.g. salary, business"
            />
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="text-lg font-semibold mb-4">Permanent Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['street', 'city', 'region', 'country', 'postalCode'].map((field) => (
            <div key={field}>
              <label className={labelClass}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                className={inputClass}
                disabled={readOnly}
                value={form.permanentAddress?.[field] || ''}
                onChange={(e) => handleAddressChange(field, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="text-lg font-semibold mb-4">Next of Kin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={100}
              value={form.nextOfKin?.name || ''}
              onChange={(e) => handleNextOfKinChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Relationship</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={50}
              value={form.nextOfKin?.relationship || ''}
              onChange={(e) => handleNextOfKinChange('relationship', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              className={inputClass}
              disabled={readOnly}
              maxLength={20}
              value={form.nextOfKin?.phone || ''}
              onChange={(e) => handleNextOfKinChange('phone', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {!readOnly && (
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Identity Profile'}
          </Button>
        </div>
      )}
    </form>
  );
}
