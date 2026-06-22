"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
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
import { buildContractHtml, buildTimelineHtml, openGeneratedDocument } from "@/lib/document-generator";
import { useDocumentTemplates } from "@/lib/document-templates";
import { useProjects } from "@/lib/use-projects";
import { useStudioSettings } from "@/lib/use-studio-settings";
import { weddingWorkflowStatuses, type Project } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getProjectSubtitle,
  getProjectTitle,
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
  const { templates } = useDocumentTemplates();
  const { workflowStatuses } = useStudioSettings();
  const isWedding = String(project?.shoot_type ?? "").toLowerCase().includes("poroka");
  const availableWorkflowStatuses = project
    ? Array.from(
        new Set([
          ...(isWedding ? weddingWorkflowStatuses : workflowStatuses),
          project.workflow_status
        ].filter(Boolean))
      )
    : workflowStatuses;

  const nextStatus = project
    ? getNextWorkflowStatus(project.workflow_status, availableWorkflowStatuses)
    : null;
  const progress = project
    ? getStatusProgress(project.workflow_status, availableWorkflowStatuses)
    : 0;
  const isFinal = project?.workflow_status === availableWorkflowStatuses.at(-1);

  const detailItems = useMemo(() => {
    if (!project) return [];

    return [
      { label: "Email", value: project.email || "Ni dodano", icon: Mail },
      { label: "Telefon", value: project.phone || "Ni dodano", icon: Phone },
      { label: "Ime stranke", value: project.client_name, icon: FolderOpen },
      { label: "Lokacija", value: project.location || "Ni dodano", icon: MapPin },
      { label: "Fotograf", value: project.photographer ?? "Žan", icon: FolderOpen },
      {
        label: "Fotografiranje",
        value: formatDate(project.shoot_date),
        icon: CalendarDays
      },
      { label: "Ura fotografiranja", value: project.shoot_time || "Ni dodano", icon: Clock3 },
      { label: "Rok oddaje", value: formatDate(project.delivery_due), icon: CalendarDays },
      { label: "Tip", value: String(project.shoot_type), icon: FolderOpen },
      { label: "Način plačila", value: project.payment_method ?? "TRR", icon: FolderOpen }
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
          <p className="eyebrow">{isWedding ? project.shoot_type : project.client_name}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            {getProjectTitle(project)}
          </h1>
          <p className="mt-2 text-lg font-medium text-muted">
            {getProjectSubtitle(project)}
          </p>
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
        {String(project.shoot_type).toLowerCase().includes("poroka") ? (
          <>
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
          </>
        ) : null}
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
            {isWedding ? (
              <>
                <ExternalLinkCard label="PDF pogodba" url={project.contract_file_url ?? ""} icon={FileText} />
                <ExternalLinkCard label="PDF časovnica" url={project.timeline_file_url ?? ""} icon={FileText} />
              </>
            ) : null}
          </div>

          {isWedding ? (
            <>
              <div className="surface rounded-lg p-4">
                <p className="eyebrow">Dokumenti</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  Generator
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() =>
                      openGeneratedDocument(buildContractHtml(project, templates))
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Generiraj pogodbo
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() =>
                      openGeneratedDocument(buildTimelineHtml(project, templates))
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Generiraj časovnico
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted">
                  Dokument se odpre v novem zavihku, kjer ga lahko shraniš kot PDF.
                </p>
              </div>

              <WeddingPackageCard project={project} />
              <WeddingAlbumCard project={project} />
            </>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <NoteCard title="Opombe" body={project.notes} />
            <NoteCard title="Opombe za retušo" body={project.retouch_notes} />
          </div>
        </div>

        <StatusTimeline
          status={project.workflow_status}
          statuses={availableWorkflowStatuses}
          statusDates={isWedding ? project.wedding_status_dates : undefined}
        />
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

function WeddingAlbumCard({ project }: { project: Project }) {
  const rows = [
    { label: "Velikost", value: project.wedding_album_size },
    { label: "Oblika", value: project.wedding_album_shape },
    {
      label: "Število strani",
      value:
        Number(project.wedding_album_pages || 0) > 0
          ? String(project.wedding_album_pages)
          : ""
    },
    { label: "Napis", value: project.wedding_album_inscription }
  ];
  const hasAlbumDetails =
    rows.some((row) => row.value) ||
    Boolean(project.wedding_album_wishes || project.wedding_album_notes);

  return (
    <div className="surface rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper text-clay ring-1 ring-line">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Fotoknjiga</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Naročilo fotoknjige
          </h2>
        </div>
      </div>

      {hasAlbumDetails ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="rounded-lg border border-line bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {row.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {row.value || "Ni dodano"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <NoteCard title="Želje za fotoknjigo" body={project.wedding_album_wishes ?? ""} />
            <NoteCard title="Opombe fotoknjige" body={project.wedding_album_notes ?? ""} />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Podrobnosti fotoknjige še niso dodane.
        </p>
      )}
    </div>
  );
}

function WeddingPackageCard({ project }: { project: Project }) {
  const rows = [
    {
      label: "Foto paket",
      name: project.wedding_package || "Ni dodano",
      price: project.wedding_package_price ?? 0,
      detail: ""
    },
    {
      label: "Dodatne ure",
      name:
        Number(project.wedding_extra_hours || 0) > 0
          ? `${project.wedding_extra_hours} x ${formatCurrency(project.wedding_extra_hour_price ?? 90)}`
          : "Ni dodano",
      price:
        Number(project.wedding_extra_hours || 0) *
        Number(project.wedding_extra_hour_price ?? 90),
      detail: ""
    },
    {
      label: "Snemanje",
      name: project.wedding_video_enabled
        ? project.wedding_video_package || "Vključeno"
        : "Ni vključeno",
      price: project.wedding_video_enabled ? project.wedding_video_price ?? 0 : 0,
      detail: project.wedding_video_enabled
        ? project.wedding_video_provider_paid
          ? "Izvajalec plačan"
          : "Izvajalec še ni plačan"
        : ""
    },
    {
      label: "Photobooth",
      name: project.wedding_photobooth_enabled
        ? project.wedding_photobooth_package || "Vključeno"
        : "Ni vključeno",
      price: project.wedding_photobooth_enabled ? project.wedding_photobooth_price ?? 0 : 0,
      detail: ""
    }
  ];
  const total = rows.reduce((sum, row) => sum + Number(row.price || 0), 0);

  return (
    <div className="surface rounded-lg p-4">
      <p className="eyebrow">Poročna ponudba</p>
      <div className="mt-3 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">{row.label}</p>
              <p className="mt-1 text-sm text-muted">{row.name}</p>
              {row.detail ? (
                <p className="mt-1 text-xs font-semibold text-muted">{row.detail}</p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-ink">{formatCurrency(row.price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-white/60 px-3 py-2">
        <span className="text-sm font-semibold text-muted">Skupaj po paketih</span>
        <span className="font-display text-xl font-semibold text-ink">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function ExternalLinkCard({
  label,
  url,
  icon: Icon = ExternalLink
}: {
  label: string;
  url: string;
  icon?: typeof ExternalLink;
}) {
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
          <Icon className="h-4 w-4 shrink-0" />
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
