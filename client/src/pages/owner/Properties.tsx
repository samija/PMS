import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building, MapPin, Eye, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { propertyAPI } from '../../services/api';

export default function Properties() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'apartment',
    street: '',
    city: '',
    state: '',
    country: 'Ethiopia',
    totalFloors: 1,
    totalUnits: 1,
    description: '',
    waitingListType: 'both',
    amenities: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyAPI.getAll({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => propertyAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create property');
    },
  });

  const toggleListingMutation = useMutation({
    mutationFn: (id: string) => propertyAPI.toggleListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Listing status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertyAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted successfully');
    },
  });

  const properties = data?.data?.data?.properties || [];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'apartment',
      street: '',
      city: '',
      state: '',
      country: 'Ethiopia',
      totalFloors: 1,
      totalUnits: 1,
      description: '',
      waitingListType: 'both',
      amenities: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      },
      totalFloors: Number(formData.totalFloors),
      totalUnits: Number(formData.totalUnits),
      description: formData.description,
      waitingListType: formData.waitingListType,
      amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
    });
  };

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'villa', label: 'Villa' },
  ];

  const waitingListTypes = [
    { value: 'queue', label: 'Queue (First-come-first-served)' },
    { value: 'application', label: 'Application (Review & Select)' },
    { value: 'both', label: 'Both Options' },
  ];

  return (
    <main aria-label="Properties management" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your properties and units</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No properties yet</h3>
          <p className="mt-2 text-gray-600">Get started by adding your first property.</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <Card key={property._id} padding="none" className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                {property.images?.[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant={property.isListed ? 'success' : 'default'}>
                    {property.isListed ? 'Listed' : 'Unlisted'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address?.city}, {property.address?.state}
                    </div>
                  </div>
                  <Badge variant="info">{property.type}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Floors</p>
                    <p className="font-medium">{property.totalFloors}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Units</p>
                    <p className="font-medium">{property.totalUnits}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between">
                  <Link
                    to={`/owner/properties/${property._id}`}
                    aria-label={`View details for ${property.name}`}
                  >
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                      View
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={property.isListed ? `Unlist ${property.name}` : `List ${property.name} publicly`}
                      onClick={() => toggleListingMutation.mutate(property._id)}
                    >
                      <Globe className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${property.name}`}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this property?')) {
                          deleteMutation.mutate(property._id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Property Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Property"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Property Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Property Type"
            options={propertyTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Street Address"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State/Region"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Floors"
              type="number"
              min="1"
              value={formData.totalFloors}
              onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
              required
            />
            <Input
              label="Total Units"
              type="number"
              min="1"
              value={formData.totalUnits}
              onChange={(e) => setFormData({ ...formData, totalUnits: Number(e.target.value) })}
              required
            />
          </div>

          <Select
            label="Waiting List Type"
            options={waitingListTypes}
            value={formData.waitingListType}
            onChange={(e) => setFormData({ ...formData, waitingListType: e.target.value })}
          />

          <Input
            label="Amenities (comma separated)"
            placeholder="Parking, Gym, Pool, Security"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
          />

          <div>
            <label htmlFor="property-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="property-description"
              className="input min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full sm:w-auto">
              Create Property
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
