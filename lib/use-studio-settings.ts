"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  shootTypes,
  workflowStatuses as defaultWorkflowStatuses
} from "@/lib/types";

export type ShootTypeOption = {
  name: string;
  deliveryWorkdays: number;
  fixedPrice: number;
};

type StudioSettings = {
  shootTypeOptions: ShootTypeOption[];
  workflowStatuses: string[];
};

const STORAGE_KEY = "fotoflow-manager-settings";

export const defaultShootTypeOptions: ShootTypeOption[] = shootTypes.map((name) => ({
  name,
  fixedPrice: 0,
  deliveryWorkdays:
    name === "Poroka"
      ? 25
      : name === "Branding"
        ? 10
        : name === "Cake smash" || name === "Rojstni dan"
          ? 7
          : 8
}));

export const defaultWorkflowStatusOptions = [...defaultWorkflowStatuses];

function readSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions
    };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<StudioSettings>;
    const savedOptions = Array.isArray(parsed.shootTypeOptions)
      ? parsed.shootTypeOptions
      : [];
    const optionNames = new Set(savedOptions.map((option) => option.name));

    const savedStatuses = Array.isArray(parsed.workflowStatuses)
      ? parsed.workflowStatuses
      : [];
    const cleanSavedStatuses = savedStatuses
      .map((status) => String(status).trim())
      .filter(Boolean);
    const statusNames = new Set(
      cleanSavedStatuses.map((status) => status.toLowerCase())
    );

    return {
      shootTypeOptions: [
        ...savedOptions,
        ...defaultShootTypeOptions.filter((option) => !optionNames.has(option.name))
      ].map((option) => ({
        name: String(option.name).trim(),
        deliveryWorkdays: Math.max(Number(option.deliveryWorkdays || 0), 0),
        fixedPrice: Math.max(Number(option.fixedPrice || 0), 0)
      })),
      workflowStatuses: [
        ...cleanSavedStatuses,
        ...defaultWorkflowStatusOptions.filter(
          (status) => !statusNames.has(status.toLowerCase())
        )
      ]
    };
  } catch {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions
    };
  }
}

function writeSettings(settings: StudioSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>({
    shootTypeOptions: defaultShootTypeOptions,
    workflowStatuses: defaultWorkflowStatusOptions
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
    (name: string, deliveryWorkdays: number, fixedPrice = 0) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      updateSettings((current) => {
        const exists = current.shootTypeOptions.some(
          (option) => option.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) return current;

        return {
          ...current,
          shootTypeOptions: [
            ...current.shootTypeOptions,
            {
              name: cleanName,
              deliveryWorkdays: Math.max(Number(deliveryWorkdays || 0), 0),
              fixedPrice: Math.max(Number(fixedPrice || 0), 0)
            }
          ]
        };
      });
    },
    [updateSettings]
  );

  const removeShootType = useCallback(
    (name: string) => {
      updateSettings((current) => ({
        ...current,
        shootTypeOptions: current.shootTypeOptions.filter((option) => option.name !== name)
      }));
    },
    [updateSettings]
  );

  const updateShootType = useCallback(
    (name: string, deliveryWorkdays: number, fixedPrice: number) => {
      updateSettings((current) => ({
        ...current,
        shootTypeOptions: current.shootTypeOptions.map((option) =>
          option.name === name
            ? {
                ...option,
                deliveryWorkdays: Math.max(Number(deliveryWorkdays || 0), 0),
                fixedPrice: Math.max(Number(fixedPrice || 0), 0)
              }
            : option
        )
      }));
    },
    [updateSettings]
  );

  const renameShootType = useCallback(
    (currentName: string, nextName: string) => {
      const cleanName = nextName.trim();
      if (!cleanName) return;

      updateSettings((current) => {
        const exists = current.shootTypeOptions.some(
          (option) =>
            option.name !== currentName &&
            option.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) return current;

        return {
          ...current,
          shootTypeOptions: current.shootTypeOptions.map((option) =>
            option.name === currentName ? { ...option, name: cleanName } : option
          )
        };
      });
    },
    [updateSettings]
  );

  const resetShootTypes = useCallback(() => {
    updateSettings((current) => ({
      ...current,
      shootTypeOptions: defaultShootTypeOptions
    }));
  }, [updateSettings]);

  const addWorkflowStatus = useCallback(
    (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      updateSettings((current) => {
        const exists = current.workflowStatuses.some(
          (status) => status.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) return current;

        return {
          ...current,
          workflowStatuses: [...current.workflowStatuses, cleanName]
        };
      });
    },
    [updateSettings]
  );

  const removeWorkflowStatus = useCallback(
    (name: string) => {
      updateSettings((current) => {
        if (current.workflowStatuses.length <= 1) return current;

        return {
          ...current,
          workflowStatuses: current.workflowStatuses.filter((status) => status !== name)
        };
      });
    },
    [updateSettings]
  );

  const resetWorkflowStatuses = useCallback(() => {
    updateSettings((current) => ({
      ...current,
      workflowStatuses: defaultWorkflowStatusOptions
    }));
  }, [updateSettings]);

  return useMemo(
    () => ({
      shootTypeOptions: settings.shootTypeOptions,
      shootTypes: settings.shootTypeOptions.map((option) => option.name),
      workflowStatuses: settings.workflowStatuses,
      addWorkflowStatus,
      addShootType,
      renameShootType,
      removeWorkflowStatus,
      removeShootType,
      resetWorkflowStatuses,
      resetShootTypes,
      updateShootType
    }),
    [
      addWorkflowStatus,
      addShootType,
      renameShootType,
      removeWorkflowStatus,
      removeShootType,
      resetWorkflowStatuses,
      resetShootTypes,
      settings.shootTypeOptions,
      settings.workflowStatuses,
      updateShootType
    ]
  );
}
