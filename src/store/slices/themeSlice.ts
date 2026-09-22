import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  isLoaded: boolean;
}

const THEME_STORAGE_KEY = 'ethnikraft_theme_mode';

const initialState: ThemeState = {
  mode: 'system',
  isLoaded: false,
};

export const loadStoredTheme = createAsyncThunk(
  'theme/loadStoredTheme',
  async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored as ThemeMode;
      }
    } catch (e) {
      console.warn('Failed to load theme preference from storage', e);
    }
    return 'system' as ThemeMode;
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

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isLoaded = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredTheme.fulfilled, (state, action) => {
        state.mode = action.payload;
        state.isLoaded = true;
      })
      .addCase(saveThemeMode.fulfilled, (state, action) => {
        state.mode = action.payload;
      });
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
