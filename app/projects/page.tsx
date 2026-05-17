"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Archive, Filter, Plus, Search, Send, type LucideIcon } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { paymentStatuses } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { useStudioSettings } from "@/lib/use-studio-settings";
import {
  formatCurrency,
  formatShortDate,
  getOutstandingAmount,
  sortByNearestUpcoming
} from "@/lib/utils";

type ProjectFocusFilter = "Vsi" | "Za fotografirat" | "Za urediti";

const editAndSendStatuses = [
  "Fotografirano",
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje"
];
const savedOrLaterStatuses = [
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
];
const selectionSentOrLaterStatuses = [
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
];
const deliveredStatuses = ["Poslano", "Plačano", "Zaključeno"];

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
  const [focusFilter, setFocusFilter] = useState<ProjectFocusFilter>("Vsi");
  const [workflowFilter, setWorkflowFilter] = useState("Vsi");
  const [paymentFilter, setPaymentFilter] = useState("Vsi");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByNearestUpcoming(projects, "shoot_date").filter((project) => {
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
      const matchesFocus =
        focusFilter === "Vsi" ||
        (focusFilter === "Za fotografirat" &&
          project.workflow_status === "Rezervirano") ||
        (focusFilter === "Za urediti" &&
          editAndSendStatuses.includes(String(project.workflow_status)));
      const matchesWorkflow =
        workflowFilter === "Vsi" || project.workflow_status === workflowFilter;
      const matchesPayment =
        paymentFilter === "Vsi" || project.payment_status === paymentFilter;

      return matchesQuery && matchesFocus && matchesWorkflow && matchesPayment;
    });
  }, [focusFilter, paymentFilter, projects, query, workflowFilter]);

  const unpaidAmount = getOutstandingAmount(projects);
  const waitingToShootCount = projects.filter(
    (project) => project.workflow_status === "Rezervirano"
  ).length;
  const waitingToEditCount = projects.filter((project) =>
    editAndSendStatuses.includes(String(project.workflow_status))
  ).length;
  const reminders = useMemo(() => getProjectReminders(projects), [projects]);
  const reminderCount =
    reminders.deadlines.length + reminders.unsaved.length + reminders.selectionLate.length;

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
      contract_file_url: values.contract_file_url ?? "",
      timeline_file_url: values.timeline_file_url ?? "",
      wedding_status_dates: values.wedding_status_dates ?? {},
      wedding_package: values.wedding_package ?? "",
      wedding_package_price: Number(values.wedding_package_price ?? 0),
      wedding_video_enabled: Boolean(values.wedding_video_enabled),
      wedding_video_package: values.wedding_video_package ?? "",
      wedding_video_price: Number(values.wedding_video_price ?? 0),
      wedding_photobooth_enabled: Boolean(values.wedding_photobooth_enabled),
      wedding_photobooth_package: values.wedding_photobooth_package ?? "",
      wedding_photobooth_price: Number(values.wedding_photobooth_price ?? 0),
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
      contract_file_url: values.contract_file_url ?? "",
      timeline_file_url: values.timeline_file_url ?? "",
      wedding_status_dates: values.wedding_status_dates ?? {},
      wedding_package: values.wedding_package ?? "",
      wedding_package_price: Number(values.wedding_package_price ?? 0),
      wedding_video_enabled: Boolean(values.wedding_video_enabled),
      wedding_video_package: values.wedding_video_package ?? "",
      wedding_video_price: Number(values.wedding_video_price ?? 0),
      wedding_photobooth_enabled: Boolean(values.wedding_photobooth_enabled),
      wedding_photobooth_package: values.wedding_photobooth_package ?? "",
      wedding_photobooth_price: Number(values.wedding_photobooth_price ?? 0),
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

      {reminderCount ? (
        <section className="surface rounded-lg border-clay/30 bg-clay/5 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-clay/10 text-clay">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Opomniki</p>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Kaj potrebuje pozornost
                </h2>
              </div>
            </div>
            <span className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-muted">
              {reminderCount} skupaj
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <ReminderColumn
              title="Deadline v 3 dneh"
              icon={AlertCircle}
              empty="Ni bližnjih deadlineov."
              items={reminders.deadlines}
              onEdit={openEditProject}
            />
            <ReminderColumn
              title="Ni shranjeno"
              icon={Archive}
              empty="Vse je označeno kot shranjeno."
              items={reminders.unsaved}
              onEdit={openEditProject}
            />
            <ReminderColumn
              title="Izbor ni poslan"
              icon={Send}
              empty="Ni zamujenih izborov."
              items={reminders.selectionLate}
              onEdit={openEditProject}
            />
          </div>
        </section>
      ) : null}

      <section className="surface rounded-lg p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: "Vsi", count: projects.length },
            { label: "Za fotografirat", count: waitingToShootCount },
            { label: "Za urediti", count: waitingToEditCount }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                focusFilter === item.label
                  ? "button-primary"
                  : "button-secondary"
              }
              onClick={() => setFocusFilter(item.label as ProjectFocusFilter)}
            >
              {item.label}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {item.count}
              </span>
            </button>
          ))}
        </div>

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

