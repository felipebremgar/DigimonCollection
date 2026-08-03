import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeckMissing } from '@/features/collection/use-deck-missing';
import { deckToText } from '@/features/deck-builder/deck-export';
import { DeckExportModal } from '@/features/deck-builder/deck-export-modal';
import { EGG_DECK_MAX, MAIN_DECK_SIZE, type DeckCardItem } from '@/features/deck-builder/deck-queries';
import { DeckStatsView } from '@/features/deck-builder/deck-stats-view';
import { validateDeck } from '@/features/deck-builder/deck-validation';
import { useDeck } from '@/features/deck-builder/use-deck';
import { useDeckStats } from '@/features/deck-builder/use-deck-stats';
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
  const [exportOpen, setExportOpen] = useState(false);
  const value = name ?? deck.data?.deck.name ?? '';

  const validation = deck.data ? validateDeck(deck.data) : null;
  const hasCards = !!deck.data && deck.data.main.length + deck.data.egg.length > 0;
  const stats = useDeckStats(id, hasCards);
  const missing = useDeckMissing(id, hasCards);

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

          {validation && (
            <View
              style={[
                styles.validation,
                { backgroundColor: validation.valid ? 'rgba(58,160,106,0.18)' : 'rgba(201,119,58,0.18)' },
              ]}>
              <ThemedText type="smallBold" style={{ color: validation.valid ? '#3aa06a' : '#c9773a' }}>
                {validation.valid ? '✓ Deck válido' : '⚠ Deck inválido'}
              </ThemedText>
              {validation.errors.map((error) => (
                <ThemedText key={error} type="small" themeColor="textSecondary">
                  • {error}
                </ThemedText>
              ))}
            </View>
          )}

          <Zone title="Deck principal" count={deck.data.mainCount} max={MAIN_DECK_SIZE} exact cards={deck.data.main} />
          <Zone title="Digi-Egg" count={deck.data.eggCount} max={EGG_DECK_MAX} cards={deck.data.egg} />

          {hasCards && missing.data && (
            <View style={styles.zone}>
              <ThemedText type="smallBold">O QUE FALTA (COLEÇÃO)</ThemedText>
              {missing.data.length === 0 ? (
                <ThemedText type="small" style={{ color: '#3aa06a' }}>
                  ✓ Você já tem todas as cartas deste deck.
                </ThemedText>
              ) : (
                missing.data.map((m) => (
                  <View key={m.cardId} style={styles.cardRow}>
                    <Image style={styles.thumb} source={{ uri: m.artUrl }} contentFit="cover" transition={100} />
                    <View style={styles.cardInfo}>
                      <ThemedText type="small">{m.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {m.number} · tem {m.owned}/{m.required}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={{ color: '#c9773a' }}>
                      faltam {m.missing}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>
          )}

          {hasCards && stats.data && <DeckStatsView stats={stats.data} />}

          {hasCards && (
            <Pressable
              style={[styles.exportButton, { borderColor: theme.textSecondary }]}
              onPress={() => setExportOpen(true)}>
              <ThemedText type="smallBold">Exportar deck</ThemedText>
            </Pressable>
          )}

          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <ThemedText type="smallBold" style={{ color: '#c9773a' }}>
              Excluir deck
            </ThemedText>
          </Pressable>
        </ScrollView>
      )}

      <DeckExportModal
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        text={deck.data ? deckToText(deck.data) : ''}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 20 },
  name: { height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 17, fontWeight: '600' },
  addButton: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  validation: { padding: 12, borderRadius: 10, gap: 4 },
  exportButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zone: { gap: 8 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  thumb: { width: 34, aspectRatio: 430 / 600, borderRadius: 4 },
  cardInfo: { flex: 1 },
  deleteButton: { alignItems: 'center', paddingVertical: 12 },
});
