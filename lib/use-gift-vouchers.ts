"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { GiftVoucher, GiftVoucherStatus } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-gift-vouchers";

export type GiftVoucherFormValues = {
  serial_number: string;
  buyer_name: string;
  recipient_name: string;
  value: number;
  issue_date: string;
  expiry_date: string;
  status: GiftVoucherStatus;
  notes: string;
};

function ensureVoucherShape(voucher: GiftVoucher): GiftVoucher {
  return {
    ...voucher,
    serial_number: voucher.serial_number ?? "",
    buyer_name: voucher.buyer_name ?? "",
    recipient_name: voucher.recipient_name ?? "",
    value: Number(voucher.value ?? 0),
    issue_date: voucher.issue_date ?? new Date().toISOString().slice(0, 10),
    expiry_date: voucher.expiry_date ?? "",
    redeemed_date: voucher.redeemed_date ?? null,
    status: voucher.status ?? "Aktiven",
    notes: voucher.notes ?? ""
  };
}

function readLocalVouchers() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as GiftVoucher[];
    return Array.isArray(parsed) ? parsed.map(ensureVoucherShape) : [];
  } catch {
    return [];
  }
}

function writeLocalVouchers(vouchers: GiftVoucher[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
}

function buildVoucher(values: GiftVoucherFormValues, existing?: GiftVoucher): GiftVoucher {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    serial_number: values.serial_number.trim(),
    buyer_name: values.buyer_name.trim(),
    recipient_name: values.recipient_name.trim(),
    value: Math.max(Number(values.value || 0), 0),
    issue_date: values.issue_date,
    expiry_date: values.expiry_date || null,
    redeemed_date: values.status === "Unovčen" ? existing?.redeemed_date ?? now.slice(0, 10) : null,
    status: values.status,
    notes: values.notes.trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function sortVouchers(a: GiftVoucher, b: GiftVoucher) {
  return b.issue_date.localeCompare(a.issue_date) || b.created_at.localeCompare(a.created_at);
}

export function useGiftVouchers() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadVouchers() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setVouchers(readLocalVouchers());
        setLoading(false);
        return;
      }

      if (!user) {
        setVouchers([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("gift_vouchers")
        .select("*")
        .order("issue_date", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setVouchers([]);
      } else {
        setVouchers((data ?? []).map(ensureVoucherShape));
      }

      setLoading(false);
    }

    loadVouchers();
  }, [authLoading, demoMode, user]);

  const createVoucher = useCallback(
    async (values: GiftVoucherFormValues) => {
      const voucher = buildVoucher(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("gift_vouchers")
          .insert({ ...voucher, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedVoucher = ensureVoucherShape(data);
        setVouchers((current) => [...current, savedVoucher].sort(sortVouchers));
        return savedVoucher;
      }

      setVouchers((current) => {
        const next = [...current, voucher].sort(sortVouchers);
        writeLocalVouchers(next);
        return next;
      });

      return voucher;
    },
    [demoMode, user]
  );

  const updateVoucher = useCallback(
    async (voucherId: string, values: GiftVoucherFormValues) => {
      const currentVoucher = vouchers.find((voucher) => voucher.id === voucherId);
      if (!currentVoucher) return null;

      const updatedVoucher = buildVoucher(values, currentVoucher);

      if (supabase && user && !demoMode) {
        const updatePayload = {
          user_id: updatedVoucher.user_id,
          serial_number: updatedVoucher.serial_number,
          buyer_name: updatedVoucher.buyer_name,
          recipient_name: updatedVoucher.recipient_name,
          value: updatedVoucher.value,
          issue_date: updatedVoucher.issue_date,
          expiry_date: updatedVoucher.expiry_date,
          redeemed_date: updatedVoucher.redeemed_date,
          status: updatedVoucher.status,
          notes: updatedVoucher.notes,
          updated_at: updatedVoucher.updated_at
        };
        const { data, error: mutationError } = await supabase
          .from("gift_vouchers")
          .update(updatePayload)
          .eq("id", voucherId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedVoucher = ensureVoucherShape(data);
        setVouchers((current) =>
          current.map((voucher) => (voucher.id === voucherId ? savedVoucher : voucher)).sort(sortVouchers)
        );
        return savedVoucher;
      }

      setVouchers((current) => {
        const next = current
          .map((voucher) => (voucher.id === voucherId ? updatedVoucher : voucher))
          .sort(sortVouchers);
        writeLocalVouchers(next);
        return next;
      });

      return updatedVoucher;
    },
    [demoMode, user, vouchers]
  );

  const deleteVoucher = useCallback(
    async (voucherId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("gift_vouchers")
          .delete()
          .eq("id", voucherId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setVouchers((current) => {
        const next = current.filter((voucher) => voucher.id !== voucherId);
        if (demoMode) writeLocalVouchers(next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      vouchers,
      loading,
      error,
      createVoucher,
      updateVoucher,
      deleteVoucher
    }),
    [createVoucher, deleteVoucher, error, loading, updateVoucher, vouchers]
  );
}
