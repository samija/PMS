import { Filter, X } from 'lucide-react';
import { CalendarFilter } from '../../types';

interface PaymentCalendarFiltersProps {
  filters: CalendarFilter;
  onFilterChange: (filters: CalendarFilter) => void;
  properties?: { _id: string; name: string }[];
  tenants?: { _id: string; name: string }[];
  isOwner?: boolean;
}

const paymentTypes = [
  { value: '', label: 'All Types' },
  { value: 'rent', label: 'Rent' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'utility', label: 'Utility' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'penalty', label: 'Penalty' },
];

const paymentStatuses = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function PaymentCalendarFilters({
  filters,
  onFilterChange,
  properties = [],
  tenants = [],
  isOwner = false,
}: PaymentCalendarFiltersProps) {
  const handleChange = (key: keyof CalendarFilter, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {isOwner && properties.length > 0 && (
        <select
          value={filters.propertyId || ''}
          onChange={(e) => handleChange('propertyId', e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Properties</option>
          {properties.map((prop) => (
            <option key={prop._id} value={prop._id}>
              {prop.name}
            </option>
          ))}
        </select>
      )}

      {isOwner && tenants.length > 0 && (
        <select
          value={filters.tenantId || ''}
          onChange={(e) => handleChange('tenantId', e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Tenants</option>
          {tenants.map((tenant) => (
            <option key={tenant._id} value={tenant._id}>
              {tenant.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filters.type || ''}
        onChange={(e) => handleChange('type', e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {paymentTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <select
        value={filters.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {paymentStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
