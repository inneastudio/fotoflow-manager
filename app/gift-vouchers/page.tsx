"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Gift, Search, TicketCheck, Trash2, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { giftVoucherStatuses, type GiftVoucher, type GiftVoucherStatus } from "@/lib/types";
import { useGiftVouchers, type GiftVoucherFormValues } from "@/lib/use-gift-vouchers";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const emptyForm: GiftVoucherFormValues = {
  serial_number: "",
  buyer_name: "",
  recipient_name: "",
  value: 0,
  issue_date: new Date().toISOString().slice(0, 10),
  expiry_date: "",
  status: "Aktiven",
  notes: ""
};

function statusTone(status: GiftVoucherStatus) {
  if (status === "Unovčen") return "border-olive/25 bg-olive/10 text-olive";
  if (status === "Potekel") return "border-rose/25 bg-rose/10 text-rose";
  return "border-clay/25 bg-clay/10 text-clay";
}

function isExpired(voucher: GiftVoucher) {
  if (!voucher.expiry_date || voucher.status !== "Aktiven") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(voucher.expiry_date) < today;
}

export default function GiftVouchersPage() {
  const { vouchers, loading, error, createVoucher, updateVoucher, deleteVoucher } =
    useGiftVouchers();
  const [form, setForm] = useState<GiftVoucherFormValues>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GiftVoucherStatus | "Vsi">("Vsi");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const decoratedVouchers = useMemo(
    () =>
      vouchers.map((voucher) => ({
        ...voucher,
        displayStatus: isExpired(voucher) ? "Potekel" : voucher.status
      })),
    [vouchers]
  );

  const filteredVouchers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return decoratedVouchers.filter((voucher) => {
      const matchesStatus = statusFilter === "Vsi" || voucher.displayStatus === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        voucher.serial_number.toLowerCase().includes(normalizedQuery) ||
        voucher.buyer_name.toLowerCase().includes(normalizedQuery) ||
        voucher.recipient_name.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [decoratedVouchers, query, statusFilter]);

  const activeVouchers = decoratedVouchers.filter((voucher) => voucher.displayStatus === "Aktiven");
  const redeemedVouchers = decoratedVouchers.filter(
    (voucher) => voucher.displayStatus === "Unovčen"
  );
  const activeValue = activeVouchers.reduce((sum, voucher) => sum + voucher.value, 0);
  const totalValue = decoratedVouchers.reduce((sum, voucher) => sum + voucher.value, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.serial_number.trim() || !form.buyer_name.trim()) {
      setFormError("Vpiši vsaj zaporedno številko in naročnika.");
      return;
    }

    setSaving(true);

    try {
      await createVoucher(form);
      setForm({ ...emptyForm, issue_date: new Date().toISOString().slice(0, 10) });
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Bona trenutno ne morem shraniti."
      );
    } finally {
      setSaving(false);
    }
  }

  async function setVoucherStatus(voucher: GiftVoucher, status: GiftVoucherStatus) {
    await updateVoucher(voucher.id, {
      serial_number: voucher.serial_number,
      buyer_name: voucher.buyer_name,
      recipient_name: voucher.recipient_name,
      value: voucher.value,
      issue_date: voucher.issue_date,
      expiry_date: voucher.expiry_date ?? "",
      status,
      notes: voucher.notes
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Darilni boni"
        title="Seznam darilnih bonov"
        description="Vodi izdane bone, vrednosti, zaporedne številke in stanje unovčenja."
        actions={
          <a href="#nov-bon" className="button-primary">
            <Gift className="h-4 w-4" />
            Dodaj bon
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Aktivni boni"
          value={String(activeVouchers.length)}
          detail="Boni, ki še niso unovčeni"
          icon={Gift}
          tone="olive"
        />
        <MetricCard
          label="Vrednost aktivnih"
          value={formatCurrency(activeValue)}
          detail="Odprta vrednost bonov"
          icon={WalletCards}
          tone="clay"
        />
        <MetricCard
          label="Unovčeni"
          value={String(redeemedVouchers.length)}
          detail="Že uporabljeni boni"
          icon={TicketCheck}
          tone="charcoal"
        />
        <MetricCard
          label="Skupaj izdano"
          value={formatCurrency(totalValue)}
          detail="Vrednost vseh vpisanih bonov"
          icon={WalletCards}
          tone="rose"
        />
      </section>

      <section id="nov-bon" className="surface rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Nov vnos</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Dodaj darilni bon</h2>
          </div>
          <Gift className="h-5 w-5 text-muted" />
        </div>

        <form className="mt-5 grid gap-4 lg:grid-cols-12" onSubmit={handleSubmit}>
          <label className="lg:col-span-3">
            <span className="label">Zaporedna številka</span>
            <input
              className="input mt-2"
              value={form.serial_number}
              onChange={(event) => setForm((current) => ({ ...current, serial_number: event.target.value }))}
              placeholder="BON-2026-001"
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Naročnik</span>
            <input
              className="input mt-2"
              value={form.buyer_name}
              onChange={(event) => setForm((current) => ({ ...current, buyer_name: event.target.value }))}
              placeholder="Ime in priimek"
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Prejemnik</span>
            <input
              className="input mt-2"
              value={form.recipient_name}
              onChange={(event) => setForm((current) => ({ ...current, recipient_name: event.target.value }))}
              placeholder="Opcijsko"
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Vrednost bona</span>
            <input
              className="input mt-2"
              type="number"
              min="0"
              step="1"
              value={form.value}
              onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))}
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Datum izdaje</span>
            <input
              className="input mt-2"
              type="date"
              value={form.issue_date}
              onChange={(event) => setForm((current) => ({ ...current, issue_date: event.target.value }))}
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Velja do</span>
            <input
              className="input mt-2"
              type="date"
              value={form.expiry_date}
              onChange={(event) => setForm((current) => ({ ...current, expiry_date: event.target.value }))}
            />
          </label>
          <label className="lg:col-span-3">
            <span className="label">Status</span>
            <select
              className="input mt-2"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as GiftVoucherStatus
                }))
              }
            >
              {giftVoucherStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-3">
            <span className="label">Opombe</span>
            <input
              className="input mt-2"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Npr. družinsko fotografiranje"
            />
          </label>

          {formError ? (
            <p className="rounded-lg border border-rose/20 bg-rose/10 px-4 py-3 text-sm font-medium text-rose lg:col-span-9">
              {formError}
            </p>
          ) : null}

          <div className="flex items-end justify-end lg:col-span-3">
            <button className="button-primary w-full justify-center" disabled={saving}>
              {saving ? "Shranjujem ..." : "Shrani bon"}
            </button>
          </div>
        </form>
      </section>

      <section className="surface rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Pregled</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Vsi darilni boni</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Išči po naročniku ali številki"
              />
            </label>
            <select
              className="input sm:w-44"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as GiftVoucherStatus | "Vsi")}
            >
              <option>Vsi</option>
              {giftVoucherStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose/20 bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
            {error}
          </p>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          <div className="hidden grid-cols-[1.15fr_1.35fr_1fr_0.9fr_0.9fr_0.9fr_1.25fr] gap-3 border-b border-line bg-mist px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:grid">
            <span>Številka</span>
            <span>Naročnik</span>
            <span>Prejemnik</span>
            <span>Izdano</span>
            <span>Velja do</span>
            <span>Vrednost</span>
            <span className="text-right">Status</span>
          </div>

          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Nalagam bone ...</p>
          ) : filteredVouchers.length ? (
            <div className="divide-y divide-line">
              {filteredVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[1.15fr_1.35fr_1fr_0.9fr_0.9fr_0.9fr_1.25fr] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Številka
                    </p>
                    <p className="font-semibold text-ink">{voucher.serial_number}</p>
                    {voucher.notes ? (
                      <p className="mt-1 text-xs text-muted lg:hidden">{voucher.notes}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Naročnik
                    </p>
                    <p className="font-medium text-ink">{voucher.buyer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Prejemnik
                    </p>
                    <p className="text-sm text-muted">{voucher.recipient_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Izdano
                    </p>
                    <p className="text-sm font-medium text-ink">{formatDate(voucher.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Velja do
                    </p>
                    <p className="text-sm text-muted">
                      {voucher.expiry_date ? formatDate(voucher.expiry_date) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted lg:hidden">
                      Vrednost
                    </p>
                    <p className="font-semibold text-ink">{formatCurrency(voucher.value)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        statusTone(voucher.displayStatus as GiftVoucherStatus)
                      )}
                    >
                      {voucher.displayStatus}
                    </span>
                    {voucher.displayStatus !== "Unovčen" ? (
                      <button
                        className="button-secondary px-3 py-2 text-xs"
                        onClick={() => setVoucherStatus(voucher, "Unovčen")}
                        type="button"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Unovči
                      </button>
                    ) : (
                      <button
                        className="button-secondary px-3 py-2 text-xs"
                        onClick={() => setVoucherStatus(voucher, "Aktiven")}
                        type="button"
                      >
                        Aktiviraj
                      </button>
                    )}
                    <button
                      className="button-secondary px-3 py-2 text-rose"
                      onClick={() => deleteVoucher(voucher.id)}
                      type="button"
                      aria-label={`Izbriši bon ${voucher.serial_number}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Ni še vpisanih bonov za izbrane filtre.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
