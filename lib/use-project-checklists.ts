"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { ProjectChecklistItem } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-project-checklists";

export type ProjectChecklistItemFormValues = {
  project_id: string;
  label: string;
  category: string;
  quantity: number;
  notes: string;
};

function ensureItemShape(item: ProjectChecklistItem): ProjectChecklistItem {
  return {
    ...item,
    project_id: item.project_id ?? "",
    label: item.label ?? "",
    category: item.category ?? "Oprema",
    quantity: Math.max(Number(item.quantity ?? 1), 1),
    is_checked: Boolean(item.is_checked),
    sort_order: Number(item.sort_order ?? 0),
    notes: item.notes ?? ""
  };
}

function readLocalItems() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as ProjectChecklistItem[];
    return Array.isArray(parsed) ? parsed.map(ensureItemShape) : [];
  } catch {
    return [];
  }
}

function writeLocalItems(items: ProjectChecklistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function sortItems(a: ProjectChecklistItem, b: ProjectChecklistItem) {
  return (
    a.sort_order - b.sort_order ||
    a.category.localeCompare(b.category, "sl") ||
    a.label.localeCompare(b.label, "sl")
  );
}

function buildItem(
  values: ProjectChecklistItemFormValues,
  existing?: ProjectChecklistItem,
  sortOrder = 0
): ProjectChecklistItem {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    project_id: values.project_id,
    label: values.label.trim(),
    category: values.category.trim() || "Oprema",
    quantity: Math.max(Number(values.quantity || 1), 1),
    is_checked: existing?.is_checked ?? false,
    sort_order: existing?.sort_order ?? sortOrder,
    notes: values.notes.trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function toUpdatePayload(item: ProjectChecklistItem) {
  return {
    user_id: item.user_id,
    project_id: item.project_id,
    label: item.label,
    category: item.category,
    quantity: item.quantity,
    is_checked: item.is_checked,
    sort_order: item.sort_order,
    notes: item.notes,
    updated_at: item.updated_at
  };
}

export function useProjectChecklists() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ProjectChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadItems() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setItems(readLocalItems().sort(sortItems));
        setLoading(false);
        return;
      }

      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("project_checklist_items")
        .select("*")
        .order("sort_order", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setItems([]);
      } else {
        setItems((data ?? []).map(ensureItemShape).sort(sortItems));
      }

      setLoading(false);
    }

    loadItems();
  }, [authLoading, demoMode, user]);

  const createItem = useCallback(
    async (values: ProjectChecklistItemFormValues) => {
      const projectItems = items.filter((item) => item.project_id === values.project_id);
      const item = buildItem(values, undefined, projectItems.length + 1);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("project_checklist_items")
          .insert({ ...item, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedItem = ensureItemShape(data);
        setItems((current) => [...current, savedItem].sort(sortItems));
        return savedItem;
      }

      setItems((current) => {
        const next = [...current, item].sort(sortItems);
        writeLocalItems(next);
        return next;
      });

      return item;
    },
    [demoMode, items, user]
  );

  const createItems = useCallback(
    async (values: ProjectChecklistItemFormValues[]) => {
      const savedItems = [];
      for (const value of values) {
        savedItems.push(await createItem(value));
      }
      return savedItems;
    },
    [createItem]
  );

  const updateItem = useCallback(
    async (itemId: string, values: Partial<ProjectChecklistItem>) => {
      const currentItem = items.find((item) => item.id === itemId);
      if (!currentItem) return null;

      const updatedItem = ensureItemShape({
        ...currentItem,
        ...values,
        updated_at: new Date().toISOString()
      });

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("project_checklist_items")
          .update(toUpdatePayload(updatedItem))
          .eq("id", itemId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedItem = ensureItemShape(data);
        setItems((current) =>
          current.map((item) => (item.id === itemId ? savedItem : item)).sort(sortItems)
        );
        return savedItem;
      }

      setItems((current) => {
        const next = current
          .map((item) => (item.id === itemId ? updatedItem : item))
          .sort(sortItems);
        writeLocalItems(next);
        return next;
      });

      return updatedItem;
    },
    [demoMode, items, user]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("project_checklist_items")
          .delete()
          .eq("id", itemId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setItems((current) => {
        const next = current.filter((item) => item.id !== itemId);
        if (demoMode) writeLocalItems(next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      createItem,
      createItems,
      updateItem,
      deleteItem
    }),
    [createItem, createItems, deleteItem, error, items, loading, updateItem]
  );
}
