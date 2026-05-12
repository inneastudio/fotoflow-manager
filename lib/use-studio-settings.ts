"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shootTypes } from "@/lib/types";

export type ShootTypeOption = {
  name: string;
  deliveryWorkdays: number;
};

type StudioSettings = {
  shootTypeOptions: ShootTypeOption[];
};

const STORAGE_KEY = "fotoflow-manager-settings";

export const defaultShootTypeOptions: ShootTypeOption[] = shootTypes.map((name) => ({
  name,
  deliveryWorkdays:
    name === "Poroka"
      ? 25
      : name === "Branding"
        ? 10
        : name === "Cake smash" || name === "Rojstni dan"
          ? 7
          : 8
}));

function readSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return { shootTypeOptions: defaultShootTypeOptions };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { shootTypeOptions: defaultShootTypeOptions };

  try {
    const parsed = JSON.parse(saved) as Partial<StudioSettings>;
    const savedOptions = Array.isArray(parsed.shootTypeOptions)
      ? parsed.shootTypeOptions
      : [];
    const optionNames = new Set(savedOptions.map((option) => option.name));

    return {
      shootTypeOptions: [
        ...savedOptions,
        ...defaultShootTypeOptions.filter((option) => !optionNames.has(option.name))
      ].map((option) => ({
        name: String(option.name).trim(),
        deliveryWorkdays: Math.max(Number(option.deliveryWorkdays || 0), 0)
      }))
    };
  } catch {
    return { shootTypeOptions: defaultShootTypeOptions };
  }
}

function writeSettings(settings: StudioSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>({
    shootTypeOptions: defaultShootTypeOptions
  });

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const updateSettings = useCallback((updater: (current: StudioSettings) => StudioSettings) => {
    setSettings((current) => {
      const next = updater(current);
      writeSettings(next);
      return next;
    });
  }, []);

  const addShootType = useCallback(
    (name: string, deliveryWorkdays: number) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      updateSettings((current) => {
        const exists = current.shootTypeOptions.some(
          (option) => option.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) return current;

        return {
          shootTypeOptions: [
            ...current.shootTypeOptions,
            { name: cleanName, deliveryWorkdays: Math.max(Number(deliveryWorkdays || 0), 0) }
          ]
        };
      });
    },
    [updateSettings]
  );

  const removeShootType = useCallback(
    (name: string) => {
      updateSettings((current) => ({
        shootTypeOptions: current.shootTypeOptions.filter((option) => option.name !== name)
      }));
    },
    [updateSettings]
  );

  const updateShootType = useCallback(
    (name: string, deliveryWorkdays: number) => {
      updateSettings((current) => ({
        shootTypeOptions: current.shootTypeOptions.map((option) =>
          option.name === name
            ? { ...option, deliveryWorkdays: Math.max(Number(deliveryWorkdays || 0), 0) }
            : option
        )
      }));
    },
    [updateSettings]
  );

  const resetShootTypes = useCallback(() => {
    updateSettings(() => ({ shootTypeOptions: defaultShootTypeOptions }));
  }, [updateSettings]);

  return useMemo(
    () => ({
      shootTypeOptions: settings.shootTypeOptions,
      shootTypes: settings.shootTypeOptions.map((option) => option.name),
      addShootType,
      removeShootType,
      resetShootTypes,
      updateShootType
    }),
    [
      addShootType,
      removeShootType,
      resetShootTypes,
      settings.shootTypeOptions,
      updateShootType
    ]
  );
}
