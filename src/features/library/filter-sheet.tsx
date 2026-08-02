import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CARD_CATEGORIES, COLORS, VERSIONS } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

import { FacetSection } from './facet-section';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  SORT_LABELS,
  toggleValue,
  type FacetKey,
  type LibraryFilters,
  type LibrarySort,
  type SortKey,
} from './filters';
import type { FilterFacets } from './queries';
import { usePresets } from './use-presets';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
  facets: FilterFacets | undefined;
  resultCount: number;
}

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export function FilterSheet(props: FilterSheetProps) {
  const { visible, onClose, filters, onChange, sort, onSortChange, facets, resultCount } = props;
  const theme = useTheme();
  const presets = usePresets(visible);
  const [presetName, setPresetName] = useState('');

  const toggle = (key: FacetKey) => (value: string) =>
    onChange({ ...filters, [key]: toggleValue(filters[key], value) });

  const setSortKey = (key: SortKey) =>
    onSortChange({ key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc' });

  const chipStyle = (active: boolean) => [
    styles.pill,
    { backgroundColor: active ? theme.text : theme.backgroundElement },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Filtros</ThemedText>
            <Pressable onPress={() => onChange(EMPTY_FILTERS)}>
              <ThemedText type="link" themeColor="textSecondary">
                Limpar ({countActiveFilters(filters)})
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Ordenação */}
            <View style={styles.block}>
              <ThemedText type="smallBold">Ordenar por</ThemedText>
              <View style={styles.chips}>
                {SORT_KEYS.map((key) => {
                  const active = sort.key === key;
                  return (
                    <Pressable key={key} onPress={() => setSortKey(key)} style={chipStyle(active)}>
                      <ThemedText type="small" style={{ color: active ? theme.background : theme.text }}>
                        {SORT_LABELS[key]}
                        {active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Presets */}
            <View style={styles.block}>
              <ThemedText type="smallBold">Presets</ThemedText>
              {presets.presets.length > 0 && (
                <View style={styles.chips}>
                  {presets.presets.map((preset) => (
                    <View key={preset.id} style={chipStyle(false)}>
                      <Pressable
                        onPress={() => {
                          onChange(preset.filters);
                          onSortChange(preset.sort);
                        }}>
                        <ThemedText type="small">{preset.name}</ThemedText>
                      </Pressable>
                      <Pressable onPress={() => presets.remove(preset.id)}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {'  ✕'}
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.saveRow}>
                <TextInput
                  value={presetName}
                  onChangeText={setPresetName}
                  placeholder="Nome do preset"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
                <Pressable
                  disabled={presetName.trim() === ''}
                  onPress={() => {
                    presets.save(presetName.trim(), filters, sort);
                    setPresetName('');
                  }}
                  style={[styles.pill, { backgroundColor: theme.backgroundElement, opacity: presetName.trim() ? 1 : 0.5 }]}>
                  <ThemedText type="smallBold">Salvar</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <ThemedText type="smallBold">Uma impressão por carta</ThemedText>
              <Switch
                value={filters.onePrintingPerCard}
                onValueChange={(v) => onChange({ ...filters, onePrintingPerCard: v })}
              />
            </View>

            <FacetSection title="Cor" options={[...COLORS]} selected={filters.colors} onToggle={toggle('colors')} initiallyOpen />
            <FacetSection title="Categoria" options={[...CARD_CATEGORIES]} selected={filters.categories} onToggle={toggle('categories')} initiallyOpen />
            <FacetSection title="Raridade" options={facets?.rarities ?? []} selected={filters.rarities} onToggle={toggle('rarities')} />
            <FacetSection title="Level" options={facets?.levels ?? []} selected={filters.levels} onToggle={toggle('levels')} />
            <FacetSection title="Custo de jogo" options={facets?.playCosts ?? []} selected={filters.playCosts} onToggle={toggle('playCosts')} />
            <FacetSection title="Custo de digivolução" options={facets?.digivolveCosts ?? []} selected={filters.digivolveCosts} onToggle={toggle('digivolveCosts')} />
            <FacetSection title="Custo de uso" options={facets?.useCosts ?? []} selected={filters.useCosts} onToggle={toggle('useCosts')} />
            <FacetSection title="Forma" options={facets?.forms ?? []} selected={filters.forms} onToggle={toggle('forms')} />
            <FacetSection title="Attribute" options={facets?.attributes ?? []} selected={filters.attributes} onToggle={toggle('attributes')} />
            <FacetSection title="Versão" options={[...VERSIONS]} selected={filters.versions} onToggle={toggle('versions')} />
            <FacetSection title="Coleção" options={facets?.sets ?? []} selected={filters.sets} onToggle={toggle('sets')} />
            <FacetSection title="Type" options={facets?.types ?? []} selected={filters.types} onToggle={toggle('types')} />
            <FacetSection title="Keyword" options={facets?.keywords ?? []} selected={filters.keywords} onToggle={toggle('keywords')} />
          </ScrollView>

          <Pressable style={[styles.applyButton, { backgroundColor: theme.text }]} onPress={onClose}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Ver {resultCount} resultados
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  block: { paddingVertical: 10, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 38, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  applyButton: {
    margin: 16,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
