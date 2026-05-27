import { useState, useEffect, useCallback } from 'react';
import { energyData, globalAverageRate, type CountryEnergy } from '../data/energyData';

interface EnergyIndexState {
  globalIndex: number;
  energyFactor: number;
  countries: CountryEnergy[];
  lastUpdated: Date;
  loading: boolean;
  sortField: keyof CountryEnergy;
  sortDirection: 'asc' | 'desc';
}

export const useEnergyIndex = () => {
  const [state, setState] = useState<EnergyIndexState>({
    globalIndex: 12.8, // Current global weighted average
    energyFactor: 1.0,
    countries: energyData,
    lastUpdated: new Date(),
    loading: true,
    sortField: 'rank',
    sortDirection: 'asc',
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const factor = globalAverageRate / state.globalIndex;
      setState(prev => ({
        ...prev,
        energyFactor: Math.min(5.0, Math.max(0.1, factor)),
        loading: false,
      }));
    }, 800);
    return () => clearTimeout(timer);
  }, [state.globalIndex]);

  const sortCountries = useCallback((field: keyof CountryEnergy) => {
    setState(prev => {
      const newDirection = prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc';
      const sorted = [...prev.countries].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return newDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return newDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
      return { ...prev, countries: sorted, sortField: field, sortDirection: newDirection };
    });
  }, []);

  const refreshIndex = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      const variation = (Math.random() - 0.5) * 0.4;
      const newIndex = Math.max(5, Math.min(25, prev => 12.8 + variation));
      setState(prev => ({
        ...prev,
        globalIndex: 12.8 + variation,
        energyFactor: Math.min(5.0, Math.max(0.1, globalAverageRate / (12.8 + variation))),
        lastUpdated: new Date(),
        loading: false,
      }));
    }, 600);
  }, []);

  return {
    ...state,
    sortCountries,
    refreshIndex,
    globalAverageRate,
  };
};
