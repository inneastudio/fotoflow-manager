"use client";

import { X } from "lucide-react";
import { ProjectForm } from "@/components/project-form";
import type { Project, ProjectFormValues } from "@/lib/types";

type ProjectModalProps = {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
};

export function ProjectModal({ open, project, onClose, onSubmit }: ProjectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="mx-auto max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-t-lg border border-line bg-paper shadow-soft sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow">{project ? "Urejanje" : "Nov projekt"}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {project ? project.client_name : "Dodaj fotografiranje"}
            </h2>
          </div>
          <button
            type="button"
            className="button-ghost h-10 w-10 p-0"
            onClick={onClose}
            aria-label="Zapri"
            title="Zapri"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(94vh-82px)] overflow-y-auto p-5">
          <ProjectForm project={project} onSubmit={onSubmit} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
