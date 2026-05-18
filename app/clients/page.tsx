"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Mail, Phone, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Project } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { formatCurrency, formatDate, sortByDateDesc } from "@/lib/utils";

type ClientSummary = {
  name: string;
  email: string;
  phone: string;
  projects: Project[];
  total: number;
  outstanding: number;
  latest: Project;
};

export default function ClientsPage() {
  const { projects, loading } = useProjects();
  const [query, setQuery] = useState("");

  const clients = useMemo<ClientSummary[]>(() => {
    const grouped = new Map<string, Project[]>();

    projects.forEach((project) => {
      const key = project.email || project.client_name;
      grouped.set(key, [...(grouped.get(key) ?? []), project]);
    });

    return Array.from(grouped.values())
      .map((clientProjects) => {
        const sorted = sortByDateDesc(clientProjects);
        const latest = sorted[0];

        return {
          name: latest.client_name,
          email: latest.email,
          phone: latest.phone,
          projects: sorted,
          total: clientProjects.reduce((sum, project) => sum + project.amount, 0),
          outstanding: clientProjects.reduce(
            (sum, project) => sum + project.balance,
            0
          ),
          latest
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "sl"));
  }, [projects]);

  const filteredClients = clients.filter((client) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [client.name, client.email, client.phone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="CRM"
        title="Stranke"
        description="Kontaktni pregled strank in njihovih projektov."
        actions={
        <div className="surface rounded-lg px-4 py-3">
          <p className="text-sm text-muted">Skupaj strank</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {clients.length}
          </p>
        </div>
        }
      />

      <section className="surface rounded-lg p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Išči stranko, email ali telefon"
          />
        </label>
      </section>

      {loading ? (
        <div className="surface overflow-hidden rounded-lg">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse border-b border-line last:border-b-0"
            />
          ))}
        </div>
      ) : filteredClients.length ? (
        <section className="surface overflow-hidden rounded-lg">
          <div className="hidden grid-cols-[minmax(220px,1.2fr)_minmax(220px,1fr)_minmax(220px,1fr)_90px_120px_120px_44px] gap-4 border-b border-line bg-mist/45 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted lg:grid">
            <span>Stranka</span>
            <span>Kontakt</span>
            <span>Zadnji projekt</span>
            <span>Projekti</span>
            <span>Skupaj</span>
            <span>Odprto</span>
            <span />
          </div>

          <div className="divide-y divide-line">
            {filteredClients.map((client) => (
              <article
                key={client.email || client.name}
                className="grid gap-3 px-4 py-4 transition hover:bg-mist/35 lg:grid-cols-[minmax(220px,1.2fr)_minmax(220px,1fr)_minmax(220px,1fr)_90px_120px_120px_44px] lg:items-center"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold text-ink">
                    {client.name}
                  </h2>
                  <div className="mt-1 lg:hidden">
                    <StatusBadge>{client.latest.workflow_status}</StatusBadge>
                  </div>
                </div>

                <div className="grid min-w-0 gap-1 text-sm text-muted">
                  <a
                    className="flex min-w-0 items-center gap-2 hover:text-ink"
                    href={`mailto:${client.email}`}
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.email || "Email ni dodan"}</span>
                  </a>
                  <a
                    className="flex min-w-0 items-center gap-2 hover:text-ink"
                    href={`tel:${client.phone}`}
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.phone || "Telefon ni dodan"}</span>
                  </a>
                </div>

                <div className="min-w-0 text-sm">
                  <p className="truncate font-semibold text-ink">
                    {client.latest.project_name || client.latest.shoot_type}
                  </p>
                  <p className="mt-1 truncate text-muted">
                    {client.latest.shoot_type} · {formatDate(client.latest.shoot_date)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm lg:block">
                  <span className="text-muted lg:hidden">Projekti</span>
                  <span className="font-semibold text-ink">{client.projects.length}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm lg:block">
                  <span className="text-muted lg:hidden">Skupaj</span>
                  <span className="font-semibold text-ink">
                    {formatCurrency(client.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm lg:block">
                  <span className="text-muted lg:hidden">Odprto</span>
                  <span className="font-semibold text-ink">
                    {formatCurrency(client.outstanding)}
                  </span>
                </div>

                <Link
                  href={`/projects/${client.latest.id}`}
                  className="button-secondary h-10 w-full p-0 lg:w-10"
                  aria-label="Odpri zadnji projekt"
                  title="Odpri zadnji projekt"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="lg:sr-only">Odpri zadnji projekt</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="surface rounded-lg p-8 text-center">
          <p className="font-display text-2xl font-semibold">Ni najdenih strank</p>
          <p className="mt-2 text-sm text-muted">Poskusi z drugim iskalnim nizom.</p>
        </section>
      )}
    </div>
  );
}
