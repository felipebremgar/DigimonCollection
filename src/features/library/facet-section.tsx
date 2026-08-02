import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface FacetSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  initiallyOpen?: boolean;
}

export function FacetSection({
  title,
  options,
  selected,
  onToggle,
  initiallyOpen = false,
}: FacetSectionProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const theme = useTheme();

  if (options.length === 0) return null;

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <ThemedText type="smallBold">
          {title}
          {selected.length > 0 ? ` · ${selected.length}` : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {open ? '▾' : '▸'}
        </ThemedText>
      </Pressable>

      {open && (
        <View style={styles.chips}>
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <Pressable
                key={option}
                onPress={() => onToggle(option)}
                style={[
                  styles.chip,
                  { backgroundColor: isSelected ? theme.text : theme.backgroundElement },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: isSelected ? theme.background : theme.text }}>
                  {option}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
