import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, X } from 'lucide-react';
import { propertyAPI } from '../../services/api';
import { usePropertyStore } from '../../store/propertyStore';

export default function PropertySwitcher({ onSelect }: { onSelect?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { selectedProperty, setSelectedProperty, clearSelectedProperty } = usePropertyStore();

  const { data } = useQuery({
    queryKey: ['properties-switcher'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const properties = data?.data?.data?.properties || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (property: any) => {
    setSelectedProperty({
      id: property._id,
      name: property.name,
      type: property.type,
      address: property.address,
    });
    setOpen(false);
    onSelect?.();
    navigate(`/owner/properties/${property._id}`);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSelectedProperty();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative px-4 py-3 border-b">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          selectedProperty
            ? 'bg-primary-50 text-primary-700 border border-primary-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
        }`}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 text-left min-w-0">
          {selectedProperty ? (
            <>
              <p className="font-medium truncate">{selectedProperty.name}</p>
              <p className="text-xs opacity-70 truncate">{selectedProperty.address?.city}</p>
            </>
          ) : (
            <p className="text-gray-500">Select a property...</p>
          )}
        </div>
        {selectedProperty ? (
          <X
            className="h-4 w-4 flex-shrink-0 hover:text-red-500 transition-colors"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-4 right-4 mt-1 bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto z-50">
          {properties.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">No properties found</p>
          ) : (
            properties.map((property: any) => (
              <button
                key={property._id}
                onClick={() => handleSelect(property)}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  selectedProperty?.id === property._id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{property.name}</p>
                  <p className="text-xs text-gray-500 truncate">{property.address?.city}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
