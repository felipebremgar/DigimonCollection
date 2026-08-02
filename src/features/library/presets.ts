import { desc, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { filterPreset } from '@/db/schema';

import type { LibraryFilters, LibrarySort } from './filters';

export interface Preset {
  id: number;
  name: string;
  filters: LibraryFilters;
  sort: LibrarySort;
}

interface PresetPayload {
  filters: LibraryFilters;
  sort: LibrarySort;
}

/** Lista os presets salvos, mais recentes primeiro (id desc — confiável mesmo
 * com created_at empatado no mesmo segundo). */
export function listPresets(db: Database): Preset[] {
  return db
    .select()
    .from(filterPreset)
    .orderBy(desc(filterPreset.id))
    .all()
    .map((row) => {
      const payload = JSON.parse(row.payload) as PresetPayload;
      return { id: row.id, name: row.name, filters: payload.filters, sort: payload.sort };
    });
}

export function savePreset(
  db: Database,
  name: string,
  filters: LibraryFilters,
  sort: LibrarySort,
): void {
  const payload: PresetPayload = { filters, sort };
  db.insert(filterPreset).values({ name, payload: JSON.stringify(payload) }).run();
}

export function deletePreset(db: Database, id: number): void {
  db.delete(filterPreset).where(eq(filterPreset.id, id)).run();
}
