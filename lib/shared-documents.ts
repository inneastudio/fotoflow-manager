"use client";

import { supabase } from "@/lib/supabase";
import type { StudioDocument } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-documents";

function readLocalDocuments() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as StudioDocument[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDocuments(documents: StudioDocument[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export async function getSharedDocument(token: string) {
  if (supabase) {
    const { data, error } = await supabase.rpc("get_shared_document", {
      share_token_input: token
    });

    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  }

  return readLocalDocuments().find((document) => document.share_token === token) ?? null;
}

export async function signSharedDocument({
  token,
  signerName,
  signerEmail,
  signatureText
}: {
  token: string;
  signerName: string;
  signerEmail: string;
  signatureText: string;
}) {
  if (supabase) {
    const { data, error } = await supabase.rpc("sign_shared_document", {
      share_token_input: token,
      signer_name_input: signerName,
      signer_email_input: signerEmail,
      signature_text_input: signatureText
    });

    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  }

  const documents = readLocalDocuments();
  const now = new Date().toISOString();
  const updated = documents.map((document) =>
    document.share_token === token
      ? {
          ...document,
          status: "Podpisano" as const,
          signed_at: now,
          signer_name: signerName,
          signer_email: signerEmail,
          signature_text: signatureText,
          updated_at: now
        }
      : document
  );

  writeLocalDocuments(updated);
  return updated.find((document) => document.share_token === token) ?? null;
}

