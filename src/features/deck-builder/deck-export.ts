import { and, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, deckCard, printing } from '@/db/schema';

import { createDeck } from './deck-queries';
import { zoneForCategory } from './deck-mutations';
import type { DeckContents } from './use-deck';

/** Serializa o deck em texto (linhas "quantidade numero", seções Main/Egg). */
export function deckToText(contents: DeckContents): string {
  const byNumber = (a: { number: string }, b: { number: string }) =>
    a.number.localeCompare(b.number);
  const lines: string[] = [`# ${contents.deck.name}`, `# Main (${contents.mainCount})`];
  for (const c of [...contents.main].sort(byNumber)) lines.push(`${c.quantity} ${c.number}`);
  if (contents.egg.length > 0) {
    lines.push(`# Egg (${contents.eggCount})`);
    for (const c of [...contents.egg].sort(byNumber)) lines.push(`${c.quantity} ${c.number}`);
  }
  return lines.join('\n');
}

export interface ParsedDeck {
  name: string | null;
  entries: { number: string; quantity: number }[];
}

/** Lê o texto de um deck: linhas "4 BT1-009" ou "4x BT1-009"; # comentários. */
export function parseDeckText(text: string): ParsedDeck {
  let name: string | null = null;
  const entries = new Map<string, number>();

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '') continue;
    if (line.startsWith('#')) {
      const rest = line.replace(/^#+\s*/, '').trim();
      if (name === null && rest !== '' && !/^main/i.test(rest) && !/^egg/i.test(rest)) {
        name = rest.replace(/\s*\(\d+\)\s*$/, '');
      }
      continue;
    }
    const match = line.match(/^(\d+)\s*x?\s+(\S+)/i);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const number = match[2].toUpperCase();
      entries.set(number, (entries.get(number) ?? 0) + quantity);
    }
  }

  return { name, entries: [...entries.entries()].map(([number, quantity]) => ({ number, quantity })) };
}

export interface ImportResult {
  deckId: number;
  imported: number;
  skipped: string[]; // numerações não encontradas
}

/**
 * Cria um novo deck a partir do texto exportado. Zona derivada da categoria;
 * numerações desconhecidas são puladas e reportadas.
 */
export function importDeck(db: Database, text: string): ImportResult {
  const parsed = parseDeckText(text);
  const deckId = createDeck(db, parsed.name?.trim() || 'Deck importado');
  let imported = 0;
  const skipped: string[] = [];

  for (const { number, quantity } of parsed.entries) {
    const cardRow = db
      .select({ id: card.id, category: card.category })
      .from(card)
      .where(eq(card.number, number))
      .get();
    if (!cardRow) {
      skipped.push(number);
      continue;
    }
    const normal = db
      .select({ id: printing.id })
      .from(printing)
      .where(and(eq(printing.cardId, cardRow.id), eq(printing.isAltArt, false)))
      .get();
    db.insert(deckCard)
      .values({
        deckId,
        cardId: cardRow.id,
        printingId: normal?.id ?? null,
        zone: zoneForCategory(cardRow.category),
        quantity,
      })
      .run();
    imported += quantity;
  }

  return { deckId, imported, skipped };
}
