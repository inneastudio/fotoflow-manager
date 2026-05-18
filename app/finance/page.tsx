"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clapperboard,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PaymentMethodLabel } from "@/components/payment-method-label";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusBadge } from "@/components/status-badge";
import { useProjects } from "@/lib/use-projects";
import { photographers, type Project, type ProjectFormValues } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getMonthlyRevenue
} from "@/lib/utils";

const MONTHLY_REVENUE_GOAL_KEY = "fotoflow-manager-monthly-revenue-goal";

export default function FinancePage() {
  const { projects, loading, updateProject } = useProjects();
  const [photographerFilter, setPhotographerFilter] = useState("Vsi");
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(MONTHLY_REVENUE_GOAL_KEY);
    if (saved) setMonthlyGoal(Number(saved));
  }, []);

  function updateMonthlyGoal(value: number) {
    const normalizedValue = Math.max(Number(value || 0), 0);
    setMonthlyGoal(normalizedValue);
    window.localStorage.setItem(
      MONTHLY_REVENUE_GOAL_KEY,
      String(normalizedValue)
    );
  }

  const photographerOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...photographers,
        ...projects.map((project) => project.photographer).filter(Boolean)
      ])
    );
  }, [projects]);
  const filteredProjects = useMemo(() => {
    if (photographerFilter === "Vsi") return projects;
    return projects.filter((project) => project.photographer === photographerFilter);
  }, [photographerFilter, projects]);

  const totalRevenue = filteredProjects
    .filter((project) => project.payment_status === "Plačano")
    .reduce((sum, project) => sum + project.amount, 0);
  const deposits = filteredProjects.reduce((sum, project) => sum + project.deposit, 0);
  const monthlyRevenue = getMonthlyRevenue(filteredProjects);
  const paidProjects = filteredProjects.filter(
    (project) => project.payment_status === "Plačano"
  );
  const averagePaidProject = paidProjects.length
    ? Math.round(totalRevenue / paidProjects.length)
    : 0;
  const monthlyGoalProgress = monthlyGoal
    ? Math.min(Math.round((monthlyRevenue / monthlyGoal) * 100), 999)
    : 0;
  const monthlyGoalRemaining = Math.max(monthlyGoal - monthlyRevenue, 0);

  const unpaidProjects = filteredProjects
    .filter(
      (project) =>
        project.workflow_status === "Zaključeno" &&
        project.payment_status !== "Plačano"
    )
    .sort((a, b) => b.balance - a.balance);
  const weddingVideoProjects = filteredProjects
    .filter((project) => project.wedding_video_enabled)
    .sort((a, b) => a.shoot_date.localeCompare(b.shoot_date));
  const unpaidVideoProviders = weddingVideoProjects.filter(
    (project) => !project.wedding_video_provider_paid
  );
  const unpaidVideoProviderAmount = unpaidVideoProviders.reduce(
    (sum, project) => sum + Number(project.wedding_video_price || 0),
    0
  );

  async function toggleVideoProviderPaid(project: Project) {
    await updateProject(project.id, {
      ...toProjectFormValues(project),
      wedding_video_provider_paid: !project.wedding_video_provider_paid
    });
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Plačila in prihodki"
        title="Finance"
        description="Pregled plačanih projektov, avansov, mesečne kvote in odprtih zneskov."
        actions={
        <label className="w-full space-y-1.5 sm:max-w-xs">
          <span className="text-sm font-medium text-ink">Fotograf</span>
          <select
            className="input"
            value={photographerFilter}
            onChange={(event) => setPhotographerFilter(event.target.value)}
          >
            <option value="Vsi">Vsi fotografi</option>
            {photographerOptions.map((photographer) => (
              <option key={photographer} value={photographer}>
                {photographer}
              </option>
            ))}
          </select>
        </label>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Mesečni prihodki"
          value={formatCurrency(monthlyRevenue)}
          detail="Plačano v tekočem mesecu"
          icon={TrendingUp}
          tone="olive"
        />
        <MetricCard
          label="Skupaj plačano"
          value={formatCurrency(totalRevenue)}
          detail="Zaključena plačila"
          icon={CircleDollarSign}
          tone="charcoal"
        />
        <MetricCard
          label="Prejeti avansi"
          value={formatCurrency(deposits)}
          detail="Vsi evidentirani avansi"
          icon={ReceiptText}
          tone="clay"
        />
        <MetricCard
          label="Odprto"
          value={formatCurrency(
            unpaidProjects.reduce((sum, project) => sum + project.balance, 0)
          )}
          detail="Zaključeno, še ne plačano"
          icon={WalletCards}
          tone="rose"
        />
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-clay" />
              <div>
                <p className="eyebrow">Mesečna kvota</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  Cilj prometa
                </h2>
              </div>
            </div>
            <label className="mt-4 block max-w-xs space-y-1.5">
              <span className="text-sm font-medium text-ink">Želeni mesečni promet</span>
              <input
                className="input"
                min="0"
                step="100"
                type="number"
                value={monthlyGoal}
                onChange={(event) => updateMonthlyGoal(Number(event.target.value))}
              />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Ta mesec</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ink">
                  {formatCurrency(monthlyRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Uspešnost</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ink">
                  {monthlyGoal ? `${monthlyGoalProgress}%` : "Ni cilja"}
                </p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-clay transition-all"
                style={{
                  width: `${monthlyGoal ? Math.min(monthlyGoalProgress, 100) : 0}%`
                }}
              />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <p>
                Do cilja manjka{" "}
                <span className="font-semibold text-ink">
                  {formatCurrency(monthlyGoalRemaining)}
                </span>
              </p>
              <p>
                Povprečen plačan projekt{" "}
                <span className="font-semibold text-ink">
                  {formatCurrency(averagePaidProject)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart projects={filteredProjects} />

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4">
            <p className="eyebrow">Izterjava</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Neplačani projekti
            </h2>
            <p className="mt-2 text-sm text-muted">
              Prikazani so samo zaključeni projekti, ki še niso označeni kot plačani.
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="h-24 animate-pulse rounded-lg bg-mist/70" />
            ) : unpaidProjects.length ? (
              unpaidProjects.map((project) => (
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
                      <p className="mt-1 text-sm text-muted">
                        Rok oddaje: {formatDate(project.delivery_due)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <PaymentMethodLabel method={project.payment_method} />
                        <span>· {project.photographer}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink">
                        {formatCurrency(project.balance)}
                      </p>
                      <StatusBadge type="payment" className="mt-1">
                        {project.payment_status}
                      </StatusBadge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
                Trenutno ni odprtih plačil.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Poroke</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Zunanji izvajalci za snemanje
            </h2>
            <p className="mt-2 text-sm text-muted">
              Ločen pregled snemanja, da vidiš komu je še treba plačati.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white/70 px-3 py-2 text-sm font-semibold text-muted">
            Odprto: {unpaidVideoProviders.length} ·{" "}
            {formatCurrency(unpaidVideoProviderAmount)}
          </div>
        </div>

        <div className="divide-y divide-line">
          {weddingVideoProjects.length ? (
            weddingVideoProjects.map((project) => (
              <div
                key={project.id}
                className="grid gap-3 py-3 md:grid-cols-[1fr_0.45fr_0.45fr_auto] md:items-center"
              >
                <Link href={`/projects/${project.id}`} className="min-w-0">
                  <p className="font-semibold text-ink">
                    {project.project_name || project.client_name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {project.wedding_video_package || "Snemanje"} ·{" "}
                    {formatDate(project.shoot_date)}
                  </p>
                </Link>
                <div>
                  <p className="text-xs text-muted">Cena snemanja</p>
                  <p className="mt-1 font-semibold text-ink">
                    {formatCurrency(project.wedding_video_price ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Status izvajalca</p>
                  <span
                    className={[
                      "mt-1 inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                      project.wedding_video_provider_paid
                        ? "border-olive/20 bg-olive/10 text-olive"
                        : "border-rose/25 bg-rose/10 text-rose"
                    ].join(" ")}
                  >
                    {project.wedding_video_provider_paid ? "Plačano" : "Ni plačano"}
                  </span>
                </div>
                <button
                  type="button"
                  className="button-secondary justify-center"
                  onClick={() => toggleVideoProviderPaid(project)}
                >
                  <Clapperboard className="h-4 w-4" />
                  {project.wedding_video_provider_paid
                    ? "Označi neplačano"
                    : "Označi plačano"}
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
              Ni porok z dodanim snemanjem.
            </p>
          )}
        </div>
      </section>

      <section className="surface rounded-lg overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <p className="eyebrow">Pregled</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Plačilni statusi
          </h2>
        </div>
        <div className="divide-y divide-line">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid gap-3 p-4 transition hover:bg-white/50 md:grid-cols-[1fr_0.45fr_0.45fr_0.45fr_0.45fr]"
            >
              <div>
                <p className="font-semibold text-ink">
                  {project.project_name || project.client_name}
                </p>
                {project.project_name ? (
                  <p className="mt-1 text-xs text-muted">{project.client_name}</p>
                ) : null}
                <p className="mt-1 text-sm text-muted">
                  {project.shoot_type} · {project.photographer}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Način</p>
                <PaymentMethodLabel
                  method={project.payment_method}
                  className="mt-1 font-semibold"
                />
              </div>
              <div>
                <p className="text-xs text-muted">Znesek</p>
                <p className="mt-1 font-semibold">{formatCurrency(project.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Preostanek</p>
                <p className="mt-1 font-semibold">{formatCurrency(project.balance)}</p>
              </div>
              <div className="md:text-right">
                <StatusBadge type="payment">{project.payment_status}</StatusBadge>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function toProjectFormValues(project: Project): ProjectFormValues {
  return {
    ...project,
    contract_file_url: project.contract_file_url ?? "",
    timeline_file_url: project.timeline_file_url ?? "",
    wedding_status_dates: project.wedding_status_dates ?? {},
    wedding_package: project.wedding_package ?? "",
    wedding_package_price: Number(project.wedding_package_price ?? 0),
    wedding_video_enabled: Boolean(project.wedding_video_enabled),
    wedding_video_package: project.wedding_video_package ?? "",
    wedding_video_price: Number(project.wedding_video_price ?? 0),
    wedding_video_provider_paid: Boolean(project.wedding_video_provider_paid),
    wedding_photobooth_enabled: Boolean(project.wedding_photobooth_enabled),
    wedding_photobooth_package: project.wedding_photobooth_package ?? "",
    wedding_photobooth_price: Number(project.wedding_photobooth_price ?? 0)
  };
}
