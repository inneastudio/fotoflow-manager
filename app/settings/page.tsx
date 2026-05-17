"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Database,
  FileText,
  LogOut,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Workflow
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth-provider";
import { useDocumentTemplates } from "@/lib/document-templates";
import { paymentStatuses } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useStudioSettings } from "@/lib/use-studio-settings";

export default function SettingsPage() {
  const { user, demoMode, signOut } = useAuth();
  const {
    shootTypeOptions,
    workflowStatuses,
    addWorkflowStatus,
    addShootType,
    renameShootType,
    removeWorkflowStatus,
    removeShootType,
    resetWorkflowStatuses,
    resetShootTypes,
    updateShootType
  } = useStudioSettings();
  const { templates, updateTemplates, resetTemplates } = useDocumentTemplates();
  const [newShootType, setNewShootType] = useState("");
  const [newWorkdays, setNewWorkdays] = useState(8);
  const [newFixedPrice, setNewFixedPrice] = useState(0);
  const [newWorkflowStatus, setNewWorkflowStatus] = useState("");

  function handleAddShootType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addShootType(newShootType, newWorkdays, newFixedPrice);
    setNewShootType("");
    setNewWorkdays(8);
    setNewFixedPrice(0);
  }

  function handleAddWorkflowStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addWorkflowStatus(newWorkflowStatus);
    setNewWorkflowStatus("");
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Studio nastavitve</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
          Nastavitve
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Supabase povezava, login status in delovni statusi aplikacije.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Baza</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Supabase</h2>
            </div>
            <Database className="h-5 w-5 text-clay" />
          </div>
          <div className="mt-5 rounded-lg border border-line bg-white/60 p-3">
            <p className="text-sm font-semibold text-ink">
              {isSupabaseConfigured ? "Povezano" : "Ni nastavljeno"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {isSupabaseConfigured
                ? "Aplikacija uporablja Supabase projekt iz env nastavitev."
                : "Dodaj `.env.local`, da vklopiš bazo in login."}
            </p>
          </div>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Login</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Račun</h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-olive" />
          </div>
          <div className="mt-5 rounded-lg border border-line bg-white/60 p-3">
            <p className="truncate text-sm font-semibold text-ink">
              {demoMode ? "Demo način" : user?.email}
            </p>
            <p className="mt-1 text-sm text-muted">
              {demoMode
                ? "Podatki se hranijo v brskalniku."
                : "Podatki so vezani na prijavljen Supabase račun."}
            </p>
          </div>
          {demoMode ? (
            <Link href="/login" className="button-secondary mt-4 w-full">
              Odpri login
            </Link>
          ) : (
            <button className="button-secondary mt-4 w-full" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Odjava
            </button>
          )}
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Sistem</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Lokalni zagon</h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-olive" />
          </div>
          <p className="mt-5 rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
            Projekt je pripravljen za `npm install` in `npm run dev`.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-clay" />
                <h2 className="font-display text-2xl font-semibold">
                  Workflow statusi
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Dodaj ali odstrani korake, ki jih uporabljaš v svojem procesu.
              </p>
            </div>
            <button className="button-secondary" onClick={resetWorkflowStatuses}>
              <RotateCcw className="h-4 w-4" />
              Ponastavi
            </button>
          </div>

          <form
            onSubmit={handleAddWorkflowStatus}
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"
          >
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Nov status</span>
              <input
                className="input"
                value={newWorkflowStatus}
                onChange={(event) => setNewWorkflowStatus(event.target.value)}
                placeholder="npr. Čaka na album"
              />
            </label>
            <button className="button-primary self-end" type="submit">
              <Plus className="h-4 w-4" />
              Dodaj
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {workflowStatuses.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/70 p-3"
              >
                <StatusBadge>{status}</StatusBadge>
                <button
                  type="button"
                  className="button-ghost h-9 w-9 p-0 text-rose hover:text-rose"
                  onClick={() => removeWorkflowStatus(status)}
                  aria-label={`Odstrani ${status}`}
                  title="Odstrani"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-olive" />
            <h2 className="font-display text-2xl font-semibold">Plačilni statusi</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {paymentStatuses.map((status) => (
              <StatusBadge key={status} type="payment">
                {status}
              </StatusBadge>
            ))}
          </div>
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Opcije projektov</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Tipi fotografiranja
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Dodaj svoje tipe fotografiranja in privzeti čas oddaje v delovnih dneh.
            </p>
          </div>
          <button className="button-secondary" onClick={resetShootTypes}>
            <RotateCcw className="h-4 w-4" />
            Ponastavi
          </button>
        </div>

        <form
          onSubmit={handleAddShootType}
          className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
        >
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Nov tip</span>
            <input
              className="input"
              value={newShootType}
              onChange={(event) => setNewShootType(event.target.value)}
              placeholder="npr. Mini session"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Delovni dnevi</span>
            <input
              className="input"
              min="0"
              type="number"
              value={newWorkdays}
              onChange={(event) => setNewWorkdays(Number(event.target.value))}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Fiksna cena</span>
            <input
              className="input"
              min="0"
              step="1"
              type="number"
              value={newFixedPrice}
              onChange={(event) => setNewFixedPrice(Number(event.target.value))}
            />
          </label>
          <button className="button-primary self-end" type="submit">
            <Plus className="h-4 w-4" />
            Dodaj
          </button>
        </form>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shootTypeOptions.map((option) => (
            <div
              key={option.name}
              className="rounded-lg border border-line bg-white/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Ime tipa
                    </span>
                    <input
                      className="input"
                      defaultValue={option.name}
                      onBlur={(event) =>
                        renameShootType(option.name, event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1 text-sm text-muted">
                    Privzeti rok in cena
                  </p>
                </div>
                <button
                  type="button"
                  className="button-ghost h-9 w-9 p-0 text-rose hover:text-rose"
                  onClick={() => removeShootType(option.name)}
                  aria-label={`Odstrani ${option.name}`}
                  title="Odstrani"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-3 block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Delovni dnevi
                </span>
                <input
                  className="input"
                  min="0"
                  type="number"
                  value={option.deliveryWorkdays}
                  onChange={(event) =>
                    updateShootType(
                      option.name,
                      Number(event.target.value),
                      option.fixedPrice
                    )
                  }
                />
              </label>
              <label className="mt-3 block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Fiksna cena
                </span>
                <input
                  className="input"
                  min="0"
                  step="1"
                  type="number"
                  value={option.fixedPrice}
                  onChange={(event) =>
                    updateShootType(
                      option.name,
                      option.deliveryWorkdays,
                      Number(event.target.value)
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-clay" />
              <h2 className="font-display text-2xl font-semibold">
                Predloge dokumentov
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Uredi besedilo pogodbe, člene in časovnico. Uporabi spremenljivke kot {"{ime_stranke}"}, {"{danasnji_datum}"}, {"{datum_fotografiranja}"}, {"{lokacija}"}, {"{znesek}"}, {"{avans}"}.
            </p>
          </div>
          <button className="button-secondary" onClick={resetTemplates}>
            <RotateCcw className="h-4 w-4" />
            Ponastavi
          </button>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-line bg-white/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Pogodba</p>
                <h3 className="font-display text-xl font-semibold text-ink">
                  Členi pogodbe
                </h3>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  updateTemplates((current) => ({
                    ...current,
                    contractClauses: [
                      ...current.contractClauses,
                      {
                        id: crypto.randomUUID(),
                        title: "Nov člen",
                        body: "Besedilo novega člena ..."
                      }
                    ]
                  }))
                }
              >
                <Plus className="h-4 w-4" />
                Člen
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">Uvod</span>
              <textarea
                className="input min-h-24"
                value={templates.contractIntro}
                onChange={(event) =>
                  updateTemplates((current) => ({
                    ...current,
                    contractIntro: event.target.value
                  }))
                }
              />
            </label>

            <div className="mt-4 space-y-3">
              {templates.contractClauses.map((clause, index) => (
                <div key={clause.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-muted">
                      Člen {index + 1}
                    </p>
                    <button
                      type="button"
                      className="button-ghost h-8 w-8 p-0 text-rose hover:text-rose"
                      onClick={() =>
                        updateTemplates((current) => ({
                          ...current,
                          contractClauses: current.contractClauses.filter(
                            (item) => item.id !== clause.id
                          )
                        }))
                      }
                      aria-label="Odstrani člen"
                      title="Odstrani"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-ink">Naslov</span>
                    <input
                      className="input"
                      value={clause.title}
                      onChange={(event) =>
                        updateTemplates((current) => ({
                          ...current,
                          contractClauses: current.contractClauses.map((item) =>
                            item.id === clause.id
                              ? { ...item, title: event.target.value }
                              : item
                          )
                        }))
                      }
                    />
                  </label>
                  <label className="mt-3 block space-y-1.5">
                    <span className="text-sm font-medium text-ink">Besedilo</span>
                    <textarea
                      className="input min-h-28"
                      value={clause.body}
                      onChange={(event) =>
                        updateTemplates((current) => ({
                          ...current,
                          contractClauses: current.contractClauses.map((item) =>
                            item.id === clause.id
                              ? { ...item, body: event.target.value }
                              : item
                          )
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Časovnica</p>
                <h3 className="font-display text-xl font-semibold text-ink">
                  Vrstice časovnice
                </h3>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  updateTemplates((current) => ({
                    ...current,
                    timelineItems: [
                      ...current.timelineItems,
                      {
                        id: crypto.randomUUID(),
                        time: "",
                        title: "Nov korak",
                        note: ""
                      }
                    ]
                  }))
                }
              >
                <Plus className="h-4 w-4" />
                Korak
              </button>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">Uvod</span>
              <textarea
                className="input min-h-24"
                value={templates.timelineIntro}
                onChange={(event) =>
                  updateTemplates((current) => ({
                    ...current,
                    timelineIntro: event.target.value
                  }))
                }
              />
            </label>

            <div className="mt-4 space-y-3">
              {templates.timelineItems.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-muted">
                      Korak {index + 1}
                    </p>
                    <button
                      type="button"
                      className="button-ghost h-8 w-8 p-0 text-rose hover:text-rose"
                      onClick={() =>
                        updateTemplates((current) => ({
                          ...current,
                          timelineItems: current.timelineItems.filter(
                            (row) => row.id !== item.id
                          )
                        }))
                      }
                      aria-label="Odstrani korak"
                      title="Odstrani"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-ink">Ura</span>
                      <input
                        className="input"
                        value={item.time}
                        onChange={(event) =>
                          updateTemplates((current) => ({
                            ...current,
                            timelineItems: current.timelineItems.map((row) =>
                              row.id === item.id
                                ? { ...row, time: event.target.value }
                                : row
                            )
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-ink">Naslov</span>
                      <input
                        className="input"
                        value={item.title}
                        onChange={(event) =>
                          updateTemplates((current) => ({
                            ...current,
                            timelineItems: current.timelineItems.map((row) =>
                              row.id === item.id
                                ? { ...row, title: event.target.value }
                                : row
                            )
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-3 block space-y-1.5">
                    <span className="text-sm font-medium text-ink">Opomba</span>
                    <textarea
                      className="input min-h-24"
                      value={item.note}
                      onChange={(event) =>
                        updateTemplates((current) => ({
                          ...current,
                          timelineItems: current.timelineItems.map((row) =>
                            row.id === item.id
                              ? { ...row, note: event.target.value }
                              : row
                          )
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
