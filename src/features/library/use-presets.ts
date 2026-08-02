import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/db/client';

import type { LibraryFilters, LibrarySort } from './filters';
import { deletePreset, listPresets, savePreset, type Preset } from './presets';

/** Presets de filtro+ordenação salvos localmente (Etapa 9). */
export function usePresets(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery<Preset[]>({
    queryKey: ['presets'],
    queryFn: () => listPresets(db),
    enabled,
    staleTime: Infinity,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['presets'] });

  return {
    presets: query.data ?? [],
    save: (name: string, filters: LibraryFilters, sort: LibrarySort) => {
      savePreset(db, name, filters, sort);
      invalidate();
    },
    remove: (id: number) => {
      deletePreset(db, id);
      invalidate();
    },
  };
}
