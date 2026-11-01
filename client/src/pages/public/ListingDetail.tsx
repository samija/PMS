import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Building2, Users, Phone, Mail, CheckCircle, ArrowLeft, Expand } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
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
      <div
        style={{ minHeight: '100vh', background: '#0c0a09', fontFamily: "'Outfit', sans-serif" }}
        className="max-w-7xl mx-auto px-4 py-8"
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>
        <div className="animate-pulse space-y-6">
          <div className="h-96 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-8 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-4 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div
        style={{ minHeight: '100vh', background: '#0c0a09', fontFamily: "'Outfit', sans-serif" }}
        className="max-w-7xl mx-auto px-4 py-16 text-center"
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>
        <Building2 className="h-12 w-12 mx-auto" style={{ color: '#78716c' }} />
        <h3 className="mt-4 text-lg font-medium" style={{ color: '#e7e5e4', fontFamily: "'DM Serif Display', serif" }}>
          Property not found
        </h3>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/listings')}>
          Back to Listings
        </Button>
      </div>
    );
  }

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '0.875rem',
    padding: '1.5rem',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c0a09',
        fontFamily: "'Outfit', sans-serif",
        color: '#d6d3d1',
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/listings')}
          className="flex items-center mb-6 transition-colors"
          style={{ color: '#a8a29e' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f97316')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </button>

        {/* Hero Image Gallery */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8 rounded-2xl overflow-hidden">
          {/* Main image */}
          <div
            className="relative group cursor-pointer"
            onClick={() => {
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
          >
            <img
              src={
                property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'
              }
              alt={property.name}
              className="w-full h-[400px] object-cover"
              style={{ borderRadius: '0.875rem' }}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 transition-opacity"
              style={{
                borderRadius: '0.875rem',
                background: 'linear-gradient(to top, rgba(12,10,9,0.7) 0%, transparent 60%)',
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderRadius: '0.875rem' }}
            >
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              >
                <Expand className="h-4 w-4" /> View Gallery
              </span>
            </div>
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative group cursor-pointer"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={
                    property.images?.[i] ||
                    `https://images.unsplash.com/photo-150267226026${i}-1c1ef2d93688?w=400&h=200&fit=crop`
                  }
                  alt={`${property.name} ${i}`}
                  className="w-full h-[190px] object-cover"
                  style={{ borderRadius: '0.75rem' }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    borderRadius: '0.75rem',
                    background: 'rgba(249,115,22,0.12)',
                  }}
                />
                {i === 4 && property.images?.length > 5 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ borderRadius: '0.75rem', background: 'rgba(12,10,9,0.65)' }}
                  >
                    <span
                      className="text-lg font-semibold"
                      style={{ color: '#fff', fontFamily: "'DM Serif Display', serif" }}
                    >
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
          images={
            property.images?.length > 0
              ? property.images
              : [
                  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1502672260267-1c1ef2d93688?w=400&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1502672260268-1c1ef2d93688?w=400&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1502672260269-1c1ef2d93688?w=400&h=200&fit=crop',
                ]
          }
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
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* Property type badge */}
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                  style={{
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    color: '#fb923c',
                  }}
                >
                  {property.type}
                </span>
                {property.waitingListCount > 0 && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(234,179,8,0.12)',
                      border: '1px solid rgba(234,179,8,0.25)',
                      color: '#fbbf24',
                    }}
                  >
                    {property.waitingListCount} in waiting list
                  </span>
                )}
              </div>
              <h1
                className="text-4xl font-bold mb-3"
                style={{
                  color: '#fafaf9',
                  fontFamily: "'DM Serif Display', serif",
                  lineHeight: 1.15,
                }}
              >
                {property.name}
              </h1>
              <div className="flex items-center" style={{ color: '#78716c' }}>
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: '#f97316' }} />
                <span style={{ color: '#a8a29e' }}>
                  {property.address.street}, {property.address.city}, {property.address.state}
                </span>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div style={glassCard}>
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
                >
                  About this Property
                </h2>
                <p style={{ color: '#a8a29e', lineHeight: 1.7 }}>{property.description}</p>
              </div>
            )}

            {/* Property Details */}
            <div style={glassCard}>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
              >
                Property Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg w-10 h-10 flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: '#f97316' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#78716c' }}>
                      Total Floors
                    </p>
                    <p className="font-medium" style={{ color: '#e7e5e4' }}>
                      {property.totalFloors}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg w-10 h-10 flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
                  >
                    <Users className="h-5 w-5" style={{ color: '#f97316' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#78716c' }}>
                      Total Units
                    </p>
                    <p className="font-medium" style={{ color: '#e7e5e4' }}>
                      {property.totalUnits}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div style={glassCard}>
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
                >
                  Amenities
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {property.amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#10b981' }} />
                      <span style={{ color: '#d6d3d1' }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Units */}
            <div style={glassCard}>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
              >
                Available Units ({units.length})
              </h2>
              {units.length === 0 ? (
                <p style={{ color: '#78716c' }}>No units currently available.</p>
              ) : (
                <div className="space-y-3">
                  {units.map((unit: any) => {
                    const isSelected = selectedUnit?._id === unit._id;
                    return (
                      <div
                        key={unit._id}
                        className="cursor-pointer transition-all"
                        style={{
                          borderRadius: '0.75rem',
                          padding: '1rem',
                          border: isSelected ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.06)',
                          background: isSelected ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
                        }}
                        onClick={() => setSelectedUnit(unit)}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold" style={{ color: '#fafaf9' }}>
                              Unit {unit.unitNumber}
                            </h3>
                            <p className="text-sm mt-0.5" style={{ color: '#78716c' }}>
                              Floor {unit.floor} &middot; {unit.type} &middot; {unit.size} sqm
                            </p>
                            {unit.features?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {unit.features.map((feature: string) => (
                                  <span
                                    key={feature}
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{
                                      background: 'rgba(255,255,255,0.05)',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      color: '#a8a29e',
                                    }}
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className="text-lg font-bold"
                              style={{
                                color: '#f97316',
                                fontFamily: "'DM Serif Display', serif",
                              }}
                            >
                              {unit.pricing.totalPrice.toLocaleString()} ETB
                            </p>
                            <p className="text-xs" style={{ color: '#78716c' }}>
                              / month
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div
              style={{
                ...glassCard,
                position: 'sticky',
                top: '6rem',
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
              >
                Interested?
              </h2>

              {selectedUnit ? (
                <div
                  className="mb-4 rounded-lg p-3"
                  style={{
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.2)',
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: '#78716c' }}>
                    Selected Unit
                  </p>
                  <p className="font-medium" style={{ color: '#e7e5e4' }}>
                    Unit {selectedUnit.unitNumber}
                  </p>
                  <p
                    className="text-xl font-bold mt-1"
                    style={{ color: '#f97316', fontFamily: "'DM Serif Display', serif" }}
                  >
                    {selectedUnit.pricing.totalPrice.toLocaleString()} ETB
                    <span className="text-sm font-normal ml-1" style={{ color: '#78716c' }}>
                      / month
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm mb-4" style={{ color: '#78716c' }}>
                  Select a unit above to apply
                </p>
              )}

              {/* Amber gradient button */}
              <button
                onClick={handleApply}
                disabled={!selectedUnit}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: selectedUnit
                    ? 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: selectedUnit ? '#fff' : '#57534e',
                  border: 'none',
                  cursor: selectedUnit ? 'pointer' : 'not-allowed',
                  boxShadow: selectedUnit ? '0 4px 20px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                Apply Now
              </button>

              <p className="text-xs text-center mt-3" style={{ color: '#57534e' }}>
                Join the waiting list or submit an application
              </p>
            </div>

            {/* Contact Card */}
            <div style={glassCard}>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}
              >
                Contact Property
              </h2>
              <div className="space-y-3">
                <a
                  href="tel:+251911123456"
                  className="flex items-center gap-3 transition-colors"
                  style={{ color: '#a8a29e' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f97316')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)' }}
                  >
                    <Phone className="h-4 w-4" style={{ color: '#f97316' }} />
                  </div>
                  +251 911 123 456
                </a>
                <a
                  href="mailto:contact@enderase.com"
                  className="flex items-center gap-3 transition-colors"
                  style={{ color: '#a8a29e' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f97316')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)' }}
                  >
                    <Mail className="h-4 w-4" style={{ color: '#f97316' }} />
                  </div>
                  contact@enderase.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for this Property">
        <div className="space-y-4">
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <h3 className="font-semibold" style={{ color: '#fafaf9', fontFamily: "'DM Serif Display', serif" }}>
              {property.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: '#78716c' }}>
              Unit {selectedUnit?.unitNumber}
            </p>
            <p className="text-xl font-bold mt-2" style={{ color: '#f97316', fontFamily: "'DM Serif Display', serif" }}>
              {selectedUnit?.pricing.totalPrice.toLocaleString()} ETB
              <span className="text-sm font-normal ml-1" style={{ color: '#78716c' }}>
                / month
              </span>
            </p>
          </div>

          <p style={{ color: '#a8a29e', lineHeight: 1.65 }}>
            You will be added to the waiting list for this unit. The property owner will review your application and
            contact you if the unit becomes available.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a8a29e',
              }}
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
                opacity: applyMutation.isPending ? 0.7 : 1,
                cursor: applyMutation.isPending ? 'not-allowed' : 'pointer',
              }}
              onClick={submitApplication}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
