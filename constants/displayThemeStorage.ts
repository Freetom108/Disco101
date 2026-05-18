import AsyncStorage from '@react-native-async-storage/async-storage';

export const DISPLAY_THEME_KEY = 'display_theme_preference';

export type StoredDisplayTheme = 'light' | 'dark' | 'auto';

export async function loadDisplayThemePreference(): Promise<StoredDisplayTheme> {
  try {
    const raw = await AsyncStorage.getItem(DISPLAY_THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'auto') return raw;
    return 'auto';
  } catch {
    return 'auto';
  }
}

export async function saveDisplayThemePreference(
  value: StoredDisplayTheme,
): Promise<void> {
  try {
    await AsyncStorage.setItem(DISPLAY_THEME_KEY, value);
  } catch {
    /* ignore */
  }
}
