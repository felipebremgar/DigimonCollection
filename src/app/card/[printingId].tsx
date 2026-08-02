import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardDetailView } from '@/features/library/card-detail';
import { useCardDetail } from '@/features/library/use-card-detail';

export default function CardDetailScreen() {
  const { printingId } = useLocalSearchParams<{ printingId: string }>();
  const detail = useCardDetail(Number(printingId));

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: detail.data?.card.name ?? 'Carta' }} />

      {detail.isPending && (
        <ThemedView style={styles.center}>
          <ActivityIndicator />
        </ThemedView>
      )}

      {(detail.isError || (detail.isSuccess && detail.data === null)) && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            Carta não encontrada.
          </ThemedText>
        </ThemedView>
      )}

      {detail.data && <CardDetailView detail={detail.data} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
