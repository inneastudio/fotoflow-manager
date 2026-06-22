"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clapperboard,
  Filter,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  Trash2,
  WalletCards
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PaymentMethodLabel } from "@/components/payment-method-label";
import { StatusBadge } from "@/components/status-badge";
import { useFinanceEntries } from "@/lib/use-finance-entries";
import { useFinanceSettings } from "@/lib/use-finance-settings";
import { useProjects } from "@/lib/use-projects";
import {
  paymentMethods,
  paymentStatuses,
  photographers,
  type PaymentMethod,
  type Project,
  type ProjectFormValues
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getProjectSubtitle,
  getProjectTitle
} from "@/lib/utils";

function monthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(value: string) {
  const [yearValue, monthPart] = value.split("-");
  const year = Number(yearValue);
  const month = Number(monthPart) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return { start, end, year, month };
}

function isWithinMonth(dateValue: string, selectedMonth: string) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const { year, month } = monthRange(selectedMonth);
  return date.getFullYear() === year && date.getMonth() === month;
}

function sumAmount(projects: Project[], key: "amount" | "deposit" | "balance" = "amount") {
  return projects.reduce((sum, project) => sum + Number(project[key] || 0), 0);
}

export default function FinancePage() {
  const { projects, loading, updateProject } = useProjects();
  const {
    entries: financeEntries,
    loading: financeEntriesLoading,
    error: financeEntriesError,
    createEntry,
    deleteEntry
  } = useFinanceEntries();
  const [photographerFilter, setPhotographerFilter] = useState("Vsi");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("Vsi");
  const [shootTypeFilter, setShootTypeFilter] = useState("Vsi");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("Vsi");
  const [selectedMonth, setSelectedMonth] = useState(monthValue());
  const [inkasoForm, setInkasoForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    title: "Osebni dokumenti",
    category: "Osebni dokumenti",
    payment_method: "Gotovina" as PaymentMethod,
    amount: 0,
    notes: ""
  });
  const [inkasoSaving, setInkasoSaving] = useState(false);
  const [inkasoError, setInkasoError] = useState<string | null>(null);
  const { monthlyRevenueGoal, updateFinanceSettings } = useFinanceSettings();
  const currentYear = new Date().getFullYear();
  const selectedMonthRange = monthRange(selectedMonth);

  function updateMonthlyGoal(value: number) {
    const normalizedValue = Math.max(Number(value || 0), 0);
    updateFinanceSettings((current) => ({
      ...current,
      monthlyRevenueGoal: normalizedValue
    }));
  }

  const photographerOptions = useMemo(() => {
    return Array.from(
      new Set([
        "Vsi",
        ...photographers,
        ...projects.map((project) => project.photographer).filter(Boolean)
      ])
    );
  }, [projects]);
  const shootTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(["Vsi", ...projects.map((project) => String(project.shoot_type)).filter(Boolean)])
      ),
    [projects]
  );
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesPhotographer =
        photographerFilter === "Vsi" || project.photographer === photographerFilter;
      const matchesPaymentMethod =
        paymentMethodFilter === "Vsi" || project.payment_method === paymentMethodFilter;
      const matchesShootType =
        shootTypeFilter === "Vsi" || String(project.shoot_type) === shootTypeFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "Vsi" || project.payment_status === paymentStatusFilter;

      return (
        matchesPhotographer &&
        matchesPaymentMethod &&
        matchesShootType &&
        matchesPaymentStatus
      );
    });
  }, [
    paymentMethodFilter,
    paymentStatusFilter,
    photographerFilter,
    projects,
    shootTypeFilter
  ]);

  const paidProjects = filteredProjects.filter(
    (project) => project.payment_status === "Plačano"
  );
  const includeInkaso =
    (paymentStatusFilter === "Vsi" || paymentStatusFilter === "Plačano") &&
    photographerFilter === "Vsi" &&
    shootTypeFilter === "Vsi";
  const filteredFinanceEntries = useMemo(() => {
    return financeEntries.filter((entry) => {
      const matchesPaymentMethod =
        paymentMethodFilter === "Vsi" || entry.payment_method === paymentMethodFilter;
      return matchesPaymentMethod;
    });
  }, [financeEntries, paymentMethodFilter]);
  const monthPaidProjects = paidProjects.filter((project) =>
    isWithinMonth(project.shoot_date, selectedMonth)
  );
  const monthFinanceEntries = includeInkaso
    ? filteredFinanceEntries.filter((entry) =>
        isWithinMonth(entry.entry_date, selectedMonth)
      )
    : [];
  const yearPaidProjects = paidProjects.filter((project) => {
    const date = new Date(project.shoot_date);
    return date.getFullYear() === currentYear;
  });
  const yearFinanceEntries = includeInkaso
    ? filteredFinanceEntries.filter((entry) => {
        const date = new Date(entry.entry_date);
        return date.getFullYear() === currentYear;
      })
    : [];
  const monthShootProjects = filteredProjects.filter((project) =>
    isWithinMonth(project.shoot_date, selectedMonth)
  );
  const totalRevenue = paidProjects
    .filter((project) => project.payment_status === "Plačano")
    .reduce((sum, project) => sum + project.amount, 0);
  const monthInkasoRevenue = monthFinanceEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0
  );
  const annualInkasoRevenue = yearFinanceEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0
  );
  const annualRevenue = sumAmount(yearPaidProjects) + annualInkasoRevenue;
  const monthlyRevenue = sumAmount(monthPaidProjects) + monthInkasoRevenue;
  const monthlyProjectedRevenue = sumAmount(monthShootProjects) + monthInkasoRevenue;
  const monthlyCashRevenue = sumAmount(
    monthPaidProjects.filter((project) => project.payment_method === "Gotovina")
  ) + monthFinanceEntries
    .filter((entry) => entry.payment_method === "Gotovina")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const monthlyBankRevenue = sumAmount(
    monthPaidProjects.filter((project) => project.payment_method === "TRR")
  ) + monthFinanceEntries
    .filter((entry) => entry.payment_method === "TRR")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const averagePaidProject = paidProjects.length
    ? Math.round(totalRevenue / paidProjects.length)
    : 0;
  const monthlyGoalProgress = monthlyRevenueGoal
    ? Math.min(Math.round((monthlyRevenue / monthlyRevenueGoal) * 100), 999)
    : 0;
  const monthlyGoalRemaining = Math.max(monthlyRevenueGoal - monthlyRevenue, 0);
  const monthlyProjectedGoalProgress = monthlyRevenueGoal
    ? Math.min(Math.round((monthlyProjectedRevenue / monthlyRevenueGoal) * 100), 999)
    : 0;
  const monthlyProjectedGoalRemaining = Math.max(
    monthlyRevenueGoal - monthlyProjectedRevenue,
    0
  );
  const isMonthOnPlan = monthlyRevenueGoal
    ? monthlyProjectedRevenue >= monthlyRevenueGoal
    : false;

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
  const monthShootTypeRows = Array.from(
    monthShootProjects.reduce((map, project) => {
      const type = String(project.shoot_type);
      const existing = map.get(type) ?? { count: 0, amount: 0, paid: 0 };
      map.set(type, {
        count: existing.count + 1,
        amount: existing.amount + Number(project.amount || 0),
        paid:
          existing.paid +
          (project.payment_status === "Plačano" ? Number(project.amount || 0) : 0)
      });
      return map;
    }, new Map<string, { count: number; amount: number; paid: number }>())
  ).sort((a, b) => b[1].amount - a[1].amount);
  const monthMethodRows = paymentMethods.map((method) => {
    const methodProjects = monthPaidProjects.filter(
      (project) => project.payment_method === method
    );
    const plannedMethodProjects = monthShootProjects.filter(
      (project) => project.payment_method === method
    );
    const methodEntries = monthFinanceEntries.filter(
      (entry) => entry.payment_method === method
    );
    const methodEntryAmount = methodEntries.reduce(
      (sum, entry) => sum + Number(entry.amount || 0),
      0
    );

    return {
      method,
      count: methodProjects.length + methodEntries.length,
      amount: sumAmount(methodProjects) + methodEntryAmount,
      planned: sumAmount(plannedMethodProjects) + methodEntryAmount
    };
  });

  async function toggleVideoProviderPaid(project: Project) {
    await updateProject(project.id, {
      ...toProjectFormValues(project),
      wedding_video_provider_paid: !project.wedding_video_provider_paid
    });
  }

  async function handleCreateInkaso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInkasoError(null);

    if (!inkasoForm.title.trim()) {
      setInkasoError("Dodaj opis inkasa.");
      return;
    }

    if (Number(inkasoForm.amount || 0) <= 0) {
      setInkasoError("Znesek mora biti večji od 0.");
      return;
    }

    setInkasoSaving(true);
    try {
      await createEntry(inkasoForm);
      setInkasoForm((current) => ({
        ...current,
        title: current.category,
        amount: 0,
        notes: ""
      }));
    } catch (error) {
      setInkasoError(error instanceof Error ? error.message : "Inkaso ni bil shranjen.");
    } finally {
      setInkasoSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Plačila in prihodki"
        title="Finance"
        description="Mesečno poročilo, letni promet, načini plačila in odprti računi."
      />

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-clay" />
          <div>
            <p className="eyebrow">Filtri</p>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Poročilo po projektih
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Mesec poročila</span>
            <input
              className="input"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Fotograf</span>
            <select
              className="input"
              value={photographerFilter}
              onChange={(event) => setPhotographerFilter(event.target.value)}
            >
              {photographerOptions.map((photographer) => (
                <option key={photographer} value={photographer}>
                  {photographer === "Vsi" ? "Vsi fotografi" : photographer}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Način plačila</span>
            <select
              className="input"
              value={paymentMethodFilter}
              onChange={(event) => setPaymentMethodFilter(event.target.value)}
            >
              <option value="Vsi">Gotovina + TRR</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Fotografiranje</span>
            <select
              className="input"
              value={shootTypeFilter}
              onChange={(event) => setShootTypeFilter(event.target.value)}
            >
              {shootTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "Vsi" ? "Vsi tipi" : type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Status plačila</span>
            <select
              className="input"
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
            >
              <option value="Vsi">Vsi statusi</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Plačano v mesecu"
          value={formatCurrency(monthlyRevenue)}
          detail={`${formatDate(selectedMonthRange.start.toISOString())} - ${formatDate(selectedMonthRange.end.toISOString())}`}
          icon={TrendingUp}
          tone="olive"
        />
        <MetricCard
          label="Vpisano v mesecu"
          value={formatCurrency(monthlyProjectedRevenue)}
          detail={
            monthlyRevenueGoal
              ? isMonthOnPlan
                ? `V planu: ${monthlyProjectedGoalProgress}% cilja`
                : `Do plana manjka ${formatCurrency(monthlyProjectedGoalRemaining)}`
              : `${monthShootProjects.length} fotografiranj · ${monthFinanceEntries.length} inkaso`
          }
          icon={Target}
          tone={isMonthOnPlan ? "olive" : "clay"}
        />
        <MetricCard
          label={`Tekoče leto ${currentYear}`}
          value={formatCurrency(annualRevenue)}
          detail="Vsa plačana fotografiranja v letu"
          icon={CircleDollarSign}
          tone="charcoal"
        />
        <MetricCard
          label="TRR / Gotovina"
          value={`${formatCurrency(monthlyBankRevenue)} / ${formatCurrency(monthlyCashRevenue)}`}
          detail="Plačano v izbranem mesecu"
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
                value={monthlyRevenueGoal}
                onChange={(event) => updateMonthlyGoal(Number(event.target.value))}
              />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Plačano</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ink">
                  {formatCurrency(monthlyRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Vpisano do konca</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ink">
                  {formatCurrency(monthlyProjectedRevenue)}
                </p>
              </div>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-mist">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-clay/30 transition-all"
                style={{
                  width: `${monthlyRevenueGoal ? Math.min(monthlyProjectedGoalProgress, 100) : 0}%`
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-clay transition-all"
                style={{
                  width: `${monthlyRevenueGoal ? Math.min(monthlyGoalProgress, 100) : 0}%`
                }}
              />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
              <p>
                Plačano{" "}
                <span className="font-semibold text-ink">
                  {monthlyRevenueGoal ? `${monthlyGoalProgress}%` : "ni cilja"}
                </span>
              </p>
              <p>
                Po vpisanih projektih{" "}
                <span className="font-semibold text-ink">
                  {monthlyRevenueGoal ? `${monthlyProjectedGoalProgress}%` : "ni cilja"}
                </span>
              </p>
              <p>
                {isMonthOnPlan ? "V planu" : "Do plana manjka"}{" "}
                <span className="font-semibold text-ink">
                  {isMonthOnPlan
                    ? formatCurrency(monthlyProjectedRevenue - monthlyRevenueGoal)
                    : formatCurrency(monthlyProjectedGoalRemaining)}
                </span>
              </p>
            </div>
            <p className="mt-3 text-sm text-muted">
              Povprečen plačan projekt{" "}
              <span className="font-semibold text-ink">
                {formatCurrency(averagePaidProject)}
              </span>
              . Za realizacijo še manjka{" "}
              <span className="font-semibold text-ink">
                {formatCurrency(monthlyGoalRemaining)}
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Inkaso</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Studio, osebni dokumenti in ostalo
            </h2>
            <p className="mt-2 text-sm text-muted">
              Vnosi se štejejo v mesečno poročilo, kadar sta fotograf in tip nastavljena
              na “vsi”.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white/70 px-3 py-2 text-sm font-semibold text-muted">
            Ta mesec: {formatCurrency(monthInkasoRevenue)}
          </div>
        </div>

        <form
          onSubmit={handleCreateInkaso}
          className="grid gap-3 lg:grid-cols-[150px_1fr_170px_150px_1fr_auto]"
        >
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Datum</span>
            <input
              className="input"
              type="date"
              value={inkasoForm.entry_date}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  entry_date: event.target.value
                }))
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Opis</span>
            <input
              className="input"
              value={inkasoForm.title}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  title: event.target.value
                }))
              }
              placeholder="npr. Osebni dokumenti"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Kategorija</span>
            <select
              className="input"
              value={inkasoForm.category}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  category: event.target.value,
                  title:
                    current.title === current.category || !current.title.trim()
                      ? event.target.value
                      : current.title
                }))
              }
            >
              {["Osebni dokumenti", "Studio", "Inkaso", "Ostalo"].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Način</span>
            <select
              className="input"
              value={inkasoForm.payment_method}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  payment_method: event.target.value as PaymentMethod
                }))
              }
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Znesek</span>
            <input
              className="input"
              min="0"
              step="1"
              type="number"
              value={inkasoForm.amount}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  amount: Number(event.target.value)
                }))
              }
            />
          </label>
          <button
            type="submit"
            className="button-primary self-end"
            disabled={inkasoSaving}
          >
            <Plus className="h-4 w-4" />
            Dodaj
          </button>
          <label className="space-y-1.5 lg:col-span-full">
            <span className="text-sm font-medium text-ink">Opomba</span>
            <input
              className="input"
              value={inkasoForm.notes}
              onChange={(event) =>
                setInkasoForm((current) => ({
                  ...current,
                  notes: event.target.value
                }))
              }
              placeholder="Opcijsko, npr. 4x dokumenti, gotovina ..."
            />
          </label>
        </form>

        {inkasoError || financeEntriesError ? (
          <p className="mt-3 rounded-lg border border-rose/20 bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
            {inkasoError || financeEntriesError}
          </p>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[110px_1fr_130px_130px_44px] gap-3 border-b border-line bg-paper px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <span>Datum</span>
            <span>Opis</span>
            <span>Način</span>
            <span className="text-right">Znesek</span>
            <span />
          </div>
          {financeEntriesLoading ? (
            <div className="h-16 animate-pulse bg-mist/70" />
          ) : monthFinanceEntries.length ? (
            monthFinanceEntries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[110px_1fr_130px_130px_44px] items-center gap-3 border-b border-line px-3 py-3 text-sm last:border-b-0"
              >
                <span className="text-muted">{formatDate(entry.entry_date)}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{entry.title}</p>
                  <p className="truncate text-xs text-muted">
                    {entry.category}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </div>
                <PaymentMethodLabel method={entry.payment_method} />
                <span className="text-right font-semibold text-ink">
                  {formatCurrency(entry.amount)}
                </span>
                <button
                  type="button"
                  className="button-ghost h-9 w-9 p-0 text-rose hover:text-rose"
                  onClick={() => deleteEntry(entry.id)}
                  aria-label="Izbriši inkaso"
                  title="Izbriši"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="p-3 text-sm text-muted">
              V izbranem mesecu ni inkaso vnosov za trenutne filtre.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Mesečno poročilo</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {formatDate(selectedMonthRange.start.toISOString(), {
                  month: "long",
                  year: "numeric"
                })}
              </h2>
              <p className="mt-2 text-sm text-muted">
                Prihodki in fotografiranja so razporejeni po datumu fotografiranja.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white/70 px-3 py-2 text-sm font-semibold text-muted">
              {monthPaidProjects.length} plačanih · {monthShootProjects.length} terminov
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {monthMethodRows.map((row) => (
              <div key={row.method} className="rounded-lg border border-line bg-white/65 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">Način plačila</p>
                    <PaymentMethodLabel method={row.method} className="mt-1 font-semibold" />
                  </div>
                  <p className="font-display text-2xl font-semibold text-ink">
                    {formatCurrency(row.amount)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {row.count} plačanih vnosov · vpisano{" "}
                  <span className="font-semibold text-ink">
                    {formatCurrency(row.planned)}
                  </span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_90px_120px_120px] gap-3 border-b border-line bg-paper px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <span>Tip fotografiranja</span>
              <span className="text-right">Termini</span>
              <span className="text-right">Vrednost</span>
              <span className="text-right">Plačano</span>
            </div>
            {monthShootTypeRows.length ? (
              monthShootTypeRows.map(([type, row]) => (
                <div
                  key={type}
                  className="grid grid-cols-[1fr_90px_120px_120px] gap-3 border-b border-line px-3 py-3 text-sm last:border-b-0"
                >
                  <span className="font-semibold text-ink">{type}</span>
                  <span className="text-right text-muted">{row.count}</span>
                  <span className="text-right font-semibold text-ink">
                    {formatCurrency(row.amount)}
                  </span>
                  <span className="text-right font-semibold text-ink">
                    {formatCurrency(row.paid)}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-3 text-sm text-muted">
                V izbranem mesecu ni fotografiranj za trenutne filtre.
              </p>
            )}
          </div>
        </div>

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
                        {getProjectTitle(project)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {getProjectSubtitle(project)}
                      </p>
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
                    {getProjectTitle(project)}
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
                  {getProjectTitle(project)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {getProjectSubtitle(project)}
                </p>
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
    wedding_extra_hours: Number(project.wedding_extra_hours ?? 0),
    wedding_extra_hour_price: Number(project.wedding_extra_hour_price ?? 90),
    wedding_video_enabled: Boolean(project.wedding_video_enabled),
    wedding_video_package: project.wedding_video_package ?? "",
    wedding_video_price: Number(project.wedding_video_price ?? 0),
    wedding_video_provider_paid: Boolean(project.wedding_video_provider_paid),
    wedding_photobooth_enabled: Boolean(project.wedding_photobooth_enabled),
    wedding_photobooth_package: project.wedding_photobooth_package ?? "",
    wedding_photobooth_price: Number(project.wedding_photobooth_price ?? 0),
    wedding_album_size: project.wedding_album_size ?? "",
    wedding_album_shape: project.wedding_album_shape ?? "",
    wedding_album_pages: Number(project.wedding_album_pages ?? 0),
    wedding_album_wishes: project.wedding_album_wishes ?? "",
    wedding_album_inscription: project.wedding_album_inscription ?? "",
    wedding_album_notes: project.wedding_album_notes ?? ""
  };
}
