/** Filtros combináveis da biblioteca (Etapas 8 e 9). Facetas em AND entre si;
 * OR dentro de cada faceta (uma carta casa se tiver qualquer valor). */
export interface LibraryFilters {
  colors: string[];
  categories: string[];
  rarities: string[];
  sets: string[];
  versions: string[];
  levels: string[];
  forms: string[];
  attributes: string[];
  types: string[];
  keywords: string[];
  playCosts: string[];
  digivolveCosts: string[];
  useCosts: string[];
  /** true = uma impressão por carta (só a arte Normal); false = todas as artes. */
  onePrintingPerCard: boolean;
}

export const EMPTY_FILTERS: LibraryFilters = {
  colors: [],
  categories: [],
  rarities: [],
  sets: [],
  versions: [],
  levels: [],
  forms: [],
  attributes: [],
  types: [],
  keywords: [],
  playCosts: [],
  digivolveCosts: [],
  useCosts: [],
  onePrintingPerCard: false,
};

/** Chaves das facetas multivaloradas (arrays de string). */
export type FacetKey = Exclude<keyof LibraryFilters, 'onePrintingPerCard'>;

const FACET_KEYS: FacetKey[] = [
  'colors',
  'categories',
  'rarities',
  'sets',
  'versions',
  'levels',
  'forms',
  'attributes',
  'types',
  'keywords',
  'playCosts',
  'digivolveCosts',
  'useCosts',
];

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function countActiveFilters(f: LibraryFilters): number {
  const facetCount = FACET_KEYS.reduce((sum, key) => sum + f[key].length, 0);
  return facetCount + (f.onePrintingPerCard ? 1 : 0);
}

// --- Ordenação (Etapa 9) ---

export type SortKey = 'number' | 'level' | 'dp' | 'playCost' | 'rarity';
export type SortDir = 'asc' | 'desc';

export interface LibrarySort {
  key: SortKey;
  dir: SortDir;
}

export const DEFAULT_SORT: LibrarySort = { key: 'number', dir: 'asc' };

export const SORT_LABELS: Record<SortKey, string> = {
  number: 'Numeração',
  level: 'Level',
  dp: 'DP',
  playCost: 'Custo',
  rarity: 'Raridade',
};
