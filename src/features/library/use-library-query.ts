import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import type { LibraryFilters, LibrarySort } from './filters';
import { queryLibrary, type LibraryItem } from './queries';

/**
 * Lê a biblioteca do SQLite aplicando busca + filtros + ordenação. Roda só com
 * o banco pronto (`enabled`); mantém os resultados anteriores enquanto muda.
 */
export function useLibraryQuery(
  filters: LibraryFilters,
  search: string,
  sort: LibrarySort,
  enabled: boolean,
) {
  return useQuery<LibraryItem[]>({
    queryKey: ['library-query', filters, search.trim(), sort],
    queryFn: () => queryLibrary(db, filters, search.trim(), sort),
    enabled,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
