import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EGG_DECK_MAX, MAIN_DECK_SIZE, type DeckCardItem } from '@/features/deck-builder/deck-queries';
import { useDeck } from '@/features/deck-builder/use-deck';
import { useDecks } from '@/features/deck-builder/use-decks';
import { useTheme } from '@/hooks/use-theme';

function DeckCardRow({ item }: { item: DeckCardItem }) {
  return (
    <View style={styles.cardRow}>
      <Image style={styles.thumb} source={{ uri: item.artUrl }} contentFit="cover" transition={100} />
      <View style={styles.cardInfo}>
        <ThemedText type="small">{item.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.number}
        </ThemedText>
      </View>
      <ThemedText type="smallBold">×{item.quantity}</ThemedText>
    </View>
  );
}

function Zone({
  title,
  count,
  max,
  exact,
  cards,
}: {
  title: string;
  count: number;
  max: number;
  exact?: boolean;
  cards: DeckCardItem[];
}) {
  const valid = exact ? count === max : count <= max;
  return (
    <View style={styles.zone}>
      <View style={styles.zoneHeader}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="smallBold" style={{ color: valid ? '#3aa06a' : '#c9773a' }}>
          {count}/{max}
        </ThemedText>
      </View>
      {cards.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhuma carta ainda — toque em “Adicionar cartas”.
        </ThemedText>
      ) : (
        cards.map((c) => <DeckCardRow key={c.deckCardId} item={c} />)
      )}
    </View>
  );
}

export default function DeckScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const id = Number(deckId);
  const deck = useDeck(id);
  const decks = useDecks(false);

  const [name, setName] = useState<string | null>(null);
  const value = name ?? deck.data?.deck.name ?? '';

  const confirmDelete = () => {
    Alert.alert('Excluir deck', 'Excluir este deck?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          decks.remove(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: deck.data?.deck.name ?? 'Deck' }} />

      {deck.isPending && (
        <ThemedView style={styles.center}>
          <ActivityIndicator />
        </ThemedView>
      )}

      {(deck.isError || (deck.isSuccess && deck.data === null)) && (
        <ThemedView style={styles.center}>
          <ThemedText type="default" themeColor="textSecondary">
            Deck não encontrado.
          </ThemedText>
        </ThemedView>
      )}

      {deck.data && (
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            value={value}
            onChangeText={setName}
            onEndEditing={() => {
              const trimmed = value.trim();
              if (trimmed && trimmed !== deck.data?.deck.name) decks.rename(id, trimmed);
            }}
            style={[styles.name, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            placeholder="Nome do deck"
            placeholderTextColor={theme.textSecondary}
          />

          <Link href={{ pathname: '/deck/[deckId]/add', params: { deckId: id } }} asChild>
            <Pressable style={[styles.addButton, { backgroundColor: theme.text }]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Adicionar cartas
              </ThemedText>
            </Pressable>
          </Link>

          <Zone title="Deck principal" count={deck.data.mainCount} max={MAIN_DECK_SIZE} exact cards={deck.data.main} />
          <Zone title="Digi-Egg" count={deck.data.eggCount} max={EGG_DECK_MAX} cards={deck.data.egg} />

          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <ThemedText type="smallBold" style={{ color: '#c9773a' }}>
              Excluir deck
            </ThemedText>
          </Pressable>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 20 },
  name: { height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 17, fontWeight: '600' },
  addButton: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  zone: { gap: 8 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  thumb: { width: 34, aspectRatio: 430 / 600, borderRadius: 4 },
  cardInfo: { flex: 1 },
  deleteButton: { alignItems: 'center', paddingVertical: 12 },
});
