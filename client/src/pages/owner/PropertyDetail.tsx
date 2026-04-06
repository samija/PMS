import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Plus,
  Trash2,
  Image as ImageIcon,
  Shield,
  Clock,
  AlertTriangle,
  DollarSign,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { propertyAPI } from '../../services/api';
import { ImageGallery, ImageUpload } from '../../components/media';
import { usePropertyContext } from '../../hooks/usePropertyContext';

export default function PropertyDetail() {
  usePropertyContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    floor: 1,
    type: 'studio',
    size: 0,
    basePrice: 0,
    amenityCharges: 0,
    features: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyAPI.getOne(id!),
    enabled: !!id,
  });

  const addUnitMutation = useMutation({
    mutationFn: (data: any) => propertyAPI.addUnit(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Unit added successfully');
      setShowAddUnitModal(false);
      resetUnitForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add unit');
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: string) => propertyAPI.deleteUnit(id!, unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Unit deleted successfully');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageUrl: string) => propertyAPI.deleteImage(id!, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Image deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: (imageUrl: string) => propertyAPI.setPrimaryImage(id!, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Primary image updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set primary image');
    },
  });

  const handleUploadImages = async (files: File[]) => {
    setIsUploadingImages(true);
    try {
      await propertyAPI.uploadImages(id!, files);
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast.success('Images uploaded successfully');
      setShowImageUploadModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload images');
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = (imageUrl: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate(imageUrl);
    }
  };

  const handleSetPrimaryImage = (imageUrl: string) => {
    setPrimaryImageMutation.mutate(imageUrl);
  };

  const property = data?.data?.data;
  const units = property?.units || [];

  const resetUnitForm = () => {
    setUnitForm({
      unitNumber: '',
      floor: 1,
      type: 'studio',
      size: 0,
      basePrice: 0,
      amenityCharges: 0,
      features: '',
    });
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    addUnitMutation.mutate({
      ...unitForm,
      features: unitForm.features.split(',').map((f) => f.trim()).filter(Boolean),
    });
  };

  const unitTypes = [
    { value: 'studio', label: 'Studio' },
    { value: '1bed', label: '1 Bedroom' },
    { value: '2bed', label: '2 Bedroom' },
    { value: '3bed', label: '3 Bedroom' },
    { value: 'office', label: 'Office' },
    { value: 'shop', label: 'Shop' },
    { value: 'warehouse', label: 'Warehouse' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      vacant: 'success',
      occupied: 'info',
      reserved: 'warning',
      maintenance: 'danger',
    };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Property not found</h3>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/owner/properties')}>
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/owner/properties')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <Badge variant={property.isListed ? 'success' : 'default'}>
              {property.isListed ? 'Listed' : 'Unlisted'}
            </Badge>
          </div>
          <div className="flex items-center text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {property.address.street}, {property.address.city}, {property.address.state}
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Property Details</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Property Type</p>
              <p className="font-medium capitalize">{property.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Floors</p>
              <p className="font-medium">{property.totalFloors}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="font-medium">{property.totalUnits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting List Type</p>
              <p className="font-medium capitalize">{property.waitingListType}</p>
            </div>
          </div>

          {property.amenities?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string) => (
                  <Badge key={amenity} variant="default">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {property.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-700">{property.description}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Unit Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Vacant</span>
              <span className="font-bold text-green-700">
                {units.filter((u: any) => u.status === 'vacant').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700">Occupied</span>
              <span className="font-bold text-blue-700">
                {units.filter((u: any) => u.status === 'occupied').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700">Reserved</span>
              <span className="font-bold text-yellow-700">
                {units.filter((u: any) => u.status === 'reserved').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">Maintenance</span>
              <span className="font-bold text-red-700">
                {units.filter((u: any) => u.status === 'maintenance').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Management Quick Links */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Management</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate(`/owner/properties/${id}/guards`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Guards</span>
          </button>
          <button
            onClick={() => navigate(`/owner/properties/${id}/attendance`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-green-50 hover:border-green-200 transition-colors"
          >
            <Clock className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Attendance</span>
          </button>
          <button
            onClick={() => navigate(`/owner/properties/${id}/incidents`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Incidents</span>
          </button>
          <button
            onClick={() => navigate(`/owner/properties/${id}/payroll`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">Payroll</span>
          </button>
          <button
            onClick={() => navigate(`/owner/properties/${id}/reviews`)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <Star className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Reviews</span>
          </button>
        </div>
      </Card>

      {/* Property Images */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Property Images ({property.images?.length || 0})</h2>
          <Button variant="secondary" onClick={() => setShowImageUploadModal(true)}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Add Images
          </Button>
        </div>

        {property.images?.length > 0 ? (
          <ImageGallery
            images={property.images}
            onDelete={handleDeleteImage}
            onSetPrimary={handleSetPrimaryImage}
            showActions={true}
            columns={4}
          />
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">No images uploaded yet</p>
            <Button variant="secondary" onClick={() => setShowImageUploadModal(true)}>
              Upload Images
            </Button>
          </div>
        )}
      </Card>

      {/* Units */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Units ({units.length})</h2>
          <Button onClick={() => setShowAddUnitModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">No units added yet</p>
            <Button className="mt-4" onClick={() => setShowAddUnitModal(true)}>
              Add First Unit
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Unit</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Floor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit: any) => (
                    <tr key={unit._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{unit.unitNumber}</td>
                      <td className="py-3 px-4">{unit.floor}</td>
                      <td className="py-3 px-4 capitalize">{unit.type}</td>
                      <td className="py-3 px-4">{unit.size} sqm</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{unit.pricing.totalPrice.toLocaleString()} ETB</p>
                          <p className="text-xs text-gray-500">
                            Base: {unit.pricing.basePrice.toLocaleString()} | Multiplier: x{unit.pricing.floorMultiplier.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadge(unit.status)}>{unit.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (unit.status === 'occupied') {
                              toast.error('Cannot delete occupied unit');
                              return;
                            }
                            if (confirm('Delete this unit?')) {
                              deleteUnitMutation.mutate(unit._id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y">
              {units.map((unit: any) => (
                <div key={unit._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Unit {unit.unitNumber}</p>
                      <p className="text-sm text-gray-500 capitalize">{unit.type} - Floor {unit.floor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(unit.status)}>{unit.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (unit.status === 'occupied') {
                            toast.error('Cannot delete occupied unit');
                            return;
                          }
                          if (confirm('Delete this unit?')) {
                            deleteUnitMutation.mutate(unit._id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-1">{unit.size} sqm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-1 font-medium">{unit.pricing.totalPrice.toLocaleString()} ETB</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Base: {unit.pricing.basePrice.toLocaleString()} ETB | Multiplier: x{unit.pricing.floorMultiplier.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Add Unit Modal */}
      <Modal
        isOpen={showAddUnitModal}
        onClose={() => setShowAddUnitModal(false)}
        title="Add New Unit"
      >
        <form onSubmit={handleAddUnit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit Number"
              placeholder="e.g., 101, A1"
              value={unitForm.unitNumber}
              onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
              required
            />
            <Input
              label="Floor"
              type="number"
              min="0"
              max={property.totalFloors}
              value={unitForm.floor}
              onChange={(e) => setUnitForm({ ...unitForm, floor: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Unit Type"
              options={unitTypes}
              value={unitForm.type}
              onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })}
            />
            <Input
              label="Size (sqm)"
              type="number"
              min="1"
              value={unitForm.size || ''}
              onChange={(e) => setUnitForm({ ...unitForm, size: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Price (ETB/month)"
              type="number"
              min="0"
              value={unitForm.basePrice || ''}
              onChange={(e) => setUnitForm({ ...unitForm, basePrice: Number(e.target.value) })}
              required
            />
            <Input
              label="Amenity Charges (ETB)"
              type="number"
              min="0"
              value={unitForm.amenityCharges || ''}
              onChange={(e) => setUnitForm({ ...unitForm, amenityCharges: Number(e.target.value) })}
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="text-blue-700">
              <strong>Estimated Total:</strong>{' '}
              {Math.round(
                unitForm.basePrice * (1 + (unitForm.floor / property.totalFloors) * 0.1) +
                  unitForm.amenityCharges
              ).toLocaleString()}{' '}
              ETB/month
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Floor multiplier: x{(1 + (unitForm.floor / property.totalFloors) * 0.1).toFixed(2)} (higher floors have higher prices)
            </p>
          </div>

          <Input
            label="Features (comma separated)"
            placeholder="Balcony, AC, Parking"
            value={unitForm.features}
            onChange={(e) => setUnitForm({ ...unitForm, features: e.target.value })}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddUnitModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={addUnitMutation.isPending} className="w-full sm:w-auto">
              Add Unit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        title="Upload Property Images"
      >
        <ImageUpload
          onUpload={handleUploadImages}
          maxFiles={10}
          isUploading={isUploadingImages}
        />
      </Modal>
    </div>
  );
}
