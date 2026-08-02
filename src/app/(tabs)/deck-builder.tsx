import { Link, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EGG_DECK_MAX, MAIN_DECK_SIZE, type DeckSummary } from '@/features/deck-builder/deck-queries';
import { useDecks } from '@/features/deck-builder/use-decks';
import { useTheme } from '@/hooks/use-theme';

function DeckRow({ deck, onDelete }: { deck: DeckSummary; onDelete: () => void }) {
  const valid = deck.mainCount === MAIN_DECK_SIZE && deck.eggCount <= EGG_DECK_MAX;
  return (
    <Link href={{ pathname: '/deck/[deckId]', params: { deckId: deck.id } }} asChild>
      <Pressable>
        <ThemedView type="backgroundElement" style={styles.row}>
          <View style={styles.rowInfo}>
            <ThemedText type="default">{deck.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Main {deck.mainCount}/{MAIN_DECK_SIZE} · Digi-Egg {deck.eggCount}/{EGG_DECK_MAX}
            </ThemedText>
          </View>
          <View style={[styles.dot, { backgroundColor: valid ? '#3aa06a' : '#c9773a' }]} />
          <Pressable hitSlop={10} onPress={onDelete}>
            <ThemedText type="default" themeColor="textSecondary">
              ✕
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

export default function DeckBuilderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const decks = useDecks(true);

  const createDeck = () => {
    const id = decks.create('Novo deck');
    router.push({ pathname: '/deck/[deckId]', params: { deckId: id } });
  };

  const confirmDelete = (deck: DeckSummary) => {
    Alert.alert('Excluir deck', `Excluir "${deck.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => decks.remove(deck.id) },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="subtitle">Deck Builder</ThemedText>
        <Pressable style={[styles.newButton, { backgroundColor: theme.text }]} onPress={createDeck}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            + Novo deck
          </ThemedText>
        </Pressable>
      </SafeAreaView>

      {decks.decks.length === 0 ? (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            Nenhum deck ainda. Crie o primeiro!
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={decks.decks}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <DeckRow deck={item} onDelete={() => confirmDelete(item)} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  rowInfo: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
