# `api/` — Integração com a API (Etapa 3)

Camada de serviço que consome a API de coleção do
[digimoncard.app](https://digimoncard.app/collection) via **TanStack Query**.

Conterá:

- `client.ts` — cliente HTTP + configuração do `QueryClient`.
- `digimoncard.ts` — endpoints e tipos do retorno da API.
- `normalize.ts` — normalização de cada carta em `card` + suas `printing`
  antes de gravar no SQLite.
