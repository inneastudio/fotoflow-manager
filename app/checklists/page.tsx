"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BatteryCharging,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { useProjectChecklists } from "@/lib/use-project-checklists";
import { useProjects } from "@/lib/use-projects";
import type { Project, ProjectChecklistItem } from "@/lib/types";
import {
  cn,
  formatDate,
  getProjectSubtitle,
  getProjectTitle,
  sortByNearestUpcoming
} from "@/lib/utils";

const checklistTemplates = {
  osnovno: [
    "Fotoaparat 1",
    "Fotoaparat 2",
    "Objektiv 35mm",
    "Objektiv 85mm",
    "Spominske kartice",
    "Baterije",
    "Polnilci",
    "Pas / oprtnik"
  ],
  poroka: [
    "Bliskavica",
    "Baterije za bliskavico",
    "Sprožilec",
    "Stojalo za luč",
    "Rezervni fotoaparat",
    "Čistilna krpica",
    "Dežnik / zaščita za dež",
    "Časovnica"
  ],
  studio: [
    "Luč 1",
    "Luč 2",
    "Softbox",
    "Ozadje",
    "Podaljšek",
    "Rekviziti",
    "Otroški pripomočki",
    "Mini tiskovine"
  ]
} as const;

function projectProgress(items: ProjectChecklistItem[]) {
  if (!items.length) return 0;
  const checked = items.filter((item) => item.is_checked).length;
  return Math.round((checked / items.length) * 100);
}

function categoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("bater") || normalized.includes("polnil")) return BatteryCharging;
  if (normalized.includes("foto") || normalized.includes("oprema")) return Camera;
  return ClipboardCheck;
}

