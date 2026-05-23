import type { EnergyRegion } from '../types/utx';

export const ENERGY_REGIONS: EnergyRegion[] = [
  // ── Aggregate / blended regions ──────────────────────────────────────────
  { id: 'us',     flag: '🇺🇸', name: 'United States',   rate: 0.12,  country: 'US',  continent: 'NA', category: 'medium' },
  { id: 'eu',     flag: '🇪🇺', name: 'Europe (avg)',     rate: 0.25,  country: '',    continent: 'EU', category: 'high'   },
  { id: 'asia',   flag: '🌏',  name: 'Asia (avg)',       rate: 0.08,  country: '',    continent: 'AS', category: 'low'    },
  { id: 'global', flag: '🌍',  name: 'Global Average',   rate: 0.14,  country: '',    continent: '',   category: 'medium' },

  // ── Country-level regions (original) ─────────────────────────────────────
  { id: 'de',     flag: '🇩🇪', name: 'Germany',          rate: 0.32,  country: 'DE',  continent: 'EU', category: 'high'   },
  { id: 'fr',     flag: '🇫🇷', name: 'France',           rate: 0.18,  country: 'FR',  continent: 'EU', category: 'medium' },
  { id: 'cn',     flag: '🇨🇳', name: 'China',            rate: 0.08,  country: 'CN',  continent: 'AS', category: 'low'    },
  { id: 'in',     flag: '🇮🇳', name: 'India',            rate: 0.07,  country: 'IN',  continent: 'AS', category: 'low'    },
  { id: 'br',     flag: '🇧🇷', name: 'Brazil',           rate: 0.09,  country: 'BR',  continent: 'SA', category: 'low'    },
  { id: 'au',     flag: '🇦🇺', name: 'Australia',        rate: 0.22,  country: 'AU',  continent: 'OC', category: 'high'   },
  { id: 'jp',     flag: '🇯🇵', name: 'Japan',            rate: 0.24,  country: 'JP',  continent: 'AS', category: 'high'   },
  { id: 'ca',     flag: '🇨🇦', name: 'Canada',           rate: 0.10,  country: 'CA',  continent: 'NA', category: 'low'    },
  { id: 'no',     flag: '🇳🇴', name: 'Norway',           rate: 0.06,  country: 'NO',  continent: 'EU', category: 'low'    },
  { id: 'za',     flag: '🇿🇦', name: 'South Africa',     rate: 0.11,  country: 'ZA',  continent: 'AF', category: 'medium' },

  // ── Country-level regions (v15 additions) ─────────────────────────────────
  { id: 'kr',     flag: '🇰🇷', name: 'South Korea',      rate: 0.11,  country: 'KR',  continent: 'AS', category: 'medium' },
  { id: 'ph',     flag: '🇵🇭', name: 'Philippines',      rate: 0.18,  country: 'PH',  continent: 'AS', category: 'medium' },
  { id: 'gb',     flag: '🇬🇧', name: 'United Kingdom',   rate: 0.29,  country: 'GB',  continent: 'EU', category: 'high'   },
  { id: 'mx',     flag: '🇲🇽', name: 'Mexico',           rate: 0.09,  country: 'MX',  continent: 'NA', category: 'low'    },

  // ── Country-level regions (v16 additions) ─────────────────────────────────
  { id: 'pl',     flag: '🇵🇱', name: 'Poland',           rate: 0.17,  country: 'PL',  continent: 'EU', category: 'medium' },
  { id: 'ee',     flag: '🇪🇪', name: 'Estonia',          rate: 0.21,  country: 'EE',  continent: 'EU', category: 'high'   },
  { id: 'se',     flag: '🇸🇪', name: 'Sweden',           rate: 0.13,  country: 'SE',  continent: 'EU', category: 'medium' },
  { id: 'sv',     flag: '🇸🇻', name: 'El Salvador',      rate: 0.16,  country: 'SV',  continent: 'NA', category: 'medium' },
  { id: 'gl',     flag: '🇬🇱', name: 'Greenland',        rate: 0.38,  country: 'GL',  continent: 'NA', category: 'high'   },

  // ── Country-level regions (v17 additions) ─────────────────────────────────
  // India (in) already present in original batch at $0.07/kWh — not duplicated.
  { id: 'il',     flag: '🇮🇱', name: 'Israel',           rate: 0.12,  country: 'IL',  continent: 'AS', category: 'medium' },
  { id: 'ae',     flag: '🇦🇪', name: 'UAE',              rate: 0.10,  country: 'AE',  continent: 'AS', category: 'low'    },
];

export function getRegionById(id: string): EnergyRegion {
  return ENERGY_REGIONS.find((r) => r.id === id) ?? ENERGY_REGIONS.find((r) => r.id === 'global')!;
}
