# FotoFlow Manager Clean

Nova čista verzija aplikacije FotoFlow Manager.

## Zagon

V tej mapi:

```bash
npm run dev
```

Odpri:

```text
http://localhost:3000
```

Ta verzija dela takoj z lokalnimi demo podatki in `localStorage`, brez Supabase nastavitve.

## Vključeno

- Dashboard
- Projekti
- Hitri workflow status na karticah
- Koledar terminov in rokov
- Finance
- Stranke
- Nastavitve tipov fotografiranja
- Avtomatski izračun roka oddaje po delovnih dneh
- Apple-like svetel UI
- Supabase SQL migracija

## Supabase

Migracija je v:

```text
supabase/migrations/20260512000000_create_projects.sql
```
