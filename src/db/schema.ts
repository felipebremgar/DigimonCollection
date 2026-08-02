import { relations, sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Modelagem do Digimon Card Game.
 *
 * Decisão central: `card` (carta de regras, uma por numeração canônica) é
 * separada de `printing` (impressão/arte, várias por card). Cópias no deck
 * contam por `card`; a biblioteca e os filtros operam sobre `printing`.
 * Ver `plano-implementacao-digimon-tcg.md`.
 */

// --- Valores canônicos (enums) ---

export const CARD_CATEGORIES = ['Digimon', 'Tamer', 'Option', 'Digi-Egg', 'Dual'] as const;
export type CardCategory = (typeof CARD_CATEGORIES)[number];

// Raridades canônicas. Guardadas como texto livre em `printing.rarity`
// porque o dataset real também traz "-" (cartas sem raridade).
export const RARITIES = ['C', 'U', 'R', 'SR', 'UR', 'SEC', 'P'] as const;
export type Rarity = (typeof RARITIES)[number];

// Versões canônicas usadas nos filtros. `printing.version` é texto livre:
// as artes alternativas do dataset trazem centenas de rótulos compostos
// (ex. "Foil - Championship Stamp - Full Art").
export const VERSIONS = [
  'Normal',
  'Alternative Art',
  'Foil',
  'Textured',
  'Pre Release',
  'Box Topper',
  'Full Art',
  'Stamp',
  'Special Rare',
  'Rare Pull',
] as const;
export type Version = (typeof VERSIONS)[number];

// Cores canônicas em inglês (fonte de dados é em inglês; tradução para
// exibição fica na i18n — Etapa 17).
export const COLORS = ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'] as const;
export type ColorName = (typeof COLORS)[number];

export const DECK_ZONES = ['main', 'egg'] as const;
export type DeckZone = (typeof DECK_ZONES)[number];

// --- card: carta de regras ---

export const card = sqliteTable(
  'card',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    number: text('number').notNull().unique(), // ex. BT21-009
    setCode: text('set_code').notNull(), // ex. BT21
    name: text('name').notNull(),
    category: text('category', { enum: CARD_CATEGORIES }).notNull(),
    form: text('form'), // Rookie, Champion, Ultimate, Mega...
    attribute: text('attribute'), // Virus, Vaccine, Data...
    level: text('level'), // "2".."7", "--" ou null
    playCost: integer('play_cost'),
    digivolutionCost: integer('digivolution_cost'),
    useCost: integer('use_cost'),
    dp: integer('dp'),
    effect: text('effect').notNull(),
    inheritedEffect: text('inherited_effect'),
    securityEffect: text('security_effect'),
    illustrator: text('illustrator').notNull(),
    notes: text('notes'),
    copyLimit: integer('copy_limit').notNull().default(4), // 0 banida, 1 limitada, até 50
  },
  (t) => [
    index('idx_card_set_code').on(t.setCode),
    index('idx_card_category').on(t.category),
    index('idx_card_name').on(t.name),
  ],
);

// --- printing: impressão / arte ---

export const printing = sqliteTable(
  'printing',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cardId: integer('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    rarity: text('rarity').notNull(), // valor canônico de RARITIES, "-" ou outros
    version: text('version').notNull(), // "Normal" ou o rótulo da arte alternativa
    isAltArt: integer('is_alt_art', { mode: 'boolean' }).notNull().default(false),
    artUrl: text('art_url').notNull(),
    illustrator: text('illustrator'), // sobrepõe card.illustrator quando a arte difere
    printingNotes: text('printing_notes'),
  },
  (t) => [
    index('idx_printing_card_id').on(t.cardId),
    index('idx_printing_is_alt_art').on(t.isAltArt),
  ],
);

// --- Atributos multivalorados (N:N sobre card) ---

export const color = sqliteTable('color', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { enum: COLORS }).notNull().unique(),
});

export const cardColor = sqliteTable(
  'card_color',
  {
    cardId: integer('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    colorId: integer('color_id')
      .notNull()
      .references(() => color.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.colorId] })],
);

export const keyword = sqliteTable('keyword', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // ex. "<Blocker>"
  explanation: text('explanation'),
});

export const cardKeyword = sqliteTable(
  'card_keyword',
  {
    cardId: integer('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    keywordId: integer('keyword_id')
      .notNull()
      .references(() => keyword.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.keywordId] })],
);

