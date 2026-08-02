import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { LibraryCard } from './library-card';
import type { LibraryItem } from './queries';

const NUM_COLUMNS = 3;

/** Grade virtualizada da biblioteca (FlashList + expo-image). */
export function LibraryGrid({ items }: { items: LibraryItem[] }) {
  const renderItem = useCallback(({ item }: { item: LibraryItem }) => <LibraryCard item={item} />, []);
  const keyExtractor = useCallback((item: LibraryItem) => String(item.printingId), []);

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 4,
  },
});
