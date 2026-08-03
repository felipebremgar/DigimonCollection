import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from '@/i18n/use-translation';
import { useTheme } from '@/hooks/use-theme';

import { usePrintingCollection } from './use-collection';

/** Marca cópias possuídas e wishlist de uma impressão (Etapa 15). */
export function CollectionControls({ printingId }: { printingId: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const col = usePrintingCollection(printingId);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="default">{t('collection.owned')}</ThemedText>
        <View style={styles.stepper}>
          <Pressable
            style={[styles.step, { backgroundColor: theme.backgroundElement }]}
            onPress={() => col.setOwned(col.quantity - 1)}
            hitSlop={6}>
            <ThemedText type="default">−</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.count}>
            {col.quantity}
          </ThemedText>
          <Pressable
            style={[styles.step, { backgroundColor: theme.backgroundElement }]}
            onPress={() => col.setOwned(col.quantity + 1)}
            hitSlop={6}>
            <ThemedText type="default">+</ThemedText>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={col.toggleWishlist}>
        <ThemedView
          type="backgroundElement"
          style={[styles.wishlist, col.wishlist && { backgroundColor: 'rgba(224,56,79,0.18)' }]}>
          <ThemedText type="smallBold" style={{ color: col.wishlist ? '#e0384f' : theme.text }}>
            {col.wishlist ? t('collection.inWishlist') : t('collection.addWishlist')}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  step: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 28, textAlign: 'center' },
  wishlist: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});
