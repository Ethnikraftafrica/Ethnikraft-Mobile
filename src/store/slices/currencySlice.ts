import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  flag: string;
  name: string;
}

// Base currency is NGN. Supported backend / international currencies matching web parity
export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: { code: 'NGN', symbol: '₦', rate: 1, flag: '🇳🇬', name: 'Nigerian Naira' },
  USD: { code: 'USD', symbol: '$', rate: 0.00065, flag: '🇺🇸', name: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.00051, flag: '🇬🇧', name: 'British Pound' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.0006, flag: '🇪🇺', name: 'Euro' },
};

export interface CurrencyState {
  code: string;
  symbol: string;
  rate: number;
  flag: string;
  name: string;
  isLoaded: boolean;
}

const initialState: CurrencyState = {
  code: 'NGN',
  symbol: '₦',
  rate: 1,
  flag: '🇳🇬',
  name: 'Nigerian Naira',
  isLoaded: false,
};

export const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      const targetCode = action.payload.toUpperCase();
      const config = SUPPORTED_CURRENCIES[targetCode] || SUPPORTED_CURRENCIES.NGN;
      state.code = config.code;
      state.symbol = config.symbol;
      state.rate = config.rate;
      state.flag = config.flag;
      state.name = config.name;
      state.isLoaded = true;
    },
    hydrateCurrency: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        const targetCode = action.payload.toUpperCase();
        const config = SUPPORTED_CURRENCIES[targetCode];
        if (config) {
          state.code = config.code;
          state.symbol = config.symbol;
          state.rate = config.rate;
          state.flag = config.flag;
          state.name = config.name;
        }
      }
      state.isLoaded = true;
    },
  },
});

export const { setCurrency, hydrateCurrency } = currencySlice.actions;
export default currencySlice.reducer;
