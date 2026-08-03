import { eq, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, deckCard, type DeckZone } from '@/db/schema';

interface DeckStatRow {
  quantity: number;
  zone: DeckZone;
  category: string;
  level: string | null;
  cost: number | null;
  colors: string | null;
  types: string | null;
}

export interface CountEntry {
  label: string;
  count: number;
}

export interface DeckStats {
  costCurve: CountEntry[]; // custo → cópias (só deck principal)
  colors: CountEntry[];
  levels: CountEntry[];
  categories: CountEntry[];
  types: CountEntry[]; // top tipos
}

/** Linhas do deck com os campos e agregados necessários às estatísticas. */
function getDeckStatRows(db: Database, deckId: number): DeckStatRow[] {
  return db
    .select({
      quantity: deckCard.quantity,
      zone: deckCard.zone,
      category: card.category,
      level: card.level,
      cost: sql<number | null>`COALESCE(${card.playCost}, ${card.useCost})`,
      colors: sql<
        string | null
      >`(SELECT group_concat(col.name) FROM card_color cc JOIN color col ON col.id = cc.color_id WHERE cc.card_id = ${card.id})`,
      types: sql<
        string | null
      >`(SELECT group_concat(t.name) FROM card_type_link ctl JOIN type t ON t.id = ctl.type_id WHERE ctl.card_id = ${card.id})`,
    })
    .from(deckCard)
    .innerJoin(card, eq(card.id, deckCard.cardId))
    .where(eq(deckCard.deckId, deckId))
    .all();
}

function toSortedEntries(map: Map<string, number>, sort: (a: CountEntry, b: CountEntry) => number) {
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort(sort);
}

const byCountDesc = (a: CountEntry, b: CountEntry) => b.count - a.count;
const byNumericLabel = (a: CountEntry, b: CountEntry) => Number(a.label) - Number(b.label);

/** Calcula curva de custo, distribuição de cores e contagens por level/categoria/type. */
export function computeDeckStats(db: Database, deckId: number): DeckStats {
  const rows = getDeckStatRows(db, deckId);

  const costCurve = new Map<string, number>();
  const colors = new Map<string, number>();
  const levels = new Map<string, number>();
  const categories = new Map<string, number>();
  const types = new Map<string, number>();

  const bump = (map: Map<string, number>, key: string, qty: number) =>
    map.set(key, (map.get(key) ?? 0) + qty);

  for (const row of rows) {
    const qty = row.quantity;
    bump(categories, row.category, qty);
    if (row.level != null) bump(levels, row.level, qty);
    if (row.zone === 'main' && row.cost != null) bump(costCurve, String(row.cost), qty);
    for (const color of row.colors?.split(',') ?? []) bump(colors, color, qty);
    for (const type of row.types?.split(',') ?? []) bump(types, type, qty);
  }

  return {
    costCurve: toSortedEntries(costCurve, byNumericLabel),
    colors: toSortedEntries(colors, byCountDesc),
    levels: toSortedEntries(levels, byNumericLabel),
    categories: toSortedEntries(categories, byCountDesc),
    types: toSortedEntries(types, byCountDesc).slice(0, 10),
  };
}