function getProjectReminders(projects: Project[]) {
  const today = new Date(new Date().toDateString());
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  function projectDate(value: string) {
    return new Date(`${value}T12:00:00`);
  }

  const openProjects = projects.filter(
    (project) => !deliveredStatuses.includes(String(project.workflow_status))
  );

  const deadlines = openProjects
    .filter((project) => {
      const due = projectDate(project.delivery_due);
      return due >= today && due <= threeDaysFromNow;
    })
    .map((project) => ({
      project,
      label: `Rok: ${formatShortDate(project.delivery_due)}`
    }));

  const unsaved = projects
    .filter((project) => {
      const shootDate = projectDate(project.shoot_date);
      return (
        shootDate <= today &&
        !savedOrLaterStatuses.includes(String(project.workflow_status))
      );
    })
    .map((project) => ({
      project,
      label: `Fotografirano: ${formatShortDate(project.shoot_date)}`
    }));

  const selectionLate = projects
    .filter((project) => {
      const shootDate = projectDate(project.shoot_date);
      const selectionDue = new Date(shootDate);
      selectionDue.setDate(selectionDue.getDate() + 3);

      return (
        today >= selectionDue &&
        !selectionSentOrLaterStatuses.includes(String(project.workflow_status))
      );
    })
    .map((project) => ({
      project,
      label: `Izbor do: ${formatShortDate(addDays(project.shoot_date, 3))}`
    }));

  return {
    deadlines: sortReminderItems(deadlines),
    unsaved: sortReminderItems(unsaved),
    selectionLate: sortReminderItems(selectionLate)
  };
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortReminderItems(
  items: Array<{ project: Project; label: string }>
) {
  return [...items].sort(
    (a, b) =>
      new Date(a.project.shoot_date).getTime() -
      new Date(b.project.shoot_date).getTime()
  );
}

function ReminderColumn({
  title,
  icon: Icon,
  empty,
  items,
  onEdit
}: {
  title: string;
  icon: LucideIcon;
  empty: string;
  items: Array<{ project: Project; label: string }>;
  onEdit: (project: Project) => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-white/65 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-clay" />
          {title}
        </div>
        <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-muted">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.slice(0, 4).map(({ project, label }) => (
            <div
              key={`${title}-${project.id}`}
              className="rounded-lg border border-line bg-paper/80 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {project.project_name || project.client_name}
                  </p>
                  <p className="mt-1 text-xs text-muted">{label}</p>
                  <p className="mt-1 text-xs text-muted">
                    Status: {project.workflow_status}
                  </p>
                </div>
                <button
                  type="button"
                  className="button-secondary h-8 px-2 text-xs"
                  onClick={() => onEdit(project)}
                >
                  Uredi
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-line bg-paper/80 p-3 text-sm text-muted">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}
