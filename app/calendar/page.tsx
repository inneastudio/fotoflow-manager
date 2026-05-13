"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Project } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { formatDate, formatShortDate, sortByDateDesc } from "@/lib/utils";

const weekDays = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];

type CalendarEvent = {
  date: string;
  type: "shoot" | "due";
  project: Project;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export default function CalendarPage() {
  const { projects, loading } = useProjects();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();

    return [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        return new Date(month.getFullYear(), month.getMonth(), index + 1);
      })
    ];
  }, [month]);

  const upcoming = sortByDateDesc(projects, "shoot_date")
    .filter((project) => new Date(project.shoot_date) >= new Date(new Date().toDateString()))
    .reverse()
    .slice(0, 6);

  const monthEvents = useMemo(() => {
    const monthStart = dateKey(month);
    const monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));

    return projects
      .flatMap((project) => {
        const events: CalendarEvent[] = [];
        if (project.shoot_date >= monthStart && project.shoot_date <= monthEnd) {
          events.push({ date: project.shoot_date, type: "shoot", project });
        }
        if (project.delivery_due >= monthStart && project.delivery_due <= monthEnd) {
          events.push({ date: project.delivery_due, type: "due", project });
        }
        return events;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.type !== b.type) return a.type === "shoot" ? -1 : 1;
        return (a.project.shoot_time || "").localeCompare(b.project.shoot_time || "");
      });
  }, [month, projects]);

  const agendaGroups = useMemo(() => {
    return monthEvents.reduce<Array<{ date: string; events: CalendarEvent[] }>>(
      (groups, event) => {
        const lastGroup = groups.at(-1);
        if (lastGroup?.date === event.date) {
          lastGroup.events.push(event);
        } else {
          groups.push({ date: event.date, events: [event] });
        }
        return groups;
      },
      []
    );
  }, [monthEvents]);

  function eventsForDay(day: Date) {
    const key = dateKey(day);
    return projects.flatMap((project) => {
      const events: Array<{ type: "shoot" | "due"; project: Project }> = [];
      if (project.shoot_date === key) events.push({ type: "shoot", project });
      if (project.delivery_due === key) events.push({ type: "due", project });
      return events;
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Deadlinei in fotografiranja</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Koledar
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Mesečni pregled terminov in deadlineov.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="button-secondary h-10 w-10 p-0"
            onClick={() =>
              setMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1)
              )
            }
            aria-label="Prejšnji mesec"
            title="Prejšnji mesec"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="button-secondary h-10 w-10 p-0"
            onClick={() =>
              setMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1)
              )
            }
            aria-label="Naslednji mesec"
            title="Naslednji mesec"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.38fr]">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold capitalize text-ink">
              {monthLabel(month)}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-clay" />
                Fotografiranje
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-olive" />
                Deadline
              </span>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="h-28 animate-pulse rounded-lg bg-mist/70" />
            ) : agendaGroups.length ? (
              agendaGroups.map((group) => (
                <div
                  key={group.date}
                  className="rounded-lg border border-line bg-white/55 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-clay" />
                      <p className="font-semibold text-ink">
                        {formatDate(group.date, { weekday: "short" })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      {group.events.length}{" "}
                      {group.events.length === 1 ? "vnos" : "vnosi"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.events.map((event) => (
                      <Link
                        key={`${event.type}-${event.project.id}-${event.date}`}
                        href={`/projects/${event.project.id}`}
                        className="block rounded-lg border border-line bg-paper/80 p-3 transition hover:border-clay/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {event.project.project_name ||
                                event.project.client_name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                              {event.type === "shoot" ? (
                                <span className="inline-flex items-center gap-1 text-clay">
                                  <Camera className="h-3.5 w-3.5" />
                                  Foto
                                  {event.project.shoot_time
                                    ? ` ob ${event.project.shoot_time}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-olive">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Deadline
                                </span>
                              )}
                              {event.project.location ? (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {event.project.location}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <StatusBadge className="shrink-0">
                            {event.project.workflow_status}
                          </StatusBadge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
                Ta mesec ni fotografiranj ali deadlineov.
              </p>
            )}
          </div>

          <div className="hidden grid-cols-7 gap-2 md:grid">
            {weekDays.map((day) => (
              <div key={day} className="px-2 pb-2 text-center text-xs font-semibold text-muted">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const events = day ? eventsForDay(day) : [];
              const isToday = day ? dateKey(day) === dateKey(new Date()) : false;

              return (
                <div
                  key={day ? dateKey(day) : `empty-${index}`}
                  className="min-h-28 rounded-lg border border-line bg-white/50 p-2"
                >
                  {day ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className={
                            isToday
                              ? "grid h-7 w-7 place-items-center rounded-lg bg-ink text-xs font-semibold text-paper"
                              : "text-xs font-semibold text-muted"
                          }
                        >
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {events.slice(0, 3).map((event) => (
                          <Link
                            key={`${event.type}-${event.project.id}`}
                            href={`/projects/${event.project.id}`}
                            className="block truncate rounded-md border border-transparent bg-paper/80 px-2 py-1 text-[11px] font-medium text-ink hover:border-clay/30"
                          >
                            <span
                              className={
                                event.type === "shoot" ? "text-clay" : "text-olive"
                              }
                            >
                              {event.type === "shoot" ? "Foto" : "Deadline"}
                            </span>{" "}
                            {event.type === "shoot" && event.project.shoot_time
                              ? `${event.project.shoot_time} · `
                              : ""}
                            {event.project.project_name || event.project.client_name}
                          </Link>
                        ))}
                        {events.length > 3 ? (
                          <p className="px-2 text-[11px] text-muted">
                            +{events.length - 3} več
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="surface rounded-lg p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Naslednje</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  Fotografiranja
                </h2>
              </div>
              <Camera className="h-5 w-5 text-clay" />
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="h-24 animate-pulse rounded-lg bg-mist/70" />
              ) : upcoming.length ? (
                upcoming.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-line bg-white/60 p-3 hover:border-clay/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          {project.project_name || project.client_name}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatShortDate(project.shoot_date)}
                          {project.shoot_time ? ` ob ${project.shoot_time}` : ""} ·{" "}
                          {project.location}
                        </p>
                      </div>
                      <StatusBadge>{project.workflow_status}</StatusBadge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-line bg-white/60 p-3 text-sm text-muted">
                  Ni prihajajočih terminov.
                </p>
              )}
            </div>
          </div>

          <div className="surface rounded-lg p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock3 className="h-4 w-4 text-clay" />
              Najbližji deadline
            </div>
            {projects.length ? (
              <p className="mt-3 text-sm text-muted">
                {formatDate(
                  [...projects].sort(
                    (a, b) =>
                      new Date(a.delivery_due).getTime() -
                      new Date(b.delivery_due).getTime()
                  )[0].delivery_due
                )}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">Ni vpisanih deadlineov.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
