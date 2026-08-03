import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ApiProvider } from '@/api/provider';
import { DatabaseProvider } from '@/db/provider';
import { PreferencesProvider, usePreferences } from '@/preferences/preferences';

function ThemedNavigation() {
  const { colorScheme } = usePreferences();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApiProvider>
        <DatabaseProvider>
          <PreferencesProvider>
            <ThemedNavigation />
          </PreferencesProvider>
        </DatabaseProvider>
      </ApiProvider>
    </GestureHandlerRootView>
  );
}
