"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleDollarSign, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PaymentMethodLabel } from "@/components/payment-method-label";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusBadge } from "@/components/status-badge";
import { useProjects } from "@/lib/use-projects";
import { photographers } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getMonthlyRevenue,
  getOutstandingAmount
} from "@/lib/utils";

export default function FinancePage() {
  const { projects, loading } = useProjects();
  const [photographerFilter, setPhotographerFilter] = useState("Vsi");
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
  const outstanding = getOutstandingAmount(filteredProjects);
  const monthlyRevenue = getMonthlyRevenue(filteredProjects);

  const unpaidProjects = filteredProjects
    .filter((project) => project.payment_status !== "Plačano")
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Plačila in prihodki</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Finance
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Pregled plačanih projektov, avansov in odprtih zneskov.
          </p>
        </div>
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
      </section>

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
          value={formatCurrency(outstanding)}
          detail="Preostanek za plačilo"
          icon={WalletCards}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart projects={filteredProjects} />

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4">
            <p className="eyebrow">Izterjava</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Neplačani projekti
            </h2>
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
