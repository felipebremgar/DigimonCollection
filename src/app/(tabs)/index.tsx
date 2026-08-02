import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDatasetSync } from '@/db/use-dataset-sync';
import { LibraryGrid } from '@/features/library/library-grid';
import { useLibrary } from '@/features/library/use-library';
import { useLibrarySearch } from '@/features/library/use-library-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const theme = useTheme();
  const sync = useDatasetSync();
  const library = useLibrary(sync.isSuccess);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const searching = debouncedQuery.trim().length > 0;
  const search = useLibrarySearch(debouncedQuery, sync.isSuccess);

  const items = searching ? (search.data ?? []) : (library.data ?? []);
  const loading = sync.isPending || (sync.isSuccess && library.isPending);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="subtitle">Biblioteca</ThemedText>

        {sync.isSuccess && (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome, efeito, keyword, type…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        )}

        {sync.isSuccess && !loading && (
          <ThemedText type="small" themeColor="textSecondary">
            {searching ? `${items.length} resultados` : `${items.length} impressões`}
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

      {sync.isSuccess && !loading && searching && items.length === 0 && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            Nenhuma carta encontrada para “{debouncedQuery.trim()}”.
          </ThemedText>
        </ThemedView>
      )}

      {sync.isSuccess && !loading && items.length > 0 && <LibraryGrid items={items} />}
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
    gap: 8,
  },
  search: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
