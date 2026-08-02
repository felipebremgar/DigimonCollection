import { and, asc, eq, inArray, like, or, type SQL, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { cardFts, toFtsQuery } from '@/db/fts';
import {
  card,
  cardColor,
  cardKeyword,
  cardTypeLink,
  color,
  keyword,
  printing,
  type as typeTable,
  type CardCategory,
  type ColorName,
} from '@/db/schema';

import type { LibraryFilters } from './filters';

/** Uma entrada da biblioteca: uma impressão (arte) com dados da carta base. */
export interface LibraryItem {
  printingId: number;
  cardId: number;
  number: string;
  name: string;
  artUrl: string;
  rarity: string;
  version: string;
  isAltArt: boolean;
  category: string;
}

const libraryColumns = {
  printingId: printing.id,
  cardId: card.id,
  number: card.number,
  name: card.name,
  artUrl: printing.artUrl,
  rarity: printing.rarity,
  version: printing.version,
  isAltArt: printing.isAltArt,
  category: card.category,
};

/** Subquery: ids de cartas que têm QUALQUER valor selecionado no N:N. */
function cardIdsWithColor(db: Database, names: string[]) {
  return db
    .select({ id: cardColor.cardId })
    .from(cardColor)
    .innerJoin(color, eq(color.id, cardColor.colorId))
    .where(inArray(color.name, names as ColorName[]));
}

function cardIdsWithType(db: Database, names: string[]) {
  return db
    .select({ id: cardTypeLink.cardId })
    .from(cardTypeLink)
    .innerJoin(typeTable, eq(typeTable.id, cardTypeLink.typeId))
    .where(inArray(typeTable.name, names));
}

function cardIdsWithKeyword(db: Database, names: string[]) {
  return db
    .select({ id: cardKeyword.cardId })
    .from(cardKeyword)
    .innerJoin(keyword, eq(keyword.id, cardKeyword.keywordId))
    .where(inArray(keyword.name, names));
}

/**
 * Query unificada da biblioteca: aplica a busca full-text (FTS5) e os filtros
 * combináveis, retornando as impressões que casam. Facetas em AND; OR dentro
 * de cada faceta. `search` vazio ignora o FTS; sem filtros lista tudo.
 */
export function queryLibrary(db: Database, filters: LibraryFilters, search: string): LibraryItem[] {
  const conditions: (SQL | undefined)[] = [];

  if (filters.categories.length) {
    conditions.push(inArray(card.category, filters.categories as CardCategory[]));
  }
  if (filters.rarities.length) conditions.push(inArray(printing.rarity, filters.rarities));
  if (filters.sets.length) conditions.push(inArray(card.setCode, filters.sets));
  if (filters.levels.length) conditions.push(inArray(card.level, filters.levels));
  if (filters.forms.length) conditions.push(inArray(card.form, filters.forms));
  if (filters.attributes.length) conditions.push(inArray(card.attribute, filters.attributes));
  if (filters.versions.length) {
    conditions.push(or(...filters.versions.map((v) => like(printing.version, `%${v}%`))));
  }
  if (filters.colors.length) {
    conditions.push(inArray(card.id, cardIdsWithColor(db, filters.colors)));
  }
  if (filters.types.length) {
    conditions.push(inArray(card.id, cardIdsWithType(db, filters.types)));
  }
  if (filters.keywords.length) {
    conditions.push(inArray(card.id, cardIdsWithKeyword(db, filters.keywords)));
  }
  if (filters.onePrintingPerCard) conditions.push(eq(printing.isAltArt, false));

  const match = toFtsQuery(search);

  let query = db
    .select(libraryColumns)
    .from(printing)
    .innerJoin(card, eq(printing.cardId, card.id))
    .$dynamic();

  if (match !== '') {
    query = query.innerJoin(cardFts, eq(cardFts.cardId, card.id));
    conditions.push(sql`${cardFts} MATCH ${match}`);
  }

  const active = conditions.filter((c): c is SQL => c != null);
  if (active.length) query = query.where(and(...active));

  return query.orderBy(asc(card.number), asc(printing.isAltArt), asc(printing.id)).all();
}

// --- Facetas disponíveis (para popular a UI de filtros) ---

export interface FilterFacets {
  rarities: string[];
  sets: string[];
  levels: string[];
  forms: string[];
  attributes: string[];
  types: string[];
  keywords: string[];
}

function distinctValues(rows: { v: string | null }[]): string[] {
  return rows.map((r) => r.v).filter((v): v is string => v != null && v !== '' && v !== '-');
}

/** Valores distintos presentes no dataset, para montar os seletores. */
export function getFilterFacets(db: Database): FilterFacets {
  return {
    rarities: distinctValues(
      db.selectDistinct({ v: printing.rarity }).from(printing).orderBy(asc(printing.rarity)).all(),
    ),
    sets: distinctValues(
      db.selectDistinct({ v: card.setCode }).from(card).orderBy(asc(card.setCode)).all(),
    ),
    levels: distinctValues(
      db.selectDistinct({ v: card.level }).from(card).orderBy(asc(card.level)).all(),
    ),
    forms: distinctValues(
      db.selectDistinct({ v: card.form }).from(card).orderBy(asc(card.form)).all(),
    ),
    attributes: distinctValues(
      db.selectDistinct({ v: card.attribute }).from(card).orderBy(asc(card.attribute)).all(),
    ),
    types: distinctValues(
      db.selectDistinct({ v: typeTable.name }).from(typeTable).orderBy(asc(typeTable.name)).all(),
    ),
    keywords: distinctValues(
      db.selectDistinct({ v: keyword.name }).from(keyword).orderBy(asc(keyword.name)).all(),
    ),
  };
}
