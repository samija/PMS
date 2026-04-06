import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectedProperty {
  id: string;
  name: string;
  type: string;
  address: { city?: string; street?: string };
}

interface PropertyState {
  selectedProperty: SelectedProperty | null;
  setSelectedProperty: (property: SelectedProperty) => void;
  clearSelectedProperty: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      selectedProperty: null,
      setSelectedProperty: (property) => set({ selectedProperty: property }),
      clearSelectedProperty: () => set({ selectedProperty: null }),
    }),
    {
      name: 'pms-property-context',
    }
  )
);
