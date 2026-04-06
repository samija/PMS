import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  MapPin,
  Building2,
  Users,
  Phone,
  Mail,
  CheckCircle,
  ArrowLeft,
  Expand,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { listingAPI, waitingListAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Lightbox } from '../../components/media';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingAPI.getOne(id!),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => waitingListAPI.apply(data),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    },
  });

  const property = data?.data?.data;
  const units = property?.availableUnits || [];

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = () => {
    applyMutation.mutate({
      propertyId: id,
      unitId: selectedUnit?._id,
      type: 'queue',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Property not found</h3>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/listings')}>
          Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/listings')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Listings
      </button>

      {/* Property Images */}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <div
          className="relative group cursor-pointer"
          onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
        >
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'}
            alt={property.name}
            className="w-full h-[400px] object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-2 rounded-lg flex items-center gap-2">
              <Expand className="h-4 w-4" /> View Gallery
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative group cursor-pointer"
              onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            >
              <img
                src={property.images?.[i] || `https://images.unsplash.com/photo-150267226026${i}-1c1ef2d93688?w=400&h=200&fit=crop`}
                alt={`${property.name} ${i}`}
                className="w-full h-[190px] object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors" />
              {i === 4 && property.images?.length > 5 && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    +{property.images.length - 5} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={property.images?.length > 0 ? property.images : [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop',
          'https://images.unsplash.com/photo-1502672260267-1c1ef2d93688?w=400&h=200&fit=crop',
          'https://images.unsplash.com/photo-1502672260268-1c1ef2d93688?w=400&h=200&fit=crop',
          'https://images.unsplash.com/photo-1502672260269-1c1ef2d93688?w=400&h=200&fit=crop',
        ]}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        showSlideshow={true}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">{property.type}</Badge>
              {property.waitingListCount > 0 && (
                <Badge variant="warning">{property.waitingListCount} in waiting list</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center text-gray-500 mt-2">
              <MapPin className="h-5 w-5 mr-2" />
              {property.address.street}, {property.address.city}, {property.address.state}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <Card>
              <h2 className="text-lg font-semibold mb-3">About this Property</h2>
              <p className="text-gray-600">{property.description}</p>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Property Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Floors</p>
                  <p className="font-medium">{property.totalFloors}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Units</p>
                  <p className="font-medium">{property.totalUnits}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Amenities</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {property.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Available Units */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Available Units ({units.length})</h2>
            {units.length === 0 ? (
              <p className="text-gray-500">No units currently available.</p>
            ) : (
              <div className="space-y-4">
                {units.map((unit: any) => (
                  <div
                    key={unit._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedUnit?._id === unit._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Unit {unit.unitNumber}</h3>
                        <p className="text-sm text-gray-500">
                          Floor {unit.floor} | {unit.type} | {unit.size} sqm
                        </p>
                        {unit.features?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {unit.features.map((feature: string) => (
                              <Badge key={feature} variant="default">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          {unit.pricing.totalPrice.toLocaleString()} ETB
                        </p>
                        <p className="text-sm text-gray-500">/month</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <Card className="sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Interested?</h2>
            {selectedUnit ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Selected Unit</p>
                <p className="font-medium">Unit {selectedUnit.unitNumber}</p>
                <p className="text-lg font-bold text-primary-600">
                  {selectedUnit.pricing.totalPrice.toLocaleString()} ETB/month
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">
                Select a unit above to apply
              </p>
            )}
            <Button className="w-full" onClick={handleApply} disabled={!selectedUnit}>
              Apply Now
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Join the waiting list or submit an application
            </p>
          </Card>

          {/* Contact */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Contact Property</h2>
            <div className="space-y-3">
              <a
                href="tel:+251911123456"
                className="flex items-center gap-3 text-gray-600 hover:text-primary-600"
              >
                <Phone className="h-5 w-5" />
                +251 911 123 456
              </a>
              <a
                href="mailto:contact@pms.com"
                className="flex items-center gap-3 text-gray-600 hover:text-primary-600"
              >
                <Mail className="h-5 w-5" />
                contact@pms.com
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for this Property"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{property.name}</h3>
            <p className="text-sm text-gray-500">Unit {selectedUnit?.unitNumber}</p>
            <p className="text-lg font-bold text-primary-600 mt-1">
              {selectedUnit?.pricing.totalPrice.toLocaleString()} ETB/month
            </p>
          </div>

          <p className="text-gray-600">
            You will be added to the waiting list for this unit. The property owner will
            review your application and contact you if the unit becomes available.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={submitApplication}
              loading={applyMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
