import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { VendorPalettePreset } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  isLoaded: boolean;
  palettePreset: VendorPalettePreset;
}

const THEME_STORAGE_KEY = 'ethnikraft_theme_mode';
const PALETTE_STORAGE_KEY = 'ethnikraft_palette_preset';

const initialState: ThemeState = {
  mode: 'system',
  isLoaded: false,
  palettePreset: 'baseline',
};

export const loadStoredTheme = createAsyncThunk(
  'theme/loadStoredTheme',
  async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const storedPalette = await AsyncStorage.getItem(PALETTE_STORAGE_KEY);
      return {
        mode: (stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system') as ThemeMode,
        palettePreset: (storedPalette && ['warm_obsidian', 'midnight_gold', 'sahara_slate', 'baseline'].includes(storedPalette)
          ? storedPalette
          : 'baseline') as VendorPalettePreset,
      };
    } catch (e) {
      console.warn('Failed to load theme preference from storage', e);
    }
    return { mode: 'system' as ThemeMode, palettePreset: 'baseline' as VendorPalettePreset };
  }
);

export const saveThemeMode = createAsyncThunk(
  'theme/saveThemeMode',
  async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme preference', e);
    }
    return mode;
  }
);

export const savePalettePreset = createAsyncThunk(
  'theme/savePalettePreset',
  async (preset: VendorPalettePreset) => {
    try {
      await AsyncStorage.setItem(PALETTE_STORAGE_KEY, preset);
    } catch (e) {
      console.warn('Failed to persist palette preset', e);
    }
    return preset;
  }
);

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isLoaded = true;
    },
    setPalettePreset: (state, action: PayloadAction<VendorPalettePreset>) => {
      state.palettePreset = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredTheme.fulfilled, (state, action) => {
        state.mode = action.payload.mode;
        state.palettePreset = action.payload.palettePreset;
        state.isLoaded = true;
      })
      .addCase(saveThemeMode.fulfilled, (state, action) => {
        state.mode = action.payload;
      })
      .addCase(savePalettePreset.fulfilled, (state, action) => {
        state.palettePreset = action.payload;
      });
  },
});

export const { setThemeMode, setPalettePreset } = themeSlice.actions;
export default themeSlice.reducer;
