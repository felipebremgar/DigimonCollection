import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/db/client';
import { useTheme } from '@/hooks/use-theme';

import { importDeck } from './deck-export';

export function DeckImportModal({
  visible,
  onClose,
  onImported,
}: {
  visible: boolean;
  onClose: () => void;
  onImported: (deckId: number) => void;
}) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const paste = async () => setText(await Clipboard.getStringAsync());

  const doImport = () => {
    const result = importDeck(db, text);
    if (result.imported === 0) {
      setError('Nenhuma carta reconhecida. Verifique o formato (ex.: "4 BT1-009").');
      return;
    }
    setText('');
    setError(null);
    onImported(result.deckId);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Importar deck</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText type="link" themeColor="textSecondary">
                Fechar
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Cole o código do deck (linhas “quantidade numeração”, ex.: “4 BT1-009”).
          </ThemedText>

          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="4 BT1-009&#10;3 BT1-010&#10;…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.text, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />

          {error && (
            <ThemedText type="small" style={{ color: '#c9773a' }}>
              {error}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}
              onPress={paste}>
              <ThemedText type="smallBold">Colar</ThemedText>
            </Pressable>
            <Pressable
              disabled={text.trim() === ''}
              style={[styles.button, { backgroundColor: theme.text, opacity: text.trim() ? 1 : 0.5 }]}
              onPress={doImport}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Importar
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { flex: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
