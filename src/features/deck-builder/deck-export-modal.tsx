import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function DeckExportModal({
  visible,
  onClose,
  text,
}: {
  visible: boolean;
  onClose: () => void;
  text: string;
}) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Exportar deck</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText type="link" themeColor="textSecondary">
                Fechar
              </ThemedText>
            </Pressable>
          </View>

          <TextInput
            value={text}
            multiline
            editable={false}
            style={[styles.text, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />

          <Pressable style={[styles.copyButton, { backgroundColor: theme.text }]} onPress={copy}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {copied ? 'Copiado!' : 'Copiar código'}
            </ThemedText>
          </Pressable>
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
  copyButton: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
