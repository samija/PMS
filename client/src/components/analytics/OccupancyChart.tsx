import { useQuery } from '@tanstack/react-query';
import { Home, Building, Users, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { propertyAPI } from '../../services/api';

interface Property {
  _id: string;
  name: string;
  totalUnits: number;
  occupiedUnits?: number;
  vacantUnits?: number;
  address: {
    city: string;
  };
  type: string;
}

interface OccupancyChartProps {
  className?: string;
}

export default function OccupancyChart({ className = '' }: OccupancyChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const properties: Property[] = data?.data?.data?.properties || [];

  // Calculate overall statistics
  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupiedUnits || 0), 0);
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  // Get occupancy status color
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Property Occupancy</h3>
            <p className="text-sm text-gray-500">Unit occupancy by property</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Home className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              <p className="text-xs text-gray-500">Total Units</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{occupiedUnits}</p>
              <p className="text-xs text-gray-500">Occupied</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{vacantUnits}</p>
              <p className="text-xs text-gray-500">Vacant</p>
            </div>
          </div>

          {/* Overall Occupancy Rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Occupancy Rate</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getOccupancyColor(occupancyRate)}`}>
                {occupancyRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`${getProgressColor(occupancyRate)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>

          {/* Property List */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">By Property</p>

            {properties.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No properties found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {properties.map((property) => {
                  const propertyOccupied = property.occupiedUnits || 0;
                  const propertyTotal = property.totalUnits || 0;
                  const propertyRate = propertyTotal > 0 ? (propertyOccupied / propertyTotal) * 100 : 0;

                  return (
                    <div key={property._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{property.name}</span>
                          <Badge variant="default" className="text-xs">
                            {property.type}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {propertyOccupied}/{propertyTotal} units
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getProgressColor(propertyRate)} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${propertyRate}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium min-w-[3rem] text-right ${
                          propertyRate >= 90 ? 'text-green-600' :
                          propertyRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {propertyRate.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{property.address.city}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">90%+ Occupancy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600">70-89%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">Below 70%</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
