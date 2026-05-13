"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, Phone, Search, UserRound } from "lucide-react";
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
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">CRM</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Stranke
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Kontaktni pregled strank in njihovih projektov.
          </p>
        </div>
        <div className="surface rounded-lg px-4 py-3">
          <p className="text-sm text-muted">Skupaj strank</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {clients.length}
          </p>
        </div>
      </section>

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
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-lg bg-mist/70" />
          ))}
        </div>
      ) : filteredClients.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredClients.map((client) => (
            <article key={client.email || client.name} className="surface rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-paper">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-semibold text-ink">
                      {client.name}
                    </h2>
                <p className="mt-1 text-sm text-muted">
                  Zadnji projekt:{" "}
                  {client.latest.project_name || client.latest.shoot_type} ·{" "}
                  {formatDate(client.latest.shoot_date)}
                </p>
                  </div>
                </div>
                <StatusBadge>{client.latest.workflow_status}</StatusBadge>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-muted">
                <a className="flex items-center gap-2 hover:text-clay" href={`mailto:${client.email}`}>
                  <Mail className="h-4 w-4 text-clay" />
                  <span className="truncate">{client.email || "Email ni dodan"}</span>
                </a>
                <a className="flex items-center gap-2 hover:text-clay" href={`tel:${client.phone}`}>
                  <Phone className="h-4 w-4 text-clay" />
                  <span>{client.phone || "Telefon ni dodan"}</span>
                </a>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-white/50 p-3 text-sm">
                <div>
                  <p className="text-muted">Projekti</p>
                  <p className="mt-1 font-semibold text-ink">{client.projects.length}</p>
                </div>
                <div>
                  <p className="text-muted">Skupaj</p>
                  <p className="mt-1 font-semibold text-ink">
                    {formatCurrency(client.total)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Odprto</p>
                  <p className="mt-1 font-semibold text-ink">
                    {formatCurrency(client.outstanding)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted">{client.latest.shoot_type}</p>
                <Link href={`/projects/${client.latest.id}`} className="button-secondary py-1.5">
                  Odpri zadnji projekt
                </Link>
              </div>
            </article>
          ))}
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
