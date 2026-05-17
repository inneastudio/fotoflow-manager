"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { DocumentType, Project, StudioDocument } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-documents";

function createShareToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

function ensureDocumentShape(document: StudioDocument): StudioDocument {
  return {
    ...document,
    status: document.status ?? "Osnutek",
    share_token: document.share_token || createShareToken(),
    signed_at: document.signed_at ?? null,
    signer_name: document.signer_name ?? null,
    signer_email: document.signer_email ?? null,
    signature_text: document.signature_text ?? null
  };
}

function readLocalDocuments() {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as StudioDocument[];
    return Array.isArray(parsed) ? parsed.map(ensureDocumentShape) : [];
  } catch {
    return [];
  }
}

function writeLocalDocuments(documents: StudioDocument[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

function documentTitle(project: Project, type: DocumentType) {
  const base = project.project_name || project.client_name;
  if (type === "timeline") return `Časovnica - ${base}`;
  if (type === "custom") return `Dokument - ${base}`;
  return `Poročna pogodba - ${base}`;
}

export function buildDocumentDraft(project: Project, type: DocumentType, html: string) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    user_id: null,
    project_id: project.id,
    title: documentTitle(project, type),
    type,
    status: "Osnutek" as const,
    client_name: project.client_name,
    client_email: project.email || "",
    document_html: html,
    share_token: createShareToken(),
    signed_at: null,
    signer_name: null,
    signer_email: null,
    signature_text: null,
    created_at: now,
    updated_at: now
  };
}

export function useDocuments() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadDocuments() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        const localDocuments = readLocalDocuments();
        setDocuments(localDocuments);
        setLoading(false);
        return;
      }

      if (!user) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setDocuments([]);
      } else {
        setDocuments((data ?? []).map(ensureDocumentShape));
      }

      setLoading(false);
    }

    loadDocuments();
  }, [authLoading, demoMode, user]);

  const createDocument = useCallback(
    async (project: Project, type: DocumentType, html: string) => {
      const draft = buildDocumentDraft(project, type, html);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("documents")
          .insert({ ...draft, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        setDocuments((current) => [ensureDocumentShape(data), ...current]);
        return ensureDocumentShape(data);
      }

      setDocuments((current) => {
        const next = [draft, ...current];
        writeLocalDocuments(next);
        return next;
      });

      return draft;
    },
    [demoMode, user]
  );

  const updateDocument = useCallback(
    async (documentId: string, values: Partial<StudioDocument>) => {
      const updatedAt = new Date().toISOString();
      const {
        id: _id,
        created_at: _createdAt,
        ...updateValues
      } = values;

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("documents")
          .update({ ...updateValues, updated_at: updatedAt })
          .eq("id", documentId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        setDocuments((current) =>
          current.map((document) =>
            document.id === documentId ? ensureDocumentShape(data) : document
          )
        );
        return ensureDocumentShape(data);
      }

      let updated: StudioDocument | null = null;
      setDocuments((current) => {
        const next = current.map((document) => {
          if (document.id !== documentId) return document;
          updated = ensureDocumentShape({ ...document, ...updateValues, updated_at: updatedAt });
          return updated;
        });
        writeLocalDocuments(next);
        return next;
      });

      return updated;
    },
    [demoMode, user]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("documents")
          .delete()
          .eq("id", documentId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setDocuments((current) => {
        const next = current.filter((document) => document.id !== documentId);
        if (demoMode) writeLocalDocuments(next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      documents,
      loading,
      error,
      createDocument,
      updateDocument,
      deleteDocument
    }),
    [createDocument, deleteDocument, documents, error, loading, updateDocument]
  );
}
