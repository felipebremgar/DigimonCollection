import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/i18n/use-translation';
import { useTheme } from '@/hooks/use-theme';

/** UI de fallback quando o ErrorBoundary captura um erro. */
export function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle">{t('error.title')}</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.center}>
          {t('error.message')}
        </ThemedText>
        {__DEV__ && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {error.message}
          </ThemedText>
        )}
        <Pressable style={[styles.button, { backgroundColor: theme.text }]} onPress={onRetry}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {t('error.retry')}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  center: { textAlign: 'center' },
  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
