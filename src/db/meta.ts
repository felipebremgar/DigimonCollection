import { eq, sql } from 'drizzle-orm';

import type { Database } from './client';
import { card, meta } from './schema';

/** Chave em `meta` que guarda a versão (ETag) do dataset já gravado. */
export const DATASET_VERSION_KEY = 'dataset_version';

// O driver expo-sqlite do Drizzle é síncrono; usamos os terminais .get()/.run().

export function getMeta(db: Database, key: string): string | null {
  const row = db.select().from(meta).where(eq(meta.key, key)).limit(1).get();
  return row?.value ?? null;
}

export function setMeta(db: Database, key: string, value: string): void {
  db.insert(meta)
    .values({ key, value })
    .onConflictDoUpdate({ target: meta.key, set: { value } })
    .run();
}

export function getDatasetVersion(db: Database): string | null {
  return getMeta(db, DATASET_VERSION_KEY);
}

/** Quantidade de cartas já gravadas (0 = banco vazio). */
export function getCardCount(db: Database): number {
  const row = db.select({ count: sql<number>`count(*)` }).from(card).get();
  return row?.count ?? 0;
}
