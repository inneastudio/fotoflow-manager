"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Database,
  LogOut,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Workflow
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth-provider";
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
    removeWorkflowStatus,
    removeShootType,
    resetWorkflowStatuses,
    resetShootTypes,
    updateShootType
  } = useStudioSettings();
  const [newShootType, setNewShootType] = useState("");
  const [newWorkdays, setNewWorkdays] = useState(8);
  const [newWorkflowStatus, setNewWorkflowStatus] = useState("");

  function handleAddShootType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addShootType(newShootType, newWorkdays);
    setNewShootType("");
    setNewWorkdays(8);
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
          className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]"
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
                <div>
                  <p className="font-semibold text-ink">{option.name}</p>
                  <p className="mt-1 text-sm text-muted">Privzeti rok oddaje</p>
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
                    updateShootType(option.name, Number(event.target.value))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
