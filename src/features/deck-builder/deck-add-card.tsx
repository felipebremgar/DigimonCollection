import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LibraryItem } from '@/features/library/queries';

const PLACEHOLDER = { blurhash: 'L1O|b2~q00_3~qofofof00ayofj[' };

interface DeckAddCardProps {
  item: LibraryItem;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}

function DeckAddCardComponent({ item, count, onAdd, onRemove }: DeckAddCardProps) {
  return (
    <Pressable style={styles.container} onPress={onAdd}>
      <Image
        style={styles.image}
        source={{ uri: item.artUrl }}
        placeholder={PLACEHOLDER}
        contentFit="cover"
        transition={200}
        recyclingKey={String(item.printingId)}
        cachePolicy="memory-disk"
        priority="low"
        accessibilityLabel={`${item.name} (${item.number})`}
      />
      {count > 0 && (
        <View style={styles.overlay}>
          <Pressable style={styles.stepButton} onPress={onRemove} hitSlop={6}>
            <ThemedText style={styles.stepText}>−</ThemedText>
          </Pressable>
          <View style={styles.countPill}>
            <ThemedText style={styles.countText}>{count}</ThemedText>
          </View>
          <View style={styles.stepButton}>
            <ThemedText style={styles.stepText}>+</ThemedText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export const DeckAddCard = memo(DeckAddCardComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    aspectRatio: 430 / 600,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2e',
  },
  image: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  stepButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  stepText: { color: '#fff', fontSize: 15, lineHeight: 17 },
  countPill: { paddingHorizontal: 8 },
  countText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
