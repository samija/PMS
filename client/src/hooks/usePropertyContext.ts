import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyAPI } from '../services/api';
import { usePropertyStore } from '../store/propertyStore';

export function usePropertyContext() {
  const { id } = useParams<{ id: string }>();
  const { selectedProperty, setSelectedProperty } = usePropertyStore();

  const { data } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyAPI.getOne(id!),
    enabled: !!id && id !== selectedProperty?.id,
  });

  useEffect(() => {
    if (data?.data?.data && id && id !== selectedProperty?.id) {
      const property = data.data.data;
      setSelectedProperty({
        id: property._id,
        name: property.name,
        type: property.type,
        address: property.address,
      });
    }
  }, [data, id, selectedProperty?.id, setSelectedProperty]);

  return { propertyId: id, property: selectedProperty };
}
