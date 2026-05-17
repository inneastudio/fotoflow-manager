"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CircleDollarSign,
  FolderKanban,
  Images,
  Plus,
  Send,
  Sparkles,
  WalletCards
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ProjectModal } from "@/components/project-modal";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusBadge } from "@/components/status-badge";
import { countReminders, getProjectReminders, type ReminderItem } from "@/lib/project-insights";
import { useProjects } from "@/lib/use-projects";
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  getMonthlyRevenue,
  getOutstandingAmount,
  isSameDay,
  sortByDateDesc
} from "@/lib/utils";

export default function DashboardPage() {
  const { projects, loading, createProject } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(
      (project) => project.workflow_status !== "Zaključeno"
    );
    const toEdit = projects.filter((project) =>
      ["Izbor prejet", "Narejen izbor", "Urejanje"].includes(project.workflow_status)
    );

    return {
      activeProjects,
      toEdit,
      unpaidAmount: getOutstandingAmount(projects),
      monthlyRevenue: getMonthlyRevenue(projects)
    };
  }, [projects]);

  const todayProjects = projects.filter((project) =>
    isSameDay(project.shoot_date, new Date())
  );
  const reminders = useMemo(() => getProjectReminders(projects), [projects]);
  const reminderCount = countReminders(reminders);
  const unpaidProjects = projects
    .filter((project) => project.payment_status !== "Plačano")
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 4);
  const recentProjects = sortByDateDesc(projects).slice(0, 5);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">FotoFlow Manager</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Studio pregled
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Pregled rezervacij, urejanja, rokov in plačil za fotografski workflow.
          </p>
        </div>
        <button className="button-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nov projekt
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Aktivni projekti"
          value={String(stats.activeProjects.length)}
          detail="Vsi odprti workflowi"
          icon={FolderKanban}
          tone="charcoal"
        />
        <MetricCard
          label="Za urediti"
          value={String(stats.toEdit.length)}
          detail="Izbor prejet, narejen izbor ali v retuši"
          icon={Images}
          tone="clay"
        />
        <MetricCard
          label="Neplačano"
          value={formatCurrency(stats.unpaidAmount)}
          detail="Preostanki odprtih plačil"
          icon={WalletCards}
          tone="rose"
        />
        <MetricCard
          label="Mesečni prihodki"
          value={formatCurrency(stats.monthlyRevenue)}
          detail="Plačani projekti ta mesec"
          icon={CircleDollarSign}
          tone="olive"
        />
      </section>

      {reminderCount ? (
        <section className="surface rounded-lg border-clay/30 bg-clay/5 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Prioritete danes</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                Kaj ne sme uiti
              </h2>
            </div>
            <span className="rounded-full border border-line bg-white/75 px-3 py-1 text-xs font-semibold text-muted">
              {reminderCount} opomnikov
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PriorityList
              title="Deadline"
              icon={AlertCircle}
              items={reminders.deadlines}
              empty="Ni nujnih deadlineov."
            />
            <PriorityList
              title="Avans"
              icon={WalletCards}
              items={reminders.unpaidDeposits}
              empty="Avansi so urejeni."
            />
            <PriorityList
              title="Shrani"
              icon={Archive}
              items={reminders.unsaved}
              empty="Ni projektov za shraniti."
            />
            <PriorityList
              title="Izbor"
              icon={Send}
              items={reminders.selectionLate}
              empty="Izbori niso zamujeni."
            />
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <RevenueChart projects={projects} />

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Danes</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Fotografiranja
              </h2>
            </div>
            <CalendarClock className="h-5 w-5 text-clay" />
          </div>

          <div className="mt-5 space-y-3">
            {todayProjects.length ? (
              todayProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-lg border border-line bg-white/60 p-3 transition hover:border-clay/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {project.project_name || project.client_name}
                      </p>
                      {project.project_name ? (
                        <p className="mt-1 text-xs text-muted">{project.client_name}</p>
                      ) : null}
                      <p className="mt-1 text-sm text-muted">{project.location}</p>
                    </div>
                    <StatusBadge>{project.workflow_status}</StatusBadge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-line bg-white/50 p-4 text-sm text-muted">
                Danes ni vpisanega fotografiranja.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Zadnje aktivnosti</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Zadnji projekti
              </h2>
            </div>
            <Link className="button-secondary py-1.5" href="/projects">
              Vsi
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.map((project) => (
              <ProjectListItem key={project.id} projectId={project.id}>
                <div>
                  <p className="font-semibold text-ink">
                    {project.project_name || project.client_name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {project.shoot_type} · {formatShortDate(project.shoot_date)}
                  </p>
                </div>
                <StatusBadge>{project.workflow_status}</StatusBadge>
              </ProjectListItem>
            ))}
          </div>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Finance</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Neplačani projekti
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-clay" />
          </div>

          <div className="space-y-3">
            {unpaidProjects.length ? (
              unpaidProjects.map((project) => (
                <ProjectListItem key={project.id} projectId={project.id}>
                  <div>
                    <p className="font-semibold text-ink">
                      {project.project_name || project.client_name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Rok: {formatDate(project.delivery_due)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">
                      {formatCurrency(project.balance)}
                    </p>
                    <StatusBadge type="payment" className="mt-1">
                      {project.payment_status}
                    </StatusBadge>
                  </div>
                </ProjectListItem>
              ))
            ) : (
              <div className="rounded-lg border border-line bg-white/50 p-4 text-sm text-muted">
                Vsa plačila so zaključena.
              </div>
            )}
          </div>
        </div>
      </section>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await createProject(values);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

function PriorityList({
  title,
  icon: Icon,
  items,
  empty
}: {
  title: string;
  icon: typeof AlertCircle;
  items: ReminderItem[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white/70 p-3">
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
          items.slice(0, 3).map(({ project, label }) => (
            <Link
              key={`${title}-${project.id}`}
              href={`/projects/${project.id}`}
              className="block rounded-lg border border-line bg-paper/80 p-2 transition hover:border-clay/35"
            >
              <p className="truncate text-sm font-semibold text-ink">
                {project.project_name || project.client_name}
              </p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </Link>
          ))
        ) : (
          <p className="rounded-lg border border-line bg-paper/80 p-2 text-sm text-muted">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectListItem({
  projectId,
  children
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/projects/${projectId}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white/60 p-3 transition hover:border-clay/40 hover:bg-white/75"
    >
      {children}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-lg bg-mist/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg bg-mist/70" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-mist/70" />
    </div>
  );
}
