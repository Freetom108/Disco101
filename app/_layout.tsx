import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  AppThemeProvider,
  useAppTheme,
} from '../context/AppThemeContext';

const ONBOARDING_KEY = 'onboarding_done';

function ThemedStatusBar() {
  const { statusBarStyle } = useAppTheme();
  return <StatusBar style={statusBarStyle} />;
}

function RootGate() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on app start
  }, []);

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootGate />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
