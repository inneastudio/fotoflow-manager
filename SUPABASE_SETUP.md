# FotoFlow Manager: prehod iz demo načina v delovno verzijo

Demo način se sam izklopi, ko aplikacija dobi pravi Supabase URL in anon key.

## 1. Ustvari Supabase projekt

V Supabase ustvari nov projekt za FotoFlow Manager.

## 2. Vklopi login

V Supabase pojdi v **Authentication → Providers** in omogoči **Email**.

Za lažji interni začetek lahko v **Authentication → Sign In / Providers → Email** začasno izklopiš email confirmations. Kasneje jih lahko spet vklopiš.

## 3. Ustvari bazo

V Supabase pojdi v **SQL Editor** in zaženi celotno vsebino te datoteke:

```text
supabase/setup.sql
```

To ustvari tabelo `projects`, indekse, RLS pravila in avtomatski izračun preostanka.

## 4. Dodaj `.env.local`

V korenu projekta ustvari datoteko `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Vrednosti dobiš v Supabase pod **Project Settings → API**.

## 5. Restart aplikacije

Ustavi dev server z `Ctrl + C`, nato zaženi:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Odpri:

```text
http://localhost:3000/login
```

Ustvari račun ali se prijavi. Ko si prijavljen, se projekti shranjujejo v Supabase namesto v demo/localStorage.

## 6. Preveri, da demo način ni več aktiven

V aplikaciji pojdi na **Nastavitve**.

Če vidiš Supabase kot povezan in račun kot prijavljen, delaš v pravi delovni verziji.
