"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export type TemplateClause = {
  id: string;
  title: string;
  body: string;
};

export type TimelineTemplateItem = {
  id: string;
  time: string;
  title: string;
  note: string;
};

export type DocumentTemplates = {
  contractIntro: string;
  contractClauses: TemplateClause[];
  timelineIntro: string;
  timelineItems: TimelineTemplateItem[];
};

const STORAGE_KEY = "fotoflow-manager-document-templates";
const SETTINGS_KEY = "document_templates";

export const defaultDocumentTemplates: DocumentTemplates = {
  contractIntro:
    `POROČNA POGODBA
INNEA STUDIO

DATUM SKLENITVE POGODBE: {danasnji_datum}

NAROČNIK:
{ime_stranke} (v nadaljevanju naročnik in naročnica)
NASLOV: {naslov}
TELEFON: {telefon}
E-POŠTA: {email}

IN

IZVAJALEC:
INNEA STUDIO, Žan Zajc s.p.
Cesta V Ranče 22, Fram, 2313, Slovenia
info@inneastudio.si
051 648 437

DATUM POROKE: {datum_fotografiranja}
LOKACIJA POROKE: {lokacija}

IZBRAN PAKET FOTOGRAFIRANJA: {foto_paket}
OKVIRNA CENA: {znesek}

Točen paket in ceno določimo, ko se dogovorimo vse podrobnosti časovnice.
Dogovorjena cena je okvirna in temelji na časovnici poročnega dne, dogovorjeni na sestanku. V primeru sprememb časovnice ali dodatnih nepredvidenih ur se cena ustrezno prilagodi.`,
  contractClauses: [
    {
      id: "timeline",
      title: "Časovnica in dodatne storitve",
      body:
        `ČASOVNICA
priprave nevesta:
priprave ženin:
cerkveni obred:
civilni obred:
portretno fotografiranje:
večerja:
torta:
ostalo:

DODATNE STORITVE
dodatne ure fotografiranja:
inneabooth / photobooth: {photobooth_paket}
snemanje: {snemanje_paket}`
    },
    {
      id: "packages",
      title: "Paketi poročnega fotografiranja",
      body:
        `PAKET 1 - od 490 €
- fotografiranje do 4 ure
- 2 fotografa
- fotografiranje civilnega in/ali cerkvenega obreda
- skupinska fotografiranja
- krajše portretno fotografiranje
- 180-200 fotografij v digitalni obliki

PAKET 2 - od 790 €
- fotografiranje do 7 ur
- 2 fotografa
- fotografiranje civilnega in/ali cerkvenega obreda
- skupinska fotografiranja
- portretno fotografiranje
- fotografiranje slavja ali priprav
- 300-400 fotografij v digitalni obliki

PAKET 3 - od 990 €
- fotografiranje do 10 ur
- 2 fotografa
- fotografiranje priprav mladoporočencev
- civilni obred
- cerkveni obred
- skupinska fotografiranja
- portretno fotografiranje
- fotografiranje slavja
- 550-800 fotografij v digitalni obliki

PAKET 4 - 1490 €
- fotografiranje več kot 13 ur
- 2 fotografa
- fotografiranje priprav
- civilni obred in cerkveni obred
- portretno fotografiranje
- fotografiranje slavja
- fotografije v spletni galeriji
- 100 natisnjenih fotografij v velikosti 10x15`
    },
    {
      id: "additional-offer",
      title: "Dodatna ponudba",
      body:
        `Dodatna ura fotografiranja: 90,00 €
Predporočno fotografiranje: po dogovoru
Oblikovanje in izdelava fotoknjige: po dogovoru

Potni stroški: Če skupna razdalja poti od naslova izvajalca do lokacije izvedbe in nazaj presega 350 km, naročnik krije potne stroške v pavšalnem znesku 100 €.

Najem fotobooth-a z neomejenim in visokokakovostnim printom:
Standard (2 h): 290 € / znižano 250 €
Party (3 h): 340 € / znižano 290 €
Premium (4 h): 390 € / znižano 340 €

Vse cene vključujejo: izbran urni paket najema stojnice, izbiro ozadja iz ponudbe, rekvizite, personaliziran digitalni okvir, neomejen tisk, spletno galerijo po dogodku in QR kodo za prenos fotografij.

Doplačilo FOTO ALBUM: 30 €`
    },
    {
      id: "general-provisions",
      title: "Splošne določbe",
      body:
        `Pogodbene stranke uvodoma kot nesporno ugotavljajo:

- da je izvajalec samostojni podjetnik, ki se ukvarja s fotografsko dejavnostjo;
- da sta se naročnika pred podpisom pogodbe seznanila z izvajalčevim slogom fotografiranja, ponudbo, cenami in načinom dela;
- da naročnika razumeta, da izvajalec samostojno odloča o načinu fotografiranja, selekciji in obdelavi fotografij;
- da naročnika za dogovorjeno ceno prejmeta fotografije, ki jih izvajalec samostojno selekcionira in obdela;
- da storitev ne vključuje lepotne (Beauty) retuše, razen če je posebej dogovorjeno;
- da ima izvajalec izključno pravico do fotografiranja;
- da naročnika ne bosta zavrnila izdelkov izvajalca na podlagi subjektivnih estetskih kriterijev;
- da se fotografije predajo v JPEG formatu v polni resoluciji in naročnika nista upravičena zahtevati RAW/TIFF datotek;
- da naročnika ne bosta dodatno obdelovala dokončanih fotografij ter jih nato objavljala kot predelane izdelke;
- da je ta pogodba sklenjena na daljavo v smislu določil Zakona o varstvu potrošnikov.`
    },
    {
      id: "scope",
      title: "Predmet pogodbe",
      body:
        `S predmetno pogodbo se izvajalec zavezuje, da bo za naročnika izvedel storitve poročnega fotografiranja, naročnika pa bosta izvajalcu za njegove storitve plačala dogovorjeno kupnino.

Vse glavne in bistvene sestavine pogodbe, kot so obseg storitev, kraj in dan oprave storitve ter cena, so razvidne iz te pogodbe in prilog, ki so sestavni del pogodbe.

Pogodba je sklenjena in začne veljati, ko jo podpišejo vse pogodbene stranke in je v celoti plačana ara.`
    },
    {
      id: "payment",
      title: "Cena in način plačila",
      body:
        `Dogovorjena cena storitve je {znesek}. Avans oziroma ara znaša {avans}. Preostanek plačila znaša {preostanek}.

Pogodbeni stranki se dogovorita, da je potrebno ob podpisu pogodbe plačati aro v višini 300,00 €, razen če je v projektu dogovorjeno drugače. S plačilom are se dokončno rezervira termin izvajalčevih storitev.

Naročnika morata najkasneje 7 dni po terminu poroke plačati celoten preostanek kupnine, in sicer v gotovini ali na transakcijski račun izvajalca, odprt pri banki NOVA KBM d.d., št. računa SI56 0400 0027 6387 667.

Stroški pošiljanja končnega izdelka niso vključeni v končno ceno in se zaračunajo posebej, če je to potrebno.`
    },
    {
      id: "client-duties",
      title: "Pravice in dolžnosti naročnika",
      body:
        `Naročnika imata pravico zahtevati od izvajalca, da v osnutku poročne knjige oziroma albuma zamenja posamezne fotografije, in sicer do največ 10 fotografij v celotnem obsegu albuma, v kolikor je izdelava albuma predmet pogodbe.

Naročnika imata dolžnost:
- izvajalcu jasno izraziti svoje želje in zahteve glede storitev;
- pravočasno odgovarjati na vprašanja pred, med in po poroki;
- pravočasno obveščati izvajalca o spremembah poročnega dne;
- izvajalcu sporočiti dodatne želje vsaj 21 dni pred poroko;
- zagotoviti nemoten potek dela;
- pridobiti dovoljenja za fotografiranje na dogovorjenih lokacijah, če so potrebna;
- v dogovorjenem roku poravnati finančne obveznosti do izvajalca.`
    },
    {
      id: "provider-duties",
      title: "Pravice in dolžnosti izvajalca",
      body:
        `Izvajalec ima dolžnost:
- v roku 30 do 40 delovnih dni po končani poroki poslati naročnikoma izdelano galerijo z izbranimi fotografijami;
- v roku 50 do 70 delovnih dni po dogodku izdelati osnutek poročne knjige oziroma albuma, v kolikor je to predmet pogodbe;
- fotografije skrbno hraniti v svojem arhivu še 3 leta od dneva dostave fotografij;
- v primeru bolezni, poškodbe, smrti, višje sile ali drugega nepričakovanega dogodka storiti vse, da zagotovi primernega nadomestnega izvajalca.

Izvajalec ima pravico do toplega obroka in osvežilne pijače, če fotografiranje traja več kot 8 ur. Izvajalec lahko v primeru neprimernega, grozečega ali napadalnega odnosa do njega ali asistenta zaključi izvajanje storitve in zapusti kraj dogodka.`
    },
    {
      id: "responsibility",
      title: "Odgovornosti izvajalca",
      body:
        `Izvajalec se zavezuje storitve opraviti s potrebno skrbnostjo in profesionalnostjo ter pri tem v največji možni meri upoštevati želje naročnikov.

Naročnika potrjujeta, da sta seznanjena, da izvajalec nima vpliva na vremenske razmere, izgled dekoracije, obleke, cvetja, make-upa, cateringa, zamude, prostor in druge okoliščine dogodka.

Izvajalec ni odgovoren za subjektivno oceno izdelkov, izgubljene priložnosti ali okoliščine, na katere nima vpliva.`
    },
    {
      id: "copyright",
      title: "Avtorske pravice izvajalca",
      body:
        `Naročnika sta seznanjena, da izvajalec z opravljeno storitvijo pridobi materialno avtorsko pravico na svojih fotografijah.

Naročnika lahko fotografije uporabljata za osebne oziroma lastne namene. Za komercialno uporabo morata predhodno pridobiti pisno soglasje izvajalca.

Izvajalec lahko uporabi fotografije za portfolio, spletno stran, blog, promocijo, natečaje in druge umetniške namene, če naročnika s tem soglašata v prilogi oziroma pisni izjavi.`
    },
    {
      id: "gdpr",
      title: "Varstvo osebnih podatkov",
      body:
        `Izvajalec naročnikoma zagotavlja varstvo osebnih podatkov skladno z GDPR in veljavno zakonodajo.

Izvajalec osebne podatke uporablja zgolj za namen zagotavljanja storitev poročnega fotografiranja in svetovanja v zvezi s poročnim fotografiranjem.

Naročnika imata pravico do dostopa, popravka, izbrisa, omejitve obdelave, ugovora in prenosljivosti osebnih podatkov v skladu z GDPR.`
    },
    {
      id: "cancellation",
      title: "Odstop od pogodbe",
      body:
        `Naročnika lahko kadarkoli odstopita od pogodbe. V primeru odstopa več kot 30 dni pred datumom poroke izvajalec zadrži aro v celoti. V primeru odstopa manj kot 30 dni pred datumom poroke sta naročnika dolžna plačati celotno dogovorjeno kupnino.

Izvajalec lahko odstopi od pogodbe. V primeru upravičenega odstopa vrne naročnikoma plačano aro oziroma plačani znesek, s čimer prenehajo njegove obveznosti po pogodbi, razen določil o varovanju osebnih podatkov.`
    },
    {
      id: "disputes",
      title: "Reševanje sporov in končne določbe",
      body:
        `Pogodbene stranke se zavezujejo, da bodo morebitne spore reševale sporazumno. Če sporazumna rešitev ni mogoča, je pristojno sodišče po sedežu izvajalca in velja slovenska zakonodaja.

Spremembe pogodbe so možne samo v pisni obliki in podpisane s strani vseh pogodbenih strank.

Pogodba je sestavljena v dveh enakih izvodih, od katerih en izvod prejmeta naročnika, drugi pa izvajalec.

Pogodbene stranke potrjujejo, da so pogodbo prebrale, razumele in se z njo strinjajo.`
    }
  ],
  timelineIntro:
    "Časovnica je okvirni plan dneva in se lahko po dogovoru prilagodi dejanskemu poteku dogodka.",
  timelineItems: [
    { id: "prep", time: "10:00", title: "Priprave", note: "Detajli, obleka, portreti med pripravami." },
    { id: "ceremony", time: "15:00", title: "Obred", note: "Prihod, obred, čestitke." },
    { id: "portraits", time: "16:00", title: "Portreti", note: "Par, družina, skupinske fotografije." },
    { id: "dinner", time: "18:00", title: "Večerja", note: "Ambient, govori, detajli." }
  ]
};

