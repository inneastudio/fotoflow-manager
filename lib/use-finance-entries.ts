"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { FinanceEntry, PaymentMethod } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-finance-entries";

export type FinanceEntryFormValues = {
  entry_date: string;
  title: string;
  category: string;
  payment_method: PaymentMethod;
  amount: number;
  notes: string;
};

function ensureEntryShape(entry: FinanceEntry): FinanceEntry {
  return {
    ...entry,
    title: entry.title ?? "",
    category: entry.category ?? "Inkaso",
    payment_method: entry.payment_method ?? "Gotovina",
    amount: Number(entry.amount ?? 0),
    notes: entry.notes ?? ""
  };
}

function readLocalEntries() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as FinanceEntry[];
    return Array.isArray(parsed) ? parsed.map(ensureEntryShape) : [];
  } catch {
    return [];
  }
}

function writeLocalEntries(entries: FinanceEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function buildEntry(values: FinanceEntryFormValues, existing?: FinanceEntry): FinanceEntry {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    entry_date: values.entry_date,
    title: values.title.trim(),
    category: values.category.trim() || "Inkaso",
    payment_method: values.payment_method,
    amount: Math.max(Number(values.amount || 0), 0),
    notes: values.notes.trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function sortEntries(a: FinanceEntry, b: FinanceEntry) {
  return b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at);
}

export function useFinanceEntries() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadEntries() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setEntries(readLocalEntries());
        setLoading(false);
        return;
      }

      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("finance_entries")
        .select("*")
        .order("entry_date", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setEntries([]);
      } else {
        setEntries((data ?? []).map(ensureEntryShape));
      }

      setLoading(false);
    }

    loadEntries();
  }, [authLoading, demoMode, user]);

  const createEntry = useCallback(
    async (values: FinanceEntryFormValues) => {
      const entry = buildEntry(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("finance_entries")
          .insert({ ...entry, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedEntry = ensureEntryShape(data);
        setEntries((current) => [...current, savedEntry].sort(sortEntries));
        return savedEntry;
      }

      setEntries((current) => {
        const next = [...current, entry].sort(sortEntries);
        writeLocalEntries(next);
        return next;
      });

      return entry;
    },
    [demoMode, user]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("finance_entries")
          .delete()
          .eq("id", entryId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setEntries((current) => {
        const next = current.filter((entry) => entry.id !== entryId);
        if (demoMode) writeLocalEntries(next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      entries,
      loading,
      error,
      createEntry,
      deleteEntry
    }),
    [createEntry, deleteEntry, entries, error, loading]
  );
}
