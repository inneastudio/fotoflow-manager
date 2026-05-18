"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Link as LinkIcon, Save, Upload } from "lucide-react";
import type { Project, ProjectFormValues } from "@/lib/types";
import {
  paymentMethods,
  paymentStatuses,
  photographers,
  weddingDateStatuses,
  weddingWorkflowStatuses
} from "@/lib/types";
import { supabase } from "@/lib/supabase";
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
    client_address: "",
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
    contract_file_url: "",
    timeline_file_url: "",
    wedding_status_dates: {},
    wedding_package: "",
    wedding_package_price: 0,
    wedding_video_enabled: false,
    wedding_video_package: "",
    wedding_video_price: 0,
    wedding_video_provider_paid: false,
    wedding_photobooth_enabled: false,
    wedding_photobooth_package: "",
    wedding_photobooth_price: 0,
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
  const {
    shootTypeOptions,
    shootTypes,
    weddingBoothPackages,
    weddingPhotoPackages,
    weddingVideoPackages,
    workflowStatuses
  } = useStudioSettings();
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
      client_address: project.client_address ?? "",
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
      contract_file_url: project.contract_file_url ?? "",
      timeline_file_url: project.timeline_file_url ?? "",
      wedding_status_dates: project.wedding_status_dates ?? {},
      wedding_package: project.wedding_package ?? "",
      wedding_package_price: Number(project.wedding_package_price ?? 0),
      wedding_video_enabled: Boolean(project.wedding_video_enabled),
      wedding_video_package: project.wedding_video_package ?? "",
      wedding_video_price: Number(project.wedding_video_price ?? 0),
      wedding_video_provider_paid: Boolean(project.wedding_video_provider_paid),
      wedding_photobooth_enabled: Boolean(project.wedding_photobooth_enabled),
      wedding_photobooth_package: project.wedding_photobooth_package ?? "",
      wedding_photobooth_price: Number(project.wedding_photobooth_price ?? 0),
      selected_photos: project.selected_photos,
      notes: project.notes,
      retouch_notes: project.retouch_notes
    });
  }, [initialValues, project]);

  const isWedding = String(values.shoot_type).toLowerCase().includes("poroka");
  const statusOptions = useMemo(() => {
    if (!isWedding) return workflowStatuses;
    return Array.from(
      new Set([...weddingWorkflowStatuses, String(values.workflow_status)].filter(Boolean))
    );
  }, [isWedding, values.workflow_status, workflowStatuses]);

  const balance = useMemo(() => {
    if (values.payment_status === "Plačano") return 0;
    return calculateBalance(Number(values.amount), Number(values.deposit));
  }, [values.amount, values.deposit, values.payment_status]);
  const weddingPackageTotal = useMemo(() => {
    return (
      Number(values.wedding_package_price || 0) +
      (values.wedding_video_enabled ? Number(values.wedding_video_price || 0) : 0) +
      (values.wedding_photobooth_enabled ? Number(values.wedding_photobooth_price || 0) : 0)
    );
  }, [
    values.wedding_package_price,
    values.wedding_photobooth_enabled,
    values.wedding_photobooth_price,
    values.wedding_video_enabled,
    values.wedding_video_price
  ]);

  function updateValue<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function calculateWeddingTotal(nextValues: ProjectFormValues) {
    return (
      Number(nextValues.wedding_package_price || 0) +
      (nextValues.wedding_video_enabled ? Number(nextValues.wedding_video_price || 0) : 0) +
      (nextValues.wedding_photobooth_enabled
        ? Number(nextValues.wedding_photobooth_price || 0)
        : 0)
    );
  }

  function updateWeddingOffer(changes: Partial<ProjectFormValues>) {
    setValues((current) => {
      const next = { ...current, ...changes };
      return {
        ...next,
        amount: calculateWeddingTotal(next)
      };
    });
  }

  function applyWeddingPackage(
    kind: "photo" | "video" | "booth",
    packageId: string
  ) {
    const options =
      kind === "video"
        ? weddingVideoPackages
        : kind === "booth"
          ? weddingBoothPackages
          : weddingPhotoPackages;
    const selectedPackage = options.find((option) => option.id === packageId);
    if (!selectedPackage) return;

    if (kind === "video") {
      updateWeddingOffer({
        wedding_video_enabled: true,
        wedding_video_package: selectedPackage.name,
        wedding_video_price: selectedPackage.price
      });
      return;
    }

    if (kind === "booth") {
      updateWeddingOffer({
        wedding_photobooth_enabled: true,
        wedding_photobooth_package: selectedPackage.name,
        wedding_photobooth_price: selectedPackage.price
      });
      return;
    }

    updateWeddingOffer({
      wedding_package: selectedPackage.name,
      wedding_package_price: selectedPackage.price
    });
  }

  function updateWeddingDate(status: string, date: string) {
    setValues((current) => ({
      ...current,
      wedding_status_dates: {
        ...current.wedding_status_dates,
        [status]: date
      }
    }));
  }

  function updateWorkflowStatus(status: Project["workflow_status"]) {
    const shouldStampWeddingDate =
      isWedding &&
      weddingDateStatuses.includes(status as (typeof weddingDateStatuses)[number]);

    setValues((current) => ({
      ...current,
      workflow_status: status,
      wedding_status_dates: shouldStampWeddingDate
        ? {
            ...current.wedding_status_dates,
            [status]: current.wedding_status_dates?.[status] || today
          }
        : current.wedding_status_dates
    }));
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

  async function uploadPdf(
    file: File | null,
    field: "contract_file_url" | "timeline_file_url"
  ) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Naloži lahko samo PDF dokument.");
      return;
    }

    setError(null);

    if (!supabase) {
      const reader = new FileReader();
      reader.onload = () => updateValue(field, String(reader.result || ""));
      reader.onerror = () => setError("PDF dokumenta ni bilo mogoče prebrati.");
      reader.readAsDataURL(file);
      return;
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const path = `${crypto.randomUUID()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(path, file, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("project-documents").getPublicUrl(path);
    updateValue(field, data.publicUrl);
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

        {isWedding ? (
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Naslov stranke</span>
            <input
              className="input"
              value={values.client_address ?? ""}
              onChange={(event) => updateValue("client_address", event.target.value)}
              placeholder="Ulica, pošta, kraj"
            />
          </label>
        ) : null}

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
              updateWorkflowStatus(event.target.value as Project["workflow_status"])
            }
          >
            {statusOptions.map((status) => (
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

      {isWedding ? (
        <section className="rounded-lg border border-line bg-white/60 p-4">
          <div className="mb-4">
            <p className="eyebrow">Poročni workflow</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink">
              Datumi do fotografiranja
            </h3>
          </div>

          <div className="mb-5 rounded-lg border border-line bg-paper p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Paketi in dodatki</p>
                <h4 className="mt-1 font-display text-lg font-semibold text-ink">
                  Poročna ponudba
                </h4>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() => updateValue("amount", weddingPackageTotal)}
              >
                Uporabi {formatCurrency(weddingPackageTotal)}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-ink">
                  Izberi foto paket iz nastavitev
                </span>
                <select
                  className="input"
                  value=""
                  onChange={(event) => applyWeddingPackage("photo", event.target.value)}
                >
                  <option value="">Izberi paket ...</option>
                  {weddingPhotoPackages.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {formatCurrency(option.price)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Foto paket</span>
                <input
                  className="input"
                  value={values.wedding_package}
                  onChange={(event) => updateValue("wedding_package", event.target.value)}
                  placeholder="npr. 8 ur, celodnevni paket ..."
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Cena foto paketa</span>
                <input
                  className="input"
                  min="0"
                  step="1"
                  type="number"
                  value={values.wedding_package_price}
                  onChange={(event) =>
                    updateWeddingOffer({
                      wedding_package_price: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink md:col-span-2">
                <input
                  type="checkbox"
                  checked={values.wedding_video_enabled}
                  onChange={(event) =>
                    updateWeddingOffer({
                      wedding_video_enabled: event.target.checked
                    })
                  }
                />
                Dodaj snemanje
              </label>
              {values.wedding_video_enabled ? (
                <>
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-ink">
                      Izberi paket snemanja iz nastavitev
                    </span>
                    <select
                      className="input"
                      value=""
                      onChange={(event) => applyWeddingPackage("video", event.target.value)}
                    >
                      <option value="">Izberi snemanje ...</option>
                      {weddingVideoPackages.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {formatCurrency(option.price)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-ink">Paket snemanja</span>
                    <input
                      className="input"
                      value={values.wedding_video_package}
                      onChange={(event) =>
                        updateValue("wedding_video_package", event.target.value)
                      }
                      placeholder="npr. highlights, celodnevno snemanje ..."
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-ink">Cena snemanja</span>
                    <input
                      className="input"
                      min="0"
                      step="1"
                      type="number"
                      value={values.wedding_video_price}
                      onChange={(event) =>
                        updateWeddingOffer({
                          wedding_video_price: Number(event.target.value)
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink md:col-span-2">
                    <input
                      type="checkbox"
                      checked={values.wedding_video_provider_paid}
                      onChange={(event) =>
                        updateValue("wedding_video_provider_paid", event.target.checked)
                      }
                    />
                    Zunanji izvajalec za snemanje je plačan
                  </label>
                </>
              ) : null}
              <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink md:col-span-2">
                <input
                  type="checkbox"
                  checked={values.wedding_photobooth_enabled}
                  onChange={(event) =>
                    updateWeddingOffer({
                      wedding_photobooth_enabled: event.target.checked
                    })
                  }
                />
                Dodaj photobooth
              </label>
              {values.wedding_photobooth_enabled ? (
                <>
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-ink">
                      Izberi photobooth paket iz nastavitev
                    </span>
                    <select
                      className="input"
                      value=""
                      onChange={(event) => applyWeddingPackage("booth", event.target.value)}
                    >
                      <option value="">Izberi booth ...</option>
                      {weddingBoothPackages.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {formatCurrency(option.price)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-ink">Photobooth paket</span>
                    <input
                      className="input"
                      value={values.wedding_photobooth_package}
                      onChange={(event) =>
                        updateValue("wedding_photobooth_package", event.target.value)
                      }
                      placeholder="npr. 3 ure, neomejeni printi ..."
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-ink">Cena photobootha</span>
                    <input
                      className="input"
                      min="0"
                      step="1"
                      type="number"
                      value={values.wedding_photobooth_price}
                      onChange={(event) =>
                        updateWeddingOffer({
                          wedding_photobooth_price: Number(event.target.value)
                        })
                      }
                    />
                  </label>
                </>
              ) : null}
            </div>

            <p className="mt-3 text-sm font-semibold text-muted">
              Predlagan skupaj: {formatCurrency(weddingPackageTotal)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {weddingDateStatuses.map((status) => (
              <label key={status} className="space-y-1.5">
                <span className="text-sm font-medium text-ink">{status}</span>
                <input
                  className="input"
                  type="date"
                  value={values.wedding_status_dates?.[status] ?? ""}
                  onChange={(event) => updateWeddingDate(status, event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PdfUploadField
              label="PDF pogodba"
              value={values.contract_file_url}
              onUpload={(file) => uploadPdf(file, "contract_file_url")}
              onClear={() => updateValue("contract_file_url", "")}
            />
            <PdfUploadField
              label="PDF časovnica"
              value={values.timeline_file_url}
              onUpload={(file) => uploadPdf(file, "timeline_file_url")}
              onClear={() => updateValue("timeline_file_url", "")}
            />
          </div>
        </section>
      ) : null}

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

function PdfUploadField({
  label,
  value,
  onUpload,
  onClear
}: {
  label: string;
  value: string;
  onUpload: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-clay" />
          <span className="text-sm font-semibold text-ink">{label}</span>
        </div>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-clay"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Odpri
          </a>
        ) : null}
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white px-3 py-4 text-sm font-medium text-muted transition hover:border-clay/40 hover:text-ink">
        <Upload className="h-4 w-4" />
        Naloži PDF
        <input
          className="sr-only"
          type="file"
          accept="application/pdf"
          onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
        />
      </label>
      {value ? (
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-muted hover:text-rose"
          onClick={onClear}
        >
          Odstrani dokument
        </button>
      ) : null}
    </div>
  );
}
