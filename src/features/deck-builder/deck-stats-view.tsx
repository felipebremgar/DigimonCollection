import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

import type { CountEntry, DeckStats } from './deck-stats';

const COLOR_HEX: Record<string, string> = {
  Red: '#e0384f',
  Blue: '#2f6bd6',
  Yellow: '#e3b23c',
  Green: '#3aa06a',
  Black: '#6b6b72',
  Purple: '#7a4fd0',
  White: '#c9ccd4',
};

function StatBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View
          style={[styles.fill, { width: `${max > 0 ? (count / max) * 100 : 0}%`, backgroundColor: color }]}
        />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
        {count}
      </ThemedText>
    </View>
  );
}

function Section({
  title,
  entries,
  colorFor,
}: {
  title: string;
  entries: CountEntry[];
  colorFor?: (label: string) => string;
}) {
  const theme = useTheme();
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map((e) => e.count));
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {entries.map((entry) => (
        <StatBar
          key={entry.label}
          label={entry.label}
          count={entry.count}
          max={max}
          color={colorFor?.(entry.label) ?? theme.textSecondary}
        />
      ))}
    </View>
  );
}

export function DeckStatsView({ stats }: { stats: DeckStats }) {
  return (
    <View style={styles.container}>
      <Section title="Curva de custo (main)" entries={stats.costCurve} />
      <Section title="Cores" entries={stats.colors} colorFor={(l) => COLOR_HEX[l] ?? '#888'} />
      <Section title="Levels" entries={stats.levels} />
      <Section title="Categorias" entries={stats.categories} />
      <Section title="Types" entries={stats.types} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  section: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 64 },
  track: { flex: 1, height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, minWidth: 2 },
  count: { width: 28, textAlign: 'right' },
});
