import { COLORS, type CardCategory, type NewCard } from '@/db/schema';

import { CANONICAL_KEYWORDS } from './keywords';
import { DIGIMONCARD_BASE_URL, type SourceCard } from './digimoncard';

/**
 * Normaliza o dataset do digimoncard.app para o schema interno, dividindo cada
 * carta em `card` + suas `printing` (a Normal + uma por arte alternativa) e
 * derivando os multivalorados (cor, type, keyword) e o Link.
 *
 * As relações N:N são expressas por chave natural (número da carta, nome da
 * cor/type/keyword) porque os IDs numéricos só são conhecidos na gravação
 * (Etapa 4).
 */

// `card` sem o id (gerado pelo banco).
export type NormalizedCard = Omit<NewCard, 'id'>;

export interface NormalizedPrinting {
  cardNumber: string; // chave natural → card.number
  rarity: string;
  version: string;
  isAltArt: boolean;
  artUrl: string;
  illustrator: string | null;
  printingNotes: string | null;
}

export interface NormalizedLink {
  cardNumber: string;
  linkCost: number | null;
}

export interface NormalizedDataset {
  cards: NormalizedCard[];
  printings: NormalizedPrinting[];
  colors: string[];
  types: string[];
  keywords: string[];
  cardColors: { cardNumber: string; colorName: string }[];
  cardTypes: { cardNumber: string; typeName: string }[];
  cardKeywords: { cardNumber: string; keywordName: string }[];
  links: NormalizedLink[];
  skipped: number; // cartas malformadas ignoradas (sem categoria)
}

const VALID_COLORS = new Set<string>(COLORS);

/** Trata os sentinelas de "vazio" do dataset ("-", "", espaços). */
function orNull(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '-' ? null : trimmed;
}

function toIntOrNull(value: string | undefined): number | null {
  const clean = orNull(value);
  if (clean == null) return null;
  const n = parseInt(clean, 10);
  return Number.isNaN(n) ? null : n;
}

/** "Lv.4" → "4"; "-" → null. */
function parseLevel(cardLv: string): string | null {
  const clean = orNull(cardLv);
  if (clean == null) return null;
  return clean.replace(/^Lv\./i, '').trim() || null;
}

/** Deriva o código da coleção a partir do número ("BT21-009" → "BT21"). */
function setCodeOf(cardNumber: string): string {
  const dash = cardNumber.indexOf('-');
  return dash === -1 ? cardNumber : cardNumber.slice(0, dash);
}

/** Mapeia o `cardType` da fonte para a categoria interna; null se malformado. */
function mapCategory(cardType: string): CardCategory | null {
  switch (cardType.trim()) {
    case 'Digimon':
      return 'Digimon';
    case 'Tamer':
      return 'Tamer';
    case 'Option':
      return 'Option';
    case 'Digi-Egg':
      return 'Digi-Egg';
    case 'Digimon/Option':
      return 'Dual';
    default:
      return null;
  }
}

/** Restrição textual → limite de cópias (0 banida, 1 limitada, 4 padrão). */
function mapCopyLimit(restriction: string | undefined): number {
  switch ((restriction ?? '').trim()) {
    case 'Banned':
      return 0;
    case 'Restricted to 1':
    case 'Choice Restriction':
      return 1;
    default:
      return 4;
  }
}

function splitSlash(value: string): string[] {
  return value
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part !== '' && part !== '-');
}

