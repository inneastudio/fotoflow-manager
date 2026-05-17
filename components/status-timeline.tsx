"use client";

import { Check } from "lucide-react";
import type { WeddingStatusDates, WorkflowStatus } from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import { cn } from "@/lib/utils";

export function StatusTimeline({
  status,
  statuses,
  statusDates
}: {
  status: WorkflowStatus;
  statuses?: readonly string[];
  statusDates?: WeddingStatusDates;
}) {
  const { workflowStatuses } = useStudioSettings();
  const availableWorkflowStatuses = Array.from(
    new Set([...(statuses?.length ? statuses : workflowStatuses), status].filter(Boolean))
  );
  const currentIndex = availableWorkflowStatuses.indexOf(status);

  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Timeline statusov</h2>
        </div>
        <p className="rounded-lg border border-line bg-white/60 px-3 py-2 text-sm font-semibold text-ink">
          {currentIndex + 1}/{availableWorkflowStatuses.length}
        </p>
      </div>

      <div className="space-y-3">
        {availableWorkflowStatuses.map((item, index) => {
          const complete = index <= currentIndex;
          const active = index === currentIndex;

          return (
            <div key={item} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border text-xs font-semibold",
                    complete
                      ? "border-olive bg-olive text-paper"
                      : "border-line bg-white/60 text-muted"
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < availableWorkflowStatuses.length - 1 ? (
                  <div className={cn("h-6 w-px", complete ? "bg-olive" : "bg-line")} />
                ) : null}
              </div>
              <div className="min-w-0 pb-3">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-clay" : complete ? "text-ink" : "text-muted"
                  )}
                >
                  {item}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {statusDates?.[item]
                    ? new Intl.DateTimeFormat("sl-SI", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }).format(new Date(statusDates[item]))
                    : active
                      ? "Trenutni korak"
                      : complete
                        ? "Zaključeno"
                        : "Čaka"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
