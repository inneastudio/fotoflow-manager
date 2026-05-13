"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Images,
  TrendingUp,
  UserRound
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { useProjects } from "@/lib/use-projects";
import { formatCurrency } from "@/lib/utils";

const chartColors = ["#0071e3", "#a97055", "#6f7d57", "#b45a5a", "#2b211c", "#8e8e93"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", { month: "short" }).format(date);
}

export default function StatisticsPage() {
  const { projects, loading } = useProjects();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = monthKey(now);
    const completed = projects.filter((project) => project.workflow_status === "Zaključeno");
    const paid = projects.filter((project) => project.payment_status === "Plačano");
    const thisMonth = projects.filter((project) => {
      return monthKey(new Date(project.shoot_date)) === currentMonth;
    });
    const averageValue = projects.length
      ? projects.reduce((sum, project) => sum + project.amount, 0) / projects.length
      : 0;

    return {
      total: projects.length,
      thisMonth: thisMonth.length,
      completed: completed.length,
      paidRevenue: paid.reduce((sum, project) => sum + project.amount, 0),
      averageValue
    };
  }, [projects]);

  const monthlyShoots = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = monthKey(date);
      const count = projects.filter((project) => {
        return monthKey(new Date(project.shoot_date)) === key;
      }).length;

      return { month: monthLabel(date), fotografiranja: count };
    });
  }, [projects]);

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      counts.set(String(project.shoot_type), (counts.get(String(project.shoot_type)) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [projects]);

  const byPhotographer = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      counts.set(project.photographer, (counts.get(project.photographer) ?? 0) + 1);
    });

    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [projects]);

  const workflowCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      counts.set(project.workflow_status, (counts.get(project.workflow_status) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-mist/70" />;
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Pregled studia</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
          Statistika
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Pregled količine fotografiranj, tipov projektov, fotografov in statusov.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Vsa fotografiranja"
          value={String(stats.total)}
          detail="Vsi vpisani projekti"
          icon={Camera}
          tone="charcoal"
        />
        <MetricCard
          label="Ta mesec"
          value={String(stats.thisMonth)}
          detail="Po datumu fotografiranja"
          icon={TrendingUp}
          tone="clay"
        />
        <MetricCard
          label="Zaključeno"
          value={String(stats.completed)}
          detail="Končani workflowi"
          icon={CheckCircle2}
          tone="olive"
        />
        <MetricCard
          label="Plačano"
          value={formatCurrency(stats.paidRevenue)}
          detail="Skupaj plačani projekti"
          icon={CircleDollarSign}
          tone="olive"
        />
        <MetricCard
          label="Povprečje"
          value={formatCurrency(stats.averageValue)}
          detail="Povprečna vrednost projekta"
          icon={Images}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartPanel title="Fotografiranja po mesecih" eyebrow="Trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyShoots} margin={{ left: 0, right: 10, top: 12, bottom: 0 }}>
              <CartesianGrid stroke="#d2d2d7" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={34} />
              <Tooltip cursor={{ fill: "rgba(0, 113, 227, 0.08)" }} />
              <Bar dataKey="fotografiranja" radius={[8, 8, 0, 0]} fill="#0071e3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Po fotografu" eyebrow="Ekipa">
          {byPhotographer.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byPhotographer}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {byPhotographer.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5">
            <p className="eyebrow">Tipi</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Najpogostejša fotografiranja
            </h2>
          </div>
          <div className="space-y-3">
            {byType.length ? (
              byType.map((item, index) => (
                <StatRow
                  key={item.name}
                  label={item.name}
                  value={item.value}
                  max={Math.max(...byType.map((type) => type.value))}
                  color={chartColors[index % chartColors.length]}
                />
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
                Ni še dovolj projektov za statistiko.
              </p>
            )}
          </div>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Statusi projektov
            </h2>
          </div>
          <div className="space-y-3">
            {workflowCounts.length ? (
              workflowCounts.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/60 p-3"
                >
                  <StatusBadge>{item.name}</StatusBadge>
                  <span className="font-display text-2xl font-semibold text-ink">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
                Ni še vpisanih statusov.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ChartPanel({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <div className="mb-5 flex items-center gap-2">
        <UserRound className="h-5 w-5 text-clay" />
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
        </div>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  max,
  color
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max ? Math.max((value / max) * 100, 5) : 0;

  return (
    <div className="rounded-lg border border-line bg-white/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{label}</p>
        <p className="font-display text-xl font-semibold">{value}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-line bg-white/60 text-sm text-muted">
      Ni podatkov za prikaz.
    </div>
  );
}
