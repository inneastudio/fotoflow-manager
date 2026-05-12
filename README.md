# FotoFlow Manager

Interna Next.js aplikacija za fotografski workflow: rezervacije, statusi, roki, galerije, finance in plačila.

## Funkcionalnosti

- Dashboard z aktivnimi projekti, urejanjem, neplačanimi zneski in mesečnimi prihodki
- Projekti z dodajanjem, urejanjem, brisanjem, iskanjem in filtriranjem
- Podrobnosti projekta s timeline prikazom statusov in gumbom za naslednji status
- Hitro spreminjanje workflow statusa direktno iz seznama projektov
- Koledarski pogled fotografiranj in rokov oddaje
- Finance z grafom prihodkov in pregledom odprtih plačil
- Pregled strank po kontaktih in zgodovini projektov
- Nastavljivi tipi fotografiranja s privzetimi delovnimi dnevi do oddaje
- Izbira fotografa: Žan ali Teja
- Način plačila: Gotovina ali TRR
- Supabase integracija za bazo in login
- Demo način brez Supabase nastavitev
- Responsive layout: sidebar na desktopu, bottom navigation na telefonu

## Lokalni zagon

```bash
npm install
npm run dev
```

Aplikacija bo na voljo na [http://localhost:3000](http://localhost:3000).

Če Supabase še ni nastavljen, se aplikacija zažene v demo načinu in podatke hrani v `localStorage`.

## Supabase nastavitev

Najlažja pot je opisana v [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

Kratka verzija:

1. Ustvari Supabase projekt.
2. V Supabase Auth vklopi Email/Password provider.
3. V SQL Editorju zaženi `supabase/setup.sql`.
4. Kopiraj `.env.example` v `.env.local`.
5. Dodaj vrednosti:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

6. Ustvari vsaj enega uporabnika v aplikaciji ali Supabase Auth.
7. Po želji zaženi seed:

```bash
supabase/seed.sql
```

Seed podatki se vstavijo za prvega uporabnika v `auth.users`.

## Struktura

```text
app/
  dashboard/
  projects/
  calendar/
  finance/
  clients/
  settings/
  login/
components/
lib/
supabase/
```

## Tabela `projects`

Glavna tabela vsebuje:

- kontakt: `client_name`, `email`, `phone`
- termin: `shoot_type`, `photographer`, `shoot_date`, `location`, `delivery_due`
- workflow: `workflow_status`, `payment_status`, `payment_method`
- finance: `amount`, `deposit`, `balance`
- roki: `delivery_workdays`, `delivery_due`
- povezave: `gallery_url`, `drive_url`
- produkcija: `selected_photos`, `notes`, `retouch_notes`

Migracija vklopi RLS pravila, zato vsak prijavljen uporabnik vidi samo svoje projekte.
