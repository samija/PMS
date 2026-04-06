import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Wrench } from 'lucide-react';
import { propertyAPI, maintenanceAPI } from '../../services/api';
import { usePropertyStore } from '../../store/propertyStore';

export default function PropertyHealthGrid() {
  const navigate = useNavigate();
  const { setSelectedProperty } = usePropertyStore();

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['properties-health'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance-all'],
    queryFn: () => maintenanceAPI.getAll({ limit: 500 }),
  });

  const properties = propertiesData?.data?.data?.properties || [];
  const maintenanceRequests = maintenanceData?.data?.data?.requests || [];

  const getPropertyMaintenance = (propertyId: string) => {
    return maintenanceRequests.filter(
      (r: any) => r.propertyId?._id === propertyId && r.status !== 'completed' && r.status !== 'cancelled'
    ).length;
  };

  const handleManage = (property: any) => {
    setSelectedProperty({
      id: property._id,
      name: property.name,
      type: property.type,
      address: property.address,
    });
    navigate(`/owner/properties/${property._id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Property Health</h2>
        <span className="text-sm text-gray-500">{properties.length} properties</span>
      </div>

      {properties.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No properties yet. Add your first property to get started.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {properties.map((property: any) => {
            const occupied = property.occupiedUnits || 0;
            const total = property.totalUnits || 0;
            const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
            const pendingMaintenance = getPropertyMaintenance(property._id);

            return (
              <div
                key={property._id}
                className="border border-gray-100 rounded-lg p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{property.address?.city}</span>
                    </div>
                  </div>
                  {pendingMaintenance > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                      <Wrench className="h-3 w-3" />
                      {pendingMaintenance}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Occupancy</span>
                    <span className="font-medium text-gray-700">{occupied}/{total} units</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        occupancyRate >= 90 ? 'bg-green-500' :
                        occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{occupancyRate}% occupied</p>
                </div>

                <button
                  onClick={() => handleManage(property)}
                  className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 py-1.5 rounded-md transition-colors"
                >
                  Manage
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
