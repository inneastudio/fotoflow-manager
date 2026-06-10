"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
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

export type EquipmentPresetItem = {
  id: string;
  label: string;
  category: string;
  quantity: number;
  notes: string;
};

export type EquipmentPreset = {
  id: string;
  name: string;
  shootType: string;
  items: EquipmentPresetItem[];
};

export type StudioSettings = {
  shootTypeOptions: ShootTypeOption[];
  workflowStatuses: string[];
  weddingPhotoPackages: WeddingPackageOption[];
  weddingVideoPackages: WeddingPackageOption[];
  weddingBoothPackages: WeddingPackageOption[];
  equipmentPresets: EquipmentPreset[];
  shootReminderEmailSubject: string;
  shootReminderEmailContent: string;
};

const STORAGE_KEY = "fotoflow-manager-settings";
const SETTINGS_KEY = "studio_settings";

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

export const defaultEquipmentPresets: EquipmentPreset[] = [
  {
    id: "preset-basic",
    name: "Osnovna oprema",
    shootType: "Vsi dogodki",
    items: [
      { id: "basic-camera-1", label: "Fotoaparat 1", category: "Oprema", quantity: 1, notes: "" },
      { id: "basic-camera-2", label: "Fotoaparat 2", category: "Oprema", quantity: 1, notes: "" },
      { id: "basic-35", label: "Objektiv 35mm", category: "Objektivi", quantity: 1, notes: "" },
      { id: "basic-85", label: "Objektiv 85mm", category: "Objektivi", quantity: 1, notes: "" },
      { id: "basic-cards", label: "Spominske kartice", category: "Shramba", quantity: 4, notes: "" },
      { id: "basic-batteries", label: "Baterije", category: "Baterije", quantity: 4, notes: "" },
      { id: "basic-chargers", label: "Polnilci", category: "Baterije", quantity: 2, notes: "" },
      { id: "basic-strap", label: "Pas / oprtnik", category: "Oprema", quantity: 1, notes: "" }
    ]
  },
  {
    id: "preset-wedding",
    name: "Poroka",
    shootType: "Poroka",
    items: [
      { id: "wedding-flash", label: "Bliskavica", category: "Luč", quantity: 2, notes: "" },
      { id: "wedding-flash-batteries", label: "Baterije za bliskavico", category: "Baterije", quantity: 8, notes: "" },
      { id: "wedding-trigger", label: "Sprožilec", category: "Luč", quantity: 1, notes: "" },
      { id: "wedding-light-stand", label: "Stojalo za luč", category: "Luč", quantity: 1, notes: "" },
      { id: "wedding-backup", label: "Rezervni fotoaparat", category: "Oprema", quantity: 1, notes: "" },
      { id: "wedding-cloth", label: "Čistilna krpica", category: "Oprema", quantity: 1, notes: "" },
      { id: "wedding-rain", label: "Dežnik / zaščita za dež", category: "Oprema", quantity: 1, notes: "" },
      { id: "wedding-timeline", label: "Časovnica", category: "Dokumenti", quantity: 1, notes: "" }
    ]
  },
  {
    id: "preset-studio",
    name: "Studio",
    shootType: "Studio",
    items: [
      { id: "studio-light-1", label: "Luč 1", category: "Studio", quantity: 1, notes: "" },
      { id: "studio-light-2", label: "Luč 2", category: "Studio", quantity: 1, notes: "" },
      { id: "studio-softbox", label: "Softbox", category: "Studio", quantity: 1, notes: "" },
      { id: "studio-background", label: "Ozadje", category: "Studio", quantity: 1, notes: "" },
      { id: "studio-extension", label: "Podaljšek", category: "Studio", quantity: 1, notes: "" },
      { id: "studio-props", label: "Rekviziti", category: "Rekviziti", quantity: 1, notes: "" },
      { id: "studio-kids", label: "Otroški pripomočki", category: "Rekviziti", quantity: 1, notes: "" },
      { id: "studio-prints", label: "Mini tiskovine", category: "Tiskovine", quantity: 1, notes: "" }
    ]
  }
];

export const defaultShootReminderEmailSubject =
  "Opomnik za fotografiranje: {tip_fotografiranja}";

export const defaultShootReminderEmailContent = `Živjo {ime_stranke},

jutri imamo rezerviran termin za {tip_fotografiranja}.

Datum: {datum_fotografiranja}
Ura: {ura_fotografiranja}
Lokacija: {lokacija}

Kratka priprava:
- pridi nekaj minut prej,
- oblačila naj bodo pripravljena in zlikana,
- izberi barve brez močnih napisov in velikih vzorcev,
- če imaš posebne želje, jih lahko pošlješ v odgovor na ta email.

Se vidimo kmalu,
Fiora`;

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

function normalizeEquipmentPresets(presets: EquipmentPreset[] | undefined) {
  const source = Array.isArray(presets) ? presets : defaultEquipmentPresets;

  return source
    .map((preset) => ({
      id: String(preset.id || crypto.randomUUID()),
      name: String(preset.name || "").trim(),
      shootType: String(preset.shootType || "Vsi dogodki").trim(),
      items: Array.isArray(preset.items)
        ? preset.items
            .map((item) => ({
              id: String(item.id || crypto.randomUUID()),
              label: String(item.label || "").trim(),
              category: String(item.category || "Oprema").trim(),
              quantity: Math.max(Number(item.quantity || 1), 1),
              notes: String(item.notes || "").trim()
            }))
            .filter((item) => item.label)
        : []
    }))
    .filter((preset) => preset.name);
}