function imageUrl(path: string): string {
  const clean = path.replace(/^\//, '');
  return `${DIGIMONCARD_BASE_URL}${clean}`;
}

function hasLink(card: SourceCard): boolean {
  return (
    orNull(card.linkEffect) != null ||
    orNull(card.linkDP) != null ||
    orNull(card.linkRequirement) != null
  );
}

/** Extrai o custo de Link do requisito ("...: Cost 1" → 1). */
function parseLinkCost(linkRequirement: string): number | null {
  const match = linkRequirement.match(/Cost\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractKeywords(card: SourceCard): string[] {
  const haystack = [card.effect, card.digivolveEffect, card.securityEffect, card.linkEffect].join(
    ' ',
  );
  return CANONICAL_KEYWORDS.filter((keyword) => haystack.includes(keyword));
}

export function normalizeDataset(source: SourceCard[]): NormalizedDataset {
  const cards: NormalizedCard[] = [];
  const printings: NormalizedPrinting[] = [];
  const cardColors: { cardNumber: string; colorName: string }[] = [];
  const cardTypes: { cardNumber: string; typeName: string }[] = [];
  const cardKeywords: { cardNumber: string; keywordName: string }[] = [];
  const links: NormalizedLink[] = [];

  const colors = new Set<string>();
  const types = new Set<string>();
  const keywords = new Set<string>();
  const seenNumbers = new Set<string>();
  let skipped = 0;

  for (const src of source) {
    const category = mapCategory(src.cardType);
    const number = src.cardNumber?.trim();

    // Ignora cartas malformadas (sem categoria válida ou sem número) e
    // duplicatas de número (mantém a primeira).
    if (category == null || !number || seenNumbers.has(number)) {
      skipped++;
      continue;
    }
    seenNumbers.add(number);

    const isOptionLike = category === 'Option' || category === 'Dual';
    const cost = toIntOrNull(src.playCost);

    cards.push({
      number,
      setCode: setCodeOf(number),
      name: src.name.english,
      category,
      form: orNull(src.form),
      attribute: orNull(src.attribute),
      level: parseLevel(src.cardLv),
      playCost: isOptionLike ? null : cost,
      digivolutionCost: toIntOrNull(src.digivolveCondition?.[0]?.cost),
      useCost: isOptionLike ? cost : null,
      dp: toIntOrNull(src.dp),
      effect: orNull(src.effect) ?? '',
      inheritedEffect: orNull(src.digivolveEffect),
      securityEffect: orNull(src.securityEffect),
      illustrator: orNull(src.illustrator) ?? 'No Illustrator',
      notes: orNull(src.notes),
      copyLimit: mapCopyLimit(src.restrictions?.english),
    });

    // Impressão Normal (a própria carta base).
    printings.push({
      cardNumber: number,
      rarity: src.rarity?.trim() || '-',
      version: 'Normal',
      isAltArt: false,
      artUrl: imageUrl(src.cardImage),
      illustrator: null,
      printingNotes: null,
    });

    // Impressões de arte alternativa.
    for (const aa of src.AAs ?? []) {
      printings.push({
        cardNumber: number,
        rarity: src.rarity?.trim() || '-',
        version: orNull(aa.type) ?? 'Alternative Art',
        isAltArt: true,
        artUrl: imageUrl(`assets/images/cards/${aa.id}.webp`),
        illustrator: orNull(aa.illustrator),
        printingNotes: orNull(aa.note),
      });
    }

    // Cores (multivalorado, filtrando glitches do dataset).
    for (const colorName of splitSlash(src.color)) {
      if (!VALID_COLORS.has(colorName)) continue;
      colors.add(colorName);
      cardColors.push({ cardNumber: number, colorName });
    }

    // Types do rodapé (multivalorado).
    for (const typeName of splitSlash(src.type)) {
      types.add(typeName);
      cardTypes.push({ cardNumber: number, typeName });
    }

    // Keywords (por substring nos efeitos).
    for (const keywordName of extractKeywords(src)) {
      keywords.add(keywordName);
      cardKeywords.push({ cardNumber: number, keywordName });
    }

    // Link.
    if (hasLink(src)) {
      links.push({ cardNumber: number, linkCost: parseLinkCost(src.linkRequirement ?? '') });
    }
  }

  return {
    cards,
    printings,
    colors: [...colors].sort(),
    types: [...types].sort(),
    keywords: [...keywords].sort(),
    cardColors,
    cardTypes,
    cardKeywords,
    links,
    skipped,
  };
}
