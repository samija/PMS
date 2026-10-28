import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, Phone, Mail, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { tenantAPI, propertyAPI } from '../../services/api';
import type { Tenant, Property, Unit } from '../../types';

interface CreateTenantData {
  email: string;
  name: string;
  phone: string;
  propertyId: string;
  unitId: string;
  leaseAgreement: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
  };
}

export default function Tenants() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    propertyId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    deposit: 0,
  });

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['tenants', statusFilter],
    queryFn: () => tenantAPI.getAll({ status: statusFilter || undefined, limit: 100 }),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units', formData.propertyId],
    queryFn: () => propertyAPI.getUnits(formData.propertyId, { status: 'vacant' }),
    enabled: !!formData.propertyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantData) => tenantAPI.create(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant added successfully');
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to add tenant');
    },
  });

  const tenants = tenantsData?.data?.data?.tenants || [];
  const properties = propertiesData?.data?.data?.properties || [];
  const units = unitsData?.data?.data || [];

  const filteredTenants = tenants.filter((tenant: Tenant) =>
    tenant.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phone: '',
      propertyId: '',
      unitId: '',
      startDate: '',
      endDate: '',
      monthlyRent: 0,
      deposit: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      propertyId: formData.propertyId,
      unitId: formData.unitId,
      leaseAgreement: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyRent: formData.monthlyRent,
        deposit: formData.deposit,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      pending: 'warning',
      terminated: 'danger',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your tenants and leases</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-48"
          />
        </div>
      </Card>

      {/* Tenants List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tenants found</h3>
          <p className="mt-2 text-gray-600">
            {searchTerm ? 'Try adjusting your search.' : 'Add your first tenant to get started.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTenants.map((tenant: Tenant) => (
            <Link key={tenant._id} to={`/owner/tenants/${tenant._id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-lg">
                        {tenant.userId?.name?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{tenant.userId?.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{tenant.userId?.email}</span>
                        </span>
                        {tenant.userId?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            {tenant.userId?.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 pl-16 sm:pl-0">
                    <Badge variant={getStatusBadge(tenant.status)}>{tenant.status}</Badge>
                    <div className="text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Unit {tenant.unitId?.unitNumber} | {tenant.propertyId?.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div className="flex justify-between sm:block">
                    <p className="text-gray-500">Monthly Rent</p>
                    <p className="font-medium">{tenant.leaseAgreement.monthlyRent.toLocaleString()} ETB</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <p className="text-gray-500">Lease Start</p>
                    <p className="font-medium">{new Date(tenant.leaseAgreement.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <p className="text-gray-500">Lease End</p>
                    <p className="font-medium">{new Date(tenant.leaseAgreement.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Tenant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Tenant"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tenant Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Property"
              options={[
                { value: '', label: 'Select Property' },
                ...properties.map((p: Property) => ({ value: p._id, label: p.name })),
              ]}
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
              required
            />
            <Select
              label="Unit"
              options={[
                { value: '', label: formData.propertyId ? 'Select Unit' : 'Select property first' },
                ...units.map((u: Unit) => ({
                  value: u._id,
                  label: `${u.unitNumber} - Floor ${u.floor} (${u.pricing?.totalPrice?.toLocaleString() || 0} ETB)`,
                })),
              ]}
              value={formData.unitId}
              onChange={(e) => {
                const unit = units.find((u: Unit) => u._id === e.target.value);
                setFormData({
                  ...formData,
                  unitId: e.target.value,
                  monthlyRent: unit?.pricing.totalPrice || 0,
                });
              }}
              disabled={!formData.propertyId}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lease Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Lease End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Rent (ETB)"
              type="number"
              min="0"
              value={formData.monthlyRent || ''}
              onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
              required
            />
            <Input
              label="Security Deposit (ETB)"
              type="number"
              min="0"
              value={formData.deposit || ''}
              onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full sm:w-auto">
              Add Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
