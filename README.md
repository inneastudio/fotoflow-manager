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
- PWA potisna obvestila za jutranje opomnike
- Social media koledar z objavami, slikami, AI pomočnikom in opomnikom 30 minut prej
- Email opomniki strankam en dan pred fotografiranjem prek Resend
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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:info@inneastudio.si
CRON_SECRET=choose-a-long-random-secret
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=INNEA STUDIO <info@inneastudio.si>
RESEND_REPLY_TO_EMAIL=info@inneastudio.si
```

6. Ustvari vsaj enega uporabnika v aplikaciji ali Supabase Auth.
7. Po želji zaženi seed:

```bash
supabase/seed.sql
```

Seed podatki se vstavijo za prvega uporabnika v `auth.users`.

## Potisna obvestila

Jutranji opomnik pošlje Vercel Cron na `/api/push/daily` ob `06:00 UTC`
(poleti približno 08:00 v Sloveniji).

Za vklop:

1. Ustvari VAPID ključe z `npx web-push generate-vapid-keys`.
2. Dodaj env vrednosti v Vercel: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
3. Deployaj aplikacijo.
4. Na telefonu dodaj FotoFlow na Home Screen.
5. V aplikaciji odpri Nastavitve in klikni `Dovoli opomnike`.

Opomnik zajame današnja fotografiranja, deadline v manj kot 3 dneh, fotografirano in še ne shranjeno ter shranjeno brez poslanega izbora 2 dni po fotografiranju.

Social media opomniki se preverjajo vsakih 15 minut in pošljejo push približno 30 minut pred planirano objavo. AI pomočnik uporablja `OPENAI_API_KEY`; če ključ ni nastavljen, aplikacija pokaže osnovni lokalni predlog.

Email opomniki za fotografiranja se pošljejo en dan pred terminom vsem projektom, ki imajo vpisan email. Za pošiljanje mora biti v Vercel nastavljen `RESEND_API_KEY` in preverjen pošiljatelj `RESEND_FROM_EMAIL`.

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
