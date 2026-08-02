# `features/` — Módulos de domínio

Código específico de cada área do app (telas compostas, componentes,
hooks e lógica de negócio), separado da navegação (`app/`) e da UI
compartilhada (`components/`).

- `library/` — grid/lista, detalhe da carta, busca e filtros (Blocos 1–2).
- `deck-builder/` — construção, regras de cópia, validação e estatísticas
  do deck (Bloco 3).
- `pricing/` — reservado para a extensão futura de preços (fora do v1.0);
  contrato único `PriceProvider` isolado aqui.
