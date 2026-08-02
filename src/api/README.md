# `api/` — Integração com a fonte de dados (Etapa 3 ✅)

O digimoncard.app **não expõe uma API REST**: serve toda a base como um único
JSON estático em `https://digimoncard.app/assets/cardlists/DigimonCards.json`
(~8,5 MB, 4399 cartas). Baixamos e normalizamos localmente.

## Arquivos

- `digimoncard.ts` — tipos da fonte (`SourceCard`, `SourceAA`) e
  `fetchCardDataset()`.
- `normalize.ts` — `normalizeDataset()`: divide cada carta em `card` + suas
  `printing` (Normal + uma por arte alternativa) e deriva cores, types,
  keywords e Link. As relações N:N usam chave natural (número/nome) porque os
  IDs numéricos só existem na gravação (Etapa 4).
- `keywords.ts` — 87 keywords canônicas (＜＞), detectadas por substring nos
  efeitos.
- `client.ts` — `QueryClient` (TanStack Query) com cache longo.
- `provider.tsx` — `ApiProvider` (`QueryClientProvider`).
- `use-card-dataset.ts` — hook `useCardDataset()` (fetch + normalização).

## Mapeamentos principais

| Fonte | Interno |
|---|---|
| `cardType: "Digimon/Option"` | `category: "Dual"` |
| `cardType: ""` | carta ignorada (malformada) |
| `color: "Red/Blue"` | N:N `card_color` (split `/`, inglês) |
| `type: "Dinosaur/ADVENTURE"` | N:N `card_type_link` (rodapé) |
| `AAs[]` | uma `printing` por arte, `is_alt_art = true` |
| `restrictions.english` | `copy_limit` (Banned→0, Restricted to 1→1, senão 4) |
| `linkRequirement: "...Cost 1"` | `link_detail.link_cost = 1` |

`printing.rarity`/`version` são texto livre: o dataset traz `rarity "-"` e
centenas de rótulos compostos de arte alternativa.

## Próximos passos

- Gravar o dataset normalizado no SQLite com `dataset_version` (Etapa 4).
- Matching de `link_target_type_id` e keyword `explanation` (refinamento).
