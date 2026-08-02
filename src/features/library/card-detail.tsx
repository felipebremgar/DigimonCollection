import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import type { CardDetail, DetailPrinting } from './card-detail-queries';
import { HighlightedEffect } from './highlighted-effect';

const COLOR_HEX: Record<string, string> = {
  Red: '#e0384f',
  Blue: '#2f6bd6',
  Yellow: '#e3b23c',
  Green: '#3aa06a',
  Black: '#3a3a40',
  Purple: '#7a4fd0',
  White: '#c9ccd4',
};

function ColorDot({ name }: { name: string }) {
  return <View style={[styles.colorDot, { backgroundColor: COLOR_HEX[name] ?? '#888' }]} />;
}

function Chip({ label }: { label: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.chip}>
      <ThemedText type="small">{label}</ThemedText>
    </ThemedView>
  );
}

function Attribute({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '' || value === '-') return null;
  return (
    <View style={styles.attribute}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{String(value)}</ThemedText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

export function CardDetailView({ detail }: { detail: CardDetail }) {
  const [selectedId, setSelectedId] = useState(detail.printings[0]?.id);
  const selected: DetailPrinting | undefined = useMemo(
    () => detail.printings.find((p) => p.id === selectedId) ?? detail.printings[0],
    [detail.printings, selectedId],
  );

  const { card } = detail;
  const illustrator = selected?.illustrator ?? card.illustrator;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {selected && (
        <Image
          style={styles.hero}
          source={{ uri: selected.artUrl }}
          contentFit="contain"
          transition={200}
          accessibilityLabel={`${card.name} (${card.number})`}
        />
      )}

      {detail.printings.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {detail.printings.map((p) => (
            <Pressable key={p.id} onPress={() => setSelectedId(p.id)}>
              <Image
                style={[styles.thumb, p.id === selected?.id && styles.thumbSelected]}
                source={{ uri: p.artUrl }}
                contentFit="cover"
                transition={100}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.titleRow}>
        <ThemedText type="subtitle">{card.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {card.number} · {card.setCode}
          {selected ? ` · ${selected.version}` : ''}
        </ThemedText>
      </View>

      <View style={styles.chipRow}>
        {detail.colors.map((c) => (
          <ThemedView key={c} type="backgroundElement" style={styles.chip}>
            <ColorDot name={c} />
            <ThemedText type="small">{c}</ThemedText>
          </ThemedView>
        ))}
        <Chip label={card.category} />
        {selected && <Chip label={selected.rarity} />}
      </View>

      <ThemedView type="backgroundElement" style={styles.attributeGrid}>
        <Attribute label="Level" value={card.level} />
        <Attribute label="Form" value={card.form} />
        <Attribute label="Attribute" value={card.attribute} />
        <Attribute label="DP" value={card.dp} />
        <Attribute label="Play Cost" value={card.playCost} />
        <Attribute label="Digivolve" value={card.digivolutionCost} />
        <Attribute label="Use Cost" value={card.useCost} />
        <Attribute label="Cópias" value={card.copyLimit} />
        {detail.hasLink && <Attribute label="Link Cost" value={detail.linkCost ?? '—'} />}
      </ThemedView>

      {detail.types.length > 0 && (
        <Section title="Types">
          <View style={styles.chipRow}>
            {detail.types.map((t) => (
              <Chip key={t} label={t} />
            ))}
          </View>
        </Section>
      )}

      {card.effect !== '' && (
        <Section title="Efeito">
          <HighlightedEffect text={card.effect} keywords={detail.keywords} />
        </Section>
      )}

      {card.inheritedEffect && (
        <Section title="Herança">
          <HighlightedEffect text={card.inheritedEffect} keywords={detail.keywords} />
        </Section>
      )}

      {card.securityEffect && (
        <Section title="Segurança">
          <HighlightedEffect text={card.securityEffect} keywords={detail.keywords} />
        </Section>
      )}

      {detail.keywords.length > 0 && (
        <Section title="Keywords">
          <View style={styles.chipRow}>
            {detail.keywords.map((k) => (
              <Chip key={k} label={k} />
            ))}
          </View>
        </Section>
      )}

      <Section title="Ilustração">
        <ThemedText type="default">{illustrator}</ThemedText>
        {selected?.printingNotes && (
          <ThemedText type="small" themeColor="textSecondary">
            {selected.printingNotes}
          </ThemedText>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  hero: {
    width: '100%',
    aspectRatio: 430 / 600,
    borderRadius: 12,
  },
  thumbRow: {
    gap: 8,
    paddingVertical: 4,
  },
  thumb: {
    width: 52,
    aspectRatio: 430 / 600,
    borderRadius: 6,
    opacity: 0.6,
  },
  thumbSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#3c87f7',
  },
  titleRow: {
    gap: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    padding: 14,
    borderRadius: 12,
  },
  attribute: {
    width: '33%',
    gap: 2,
  },
  section: {
    gap: 8,
  },
});
