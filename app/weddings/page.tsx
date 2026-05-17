"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarHeart,
  CheckCircle2,
  FileText,
  Heart,
  Images,
  Plus,
  WalletCards
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ProjectModal } from "@/components/project-modal";
import { StatusBadge } from "@/components/status-badge";
import { useProjects } from "@/lib/use-projects";
import type { Project } from "@/lib/types";
import {
  addBusinessDays,
  formatCurrency,
  formatDate,
  formatShortDate,
  getOutstandingAmount,
  sortByDateDesc
} from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

export default function WeddingsPage() {
  const { projects, loading, createProject } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);

  const weddingProjects = useMemo(() => {
    return projects.filter((project) =>
      String(project.shoot_type).toLowerCase().includes("poroka")
    );
  }, [projects]);

  const weddingInitialValues = useMemo(
    () => ({
      shoot_type: "Poroka",
      workflow_status: "Ponudba poslana",
      delivery_workdays: 25,
      delivery_due: addBusinessDays(today, 25),
      project_name: "Poroka "
    }),
    []
  );

  const upcomingWeddings = useMemo(() => {
    return weddingProjects
      .filter((project) => new Date(project.shoot_date) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime());
  }, [weddingProjects]);
  const orderedWeddings = useMemo(() => {
    return sortWeddingsByNearest(weddingProjects);
  }, [weddingProjects]);

  const editingWeddings = weddingProjects.filter((project) =>
    ["Izbor prejet", "Narejen izbor", "Urejanje"].includes(project.workflow_status)
  );
  const deliveredWeddings = weddingProjects.filter((project) =>
    ["Poslano", "Plačano", "Zaključeno"].includes(project.workflow_status)
  );
  const weddingRevenue = weddingProjects
    .filter((project) => project.payment_status === "Plačano")
    .reduce((sum, project) => sum + project.amount, 0);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-mist/70" />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Poseben workflow</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Poroke
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Pregled poročnih projektov, rokov, plačil in faz obdelave.
          </p>
        </div>
        <button className="button-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova poroka
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Vse poroke"
          value={String(weddingProjects.length)}
          detail="Projekti tipa Poroka"
          icon={Heart}
          tone="charcoal"
        />
        <MetricCard
          label="Prihajajoče"
          value={String(upcomingWeddings.length)}
          detail="Po datumu fotografiranja"
          icon={CalendarHeart}
          tone="clay"
        />
        <MetricCard
          label="V obdelavi"
          value={String(editingWeddings.length)}
          detail="Izbor ali retuša"
          icon={Images}
          tone="rose"
        />
        <MetricCard
          label="Oddano"
          value={String(deliveredWeddings.length)}
          detail="Poslano ali zaključeno"
          icon={CheckCircle2}
          tone="olive"
        />
        <MetricCard
          label="Odprto"
          value={formatCurrency(getOutstandingAmount(weddingProjects))}
          detail="Preostanek plačil"
          icon={WalletCards}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Termini</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Prihajajoče poroke
              </h2>
            </div>
            <CalendarHeart className="h-5 w-5 text-clay" />
          </div>
          <div className="space-y-3">
            {upcomingWeddings.length ? (
              upcomingWeddings.map((project) => (
                <WeddingRow key={project.id} project={project} />
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
                Trenutno ni prihajajočih porok.
              </p>
            )}
          </div>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5">
            <p className="eyebrow">Finance</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Poročni promet
            </h2>
          </div>
          <div className="rounded-lg border border-line bg-white/60 p-4">
            <p className="text-sm text-muted">Plačano skupaj</p>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {formatCurrency(weddingRevenue)}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {sortByDateDesc(weddingProjects, "shoot_date").slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/60 p-3 transition hover:border-clay/40"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {project.project_name || project.client_name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatShortDate(project.shoot_date)}
                  </p>
                </div>
                <p className="font-semibold text-ink">{formatCurrency(project.amount)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-5">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Vse poroke
          </h2>
        </div>
        <div className="space-y-3">
          {weddingProjects.length ? (
            orderedWeddings.map((project) => (
              <WeddingRow key={project.id} project={project} compact />
            ))
          ) : (
            <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
              Ko dodaš projekt tipa Poroka, se bo prikazal tukaj.
            </p>
          )}
        </div>
      </section>

      <ProjectModal
        open={modalOpen}
        initialValues={weddingInitialValues}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await createProject(values);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

function sortWeddingsByNearest(projects: Project[]) {
  const startOfToday = new Date(new Date().toDateString()).getTime();

  return [...projects].sort((a, b) => {
    const aTime = new Date(a.shoot_date).getTime();
    const bTime = new Date(b.shoot_date).getTime();
    const aUpcoming = aTime >= startOfToday;
    const bUpcoming = bTime >= startOfToday;

    if (aUpcoming && bUpcoming) return aTime - bTime;
    if (!aUpcoming && !bUpcoming) return bTime - aTime;
    return aUpcoming ? -1 : 1;
  });
}

function getLatestWeddingStep(project: Project) {
  const entries = Object.entries(project.wedding_status_dates ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );

  if (!entries.length) return null;

  return entries.sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function WeddingRow({
  project,
  compact = false
}: {
  project: Project;
  compact?: boolean;
}) {
  const latestStep = getLatestWeddingStep(project);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-line bg-white/60 p-3 transition hover:border-clay/40"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {project.project_name || project.client_name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatDate(project.shoot_date)}
            {project.shoot_time ? ` ob ${project.shoot_time}` : ""}
            {project.location ? ` · ${project.location}` : ""}
          </p>
          {latestStep ? (
            <p className="mt-1 text-xs font-medium text-muted">
              {latestStep[0]}: {formatShortDate(latestStep[1])}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <StatusBadge>{project.workflow_status}</StatusBadge>
          {!compact ? <StatusBadge type="payment">{project.payment_status}</StatusBadge> : null}
          {project.contract_file_url ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-1 text-xs font-semibold text-muted">
              <FileText className="h-3.5 w-3.5" />
              Pogodba
            </span>
          ) : null}
          {project.timeline_file_url ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-1 text-xs font-semibold text-muted">
              <FileText className="h-3.5 w-3.5" />
              Časovnica
            </span>
          ) : null}
          <span className="text-sm font-semibold text-ink">
            {formatCurrency(project.amount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
