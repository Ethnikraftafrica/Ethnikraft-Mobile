import { useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ThemeMode,
  setThemeMode as setModeAction,
  saveThemeMode,
  loadStoredTheme,
} from '@/store/slices/themeSlice';
import { LightTheme, DarkTheme, ThemeColors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface UseAppThemeReturn {
  theme: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useAppTheme = (): UseAppThemeReturn => {
  const dispatch = useAppDispatch();
  const systemColorScheme = useColorScheme();
  const { mode, isLoaded } = useAppSelector((state) => state.theme);

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
    return isDark ? DarkTheme : LightTheme;
  }, [isDark]);

  const setThemeMode = useCallback(
    (newMode: ThemeMode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch(setModeAction(newMode));
      dispatch(saveThemeMode(newMode));
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
    setThemeMode,
    toggleTheme,
  };
};
