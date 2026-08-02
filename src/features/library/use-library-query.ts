import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import type { LibraryFilters } from './filters';
import { queryLibrary, type LibraryItem } from './queries';

/**
 * Lê a biblioteca do SQLite aplicando busca + filtros. Roda só com o banco
 * pronto (`enabled`); mantém os resultados anteriores enquanto muda a query.
 */
export function useLibraryQuery(filters: LibraryFilters, search: string, enabled: boolean) {
  return useQuery<LibraryItem[]>({
    queryKey: ['library-query', filters, search.trim()],
    queryFn: () => queryLibrary(db, filters, search.trim()),
    enabled,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
