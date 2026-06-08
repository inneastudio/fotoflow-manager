"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Filter, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { paymentStatuses } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { sortByDateDesc } from "@/lib/utils";

export default function ArchivePage() {
  const { projects, loading, updateProject, deleteProject } = useProjects();
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Vsi");
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const archivedProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByDateDesc(
      projects.filter((project) => project.workflow_status === "Zaključeno"),
      "shoot_date"
    ).filter((project) => {
      const matchesQuery = normalizedQuery
        ? [
            project.project_name,
            project.client_name,
            project.email,
            project.phone,
            project.location
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesPayment =
        paymentFilter === "Vsi" || project.payment_status === paymentFilter;

      return matchesQuery && matchesPayment;
    });
  }, [paymentFilter, projects, query]);

  async function handleWorkflowStatusChange(
    project: Project,
    workflowStatus: WorkflowStatus
  ) {
    await updateProject(project.id, {
      ...toFormValues(project),
      workflow_status: workflowStatus,
      payment_status:
        workflowStatus === "Plačano" || workflowStatus === "Zaključeno"
          ? "Plačano"
          : project.payment_status
    });
  }

  async function handlePaymentStatusChange(
    project: Project,
    paymentStatus: PaymentStatus
  ) {
    await updateProject(project.id, {
      ...toFormValues(project),
      payment_status: paymentStatus
    });
  }

  async function handleRestore(project: Project) {
    await updateProject(project.id, {
      ...toFormValues(project),
      workflow_status: "Poslano"
    });
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Izbrišem arhiviran projekt za ${project.client_name}? Tega dejanja ni mogoče razveljaviti.`
    );
    if (!confirmed) return;
    await deleteProject(project.id);
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Zaključeno"
        title="Arhiv"
        description="Zaključeni projekti ostanejo tukaj, glavni pregled pa ostane čist."
        actions={
        <Link href="/projects" className="button-secondary">
          Projekti
        </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="surface rounded-lg p-4">
          <p className="text-sm text-muted">Arhivirani projekti</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {archivedProjects.length}
          </p>
        </div>
        <div className="surface rounded-lg p-4 md:col-span-2">
          <p className="text-sm text-muted">Kako arhiviraš?</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Projekt pride v arhiv, ko ima workflow status Zaključeno.
          </p>
        </div>
      </section>

      <section className="surface rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Išči po arhivu"
            />
          </label>
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              className="input pl-10"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="Vsi">Vsi plačilni statusi</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-mist/70" />
          ))}
        </div>
      ) : archivedProjects.length ? (
        <section className="space-y-3">
          {archivedProjects.map((project) => (
            <div key={project.id} className="space-y-2">
              <ProjectCard
                project={project}
                onEdit={setEditingProject}
                onDelete={handleDelete}
                onWorkflowStatusChange={handleWorkflowStatusChange}
                onPaymentStatusChange={handlePaymentStatusChange}
              />
              <button
                type="button"
                className="button-secondary text-sm"
                onClick={() => handleRestore(project)}
              >
                <RotateCcw className="h-4 w-4" />
                Vrni med aktivne
              </button>
            </div>
          ))}
        </section>
      ) : (
        <section className="surface rounded-lg p-8 text-center">
          <Archive className="mx-auto h-8 w-8 text-clay" />
          <p className="mt-3 font-display text-2xl font-semibold">
            Arhiv je prazen
          </p>
          <p className="mt-2 text-sm text-muted">
            Zaključeni projekti se bodo prikazali tukaj.
          </p>
        </section>
      )}

      <ProjectModal
        open={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={async (values) => {
          if (!editingProject) return;
          await updateProject(editingProject.id, values);
          setEditingProject(null);
        }}
      />
    </div>
  );
}

function toFormValues(project: Project) {
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
    selected_photos: project.selected_photos,
    notes: project.notes,
    retouch_notes: project.retouch_notes
  };
}
