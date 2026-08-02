# Digimon Collection

Aplicativo mobile (Android + iOS) de biblioteca de cartas do **Digimon Card Game**:
biblioteca navegável, busca, filtros e deck builder. Dados consumidos da API do
[digimoncard.app](https://digimoncard.app/collection).

Feito com **React Native + Expo** (SDK 57) e Expo Router.

## Requisitos

- Node.js 20+ (testado em v24)
- App **Expo Go** no celular, ou um emulador Android / simulador iOS

## Começando

```bash
npm install
npm start
```

Depois leia o QR code com o Expo Go, ou rode `npm run android` / `npm run ios`.

## Scripts

| Script | O que faz |
|---|---|
| `npm start` | Inicia o Metro / Expo dev server |
| `npm run android` | Abre no emulador/dispositivo Android |
| `npm run ios` | Abre no simulador iOS (requer macOS) |
| `npm run web` | Abre no navegador |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm run format` | Prettier sobre `src/**` |

## Estrutura de pastas

```
src/
  app/              # rotas (Expo Router, file-based)
    (tabs)/         #   navegação principal em abas
      index.tsx     #     Biblioteca
      deck-builder.tsx #  Deck Builder
  api/              # integração com a API (TanStack Query)     — Etapa 3
  db/               # SQLite + Drizzle ORM (schema, migrations) — Etapa 2
  features/         # módulos de domínio (library, deck-builder, pricing)
  components/       # UI compartilhada (ThemedText, ThemedView...)
  constants/        # tema, cores, spacing
  hooks/            # hooks compartilhados
  lib/              # utilitários e storage (MMKV)
```

## Build (EAS)

Perfis definidos em [`eas.json`](eas.json): `development`, `preview`, `production`.

```bash
npx eas-cli login      # autenticar
npx eas-cli init       # vincula o projeto (gera o projectId)
npx eas-cli build --profile preview --platform android
```

## Documentação do projeto

- [`plano-implementacao-digimon-tcg.md`](plano-implementacao-digimon-tcg.md) — plano completo, modelagem de dados e regras de negócio.
- [`checklist-marcos-digimon-tcg.html`](checklist-marcos-digimon-tcg.html) — checklist de marcos por versão.
