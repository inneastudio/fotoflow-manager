"use client";

import Link from "next/link";
import { CircleDollarSign, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusBadge } from "@/components/status-badge";
import { useProjects } from "@/lib/use-projects";
import {
  formatCurrency,
  formatDate,
  getMonthlyRevenue,
  getOutstandingAmount
} from "@/lib/utils";

export default function FinancePage() {
  const { projects, loading } = useProjects();

  const totalRevenue = projects
    .filter((project) => project.payment_status === "Plačano")
    .reduce((sum, project) => sum + project.amount, 0);
  const deposits = projects.reduce((sum, project) => sum + project.deposit, 0);
  const outstanding = getOutstandingAmount(projects);
  const monthlyRevenue = getMonthlyRevenue(projects);

  const unpaidProjects = projects
    .filter((project) => project.payment_status !== "Plačano")
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Plačila in prihodki</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
          Finance
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Pregled plačanih projektov, avansov in odprtih zneskov.
        </p>
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
        <RevenueChart projects={projects} />

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
                      <p className="font-semibold text-ink">{project.client_name}</p>
                      <p className="mt-1 text-sm text-muted">
                        Rok oddaje: {formatDate(project.delivery_due)}
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
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid gap-3 p-4 transition hover:bg-white/50 md:grid-cols-[1fr_0.5fr_0.5fr_0.5fr]"
            >
              <div>
                <p className="font-semibold text-ink">{project.client_name}</p>
                <p className="mt-1 text-sm text-muted">{project.shoot_type}</p>
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
