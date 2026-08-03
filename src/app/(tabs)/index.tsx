import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDatasetSync } from '@/db/use-dataset-sync';
import { FilterSheet } from '@/features/library/filter-sheet';
import {
  countActiveFilters,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  type LibraryFilters,
  type LibrarySort,
} from '@/features/library/filters';
import { LibraryGrid } from '@/features/library/library-grid';
import { useFilterFacets } from '@/features/library/use-filter-facets';
import { useLibraryQuery } from '@/features/library/use-library-query';
import { useTranslation } from '@/i18n/use-translation';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const sync = useDatasetSync();
  const ready = sync.isSuccess;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<LibrarySort>(DEFAULT_SORT);
  const [filterOpen, setFilterOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  const facets = useFilterFacets(ready);
  const library = useLibraryQuery(filters, debouncedQuery, sort, ready);

  const items = library.data ?? [];
  const activeFilters = countActiveFilters(filters);
  const loading = sync.isPending || (ready && library.isPending);
  const searchingOrFiltering = debouncedQuery.trim().length > 0 || activeFilters > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="subtitle">{t('library.title')}</ThemedText>

        {ready && (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('library.searchPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            <View style={styles.controls}>
              <ThemedText type="small" themeColor="textSecondary">
                {searchingOrFiltering
                  ? t('library.results', { n: items.length })
                  : t('library.printings', { n: items.length })}
              </ThemedText>
              <Pressable
                onPress={() => setFilterOpen(true)}
                style={[styles.filterButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">
                  {t('filters.button')}
                  {activeFilters > 0 ? ` · ${activeFilters}` : ''}
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>

      {loading && (
        <ThemedView style={styles.center}>
          <ActivityIndicator />
          <ThemedText type="default" themeColor="textSecondary">
            {sync.isPending ? t('library.syncing') : t('library.loadingCards')}
          </ThemedText>
        </ThemedView>
      )}

      {sync.isError && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            {t('library.loadError', { msg: sync.error.message })}
          </ThemedText>
        </ThemedView>
      )}

      {ready && !loading && searchingOrFiltering && items.length === 0 && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            {t('library.noResults')}
          </ThemedText>
        </ThemedView>
      )}

      {ready && !loading && items.length > 0 && <LibraryGrid items={items} />}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        facets={facets.data}
        resultCount={items.length}
      />
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
