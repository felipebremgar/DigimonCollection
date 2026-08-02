import { desc, eq, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, deck, deckCard, printing, type Deck, type DeckZone } from '@/db/schema';

export const MAIN_DECK_SIZE = 50;
export const EGG_DECK_MAX = 5;

export interface DeckSummary {
  id: number;
  name: string;
  updatedAt: Date;
  mainCount: number;
  eggCount: number;
}

export interface DeckCardItem {
  deckCardId: number;
  cardId: number;
  printingId: number | null;
  zone: DeckZone;
  quantity: number;
  number: string;
  name: string;
  category: string;
  artUrl: string;
}

const mainSum = sql<number>`COALESCE(SUM(CASE WHEN ${deckCard.zone} = 'main' THEN ${deckCard.quantity} END), 0)`;
const eggSum = sql<number>`COALESCE(SUM(CASE WHEN ${deckCard.zone} = 'egg' THEN ${deckCard.quantity} END), 0)`;

/** Lista os decks com a contagem de cartas por zona, mais recentes primeiro. */
export function listDecks(db: Database): DeckSummary[] {
  return db
    .select({
      id: deck.id,
      name: deck.name,
      updatedAt: deck.updatedAt,
      mainCount: mainSum,
      eggCount: eggSum,
    })
    .from(deck)
    .leftJoin(deckCard, eq(deckCard.deckId, deck.id))
    .groupBy(deck.id)
    .orderBy(desc(deck.updatedAt), desc(deck.id))
    .all();
}

export function getDeck(db: Database, id: number): Deck | null {
  return db.select().from(deck).where(eq(deck.id, id)).get() ?? null;
}

export function createDeck(db: Database, name: string): number {
  const row = db.insert(deck).values({ name }).returning({ id: deck.id }).get();
  return row.id;
}

export function renameDeck(db: Database, id: number, name: string): void {
  db.update(deck).set({ name, updatedAt: new Date() }).where(eq(deck.id, id)).run();
}

export function deleteDeck(db: Database, id: number): void {
  db.delete(deck).where(eq(deck.id, id)).run();
}

/**
 * Cartas de um deck, com o nome/arte da carta. Usa a arte escolhida
 * (`printing_id`) ou, se ausente, a arte Normal da carta.
 */
export function getDeckCards(db: Database, deckId: number): DeckCardItem[] {
  const normalArt = sql<string>`COALESCE(${printing.artUrl}, (
    SELECT p2.art_url FROM printing p2
    WHERE p2.card_id = ${card.id} AND p2.is_alt_art = 0 LIMIT 1
  ))`;
  return db
    .select({
      deckCardId: deckCard.id,
      cardId: card.id,
      printingId: deckCard.printingId,
      zone: deckCard.zone,
      quantity: deckCard.quantity,
      number: card.number,
      name: card.name,
      category: card.category,
      artUrl: normalArt,
    })
    .from(deckCard)
    .innerJoin(card, eq(card.id, deckCard.cardId))
    .leftJoin(printing, eq(printing.id, deckCard.printingId))
    .where(eq(deckCard.deckId, deckId))
    .orderBy(desc(deckCard.quantity), card.number)
    .all();
}