export default function ChecklistsPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const {
    items,
    loading: itemsLoading,
    error,
    createItem,
    createItems,
    updateItem,
    deleteItem
  } = useProjectChecklists();
  const sortedProjects = useMemo(
    () => sortByNearestUpcoming(projects, "shoot_date"),
    [projects]
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    label: "",
    category: "Oprema",
    quantity: 1,
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedProject = useMemo<Project | undefined>(() => {
    return sortedProjects.find((project) => project.id === selectedProjectId) ?? sortedProjects[0];
  }, [selectedProjectId, sortedProjects]);
  const activeProjectId = selectedProject?.id ?? "";
  const projectItems = useMemo(
    () => items.filter((item) => item.project_id === activeProjectId),
    [activeProjectId, items]
  );
  const filteredProjectItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return projectItems;

    return projectItems.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.notes.toLowerCase().includes(normalizedQuery)
    );
  }, [projectItems, query]);

  const openItems = projectItems.filter((item) => !item.is_checked);
  const readyItems = projectItems.filter((item) => item.is_checked);
  const projectsWithLists = new Set(items.map((item) => item.project_id)).size;
  const progress = projectProgress(projectItems);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!activeProjectId) {
      setFormError("Najprej izberi projekt.");
      return;
    }

    if (!form.label.trim()) {
      setFormError("Vpiši opremo ali opravilo.");
      return;
    }

    setSaving(true);

    try {
      await createItem({
        project_id: activeProjectId,
        label: form.label,
        category: form.category,
        quantity: form.quantity,
        notes: form.notes
      });
      setForm({ label: "", category: form.category, quantity: 1, notes: "" });
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Točke trenutno ne morem shraniti."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addTemplate(templateName: keyof typeof checklistTemplates) {
    if (!activeProjectId) return;

    const existingLabels = new Set(projectItems.map((item) => item.label.toLowerCase()));
    const values = checklistTemplates[templateName]
      .filter((label) => !existingLabels.has(label.toLowerCase()))
      .map((label) => ({
        project_id: activeProjectId,
        label,
        category: templateName === "studio" ? "Studio" : "Oprema",
        quantity: label.toLowerCase().includes("bater") ? 4 : 1,
        notes: ""
      }));

    if (values.length) await createItems(values);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Oprema"
        title="Projektne checkliste"
        description="Za vsak projekt si pripravi seznam opreme in ga pred odhodom hitro obkljukaj."
        actions={
          <a href="#dodaj" className="button-primary">
            <Plus className="h-4 w-4" />
            Dodaj točko
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Projektov s checklisto"
          value={String(projectsWithLists)}
          detail="Vsaj ena vpisana točka"
          icon={ClipboardCheck}
          tone="charcoal"
        />
        <MetricCard
          label="Pripravljeno"
          value={String(readyItems.length)}
          detail="Obkljukano za izbrani projekt"
          icon={CheckCircle2}
          tone="olive"
        />
        <MetricCard
          label="Še manjka"
          value={String(openItems.length)}
          detail="Neobkljukane točke"
          icon={Camera}
          tone="rose"
        />
        <MetricCard
          label="Napredek"
          value={`${progress}%`}
          detail={selectedProject ? getProjectTitle(selectedProject) : "Izberi projekt"}
          icon={BatteryCharging}
          tone="clay"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Projekti</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Izberi projekt</h2>
            </div>
            <ClipboardCheck className="h-5 w-5 text-muted" />
          </div>

          <div className="mt-5 space-y-2">
            {projectsLoading ? (
              <p className="rounded-lg border border-line px-4 py-3 text-sm text-muted">
                Nalagam projekte ...
              </p>
            ) : sortedProjects.length ? (
              sortedProjects.map((project) => {
                const projectChecklist = items.filter((item) => item.project_id === project.id);
                const projectChecklistProgress = projectProgress(projectChecklist);
                const active = project.id === activeProjectId;

                return (
                  <button
                    key={project.id}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left transition",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/20 hover:bg-mist"
                    )}
                    onClick={() => setSelectedProjectId(project.id)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">
                      {getProjectTitle(project)}
                    </span>
                    <span className={cn("mt-1 block text-xs", active ? "text-white/75" : "text-muted")}>
                      {getProjectSubtitle(project)} · {formatDate(project.shoot_date)}
                    </span>
                    <span className={cn("mt-3 block h-1.5 rounded-full", active ? "bg-white/20" : "bg-mist")}>
                      <span
                        className={cn("block h-full rounded-full", active ? "bg-white" : "bg-olive")}
                        style={{ width: `${projectChecklistProgress}%` }}
                      />
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-lg border border-line px-4 py-3 text-sm text-muted">
                Najprej dodaj projekt.
              </p>
            )}
          </div>
        </aside>

        <div className="space-y-5">
          <section id="dodaj" className="surface rounded-lg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Izbrani projekt</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  {selectedProject ? getProjectTitle(selectedProject) : "Ni izbranega projekta"}
                </h2>
                {selectedProject ? (
                  <p className="mt-1 text-sm text-muted">
                    {getProjectSubtitle(selectedProject)} · {formatDate(selectedProject.shoot_date)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="button-secondary" onClick={() => addTemplate("osnovno")} type="button">
                  Osnovna oprema
                </button>
                <button className="button-secondary" onClick={() => addTemplate("poroka")} type="button">
                  Poroka
                </button>
                <button className="button-secondary" onClick={() => addTemplate("studio")} type="button">
                  Studio
                </button>
              </div>
            </div>

            <form className="mt-5 grid gap-4 lg:grid-cols-12" onSubmit={handleSubmit}>
              <label className="lg:col-span-5">
                <span className="label">Oprema ali opravilo</span>
                <input
                  className="input mt-2"
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Npr. 85mm objektiv"
                />
              </label>
              <label className="lg:col-span-3">
                <span className="label">Kategorija</span>
                <input
                  className="input mt-2"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Oprema"
                />
              </label>
              <label className="lg:col-span-2">
                <span className="label">Količina</span>
                <input
                  className="input mt-2"
                  min="1"
                  step="1"
                  type="number"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                />
              </label>
              <label className="lg:col-span-2">
                <span className="label">Opomba</span>
                <input
                  className="input mt-2"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Opcijsko"
                />
              </label>

              {formError ? (
                <p className="rounded-lg border border-rose/20 bg-rose/10 px-4 py-3 text-sm font-medium text-rose lg:col-span-9">
                  {formError}
                </p>
              ) : null}

              <div className="flex items-end justify-end lg:col-span-3">
                <button className="button-primary w-full justify-center" disabled={saving || !activeProjectId}>
                  {saving ? "Shranjujem ..." : "Dodaj na checklisto"}
                </button>
              </div>
            </form>
          </section>

          <section className="surface rounded-lg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Seznam</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Kaj vzeti s sabo</h2>
              </div>
              <label className="relative min-w-0 sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="input pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Išči po opremi"
                />
              </label>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-rose/20 bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
                {error}
              </p>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-lg border border-line">
              {itemsLoading ? (
                <p className="px-4 py-8 text-center text-sm text-muted">Nalagam checklisto ...</p>
              ) : filteredProjectItems.length ? (
                <div className="divide-y divide-line">
                  {filteredProjectItems.map((item) => {
                    const Icon = categoryIcon(item.category);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "grid gap-3 px-4 py-4 transition lg:grid-cols-[auto_1fr_auto_auto] lg:items-center",
                          item.is_checked ? "bg-olive/5" : "bg-white"
                        )}
                      >
                        <button
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-lg border transition",
                            item.is_checked
                              ? "border-olive/20 bg-olive/10 text-olive"
                              : "border-line bg-white text-muted hover:border-ink/25 hover:text-ink"
                          )}
                          onClick={() => updateItem(item.id, { is_checked: !item.is_checked })}
                          type="button"
                          aria-label={item.is_checked ? "Označi kot nepripravljeno" : "Označi kot pripravljeno"}
                        >
                          {item.is_checked ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </button>

                        <div>
                          <p className={cn("font-semibold", item.is_checked ? "text-muted line-through" : "text-ink")}>
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {item.category} · količina {item.quantity}
                            {item.notes ? ` · ${item.notes}` : ""}
                          </p>
                        </div>

                        <input
                          className="input h-11 w-full lg:w-20"
                          min="1"
                          step="1"
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, { quantity: Number(event.target.value) })
                          }
                          aria-label={`Količina za ${item.label}`}
                        />

                        <button
                          className="button-secondary justify-center px-3 py-2 text-rose"
                          onClick={() => deleteItem(item.id)}
                          type="button"
                          aria-label={`Izbriši ${item.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  Za ta projekt še ni checkliste. Dodaj svojo točko ali uporabi eno izmed predlog.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
