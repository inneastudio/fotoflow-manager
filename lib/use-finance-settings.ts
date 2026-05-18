"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "fotoflow-manager-finance-settings";
const SETTINGS_KEY = "finance_settings";

type FinanceSettings = {
  monthlyRevenueGoal: number;
  showDashboardFinance: boolean;
};

const defaultFinanceSettings: FinanceSettings = {
  monthlyRevenueGoal: 0,
  showDashboardFinance: true
};

function normalizeFinanceSettings(value: Partial<FinanceSettings> | null): FinanceSettings {
  return {
    monthlyRevenueGoal: Math.max(Number(value?.monthlyRevenueGoal || 0), 0),
    showDashboardFinance: value?.showDashboardFinance ?? true
  };
}

function readLocalSettings() {
  if (typeof window === "undefined") return defaultFinanceSettings;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultFinanceSettings;

  try {
    return normalizeFinanceSettings(JSON.parse(saved) as Partial<FinanceSettings>);
  } catch {
    return defaultFinanceSettings;
  }
}

function writeLocalSettings(settings: FinanceSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useFinanceSettings() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<FinanceSettings>(defaultFinanceSettings);

  const persistSettings = useCallback(
    async (next: FinanceSettings) => {
      writeLocalSettings(next);

      if (!supabase || !user || demoMode) return;

      await supabase
        .from("app_settings")
        .upsert(
          {
            user_id: user.id,
            key: SETTINGS_KEY,
            value: next
          },
          { onConflict: "user_id,key" }
        );
    },
    [demoMode, user]
  );

  useEffect(() => {
    if (authLoading) return;

    async function loadSettings() {
      const localSettings = readLocalSettings();
      setSettings(localSettings);

      if (!supabase || !user || demoMode) return;

      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (error || !data?.value) {
        await persistSettings(localSettings);
        return;
      }

      const next = normalizeFinanceSettings(data.value as Partial<FinanceSettings>);
      setSettings(next);
      writeLocalSettings(next);
    }

    loadSettings();
  }, [authLoading, demoMode, persistSettings, user]);

  const updateFinanceSettings = useCallback(
    (updater: (current: FinanceSettings) => FinanceSettings) => {
      setSettings((current) => {
        const next = normalizeFinanceSettings(updater(current));
        void persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  return useMemo(
    () => ({
      ...settings,
      updateFinanceSettings
    }),
    [settings, updateFinanceSettings]
  );
}

