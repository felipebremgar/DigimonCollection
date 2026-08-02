import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CARD_CATEGORIES, COLORS, VERSIONS } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

import { FacetSection } from './facet-section';
import { countActiveFilters, EMPTY_FILTERS, toggleValue, type FacetKey, type LibraryFilters } from './filters';
import type { FilterFacets } from './queries';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
  facets: FilterFacets | undefined;
  resultCount: number;
}

export function FilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  facets,
  resultCount,
}: FilterSheetProps) {
  const theme = useTheme();

  const toggle = (key: FacetKey) => (value: string) =>
    onChange({ ...filters, [key]: toggleValue(filters[key], value) });

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
            <FacetSection title="Forma" options={facets?.forms ?? []} selected={filters.forms} onToggle={toggle('forms')} />
            <FacetSection title="Attribute" options={facets?.attributes ?? []} selected={filters.attributes} onToggle={toggle('attributes')} />
            <FacetSection title="Versão" options={[...VERSIONS]} selected={filters.versions} onToggle={toggle('versions')} />
            <FacetSection title="Coleção" options={facets?.sets ?? []} selected={filters.sets} onToggle={toggle('sets')} />
            <FacetSection title="Type" options={facets?.types ?? []} selected={filters.types} onToggle={toggle('types')} />
            <FacetSection title="Keyword" options={facets?.keywords ?? []} selected={filters.keywords} onToggle={toggle('keywords')} />
          </ScrollView>

          <Pressable
            style={[styles.applyButton, { backgroundColor: theme.text }]}
            onPress={onClose}>
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
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
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
