"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Camera,
  ChevronDown,
  Database,
  FileText,
  LogOut,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Video,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useDocumentTemplates } from "@/lib/document-templates";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePushNotifications } from "@/lib/use-push-notifications";
import {
  type WeddingPackageGroup,
  type WeddingPackageOption,
  useStudioSettings
} from "@/lib/use-studio-settings";
import { cn, formatCurrency } from "@/lib/utils";

function pushStatusLabel(status: string) {
  if (status === "enabled") return "vklopljeno na tej napravi";
  if (status === "denied") return "blokirano v brskalniku";
  if (status === "unsupported") return "ta brskalnik ne podpira obvestil";
  if (status === "missing-key") return "manjka VAPID ključ";
  if (status === "signed-out") return "potrebna je prijava";
  return "še ni vklopljeno";
}

type SettingsSectionId =
  | "account"
  | "push"
  | "email"
  | "workflow"
  | "wedding"
  | "shoot-types"
  | "documents";

export default function SettingsPage() {
  const { user, demoMode, signOut } = useAuth();
  const {
    shootTypeOptions,
    weddingPhotoPackages,
    weddingVideoPackages,
    weddingBoothPackages,
    shootReminderEmailSubject,
    shootReminderEmailHtml,
    shootReminderEmailText,
    workflowStatuses,
    addWorkflowStatus,
    addShootType,
    addWeddingPackage,
    renameShootType,
    removeWeddingPackage,
    removeWorkflowStatus,
    removeShootType,
    resetWeddingPackages,
    resetShootReminderEmail,
    resetWorkflowStatuses,
    resetShootTypes,
    updateShootReminderEmail,
    updateShootType,
    updateWeddingPackage
  } = useStudioSettings();
  const { templates, updateTemplates, resetTemplates } = useDocumentTemplates();
  const {
    enableNotifications,
    error: pushError,
    saving: pushSaving,
    sendTestNotification,
    state: pushState
  } = usePushNotifications();
  const [openSection, setOpenSection] = useState<SettingsSectionId>("account");
  const [newShootType, setNewShootType] = useState("");
  const [newWorkdays, setNewWorkdays] = useState(8);
  const [newFixedPrice, setNewFixedPrice] = useState(0);
  const [newWorkflowStatus, setNewWorkflowStatus] = useState("");

  function toggleSection(section: SettingsSectionId) {
    setOpenSection((current) => (current === section ? "account" : section));
  }

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
    <div className="page-shell">
      <PageHeader
        eyebrow="Studio nastavitve"
        title="Nastavitve"
        description="Urejeno po sklopih. Odpri samo tisto, kar trenutno potrebuješ."
      />

      <div className="space-y-3">
        <SettingsSection
          id="account"
          title="Račun in povezave"
          description="Supabase povezava, prijavljen račun in odjava."
          icon={Database}
          open={openSection === "account"}
          onToggle={toggleSection}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-white/70 p-4">
              <p className="eyebrow">Baza</p>
              <h3 className="mt-1 font-display text-xl font-semibold">Supabase</h3>
              <p className="mt-3 text-sm font-semibold text-ink">
                {isSupabaseConfigured ? "Povezano" : "Ni nastavljeno"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {isSupabaseConfigured
                  ? "Aplikacija uporablja Supabase projekt iz env nastavitev."
                  : "Dodaj `.env.local`, da vklopiš bazo in login."}
              </p>
            </div>

            <div className="rounded-lg border border-line bg-white/70 p-4">
              <p className="eyebrow">Login</p>
              <h3 className="mt-1 font-display text-xl font-semibold">Račun</h3>
              <p className="mt-3 truncate text-sm font-semibold text-ink">
                {demoMode ? "Demo način" : user?.email}
              </p>
              <p className="mt-1 text-sm text-muted">
                {demoMode
                  ? "Podatki se hranijo v brskalniku."
                  : "Podatki so vezani na prijavljen Supabase račun."}
              </p>
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
          </div>
        </SettingsSection>

        <SettingsSection
          id="push"
          title="Telefonski opomniki"
          description="Potisna obvestila za dnevne naloge, deadline in izbor."
          icon={Bell}
          open={openSection === "push"}
          onToggle={toggleSection}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-muted">
              Vsako jutro prejmeš potisno obvestilo za današnja fotografiranja,
              deadline v manj kot 3 dneh, fotografirano in še ne shranjeno ter
              shranjeno brez poslanega izbora 2 dni po fotografiranju.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="button-primary"
                disabled={pushSaving || pushState === "enabled"}
                onClick={enableNotifications}
              >
                <Bell className="h-4 w-4" />
                {pushState === "enabled" ? "Obvestila dovoljena" : "Dovoli opomnike"}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={pushSaving || pushState !== "enabled"}
                onClick={sendTestNotification}
              >
                Test
              </button>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-line bg-white/70 p-3 text-sm">
            <p className="font-semibold text-ink">Status: {pushStatusLabel(pushState)}</p>
            <p className="mt-1 text-muted">
              Na iPhonu mora biti FotoFlow dodan na Home Screen, potem lahko dovoliš
              potisna obvestila.
            </p>
            {pushError ? <p className="mt-2 text-rose">{pushError}</p> : null}
          </div>
        </SettingsSection>

        <SettingsSection
          id="email"
          title="Email opomnik pred fotografiranjem"
          description="Predloga emaila, ki gre stranki en dan pred terminom."
          icon={FileText}
          open={openSection === "email"}
          onToggle={toggleSection}
          action={
            <button className="button-secondary" onClick={resetShootReminderEmail}>
              <RotateCcw className="h-4 w-4" />
              Ponastavi
            </button>
          }
        >
          <p className="mb-4 text-sm leading-6 text-muted">
            Uporabi spremenljivke {"{ime_stranke}"}, {"{tip_fotografiranja}"}, {"{datum_fotografiranja}"}, {"{ura_fotografiranja}"} in {"{lokacija}"}.
          </p>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink">Zadeva emaila</span>
                <input
                  className="input"
                  value={shootReminderEmailSubject}
                  onChange={(event) =>
                    updateShootReminderEmail({
                      shootReminderEmailSubject: event.target.value
                    })
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink">HTML vsebina</span>
                <textarea
                  className="input min-h-72 font-mono text-xs"
                  value={shootReminderEmailHtml}
                  onChange={(event) =>
                    updateShootReminderEmail({
                      shootReminderEmailHtml: event.target.value
                    })
                  }
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink">Tekstovna verzija</span>
                <textarea
                  className="input min-h-72"
                  value={shootReminderEmailText}
                  onChange={(event) =>
                    updateShootReminderEmail({
                      shootReminderEmailText: event.target.value
                    })
                  }
                />
              </label>
              <div className="rounded-lg border border-line bg-white/70 p-4">
                <p className="text-sm font-semibold text-ink">Predogled zamenjav</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {"{ime_stranke}"} → Ana Novak<br />
                  {"{tip_fotografiranja}"} → Portret<br />
                  {"{datum_fotografiranja}"} → 23. maj 2026<br />
                  {"{ura_fotografiranja}"} → 10:00<br />
                  {"{lokacija}"} → Studio Fiora
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="workflow"
          title="Workflow statusi"
          description="Koraki procesa za običajne projekte."
          icon={Workflow}
          open={openSection === "workflow"}
          onToggle={toggleSection}
          action={
            <button className="button-secondary" onClick={resetWorkflowStatuses}>
              <RotateCcw className="h-4 w-4" />
              Ponastavi
            </button>
          }
        >
          <form
            onSubmit={handleAddWorkflowStatus}
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
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

          <div className="mt-5 grid gap-2 md:grid-cols-2">
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
        </SettingsSection>

        <SettingsSection
          id="wedding"
          title="Poročni paketi"
          description="Cene za fotografiranje, snemanje in photobooth."
          icon={Camera}
          open={openSection === "wedding"}
          onToggle={toggleSection}
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <WeddingPackageSettings
              title="Fotografiranje"
              description="Poročni foto paketi."
              icon={Camera}
              group="photo"
              packages={weddingPhotoPackages}
              onAdd={addWeddingPackage}
              onUpdate={updateWeddingPackage}
              onRemove={removeWeddingPackage}
              onReset={resetWeddingPackages}
            />
            <WeddingPackageSettings
              title="Snemanje"
              description="Video paketi in cene."
              icon={Video}
              group="video"
              packages={weddingVideoPackages}
              onAdd={addWeddingPackage}
              onUpdate={updateWeddingPackage}
              onRemove={removeWeddingPackage}
              onReset={resetWeddingPackages}
            />
            <WeddingPackageSettings
              title="Photobooth"
              description="Booth paketi."
              icon={Sparkles}
              group="booth"
              packages={weddingBoothPackages}
              onAdd={addWeddingPackage}
              onUpdate={updateWeddingPackage}
              onRemove={removeWeddingPackage}
              onReset={resetWeddingPackages}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          id="shoot-types"
          title="Tipi fotografiranja"
          description="Tipi projektov, privzeti rok oddaje in fiksne cene."
          icon={Camera}
          open={openSection === "shoot-types"}
          onToggle={toggleSection}
          action={
            <button className="button-secondary" onClick={resetShootTypes}>
              <RotateCcw className="h-4 w-4" />
              Ponastavi
            </button>
          }
        >
          <form
            onSubmit={handleAddShootType}
            className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"
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
              <div key={option.name} className="rounded-lg border border-line bg-white/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <label className="block flex-1 space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Ime tipa
                    </span>
                    <input
                      className="input"
                      defaultValue={option.name}
                      onBlur={(event) => renameShootType(option.name, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                    />
                  </label>
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
        </SettingsSection>

        <SettingsSection
          id="documents"
          title="Predloge dokumentov"
          description="Pogodbeni členi in vrstice časovnice."
          icon={FileText}
          open={openSection === "documents"}
          onToggle={toggleSection}
          action={
            <button className="button-secondary" onClick={resetTemplates}>
              <RotateCcw className="h-4 w-4" />
              Ponastavi
            </button>
          }
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <DocumentContractSettings
              templates={templates}
              updateTemplates={updateTemplates}
            />
            <DocumentTimelineSettings
              templates={templates}
              updateTemplates={updateTemplates}
            />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  id,
  title,
  description,
  icon: Icon,
  open,
  onToggle,
  action,
  children
}: {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: (id: SettingsSectionId) => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface overflow-hidden rounded-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
        onClick={() => onToggle(id)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mist text-ink">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl font-semibold text-ink">
              {title}
            </span>
            <span className="mt-1 block text-sm text-muted">{description}</span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-line px-4 py-5 sm:px-5">
          {action ? <div className="mb-5 flex justify-end">{action}</div> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}

function DocumentContractSettings({
  templates,
  updateTemplates
}: {
  templates: ReturnType<typeof useDocumentTemplates>["templates"];
  updateTemplates: ReturnType<typeof useDocumentTemplates>["updateTemplates"];
}) {
  return (
    <div className="rounded-lg border border-line bg-white/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Pogodba</p>
          <h3 className="font-display text-xl font-semibold text-ink">Členi pogodbe</h3>
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
              <p className="text-sm font-semibold text-muted">Člen {index + 1}</p>
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
  );
}

function DocumentTimelineSettings({
  templates,
  updateTemplates
}: {
  templates: ReturnType<typeof useDocumentTemplates>["templates"];
  updateTemplates: ReturnType<typeof useDocumentTemplates>["updateTemplates"];
}) {
  return (
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
              <p className="text-sm font-semibold text-muted">Korak {index + 1}</p>
              <button
                type="button"
                className="button-ghost h-8 w-8 p-0 text-rose hover:text-rose"
                onClick={() =>
                  updateTemplates((current) => ({
                    ...current,
                    timelineItems: current.timelineItems.filter((row) => row.id !== item.id)
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
                        row.id === item.id ? { ...row, time: event.target.value } : row
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
                        row.id === item.id ? { ...row, title: event.target.value } : row
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
                      row.id === item.id ? { ...row, note: event.target.value } : row
                    )
                  }))
                }
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeddingPackageSettings({
  title,
  description,
  icon: Icon,
  group,
  packages,
  onAdd,
  onUpdate,
  onRemove,
  onReset
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  group: WeddingPackageGroup;
  packages: WeddingPackageOption[];
  onAdd: (group: WeddingPackageGroup, name: string, price: number) => void;
  onUpdate: (
    group: WeddingPackageGroup,
    id: string,
    values: Partial<Omit<WeddingPackageOption, "id">>
  ) => void;
  onRemove: (group: WeddingPackageGroup, id: string) => void;
  onReset: (group: WeddingPackageGroup) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(group, name, price);
    setName("");
    setPrice(0);
  }

  return (
    <div className="rounded-lg border border-line bg-white/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-clay" />
            <h3 className="font-display text-xl font-semibold">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
        <button className="button-secondary" type="button" onClick={() => onReset(group)}>
          <RotateCcw className="h-4 w-4" />
          Ponastavi
        </button>
      </div>

      <form onSubmit={handleAdd} className="mt-5 grid gap-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Ime paketa</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="npr. Paket 1"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-ink">Cena</span>
          <input
            className="input"
            min="0"
            step="1"
            type="number"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <button className="button-primary" type="submit">
          <Plus className="h-4 w-4" />
          Dodaj
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {packages.map((item) => (
          <div key={item.id} className="rounded-lg border border-line bg-paper p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <input
                  className="input"
                  value={item.name}
                  onChange={(event) =>
                    onUpdate(group, item.id, { name: event.target.value })
                  }
                />
                <p className="mt-2 text-sm font-semibold text-muted">
                  {formatCurrency(item.price)}
                </p>
              </div>
              <button
                type="button"
                className="button-ghost h-9 w-9 p-0 text-rose hover:text-rose"
                onClick={() => onRemove(group, item.id)}
                aria-label={`Odstrani ${item.name}`}
                title="Odstrani"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-3 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Cena paketa
              </span>
              <input
                className="input"
                min="0"
                step="1"
                type="number"
                value={item.price}
                onChange={(event) =>
                  onUpdate(group, item.id, { price: Number(event.target.value) })
                }
              />
            </label>
          </div>
        ))}

        {!packages.length ? (
          <p className="rounded-lg border border-line bg-paper p-3 text-sm text-muted">
            Ni dodanih paketov.
          </p>
        ) : null}
      </div>
    </div>
  );
}
