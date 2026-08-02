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

/** Deriva a versão remota do dataset a partir dos headers da resposta. */
function versionFromHeaders(headers: Headers): string {
  return headers.get('etag') ?? headers.get('last-modified') ?? '';
}

/**
 * Consulta a versão remota do dataset (ETag) sem baixá-lo, via HEAD.
 * Usado para decidir se um novo sync é necessário (Etapa 4).
 */
export async function fetchDatasetVersion(signal?: AbortSignal): Promise<string> {
  const response = await fetch(CARD_DATASET_URL, { method: 'HEAD', signal });
  if (!response.ok) {
    throw new Error(`Falha ao consultar a versão do dataset: HTTP ${response.status}`);
  }
  return versionFromHeaders(response.headers);
}

/** Baixa o dataset completo de cartas do digimoncard.app, com sua versão. */
export async function fetchCardDataset(
  signal?: AbortSignal,
): Promise<{ cards: SourceCard[]; version: string }> {
  const response = await fetch(CARD_DATASET_URL, { signal });
  if (!response.ok) {
    throw new Error(`Falha ao baixar o dataset de cartas: HTTP ${response.status}`);
  }
  const cards = (await response.json()) as SourceCard[];
  return { cards, version: versionFromHeaders(response.headers) };
}