// Types do rodapé da carta (ex. Search, Hero). Distinto de card.category.
export const type = sqliteTable('type', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const cardTypeLink = sqliteTable(
  'card_type_link',
  {
    cardId: integer('card_id')
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    typeId: integer('type_id')
      .notNull()
      .references(() => type.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.typeId] })],
);

// --- link_detail: Link é efeito secundário, não categoria (1:1 opcional) ---

export const linkDetail = sqliteTable('link_detail', {
  cardId: integer('card_id')
    .primaryKey()
    .references(() => card.id, { onDelete: 'cascade' }),
  linkCost: integer('link_cost'),
  linkTargetTypeId: integer('link_target_type_id').references(() => type.id), // ex. Link [Appmon]
});

// --- Deck ---

export const deck = sqliteTable('deck', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const deckCard = sqliteTable(
  'deck_card',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    deckId: integer('deck_id')
      .notNull()
      .references(() => deck.id, { onDelete: 'cascade' }),
    cardId: integer('card_id') // aponta para CARD → cópias contam por regra
      .notNull()
      .references(() => card.id, { onDelete: 'cascade' }),
    printingId: integer('printing_id') // arte escolhida para exibição (cosmético)
      .references(() => printing.id, { onDelete: 'set null' }),
    zone: text('zone', { enum: DECK_ZONES }).notNull(),
    quantity: integer('quantity').notNull().default(1),
  },
  (t) => [
    index('idx_deck_card_deck_id').on(t.deckId),
    index('idx_deck_card_card_id').on(t.cardId),
  ],
);

// --- meta: chave-valor para flags do app (ex. versão do dataset) ---

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// --- Relations (joins type-safe) ---

export const cardRelations = relations(card, ({ many, one }) => ({
  printings: many(printing),
  colors: many(cardColor),
  keywords: many(cardKeyword),
  types: many(cardTypeLink),
  linkDetail: one(linkDetail),
  deckEntries: many(deckCard),
}));

export const printingRelations = relations(printing, ({ one }) => ({
  card: one(card, { fields: [printing.cardId], references: [card.id] }),
}));

export const colorRelations = relations(color, ({ many }) => ({
  cards: many(cardColor),
}));

export const cardColorRelations = relations(cardColor, ({ one }) => ({
  card: one(card, { fields: [cardColor.cardId], references: [card.id] }),
  color: one(color, { fields: [cardColor.colorId], references: [color.id] }),
}));

export const keywordRelations = relations(keyword, ({ many }) => ({
  cards: many(cardKeyword),
}));

export const cardKeywordRelations = relations(cardKeyword, ({ one }) => ({
  card: one(card, { fields: [cardKeyword.cardId], references: [card.id] }),
  keyword: one(keyword, { fields: [cardKeyword.keywordId], references: [keyword.id] }),
}));

export const typeRelations = relations(type, ({ many }) => ({
  cards: many(cardTypeLink),
}));

export const cardTypeLinkRelations = relations(cardTypeLink, ({ one }) => ({
  card: one(card, { fields: [cardTypeLink.cardId], references: [card.id] }),
  type: one(type, { fields: [cardTypeLink.typeId], references: [type.id] }),
}));

export const linkDetailRelations = relations(linkDetail, ({ one }) => ({
  card: one(card, { fields: [linkDetail.cardId], references: [card.id] }),
  targetType: one(type, { fields: [linkDetail.linkTargetTypeId], references: [type.id] }),
}));

export const deckRelations = relations(deck, ({ many }) => ({
  cards: many(deckCard),
}));

export const deckCardRelations = relations(deckCard, ({ one }) => ({
  deck: one(deck, { fields: [deckCard.deckId], references: [deck.id] }),
  card: one(card, { fields: [deckCard.cardId], references: [card.id] }),
  printing: one(printing, { fields: [deckCard.printingId], references: [printing.id] }),
}));

// --- Tipos inferidos ---

export type Card = typeof card.$inferSelect;
export type NewCard = typeof card.$inferInsert;
export type Printing = typeof printing.$inferSelect;
export type NewPrinting = typeof printing.$inferInsert;
export type Deck = typeof deck.$inferSelect;
export type NewDeck = typeof deck.$inferInsert;
export type DeckCard = typeof deckCard.$inferSelect;
export type NewDeckCard = typeof deckCard.$inferInsert;
export type Meta = typeof meta.$inferSelect;
