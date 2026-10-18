import { useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ThemeMode,
  setThemeMode as setModeAction,
  saveThemeMode,
  loadStoredTheme,
  setPalettePreset as setPaletteAction,
  savePalettePreset,
} from '@/store/slices/themeSlice';
import {
  ThemeColors,
  VendorPalettePreset,
  getVendorPalette,
} from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface UseAppThemeReturn {
  theme: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  palettePreset: VendorPalettePreset;
  setThemeMode: (mode: ThemeMode) => void;
  setPalettePreset: (preset: VendorPalettePreset) => void;
  toggleTheme: () => void;
}

export const useAppTheme = (): UseAppThemeReturn => {
  const dispatch = useAppDispatch();
  const systemColorScheme = useColorScheme();
  const { mode, isLoaded, palettePreset = 'warm_obsidian' } = useAppSelector((state) => state.theme);

  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadStoredTheme());
    }
  }, [dispatch, isLoaded]);

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [mode, systemColorScheme]);

  const theme: ThemeColors = useMemo(() => {
    return getVendorPalette(isDark, palettePreset);
  }, [isDark, palettePreset]);

  const setThemeMode = useCallback(
    (newMode: ThemeMode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch(setModeAction(newMode));
      dispatch(saveThemeMode(newMode));
    },
    [dispatch]
  );

  const setPalettePreset = useCallback(
    (newPreset: VendorPalettePreset) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch(setPaletteAction(newPreset));
      dispatch(savePalettePreset(newPreset));
    },
    [dispatch]
  );

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [isDark, setThemeMode]);

  return {
    theme,
    isDark,
    mode,
    palettePreset,
    setThemeMode,
    setPalettePreset,
    toggleTheme,
  };
};
