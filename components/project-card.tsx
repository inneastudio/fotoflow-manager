"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Edit3,
  ExternalLink,
  MapPin,
  Trash2
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { paymentStatuses } from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import { formatDate } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onWorkflowStatusChange?: (project: Project, status: WorkflowStatus) => void;
  onPaymentStatusChange?: (project: Project, status: PaymentStatus) => void;
};

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onWorkflowStatusChange,
  onPaymentStatusChange
}: ProjectCardProps) {
  const { workflowStatuses } = useStudioSettings();
  const availableWorkflowStatuses = Array.from(
    new Set([...workflowStatuses, project.workflow_status].filter(Boolean))
  );
  const projectTitle = project.project_name || project.client_name;

  return (
    <article className="surface rounded-lg p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.2fr)_minmax(260px,1.2fr)_180px_180px_110px] xl:items-center">
        <div className="min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="block truncate font-display text-xl font-semibold text-ink hover:text-clay"
          >
            {projectTitle}
          </Link>
          {project.project_name ? (
            <p className="mt-1 truncate text-sm text-muted">{project.client_name}</p>
          ) : null}
          <p className="mt-1 truncate text-sm text-muted">{project.shoot_type}</p>
        </div>

        <div className="grid gap-2 text-sm text-muted sm:grid-cols-2 xl:grid-cols-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-clay" />
            <span className="truncate">{formatDate(project.shoot_date)}</span>
            <span className="text-muted/70">·</span>
            <Clock3 className="h-4 w-4 shrink-0 text-clay" />
            <span className="truncate">{project.shoot_time || "brez ure"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-clay" />
            <span className="truncate">{project.location || "Lokacija ni določena"}</span>
          </div>
        </div>

        <label className="space-y-1">
          <span className="sr-only">Workflow status</span>
          <select
            className="input h-10 text-sm"
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
        </label>

        <label className="space-y-1">
          <span className="sr-only">Plačilni status</span>
          <select
            className="input h-10 text-sm"
            value={project.payment_status}
            onChange={(event) =>
              onPaymentStatusChange?.(
                project,
                event.target.value as PaymentStatus
              )
            }
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <div className="flex flex-wrap gap-1.5 xl:hidden">
            <StatusBadge>{project.workflow_status}</StatusBadge>
            <StatusBadge type="payment">{project.payment_status}</StatusBadge>
          </div>
          <div className="flex items-center gap-1">
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
            <Link
              href={`/projects/${project.id}`}
              className="button-secondary h-9 w-9 p-0"
              aria-label="Odpri projekt"
              title="Odpri projekt"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