type LegacyStudioSettings = Partial<StudioSettings> & {
  shootReminderEmailText?: string;
};

function normalizeSettings(value: LegacyStudioSettings | null): StudioSettings {
  const savedOptions = Array.isArray(value?.shootTypeOptions)
    ? value.shootTypeOptions
    : [];
  const optionNames = new Set(savedOptions.map((option) => option.name));
  const savedStatuses = Array.isArray(value?.workflowStatuses)
    ? value.workflowStatuses
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
      value?.weddingPhotoPackages,
      defaultWeddingPhotoPackages
    ),
    weddingVideoPackages: normalizeWeddingPackages(
      value?.weddingVideoPackages,
      defaultWeddingVideoPackages
    ),
    weddingBoothPackages: normalizeWeddingPackages(
      value?.weddingBoothPackages,
      defaultWeddingBoothPackages
    ),
    equipmentPresets: normalizeEquipmentPresets(value?.equipmentPresets),
    shootReminderEmailSubject:
      typeof value?.shootReminderEmailSubject === "string"
        ? value.shootReminderEmailSubject
        : defaultShootReminderEmailSubject,
    shootReminderEmailContent:
      typeof value?.shootReminderEmailContent === "string"
        ? value.shootReminderEmailContent
        : typeof value?.shootReminderEmailText === "string"
          ? value.shootReminderEmailText
          : defaultShootReminderEmailContent
  };
}

function defaultSettings(): StudioSettings {
  return {
    shootTypeOptions: defaultShootTypeOptions,
    workflowStatuses: defaultWorkflowStatusOptions,
    weddingPhotoPackages: defaultWeddingPhotoPackages,
    weddingVideoPackages: defaultWeddingVideoPackages,
    weddingBoothPackages: defaultWeddingBoothPackages,
    equipmentPresets: defaultEquipmentPresets,
    shootReminderEmailSubject: defaultShootReminderEmailSubject,
    shootReminderEmailContent: defaultShootReminderEmailContent
  };
}

function readSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return defaultSettings();
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultSettings();
  }

  try {
    return normalizeSettings(JSON.parse(saved) as Partial<StudioSettings>);
  } catch {
    return defaultSettings();
  }
}

function writeSettings(settings: StudioSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useStudioSettings() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<StudioSettings>(defaultSettings);

  const persistSettings = useCallback(
    async (next: StudioSettings) => {
      writeSettings(next);

      if (!supabase || !user || demoMode) return;

      await supabase
        .from("app_settings")
        .upsert(
          {
            user_id: user.id,
            key: SETTINGS_KEY,
            value: next as unknown as Record<string, unknown>
          },
          { onConflict: "user_id,key" }
        );
    },
    [demoMode, user]
  );

  useEffect(() => {
    if (authLoading) return;

    async function loadSettings() {
      const localSettings = readSettings();
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

      const next = normalizeSettings(data.value as Partial<StudioSettings>);
      setSettings(next);
      writeSettings(next);
    }

    loadSettings();
  }, [authLoading, demoMode, persistSettings, user]);

  const updateSettings = useCallback((updater: (current: StudioSettings) => StudioSettings) => {
    setSettings((current) => {
      const next = updater(current);
      void persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const saveSettings = useCallback(
    (nextSettings: StudioSettings) => {
      const next = normalizeSettings(nextSettings);
      setSettings(next);
      void persistSettings(next);
    },
    [persistSettings]
  );

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

  const updateShootReminderEmail = useCallback(
    (values: Partial<Pick<
      StudioSettings,
      "shootReminderEmailSubject" | "shootReminderEmailContent"
    >>) => {
      updateSettings((current) => ({
        ...current,
        ...values
      }));
    },
    [updateSettings]
  );

  const resetShootReminderEmail = useCallback(() => {
    updateSettings((current) => ({
      ...current,
      shootReminderEmailSubject: defaultShootReminderEmailSubject,
      shootReminderEmailContent: defaultShootReminderEmailContent
    }));
  }, [updateSettings]);

  return useMemo(
    () => ({
      settings,
      shootTypeOptions: settings.shootTypeOptions,
      shootTypes: settings.shootTypeOptions.map((option) => option.name),
      workflowStatuses: settings.workflowStatuses,
      weddingPhotoPackages: settings.weddingPhotoPackages,
      weddingVideoPackages: settings.weddingVideoPackages,
      weddingBoothPackages: settings.weddingBoothPackages,
      equipmentPresets: settings.equipmentPresets,
      shootReminderEmailSubject: settings.shootReminderEmailSubject,
      shootReminderEmailContent: settings.shootReminderEmailContent,
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
      updateWeddingPackage,
      updateShootReminderEmail,
      resetShootReminderEmail,
      saveSettings
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
      saveSettings,
      settings,
      settings.equipmentPresets,
      settings.shootTypeOptions,
      settings.shootReminderEmailContent,
      settings.shootReminderEmailSubject,
      settings.weddingBoothPackages,
      settings.weddingPhotoPackages,
      settings.weddingVideoPackages,
      settings.workflowStatuses,
      updateShootType,
      updateWeddingPackage,
      updateShootReminderEmail,
      resetShootReminderEmail
    ]
  );
}
