/**
 * Fonte de dados: o app digimoncard.app serve toda a base de cartas como um
 * único JSON estático (não há API REST com endpoints de query). Baixamos esse
 * dataset e normalizamos localmente para o schema interno (ver `normalize.ts`).
 */

export const DIGIMONCARD_BASE_URL = 'https://digimoncard.app/';
export const CARD_DATASET_URL = `${DIGIMONCARD_BASE_URL}assets/cardlists/DigimonCards.json`;

/** Arte alternativa de uma carta (entradas em `AAs` / `JAAs`). */
export interface SourceAA {
  id: string;
  illustrator: string;
  note: string;
  type: string;
}

export interface SourceDigivolveCondition {
  color: string;
  cost: string;
  level: string;
}

/** Uma carta como vem no JSON do digimoncard.app. */
export interface SourceCard {
  id: string;
  cardNumber: string;
  cardType: string;
  cardImage: string;
  name: {
    english: string;
    japanese: string;
    korean: string;
    simplifiedChinese: string;
    traditionalChinese: string;
  };
  color: string;
  form: string;
  attribute: string;
  cardLv: string;
  type: string;
  playCost: string;
  dp: string;
  digivolveCondition: SourceDigivolveCondition[];
  digivolveEffect: string;
  effect: string;
  securityEffect: string;
  rarity: string;
  version: string;
  illustrator: string;
  notes: string;
  restrictions: {
    chinese: string;
    english: string;
    japanese: string;
    korean: string;
  };
  linkDP: string;
  linkEffect: string;
  linkRequirement: string;
  AAs?: SourceAA[];
  JAAs?: SourceAA[];
  // Campos adicionais existem no JSON, mas não são usados na normalização.
}

/** Baixa o dataset completo de cartas do digimoncard.app. */
export async function fetchCardDataset(signal?: AbortSignal): Promise<SourceCard[]> {
  const response = await fetch(CARD_DATASET_URL, { signal });
  if (!response.ok) {
    throw new Error(`Falha ao baixar o dataset de cartas: HTTP ${response.status}`);
  }
  return (await response.json()) as SourceCard[];
}
