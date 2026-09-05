import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HK, US, CA, GB, AU, DE, FR, JP } from 'country-flag-icons/react/3x2';
import { Globe, ChevronDown } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. Types & Data Configuration
// ----------------------------------------------------------------------
export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  Flag: React.ComponentType<{ className?: string }>;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  HKD: { code: 'HKD', symbol: 'HK$', rate: 7.8, Flag: HK, name: 'Hong Kong' },
  USD: { code: 'USD', symbol: '$', rate: 1.0, Flag: US, name: 'United States' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.35, Flag: CA, name: 'Canada' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.78, Flag: GB, name: 'United Kingdom' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, Flag: AU, name: 'Australia' },
  EUR_DE: { code: 'EUR', symbol: '€', rate: 0.92, Flag: DE, name: 'Germany' },
  EUR_FR: { code: 'EUR', symbol: '€', rate: 0.92, Flag: FR, name: 'France' },
  JPY: { code: 'JPY', symbol: '¥', rate: 155.0, Flag: JP, name: 'Japan' },
};

// ----------------------------------------------------------------------
// 2. Context & Provider
// ----------------------------------------------------------------------
interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  formatPrice: (priceInUSD: number) => string;
  currencyConfig: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('app_currency') || 'HKD';
  });

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  const currencyConfig = CURRENCIES[currency] || CURRENCIES.HKD;

  const normalizeToDollars = (price: number) => {
    if (price >= 100 || price % 1 !== 0) {
      return price > 100 && Number.isInteger(price) ? price / 100 : price;
    }
    return price;
  };

  const formatPrice = (usdAmount: number) => {
    const normalizedUSD = normalizeToDollars(usdAmount);
    let converted = normalizedUSD * currencyConfig.rate;

    const isHKD = currencyConfig.code === 'HKD';

    // Auto round up to nearest integer for HKD
    if (isHKD) {
      converted = Math.ceil(converted);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: isHKD ? 0 : 2,
      maximumFractionDigits: isHKD ? 0 : 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, currencyConfig }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// ----------------------------------------------------------------------
// 3. Dropdown UI Component
// ----------------------------------------------------------------------
export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, currencyConfig } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const CurrentFlag = currencyConfig.Flag;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Header button with Globe + Flag + Country / Currency */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white px-3 py-2 rounded-xl transition-all text-sm font-medium"
      >
        <Globe className="w-4 h-4 text-neutral-400" />
        <CurrentFlag className="w-5 h-3.5 object-cover rounded-sm" />
        <span>{currencyConfig.code}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-2 z-50">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
            SELECT COUNTRY / CURRENCY
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto overscroll-contain" data-lenis-prevent>
            {Object.entries(CURRENCIES).map(([key, c]) => {
              const FlagComponent = c.Flag;
              const isSelected = key === currency;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setCurrency(key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-colors text-sm ${
                    isSelected ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-300 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FlagComponent className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                    <span>{c.name}</span>
                  </div>
                  <span className="text-neutral-500 font-mono text-xs">{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};