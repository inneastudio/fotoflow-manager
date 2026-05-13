"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  ChevronRight,
  Edit3,
  ExternalLink,
  MapPin,
  Trash2
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Project, WorkflowStatus } from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import { formatCurrency, formatDate, getNextWorkflowStatus } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onMoveNext?: (project: Project) => void;
  onWorkflowStatusChange?: (project: Project, status: WorkflowStatus) => void;
};

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onMoveNext,
  onWorkflowStatusChange
}: ProjectCardProps) {
  const { workflowStatuses } = useStudioSettings();
  const availableWorkflowStatuses = Array.from(
    new Set([...workflowStatuses, project.workflow_status].filter(Boolean))
  );
  const nextStatus = getNextWorkflowStatus(
    project.workflow_status,
    availableWorkflowStatuses
  );
  const isFinal =
    project.workflow_status ===
    availableWorkflowStatuses[availableWorkflowStatuses.length - 1];

  return (
    <article className="surface rounded-lg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="font-display text-2xl font-semibold text-ink hover:text-clay"
          >
            {project.client_name}
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge>{project.workflow_status}</StatusBadge>
            <StatusBadge type="payment">{project.payment_status}</StatusBadge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-ghost h-9 w-9 p-0"
            onClick={() => onEdit?.(project)}
            aria-label="Uredi projekt"
            title="Uredi projekt"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="button-ghost h-9 w-9 p-0 text-rose hover:text-rose"
            onClick={() => onDelete?.(project)}
            aria-label="Izbriši projekt"
            title="Izbriši projekt"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-clay" />
          <span>{formatDate(project.shoot_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-clay" />
          <span>{project.shoot_time || "Ura ni določena"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-clay" />
          <span className="truncate">{project.location || "Lokacija ni določena"}</span>
        </div>
        <div>
          <span className="font-semibold text-ink">Fotograf:</span>{" "}
          {project.photographer}
        </div>
        <div>
          <span className="font-semibold text-ink">Plačilo:</span>{" "}
          {project.payment_method}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-white/50 p-3 text-sm">
        <div>
          <p className="text-muted">Znesek</p>
          <p className="mt-1 font-semibold text-ink">{formatCurrency(project.amount)}</p>
        </div>
        <div>
          <p className="text-muted">Avans</p>
          <p className="mt-1 font-semibold text-ink">{formatCurrency(project.deposit)}</p>
        </div>
        <div>
          <p className="text-muted">Ostane</p>
          <p className="mt-1 font-semibold text-ink">{formatCurrency(project.balance)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-white/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Hitri workflow
          </p>
          <button
            type="button"
            className="button-ghost py-1.5 pr-2 text-clay"
            disabled={isFinal}
            onClick={() => onMoveNext?.(project)}
          >
            {isFinal ? "Zaključeno" : `Naslednji: ${nextStatus}`}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <select
          className="input"
          value={project.workflow_status}
          onChange={(event) =>
            onWorkflowStatusChange?.(
              project,
              event.target.value as WorkflowStatus
            )
          }
        >
          {availableWorkflowStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted">{project.shoot_type}</p>
        <Link href={`/projects/${project.id}`} className="button-secondary py-1.5">
          <ExternalLink className="h-4 w-4" />
          Odpri
        </Link>
      </div>
    </article>
  );
}
