"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

export const defaultDocumentTemplates: DocumentTemplates = {
  contractIntro:
    "Pogodba ureja dogovor za fotografsko storitev med izvajalcem in naročnikom.",
  contractClauses: [
    {
      id: "scope",
      title: "Predmet pogodbe",
      body:
        "Izvajalec se zaveže izvesti fotografiranje za projekt {ime_projekta} dne {datum_fotografiranja} na lokaciji {lokacija}."
    },
    {
      id: "payment",
      title: "Cena in plačilo",
      body:
        "Dogovorjena cena storitve je {znesek}. Avans znaša {avans}, preostanek plačila znaša {preostanek}."
    },
    {
      id: "delivery",
      title: "Oddaja fotografij",
      body:
        "Končna galerija oziroma dogovorjeni materiali bodo oddani do {rok_oddaje}, razen če se stranki pisno dogovorita drugače."
    },
    {
      id: "rights",
      title: "Uporaba fotografij",
      body:
        "Naročnik prejme fotografije za osebno uporabo. Javna ali komercialna uporaba se ureja po dodatnem dogovoru."
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
  const [templates, setTemplates] = useState<DocumentTemplates>(defaultDocumentTemplates);

  useEffect(() => {
    setTemplates(readTemplates());
  }, []);

  const updateTemplates = useCallback((updater: (current: DocumentTemplates) => DocumentTemplates) => {
    setTemplates((current) => {
      const next = updater(current);
      writeTemplates(next);
      return next;
    });
  }, []);

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
