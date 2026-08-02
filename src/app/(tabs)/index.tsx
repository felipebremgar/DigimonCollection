import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDatasetSync } from '@/db/use-dataset-sync';

export default function LibraryScreen() {
  const sync = useDatasetSync();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <ThemedText type="subtitle">Biblioteca</ThemedText>

        {sync.isPending && (
          <ThemedView style={styles.row}>
            <ActivityIndicator />
            <ThemedText type="default" themeColor="textSecondary">
              Sincronizando o catálogo de cartas…
            </ThemedText>
          </ThemedView>
        )}

        {sync.isError && (
          <ThemedText type="default" themeColor="textSecondary">
            Não foi possível carregar as cartas: {sync.error.message}
          </ThemedText>
        )}

        {sync.isSuccess && (
          <ThemedText type="default" themeColor="textSecondary">
            {sync.data.cardCount} cartas disponíveis offline
            {sync.data.synced ? ' (recém-sincronizadas).' : '.'}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
