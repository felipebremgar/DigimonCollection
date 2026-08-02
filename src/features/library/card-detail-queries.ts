import { asc, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import {
  card,
  cardColor,
  cardKeyword,
  cardTypeLink,
  color,
  keyword,
  linkDetail,
  printing,
  type as typeTable,
  type Card,
} from '@/db/schema';

export interface DetailPrinting {
  id: number;
  rarity: string;
  version: string;
  isAltArt: boolean;
  artUrl: string;
  illustrator: string | null;
  printingNotes: string | null;
}

export interface CardDetail {
  card: Card;
  colors: string[];
  types: string[];
  keywords: string[];
  linkCost: number | null;
  hasLink: boolean;
  printings: DetailPrinting[];
}

/**
 * Carrega o detalhe completo da carta dona de uma impressão: todos os campos
 * de regra, os multivalorados (cor/type/keyword), o Link e todas as impressões
 * (artes) da mesma numeração. Driver síncrono → `.get()`/`.all()`.
 */
export function getCardDetail(db: Database, printingId: number): CardDetail | null {
  const owner = db
    .select({ cardId: printing.cardId })
    .from(printing)
    .where(eq(printing.id, printingId))
    .get();
  if (!owner) return null;

  const cardRow = db.select().from(card).where(eq(card.id, owner.cardId)).get();
  if (!cardRow) return null;

  const printings = db
    .select({
      id: printing.id,
      rarity: printing.rarity,
      version: printing.version,
      isAltArt: printing.isAltArt,
      artUrl: printing.artUrl,
      illustrator: printing.illustrator,
      printingNotes: printing.printingNotes,
    })
    .from(printing)
    .where(eq(printing.cardId, owner.cardId))
    .orderBy(asc(printing.isAltArt), asc(printing.id))
    .all();

  const colors = db
    .select({ name: color.name })
    .from(cardColor)
    .innerJoin(color, eq(color.id, cardColor.colorId))
    .where(eq(cardColor.cardId, owner.cardId))
    .all()
    .map((r) => r.name);

  const types = db
    .select({ name: typeTable.name })
    .from(cardTypeLink)
    .innerJoin(typeTable, eq(typeTable.id, cardTypeLink.typeId))
    .where(eq(cardTypeLink.cardId, owner.cardId))
    .all()
    .map((r) => r.name);

  const keywords = db
    .select({ name: keyword.name })
    .from(cardKeyword)
    .innerJoin(keyword, eq(keyword.id, cardKeyword.keywordId))
    .where(eq(cardKeyword.cardId, owner.cardId))
    .all()
    .map((r) => r.name);

  const link = db
    .select({ linkCost: linkDetail.linkCost })
    .from(linkDetail)
    .where(eq(linkDetail.cardId, owner.cardId))
    .get();

  return {
    card: cardRow,
    colors,
    types,
    keywords,
    linkCost: link?.linkCost ?? null,
    hasLink: link != null,
    printings,
  };
}
