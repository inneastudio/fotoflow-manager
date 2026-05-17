"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { Project, ProjectFormValues } from "@/lib/types";
import {
  paymentMethods,
  paymentStatuses,
  photographers,
  workflowStatuses
} from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import {
  addBusinessDays,
  calculateBalance,
  formatCurrency,
  getBusinessDaysBetween
} from "@/lib/utils";

type ProjectFormProps = {
  project?: Project | null;
  initialValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
  onCancel: () => void;
};

const today = new Date().toISOString().slice(0, 10);

function defaultValues(initialValues?: Partial<ProjectFormValues>): ProjectFormValues {
  const base: ProjectFormValues = {
    project_name: "",
    client_name: "",
    email: "",
    phone: "",
    shoot_type: "Portret",
    photographer: "Teja",
    shoot_date: today,
    shoot_time: "",
    location: "",
    workflow_status: "Rezervirano",
    payment_status: "Neplačano",
    payment_method: "TRR",
    amount: 0,
    deposit: 0,
    delivery_workdays: 8,
    delivery_due: addBusinessDays(today, 8),
    gallery_url: "",
    drive_url: "",
    selected_photos: 0,
    notes: "",
    retouch_notes: ""
  };

  return { ...base, ...initialValues };
}

export function ProjectForm({
  project,
  initialValues,
  onSubmit,
  onCancel
}: ProjectFormProps) {
  const { shootTypeOptions, shootTypes, workflowStatuses } = useStudioSettings();
  const [values, setValues] = useState<ProjectFormValues>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableShootTypes = useMemo(() => {
    return Array.from(new Set([...shootTypes, String(values.shoot_type)].filter(Boolean)));
  }, [shootTypes, values.shoot_type]);

  useEffect(() => {
    if (!project) {
      setValues(defaultValues(initialValues));
      return;
    }

    setValues({
      project_name: project.project_name ?? "",
      client_name: project.client_name,
      email: project.email,
      phone: project.phone,
      shoot_type: project.shoot_type,
      photographer: project.photographer ?? "Žan",
      shoot_date: project.shoot_date,
      shoot_time: project.shoot_time ?? "",
      location: project.location,
      workflow_status: project.workflow_status,
      payment_status: project.payment_status,
      payment_method: project.payment_method ?? "TRR",
      amount: project.amount,
      deposit: project.deposit,
      delivery_workdays:
        project.delivery_workdays ??
        getBusinessDaysBetween(project.shoot_date, project.delivery_due),
      delivery_due: project.delivery_due,
      gallery_url: project.gallery_url,
      drive_url: project.drive_url,
      selected_photos: project.selected_photos,
      notes: project.notes,
      retouch_notes: project.retouch_notes
    });
  }, [initialValues, project]);

  const balance = useMemo(() => {
    if (values.payment_status === "Plačano") return 0;
    return calculateBalance(Number(values.amount), Number(values.deposit));
  }, [values.amount, values.deposit, values.payment_status]);

  function updateValue<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateShootType(type: string) {
    const selectedOption = shootTypeOptions.find((option) => option.name === type);
    const defaultDays =
      selectedOption?.deliveryWorkdays ??
      values.delivery_workdays ??
      8;
    const fixedPrice = Number(selectedOption?.fixedPrice || 0);

    setValues((current) => ({
      ...current,
      shoot_type: type,
      amount: fixedPrice > 0 ? fixedPrice : current.amount,
      delivery_workdays: defaultDays,
      delivery_due: addBusinessDays(current.shoot_date, defaultDays)
    }));
  }

  function updateShootDate(date: string) {
    setValues((current) => ({
      ...current,
      shoot_date: date,
      delivery_due: addBusinessDays(date, current.delivery_workdays ?? 0)
    }));
  }

  function updateDeliveryWorkdays(days: number) {
    const normalizedDays = Math.max(Number(days || 0), 0);

    setValues((current) => ({
      ...current,
      delivery_workdays: normalizedDays,
      delivery_due: addBusinessDays(current.shoot_date, normalizedDays)
    }));
  }

  function updateDeliveryDue(date: string) {
    setValues((current) => ({
      ...current,
      delivery_due: date,
      delivery_workdays: getBusinessDaysBetween(current.shoot_date, date)
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit({ ...values, balance });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Shranjevanje ni uspelo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-ink">Ime projekta</span>
          <input
            className="input"
            value={values.project_name}
            onChange={(event) => updateValue("project_name", event.target.value)}
            placeholder="npr. Poroka Ana Luka 2026 ali Branding 001"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Ime stranke</span>
          <input
            className="input"
            required
            value={values.client_name}
            onChange={(event) => updateValue("client_name", event.target.value)}
            placeholder="npr. Maja Kovač"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Tip fotografiranja</span>
          <select
            className="input"
            value={values.shoot_type}
            onChange={(event) => updateShootType(event.target.value)}
          >
            {availableShootTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Fotograf</span>
          <select
            className="input"
            value={values.photographer}
            onChange={(event) =>
              updateValue("photographer", event.target.value as Project["photographer"])
            }
          >
            {photographers.map((photographer) => (
              <option key={photographer} value={photographer}>
                {photographer}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            className="input"
            type="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            placeholder="ime@example.com"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Telefon</span>
          <input
            className="input"
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            placeholder="+386 ..."
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Datum fotografiranja</span>
          <input
            className="input"
            type="date"
            required
            value={values.shoot_date}
            onChange={(event) => updateShootDate(event.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Ura fotografiranja</span>
          <input
            className="input"
            type="time"
            value={values.shoot_time}
            onChange={(event) => updateValue("shoot_time", event.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Delovni dnevi do oddaje</span>
          <input
            className="input"
            min="0"
            type="number"
            value={values.delivery_workdays}
            onChange={(event) => updateDeliveryWorkdays(Number(event.target.value))}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Rok oddaje</span>
          <input
            className="input"
            type="date"
            required
            value={values.delivery_due}
            onChange={(event) => updateDeliveryDue(event.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Lokacija</span>
          <input
            className="input"
            value={values.location}
            onChange={(event) => updateValue("location", event.target.value)}
            placeholder="Studio, mesto ali naslov"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Status workflowa</span>
          <select
            className="input"
            value={values.workflow_status}
            onChange={(event) =>
              updateValue("workflow_status", event.target.value as Project["workflow_status"])
            }
          >
            {workflowStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Status plačila</span>
          <select
            className="input"
            value={values.payment_status}
            onChange={(event) =>
              updateValue("payment_status", event.target.value as Project["payment_status"])
            }
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Način plačila</span>
          <select
            className="input"
            value={values.payment_method}
            onChange={(event) =>
              updateValue("payment_method", event.target.value as Project["payment_method"])
            }
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Izbrane fotografije</span>
          <input
            className="input"
            min="0"
            type="number"
            value={values.selected_photos}
            onChange={(event) =>
              updateValue("selected_photos", Number(event.target.value))
            }
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Znesek</span>
          <input
            className="input"
            min="0"
            step="1"
            type="number"
            value={values.amount}
            onChange={(event) => updateValue("amount", Number(event.target.value))}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Avans</span>
          <input
            className="input"
            min="0"
            step="1"
            type="number"
            value={values.deposit}
            onChange={(event) => updateValue("deposit", Number(event.target.value))}
          />
        </label>

        <div className="rounded-lg border border-line bg-white/60 px-3 py-2">
          <span className="text-sm font-medium text-muted">Preostanek</span>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Link do galerije</span>
          <input
            className="input"
            type="url"
            value={values.gallery_url}
            onChange={(event) => updateValue("gallery_url", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Google Drive mapa</span>
          <input
            className="input"
            type="url"
            value={values.drive_url}
            onChange={(event) => updateValue("drive_url", event.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Opombe</span>
          <textarea
            className="input min-h-28 resize-y"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Opombe za retušo</span>
          <textarea
            className="input min-h-28 resize-y"
            value={values.retouch_notes}
            onChange={(event) => updateValue("retouch_notes", event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose/25 bg-rose/10 px-3 py-2 text-sm text-rose">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <button type="button" className="button-secondary" onClick={onCancel}>
          Prekliči
        </button>
        <button type="submit" className="button-primary" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Shranjujem" : project ? "Shrani spremembe" : "Dodaj projekt"}
        </button>
      </div>
    </form>
  );
}
