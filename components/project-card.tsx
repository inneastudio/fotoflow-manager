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
import { PaymentMethodLabel } from "@/components/payment-method-label";
import { StatusBadge } from "@/components/status-badge";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { getPaymentStatusesForMethod, weddingWorkflowStatuses } from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import {
  formatCurrency,
  formatDate,
  getProjectSubtitle,
  getProjectTitle
} from "@/lib/utils";

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
  const isWedding = String(project.shoot_type).toLowerCase().includes("poroka");
  const availableWorkflowStatuses = Array.from(
    new Set([
      ...(isWedding ? weddingWorkflowStatuses : workflowStatuses),
      project.workflow_status
    ].filter(Boolean))
  );
  const projectTitle = getProjectTitle(project);
  const projectSubtitle = getProjectSubtitle(project);
  const paymentStatusOptions = getPaymentStatusesForMethod(
    project.payment_method,
    project.payment_status
  );

  return (
    <article className="surface rounded-lg px-4 py-3 transition hover:-translate-y-0.5 hover:border-clay/35 hover:bg-white/75 hover:shadow-soft">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.2fr)_minmax(260px,1fr)_120px_minmax(340px,1.15fr)_104px] xl:items-center">
        <div className="min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="block truncate font-display text-lg font-semibold tracking-normal text-ink hover:text-clay"
          >
            {projectTitle}
          </Link>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="truncate">{projectSubtitle}</span>
          </div>
        </div>

        <div className="grid gap-1.5 text-sm text-muted">
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

        <div className="text-sm xl:text-right">
          <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/55 px-2.5 py-1.5">
            <p className="text-xs text-muted">Znesek</p>
            <p className="font-semibold text-ink">{formatCurrency(project.amount)}</p>
          </div>
          <PaymentMethodLabel
            method={project.payment_method}
            className="mt-1.5 text-xs text-muted xl:justify-end"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label>
            <span className="sr-only">Workflow status</span>
            <select
              className="input h-10 rounded-lg border-line bg-white/70 text-sm font-medium"
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

          <label>
            <span className="sr-only">Plačilni status</span>
            <select
              className="input h-10 rounded-lg border-line bg-white/70 text-sm font-medium"
              value={project.payment_status}
              onChange={(event) =>
                onPaymentStatusChange?.(
                  project,
                  event.target.value as PaymentStatus
                )
              }
            >
              {paymentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <div className="flex flex-wrap gap-1.5 xl:hidden">
            <StatusBadge>{project.workflow_status}</StatusBadge>
            <StatusBadge type="payment">{project.payment_status}</StatusBadge>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="button-ghost h-9 w-9 p-0 text-muted"
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
