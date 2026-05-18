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

export type WeddingPackageOption = {
  id: string;
  name: string;
  price: number;
};

export type WeddingPackageGroup = "photo" | "video" | "booth";

type StudioSettings = {
  shootTypeOptions: ShootTypeOption[];
  workflowStatuses: string[];
  weddingPhotoPackages: WeddingPackageOption[];
  weddingVideoPackages: WeddingPackageOption[];
  weddingBoothPackages: WeddingPackageOption[];
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

export const defaultWeddingPhotoPackages: WeddingPackageOption[] = [
  { id: "photo-1", name: "Paket 1 - do 4 ure", price: 490 },
  { id: "photo-2", name: "Paket 2 - do 7 ur", price: 790 },
  { id: "photo-3", name: "Paket 3 - do 10 ur", price: 990 },
  { id: "photo-4", name: "Paket 4 - več kot 13 ur", price: 1490 }
];

export const defaultWeddingVideoPackages: WeddingPackageOption[] = [
  { id: "video-highlight", name: "Highlights film", price: 0 },
  { id: "video-full-day", name: "Celodnevno snemanje", price: 0 }
];

export const defaultWeddingBoothPackages: WeddingPackageOption[] = [
  { id: "booth-standard", name: "Standard (2 h)", price: 250 },
  { id: "booth-party", name: "Party (3 h)", price: 290 },
  { id: "booth-premium", name: "Premium (4 h)", price: 340 }
];

function normalizeWeddingPackages(
  packages: WeddingPackageOption[] | undefined,
  defaults: WeddingPackageOption[]
) {
  const source = Array.isArray(packages) ? packages : defaults;

  return source
    .map((option) => ({
      id: String(option.id || crypto.randomUUID()),
      name: String(option.name || "").trim(),
      price: Math.max(Number(option.price || 0), 0)
    }))
    .filter((option) => option.name);
}

function readSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions,
      weddingPhotoPackages: defaultWeddingPhotoPackages,
      weddingVideoPackages: defaultWeddingVideoPackages,
      weddingBoothPackages: defaultWeddingBoothPackages
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions,
      weddingPhotoPackages: defaultWeddingPhotoPackages,
      weddingVideoPackages: defaultWeddingVideoPackages,
      weddingBoothPackages: defaultWeddingBoothPackages
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
      ],
      weddingPhotoPackages: normalizeWeddingPackages(
        parsed.weddingPhotoPackages,
        defaultWeddingPhotoPackages
      ),
      weddingVideoPackages: normalizeWeddingPackages(
        parsed.weddingVideoPackages,
        defaultWeddingVideoPackages
      ),
      weddingBoothPackages: normalizeWeddingPackages(
        parsed.weddingBoothPackages,
        defaultWeddingBoothPackages
      )
    };
  } catch {
    return {
      shootTypeOptions: defaultShootTypeOptions,
      workflowStatuses: defaultWorkflowStatusOptions,
      weddingPhotoPackages: defaultWeddingPhotoPackages,
      weddingVideoPackages: defaultWeddingVideoPackages,
      weddingBoothPackages: defaultWeddingBoothPackages
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
    workflowStatuses: defaultWorkflowStatusOptions,
    weddingPhotoPackages: defaultWeddingPhotoPackages,
    weddingVideoPackages: defaultWeddingVideoPackages,
    weddingBoothPackages: defaultWeddingBoothPackages
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

  function packageKey(group: WeddingPackageGroup) {
    if (group === "video") return "weddingVideoPackages";
    if (group === "booth") return "weddingBoothPackages";
    return "weddingPhotoPackages";
  }

  function defaultPackagesFor(group: WeddingPackageGroup) {
    if (group === "video") return defaultWeddingVideoPackages;
    if (group === "booth") return defaultWeddingBoothPackages;
    return defaultWeddingPhotoPackages;
  }

  const addWeddingPackage = useCallback(
    (group: WeddingPackageGroup, name: string, price: number) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      updateSettings((current) => {
        const key = packageKey(group);
        const exists = current[key].some(
          (option) => option.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) return current;

        return {
          ...current,
          [key]: [
            ...current[key],
            {
              id: crypto.randomUUID(),
              name: cleanName,
              price: Math.max(Number(price || 0), 0)
            }
          ]
        };
      });
    },
    [updateSettings]
  );

  const updateWeddingPackage = useCallback(
    (
      group: WeddingPackageGroup,
      id: string,
      values: Partial<Omit<WeddingPackageOption, "id">>
    ) => {
      updateSettings((current) => {
        const key = packageKey(group);
        return {
          ...current,
          [key]: current[key].map((option) =>
            option.id === id
              ? {
                  ...option,
                  name: values.name === undefined ? option.name : values.name,
                  price:
                    values.price === undefined
                      ? option.price
                      : Math.max(Number(values.price || 0), 0)
                }
              : option
          )
        };
      });
    },
    [updateSettings]
  );

  const removeWeddingPackage = useCallback(
    (group: WeddingPackageGroup, id: string) => {
      updateSettings((current) => {
        const key = packageKey(group);
        return {
          ...current,
          [key]: current[key].filter((option) => option.id !== id)
        };
      });
    },
    [updateSettings]
  );

  const resetWeddingPackages = useCallback(
    (group: WeddingPackageGroup) => {
      updateSettings((current) => ({
        ...current,
        [packageKey(group)]: defaultPackagesFor(group)
      }));
    },
    [updateSettings]
  );

  return useMemo(
    () => ({
      shootTypeOptions: settings.shootTypeOptions,
      shootTypes: settings.shootTypeOptions.map((option) => option.name),
      workflowStatuses: settings.workflowStatuses,
      weddingPhotoPackages: settings.weddingPhotoPackages,
      weddingVideoPackages: settings.weddingVideoPackages,
      weddingBoothPackages: settings.weddingBoothPackages,
      addWorkflowStatus,
      addShootType,
      addWeddingPackage,
      renameShootType,
      removeWeddingPackage,
      removeWorkflowStatus,
      removeShootType,
      resetWeddingPackages,
      resetWorkflowStatuses,
      resetShootTypes,
      updateShootType,
      updateWeddingPackage
    }),
    [
      addWorkflowStatus,
      addShootType,
      addWeddingPackage,
      renameShootType,
      removeWeddingPackage,
      removeWorkflowStatus,
      removeShootType,
      resetWeddingPackages,
      resetWorkflowStatuses,
      resetShootTypes,
      settings.shootTypeOptions,
      settings.weddingBoothPackages,
      settings.weddingPhotoPackages,
      settings.weddingVideoPackages,
      settings.workflowStatuses,
      updateShootType,
      updateWeddingPackage
    ]
  );
}
