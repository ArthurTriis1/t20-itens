# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

There are no tests.

## Architecture

Single-page Next.js app — one route, entirely client-side rendered.

- **`app/page.tsx`** — the whole application. `CatalogPage` ("use client") owns all state: item list fetched from `/itens.json`, URL-driven filters (`q`, `categoria`, `local`, `item` search params), and the mobile drawer / desktop sidebar split layout.
- **`app/layout.tsx`** — root layout; loads the `Tormenta.ttf` custom font via `next/font/local` (exposed as `--font-tormenta` / `font-tormenta` utility).
- **`public/itens.json`** — static item database (array of objects). The only data source; fetched at runtime with `no-store` in dev and `force-cache` in prod.
- **`public/images/`** — item images referenced by `nome_arquivo_imagem` fields in the JSON.

### Item shape (`Item` type in `page.tsx`)

| Field | Notes |
|---|---|
| `Equipamento` | Display name (used as unique key in URL) |
| `Categoria` | Used for category filter dropdown |
| `Local` | `string[]` — used for location filter |
| `nome_arquivo_imagem` | Filename under `/images/` |
| `Preço`, `Espaço`, `Dano`, `Crítico`, `Alcance`, `Tipo`, `Descrição` | Displayed in detail panel |

### Design system

Dark red / black medieval theme. CSS variables are defined in `globals.css` (e.g. `--t20-accent: #ff0000`, `--t20-border: #660000`) but mostly applied as inline Tailwind color values in `page.tsx`. Tailwind v4 is used — config is in `postcss.config.mjs`, not `tailwind.config.js`.
