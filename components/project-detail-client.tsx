"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Edit3,
  ExternalLink,
  FolderOpen,
  Mail,
  MapPin,
  Phone,
  Trash2
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ProjectModal } from "@/components/project-modal";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { workflowStatuses } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import {
  formatCurrency,
  formatDate,
  getNextWorkflowStatus,
  getStatusProgress
} from "@/lib/utils";

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const {
    projects,
    loading,
    updateProject,
    deleteProject,
    moveToNextStatus
  } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const project = projects.find((item) => item.id === projectId);

  const nextStatus = project ? getNextWorkflowStatus(project.workflow_status) : null;
  const progress = project ? getStatusProgress(project.workflow_status) : 0;
  const isFinal = project?.workflow_status === workflowStatuses.at(-1);

  const detailItems = useMemo(() => {
    if (!project) return [];

    return [
      { label: "Email", value: project.email || "Ni dodano", icon: Mail },
      { label: "Telefon", value: project.phone || "Ni dodano", icon: Phone },
      { label: "Lokacija", value: project.location || "Ni dodano", icon: MapPin },
      {
        label: "Fotografiranje",
        value: formatDate(project.shoot_date),
        icon: CalendarDays
      },
      { label: "Rok oddaje", value: formatDate(project.delivery_due), icon: CalendarDays },
      { label: "Tip", value: String(project.shoot_type), icon: FolderOpen }
    ];
  }, [project]);

  async function handleMoveNext() {
    if (!project) return;
    setMoving(true);
    try {
      await moveToNextStatus(project.id);
    } finally {
      setMoving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;

    const confirmed = window.confirm(
      `Izbrišem projekt za ${project.client_name}? Tega dejanja ni mogoče razveljaviti.`
    );

    if (!confirmed) return;
    await deleteProject(project.id);
    router.push("/projects");
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-mist/70" />;
  }

  if (!project) {
    return (
      <section className="surface rounded-lg p-8 text-center">
        <p className="font-display text-3xl font-semibold">Projekt ni najden</p>
        <p className="mt-2 text-sm text-muted">
          Morda je bil izbrisan ali še ni sinhroniziran.
        </p>
        <Link href="/projects" className="button-primary mt-5">
          <ArrowLeft className="h-4 w-4" />
          Nazaj na projekte
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/projects" className="button-ghost mb-4 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Projekti
          </Link>
          <p className="eyebrow">{project.shoot_type}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            {project.client_name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>{project.workflow_status}</StatusBadge>
            <StatusBadge type="payment">{project.payment_status}</StatusBadge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="button-secondary" onClick={() => setModalOpen(true)}>
            <Edit3 className="h-4 w-4" />
            Uredi
          </button>
          <button className="button-ghost text-rose hover:text-rose" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Izbriši
          </button>
        </div>
      </div>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Napredek workflowa</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-clay transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            className="button-primary"
            disabled={Boolean(isFinal) || moving}
            onClick={handleMoveNext}
          >
            {moving ? "Premikam" : "Premakni v naslednji status"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {nextStatus && !isFinal ? (
          <p className="mt-3 text-sm text-muted">Naslednji status: {nextStatus}</p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Znesek"
          value={formatCurrency(project.amount)}
          detail="Skupna vrednost projekta"
          icon={FolderOpen}
          tone="charcoal"
        />
        <MetricCard
          label="Avans"
          value={formatCurrency(project.deposit)}
          detail="Že prejeto"
          icon={FolderOpen}
          tone="olive"
        />
        <MetricCard
          label="Preostanek"
          value={formatCurrency(project.balance)}
          detail="Odprto plačilo"
          icon={FolderOpen}
          tone={project.balance ? "rose" : "olive"}
        />
        <MetricCard
          label="Izbrane fotografije"
          value={String(project.selected_photos)}
          detail="Za končno obdelavo"
          icon={FolderOpen}
          tone="clay"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <div className="space-y-6">
          <div className="surface rounded-lg p-4 sm:p-5">
            <div className="mb-5">
              <p className="eyebrow">Podrobnosti</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Kontakt, lokacija in roki
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {detailItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-line bg-white/60 p-3"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Icon className="h-4 w-4 text-clay" />
                      {item.label}
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-ink">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ExternalLinkCard label="Galerija" url={project.gallery_url} />
            <ExternalLinkCard label="Google Drive" url={project.drive_url} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NoteCard title="Opombe" body={project.notes} />
            <NoteCard title="Opombe za retušo" body={project.retouch_notes} />
          </div>
        </div>

        <StatusTimeline status={project.workflow_status} />
      </section>

      <ProjectModal
        open={modalOpen}
        project={project}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await updateProject(project.id, values);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

function ExternalLinkCard({ label, url }: { label: string; url: string }) {
  return (
    <div className="surface rounded-lg p-4">
      <p className="eyebrow">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-clay hover:text-ink"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">{url}</span>
        </a>
      ) : (
        <p className="mt-3 text-sm text-muted">Link še ni dodan.</p>
      )}
    </div>
  );
}

function NoteCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface rounded-lg p-4">
      <p className="eyebrow">{title}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
        {body || "Brez opomb."}
      </p>
    </div>
  );
}
