import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Building2, Filter } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listingAPI } from '../../services/api';

export default function Listings() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    city: '',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingAPI.getAll(filters),
  });

  const listings = data?.data?.data?.listings || [];
  const pagination = data?.data?.data?.pagination;

  const propertyTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'villa', label: 'Villa' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Next Home</h1>
          <p className="mt-2 text-gray-600">
            Browse through our available properties and find the perfect place for you.
          </p>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, city, or location..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <Select
              options={propertyTypes}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="sm:w-48"
            />
            <Input
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value, page: 1 })}
              className="sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} padding="none" className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No properties found</h3>
            <p className="mt-2 text-gray-600">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {listings.length} of {pagination?.total || 0} properties
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((property: any) => (
                <Link key={property._id} to={`/listings/${property._id}`}>
                  <Card padding="none" className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative">
                      <img
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'}
                        alt={property.name}
                        className="h-48 w-full object-cover"
                      />
                      <Badge className="absolute top-3 right-3" variant="info">
                        {property.type}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{property.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.address.street}, {property.address.city}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {property.amenities?.slice(0, 3).map((amenity: string) => (
                          <Badge key={amenity} variant="default">
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-500">Starting from</span>
                          <p className="text-lg font-bold text-primary-600">
                            {property.priceRange?.minPrice?.toLocaleString() || '---'} ETB
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Available</span>
                          <p className="font-semibold text-gray-900">
                            {property.availableUnits || 0} units
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  disabled={filters.page === pagination.pages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
