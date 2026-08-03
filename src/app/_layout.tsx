import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ApiProvider } from '@/api/provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { DatabaseProvider } from '@/db/provider';
import { Onboarding } from '@/features/onboarding/onboarding';
import { useOnboarding } from '@/features/onboarding/use-onboarding';
import { PreferencesProvider, usePreferences } from '@/preferences/preferences';

function ThemedNavigation() {
  const { colorScheme } = usePreferences();
  const onboarding = useOnboarding();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {!onboarding.seen && (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding onDone={onboarding.complete} />
        </View>
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ApiProvider>
          <DatabaseProvider>
            <PreferencesProvider>
              <ThemedNavigation />
            </PreferencesProvider>
          </DatabaseProvider>
        </ApiProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
