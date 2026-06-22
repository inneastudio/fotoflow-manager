"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, Columns3, Euro, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Project, ProjectFormValues, WorkflowStatus } from "@/lib/types";
import { weddingWorkflowStatuses } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { useStudioSettings } from "@/lib/use-studio-settings";
import {
  formatCurrency,
  formatShortDate,
  getProjectSubtitle,
  getProjectTitle,
  sortByNearestUpcoming
} from "@/lib/utils";

export default function KanbanPage() {
  const { projects, loading, updateProject } = useProjects();
  const { workflowStatuses } = useStudioSettings();

  const statuses = useMemo(() => {
    return Array.from(
      new Set([
        ...workflowStatuses,
        ...weddingWorkflowStatuses,
        ...projects.map((project) => String(project.workflow_status))
      ].filter(Boolean))
    );
  }, [projects, workflowStatuses]);

  const groupedProjects = useMemo(() => {
    return statuses.map((status) => ({
      status,
      projects: sortByNearestUpcoming(
        projects.filter((project) => project.workflow_status === status),
        "shoot_date"
      )
    }));
  }, [projects, statuses]);

  async function changeStatus(project: Project, status: WorkflowStatus) {
    await updateProject(project.id, {
      ...toFormValues(project),
      workflow_status: status,
      payment_status:
        status === "Plačano" || status === "Zaključeno"
          ? "Plačano"
          : project.payment_status
    });
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-mist/70" />;
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Pipeline"
        title="Kanban"
        description="Pregled projektov po workflow statusih za hitro planiranje dela."
      />

      <section className="overflow-x-auto pb-3">
        <div className="flex min-h-[580px] gap-4">
          {groupedProjects.map((group) => (
            <div
              key={group.status}
              className="w-80 shrink-0 rounded-lg border border-line bg-white/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-clay" />
                  <h2 className="font-semibold text-ink">{group.status}</h2>
                </div>
                <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-muted">
                  {group.projects.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.projects.length ? (
                  group.projects.map((project) => (
                    <KanbanCard
                      key={project.id}
                      project={project}
                      statuses={statuses}
                      onStatusChange={changeStatus}
                    />
                  ))
                ) : (
                  <p className="rounded-lg border border-line bg-paper/70 p-3 text-sm text-muted">
                    Ni projektov v tem statusu.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KanbanCard({
  project,
  statuses,
  onStatusChange
}: {
  project: Project;
  statuses: string[];
  onStatusChange: (project: Project, status: WorkflowStatus) => void;
}) {
  return (
    <article className="rounded-lg border border-line bg-paper p-3 shadow-sm">
      <Link
        href={`/projects/${project.id}`}
        className="block font-display text-lg font-semibold text-ink hover:text-clay"
      >
        {getProjectTitle(project)}
      </Link>
      <p className="mt-1 text-xs text-muted">{getProjectSubtitle(project)}</p>
      <div className="mt-3 space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-clay" />
          {formatShortDate(project.shoot_date)}
          {project.shoot_time ? ` ob ${project.shoot_time}` : ""}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-clay" />
          {project.location || "Lokacija ni določena"}
        </p>
        <p className="flex items-center gap-2">
          <Euro className="h-3.5 w-3.5 text-clay" />
          {formatCurrency(project.amount)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge>{project.workflow_status}</StatusBadge>
        <StatusBadge type="payment">{project.payment_status}</StatusBadge>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Premakni status</span>
        <select
          className="input h-9 rounded-lg bg-white/70 text-sm"
          value={project.workflow_status}
          onChange={(event) =>
            onStatusChange(project, event.target.value as WorkflowStatus)
          }
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

function toFormValues(project: Project): ProjectFormValues {
  return {
    project_name: project.project_name ?? "",
    client_name: project.client_name,
    email: project.email,
    phone: project.phone,
    shoot_type: project.shoot_type,
    photographer: project.photographer,
    shoot_date: project.shoot_date,
    shoot_time: project.shoot_time ?? "",
    location: project.location,
    workflow_status: project.workflow_status,
    payment_status: project.payment_status,
    payment_method: project.payment_method,
    amount: project.amount,
    deposit: project.deposit,
    delivery_workdays: project.delivery_workdays,
    delivery_due: project.delivery_due,
    gallery_url: project.gallery_url,
    drive_url: project.drive_url,
    contract_file_url: project.contract_file_url ?? "",
    timeline_file_url: project.timeline_file_url ?? "",
    wedding_status_dates: project.wedding_status_dates ?? {},
    wedding_package: project.wedding_package ?? "",
    wedding_package_price: Number(project.wedding_package_price ?? 0),
    wedding_extra_hours: Number(project.wedding_extra_hours ?? 0),
    wedding_extra_hour_price: Number(project.wedding_extra_hour_price ?? 90),
    wedding_video_enabled: Boolean(project.wedding_video_enabled),
    wedding_video_package: project.wedding_video_package ?? "",
    wedding_video_price: Number(project.wedding_video_price ?? 0),
    wedding_video_provider_paid: Boolean(project.wedding_video_provider_paid),
    wedding_photobooth_enabled: Boolean(project.wedding_photobooth_enabled),
    wedding_photobooth_package: project.wedding_photobooth_package ?? "",
    wedding_photobooth_price: Number(project.wedding_photobooth_price ?? 0),
    wedding_album_size: project.wedding_album_size ?? "",
    wedding_album_shape: project.wedding_album_shape ?? "",
    wedding_album_pages: Number(project.wedding_album_pages ?? 0),
    wedding_album_wishes: project.wedding_album_wishes ?? "",
    wedding_album_inscription: project.wedding_album_inscription ?? "",
    wedding_album_notes: project.wedding_album_notes ?? "",
    selected_photos: project.selected_photos,
    notes: project.notes,
    retouch_notes: project.retouch_notes
  };
}
