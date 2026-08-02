import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renderiza o texto de efeito destacando as keywords (＜...＞) da carta e os
 * tempos entre colchetes ([On Play], [When Digivolving]...).
 */
export function HighlightedEffect({ text, keywords }: { text: string; keywords: string[] }) {
  const tokens = [...keywords.map(escapeRegExp), '\\[[^\\]]+\\]'];
  const regex = new RegExp(`(${tokens.join('|')})`, 'g');
  const parts = text.split(regex).filter((part) => part !== '');
  const keywordSet = new Set(keywords);

  return (
    <ThemedText type="default">
      {parts.map((part, index) => {
        if (keywordSet.has(part)) {
          return (
            <ThemedText key={index} style={styles.keyword}>
              {part}
            </ThemedText>
          );
        }
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <ThemedText key={index} style={styles.timing}>
              {part}
            </ThemedText>
          );
        }
        return part;
      })}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  keyword: {
    color: '#3c87f7',
    fontWeight: '700',
  },
  timing: {
    fontWeight: '700',
  },
});
