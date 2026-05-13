"use client";

import { useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { paymentStatuses } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { useStudioSettings } from "@/lib/use-studio-settings";
import { formatCurrency, getOutstandingAmount, sortByDateDesc } from "@/lib/utils";

export default function ProjectsPage() {
  const { workflowStatuses } = useStudioSettings();
  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject
  } =
    useProjects();
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("Vsi");
  const [paymentFilter, setPaymentFilter] = useState("Vsi");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByDateDesc(projects, "shoot_date").filter((project) => {
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
      const matchesWorkflow =
        workflowFilter === "Vsi" || project.workflow_status === workflowFilter;
      const matchesPayment =
        paymentFilter === "Vsi" || project.payment_status === paymentFilter;

      return matchesQuery && matchesWorkflow && matchesPayment;
    });
  }, [paymentFilter, projects, query, workflowFilter]);

  const unpaidAmount = getOutstandingAmount(projects);

  function openNewProject() {
    setEditingProject(null);
    setModalOpen(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    setModalOpen(true);
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Izbrišem projekt za ${project.client_name}? Tega dejanja ni mogoče razveljaviti.`
    );

    if (!confirmed) return;
    await deleteProject(project.id);
  }

  async function handleWorkflowStatusChange(
    project: Project,
    workflowStatus: WorkflowStatus
  ) {
    const paymentStatus =
      workflowStatus === "Plačano" || workflowStatus === "Zaključeno"
        ? "Plačano"
        : project.payment_status;
    const {
      id: _id,
      user_id: _userId,
      created_at: _createdAt,
      updated_at: _updatedAt,
      balance: _balance,
      ...values
    } = project;

    await updateProject(project.id, {
      ...values,
      workflow_status: workflowStatus,
      payment_status: paymentStatus
    });
  }

  async function handlePaymentStatusChange(
    project: Project,
    paymentStatus: PaymentStatus
  ) {
    const {
      id: _id,
      user_id: _userId,
      created_at: _createdAt,
      updated_at: _updatedAt,
      balance: _balance,
      ...values
    } = project;

    await updateProject(project.id, {
      ...values,
      payment_status: paymentStatus
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Workflow</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Projekti
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Filtriraj po statusu, poišči stranko in hitro odpri podrobnosti.
          </p>
        </div>
        <button className="button-primary" onClick={openNewProject}>
          <Plus className="h-4 w-4" />
          Dodaj projekt
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="surface rounded-lg p-4">
          <p className="text-sm text-muted">Vsi projekti</p>
          <p className="mt-2 font-display text-3xl font-semibold">{projects.length}</p>
        </div>
        <div className="surface rounded-lg p-4">
          <p className="text-sm text-muted">Odprti workflowi</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {
              projects.filter((project) => project.workflow_status !== "Zaključeno")
                .length
            }
          </p>
        </div>
        <div className="surface rounded-lg p-4">
          <p className="text-sm text-muted">Neplačan znesek</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {formatCurrency(unpaidAmount)}
          </p>
        </div>
      </section>

      <section className="surface rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Išči po stranki, emailu, telefonu ali lokaciji"
            />
          </label>

          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              className="input pl-10"
              value={workflowFilter}
              onChange={(event) => setWorkflowFilter(event.target.value)}
            >
              <option value="Vsi">Vsi workflow statusi</option>
              {workflowStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <select
            className="input"
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
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-mist/70" />
          ))}
        </div>
      ) : filteredProjects.length ? (
        <section className="space-y-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditProject}
              onDelete={handleDeleteProject}
              onWorkflowStatusChange={handleWorkflowStatusChange}
              onPaymentStatusChange={handlePaymentStatusChange}
            />
          ))}
        </section>
      ) : (
        <section className="surface rounded-lg p-8 text-center">
          <p className="font-display text-2xl font-semibold">Ni najdenih projektov</p>
          <p className="mt-2 text-sm text-muted">
            Spremeni filtre ali dodaj nov projekt.
          </p>
          <button className="button-primary mt-5" onClick={openNewProject}>
            <Plus className="h-4 w-4" />
            Dodaj projekt
          </button>
        </section>
      )}

      <ProjectModal
        open={modalOpen}
        project={editingProject}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          if (editingProject) {
            await updateProject(editingProject.id, values);
          } else {
            await createProject(values);
          }
          setModalOpen(false);
          setEditingProject(null);
        }}
      />
    </div>
  );
}
