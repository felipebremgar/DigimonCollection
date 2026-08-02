import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDatasetSync } from '@/db/use-dataset-sync';
import { DeckAddCard } from '@/features/deck-builder/deck-add-card';
import { EGG_DECK_MAX, MAIN_DECK_SIZE } from '@/features/deck-builder/deck-queries';
import { useDeck } from '@/features/deck-builder/use-deck';
import { useDeckEditor } from '@/features/deck-builder/use-deck-editor';
import { EMPTY_FILTERS, DEFAULT_SORT } from '@/features/library/filters';
import type { LibraryItem } from '@/features/library/queries';
import { useLibraryQuery } from '@/features/library/use-library-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';

const NUM_COLUMNS = 3;

export default function AddCardsScreen() {
  const theme = useTheme();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const id = Number(deckId);

  const sync = useDatasetSync();
  const ready = sync.isSuccess;
  const deck = useDeck(id);
  const editor = useDeckEditor(id);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const library = useLibraryQuery(EMPTY_FILTERS, debouncedQuery, DEFAULT_SORT, ready);
  const items = library.data ?? [];

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  }, []);

  const addCard = useCallback(
    (item: LibraryItem) => {
      const result = editor.add(item);
      if (!result.added) {
        showNotice(
          result.limit === 0
            ? `${item.name} é banida (0 cópias).`
            : `Limite de ${result.limit} cópia(s) atingido: ${item.name}.`,
        );
      }
    },
    [editor, showNotice],
  );

  const renderItem = useCallback(
    ({ item }: { item: LibraryItem }) => (
      <DeckAddCard
        item={item}
        count={editor.counts[item.cardId] ?? 0}
        onAdd={() => addCard(item)}
        onRemove={() => editor.remove(item)}
      />
    ),
    [editor, addCard],
  );

  const mainCount = deck.data?.mainCount ?? 0;
  const eggCount = deck.data?.eggCount ?? 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Adicionar cartas' }} />

      <ThemedView type="backgroundElement" style={styles.summary}>
        <ThemedText type="smallBold" style={{ color: mainCount === MAIN_DECK_SIZE ? '#3aa06a' : theme.text }}>
          Main {mainCount}/{MAIN_DECK_SIZE}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: eggCount <= EGG_DECK_MAX ? '#3aa06a' : '#c9773a' }}>
          Digi-Egg {eggCount}/{EGG_DECK_MAX}
        </ThemedText>
      </ThemedView>

      {notice && (
        <View style={styles.notice}>
          <ThemedText type="small" style={styles.noticeText}>
            {notice}
          </ThemedText>
        </View>
      )}

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar carta para adicionar…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {sync.isPending && (
        <ThemedView style={styles.center}>
          <ActivityIndicator />
          <ThemedText type="default" themeColor="textSecondary">
            Sincronizando o catálogo…
          </ThemedText>
        </ThemedView>
      )}

      {ready && (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.printingId)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          keyboardDismissMode="on-drag"
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
  },
  notice: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(224,160,60,0.22)',
  },
  noticeText: { color: '#c9773a' },
  searchWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  search: { height: 40, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 },
  grid: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
