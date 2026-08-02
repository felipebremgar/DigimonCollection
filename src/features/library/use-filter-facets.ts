import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { getFilterFacets, type FilterFacets } from './queries';

/** Valores distintos do dataset para popular os seletores de filtro. */
export function useFilterFacets(enabled: boolean) {
  return useQuery<FilterFacets>({
    queryKey: ['filter-facets'],
    queryFn: () => getFilterFacets(db),
    enabled,
    staleTime: Infinity,
  });
}
