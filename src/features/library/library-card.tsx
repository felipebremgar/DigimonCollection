import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import type { LibraryItem } from './queries';

// Proporção das cartas do Digimon TCG (~430x600).
const CARD_ASPECT_RATIO = 430 / 600;

// Placeholder sutil enquanto a arte carrega (cinza translúcido).
const PLACEHOLDER = { blurhash: 'L1O|b2~q00_3~qofofof00ayofj[' };

function LibraryCardComponent({ item }: { item: LibraryItem }) {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={{ uri: item.artUrl }}
        placeholder={PLACEHOLDER}
        contentFit="cover"
        transition={200}
        recyclingKey={String(item.printingId)}
        accessibilityLabel={`${item.name} (${item.number})`}
      />
      {item.isAltArt && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>★</ThemedText>
        </View>
      )}
    </View>
  );
}

export const LibraryCard = memo(LibraryCardComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2e',
  },
  image: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffd54a',
    fontSize: 12,
    lineHeight: 14,
  },
});
