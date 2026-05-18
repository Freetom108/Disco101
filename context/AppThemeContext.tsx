import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  loadDisplayThemePreference,
  saveDisplayThemePreference,
  type StoredDisplayTheme,
} from '../constants/displayThemeStorage';
import { darkPalette, lightPalette, type AppPalette } from '../constants/themePalettes';

export type AppThemeContextValue = {
  preference: StoredDisplayTheme;
  setPreference: (value: StoredDisplayTheme) => void;
  resolvedScheme: 'light' | 'dark';
  colors: AppPalette;
  statusBarStyle: 'light' | 'dark';
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<StoredDisplayTheme>('auto');

  useEffect(() => {
    void loadDisplayThemePreference().then(setPreferenceState);
  }, []);

  const setPreference = useCallback((value: StoredDisplayTheme) => {
    setPreferenceState(value);
    void saveDisplayThemePreference(value);
  }, []);

  const resolvedScheme = useMemo<'light' | 'dark'>(() => {
    if (preference === 'auto') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const colors = useMemo(
    () => (resolvedScheme === 'dark' ? darkPalette() : lightPalette()),
    [resolvedScheme],
  );

  const statusBarStyle: 'light' | 'dark' =
    resolvedScheme === 'dark' ? 'light' : 'dark';

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      colors,
      statusBarStyle,
    }),
    [preference, setPreference, resolvedScheme, colors, statusBarStyle],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
}
