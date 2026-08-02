/** Filtros combináveis da biblioteca (Etapa 8). Facetas em AND entre si; OR
 * dentro de cada faceta (uma carta casa se tiver qualquer valor selecionado). */
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
  onePrintingPerCard: false,
};

/** Chaves das facetas multivaloradas (arrays de string). */
export type FacetKey = Exclude<keyof LibraryFilters, 'onePrintingPerCard'>;

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function countActiveFilters(f: LibraryFilters): number {
  const facets: FacetKey[] = [
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
  ];
  const facetCount = facets.reduce((sum, key) => sum + f[key].length, 0);
  return facetCount + (f.onePrintingPerCard ? 1 : 0);
}
