import React, { createContext, useContext, useState, useCallback } from 'react';

export interface RegionInfo {
  id: string;
  name: string;
  flag: string;
  rate: number;
  color: string;
}

interface RegionContextValue {
  selectedRegion: RegionInfo | null;
  setSelectedRegion: (r: RegionInfo) => void;
}

const RegionContext = createContext<RegionContextValue>({
  selectedRegion: null,
  setSelectedRegion: () => {},
});

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRegion, setSelectedRegionState] = useState<RegionInfo | null>(null);
  const setSelectedRegion = useCallback((r: RegionInfo) => setSelectedRegionState(r), []);
  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegionContext = () => useContext(RegionContext);
