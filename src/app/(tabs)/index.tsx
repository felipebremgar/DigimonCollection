import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDatasetSync } from '@/db/use-dataset-sync';
import { LibraryGrid } from '@/features/library/library-grid';
import { useLibrary } from '@/features/library/use-library';

export default function LibraryScreen() {
  const sync = useDatasetSync();
  const library = useLibrary(sync.isSuccess);

  const loading = sync.isPending || (sync.isSuccess && library.isPending);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="subtitle">Biblioteca</ThemedText>
        {sync.isSuccess && library.isSuccess && (
          <ThemedText type="small" themeColor="textSecondary">
            {library.data.length} impressões
            {sync.data.synced ? ' · recém-sincronizadas' : ''}
          </ThemedText>
        )}
      </SafeAreaView>

      {loading && (
        <ThemedView style={styles.center}>
          <ActivityIndicator />
          <ThemedText type="default" themeColor="textSecondary">
            {sync.isPending ? 'Sincronizando o catálogo…' : 'Carregando cartas…'}
          </ThemedText>
        </ThemedView>
      )}

      {sync.isError && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            Não foi possível carregar as cartas: {sync.error.message}
          </ThemedText>
        </ThemedView>
      )}

      {library.isSuccess && <LibraryGrid items={library.data} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