function normalizeTemplates(value: Partial<DocumentTemplates> | null): DocumentTemplates {
  return {
    contractIntro: String(value?.contractIntro || defaultDocumentTemplates.contractIntro),
    contractClauses: Array.isArray(value?.contractClauses) && value.contractClauses.length
      ? value.contractClauses.map((clause) => ({
          id: String(clause.id || crypto.randomUUID()),
          title: String(clause.title || "Člen"),
          body: String(clause.body || "")
        }))
      : defaultDocumentTemplates.contractClauses,
    timelineIntro: String(value?.timelineIntro || defaultDocumentTemplates.timelineIntro),
    timelineItems: Array.isArray(value?.timelineItems) && value.timelineItems.length
      ? value.timelineItems.map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          time: String(item.time || ""),
          title: String(item.title || "Korak"),
          note: String(item.note || "")
        }))
      : defaultDocumentTemplates.timelineItems
  };
}

function readTemplates(): DocumentTemplates {
  if (typeof window === "undefined") return defaultDocumentTemplates;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultDocumentTemplates;

  try {
    return normalizeTemplates(JSON.parse(saved) as Partial<DocumentTemplates>);
  } catch {
    return defaultDocumentTemplates;
  }
}

function writeTemplates(templates: DocumentTemplates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useDocumentTemplates() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplates>(defaultDocumentTemplates);

  const persistTemplates = useCallback(
    async (next: DocumentTemplates) => {
      writeTemplates(next);

      if (!supabase || !user || demoMode) return;

      await supabase
        .from("app_settings")
        .upsert(
          {
            user_id: user.id,
            key: SETTINGS_KEY,
            value: next as unknown as Record<string, unknown>
          },
          { onConflict: "user_id,key" }
        );
    },
    [demoMode, user]
  );

  useEffect(() => {
    if (authLoading) return;

    async function loadTemplates() {
      const localTemplates = readTemplates();
      setTemplates(localTemplates);

      if (!supabase || !user || demoMode) return;

      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (error || !data?.value) {
        await persistTemplates(localTemplates);
        return;
      }

      const next = normalizeTemplates(data.value as Partial<DocumentTemplates>);
      setTemplates(next);
      writeTemplates(next);
    }

    loadTemplates();
  }, [authLoading, demoMode, persistTemplates, user]);

  const updateTemplates = useCallback((updater: (current: DocumentTemplates) => DocumentTemplates) => {
    setTemplates((current) => {
      const next = updater(current);
      void persistTemplates(next);
      return next;
    });
  }, [persistTemplates]);

  const resetTemplates = useCallback(() => {
    updateTemplates(() => defaultDocumentTemplates);
  }, [updateTemplates]);

  return useMemo(
    () => ({
      templates,
      updateTemplates,
      resetTemplates
    }),
    [resetTemplates, templates, updateTemplates]
  );
}
