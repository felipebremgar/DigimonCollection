import { useQuery } from '@tanstack/react-query';

import { fetchCardDataset, fetchDatasetVersion } from '@/api/digimoncard';
import { normalizeDataset } from '@/api/normalize';

import { db } from './client';
import { getCardCount, getDatasetVersion } from './meta';
import { persistDataset } from './persist';

export const DATASET_SYNC_QUERY_KEY = ['dataset-sync'] as const;

export interface DatasetSyncResult {
  /** true se baixou e regravou o dataset nesta execução. */
  synced: boolean;
  version: string | null;
  cardCount: number;
}

/**
 * Garante que o dataset esteja gravado no SQLite local (Etapa 4).
 *
 * Regras:
 * - Se já há dados locais e a versão (ETag) remota não mudou (ou o device está
 *   offline), usa o que está no banco — sem baixar nada.
 * - Se o banco está vazio ou a versão mudou, baixa tudo, normaliza e regrava.
 * - Offline com banco vazio → erro (nada a exibir ainda).
 */
export function useDatasetSync() {
  return useQuery<DatasetSyncResult>({
    queryKey: DATASET_SYNC_QUERY_KEY,
    queryFn: async ({ signal }): Promise<DatasetSyncResult> => {
      const localCount = getCardCount(db);
      const localVersion = getDatasetVersion(db);

      let remoteVersion = '';
      try {
        remoteVersion = await fetchDatasetVersion(signal);
      } catch {
        // Sem conexão: seguimos com o que houver localmente.
      }

      const upToDate = remoteVersion === '' || remoteVersion === localVersion;
      if (localCount > 0 && upToDate) {
        return { synced: false, version: localVersion, cardCount: localCount };
      }

      if (remoteVersion === '' && localCount === 0) {
        throw new Error('Sem conexão e sem dados locais para exibir.');
      }

      const { cards, version } = await fetchCardDataset(signal);
      const dataset = normalizeDataset(cards);
      const effectiveVersion = version || remoteVersion || String(Date.now());
      persistDataset(db, dataset, effectiveVersion);

      return { synced: true, version: effectiveVersion, cardCount: getCardCount(db) };
    },
  });
}
