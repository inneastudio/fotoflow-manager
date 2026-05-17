"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarHeart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSignature,
  MapPin,
  MessageCircle,
  Timer
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Project } from "@/lib/types";
import { useProjects } from "@/lib/use-projects";
import { formatDate } from "@/lib/utils";

const weekDays = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];
const maxCalendarMonth = new Date(2027, 11, 1);

type WeddingEventType =
  | "wedding"
  | "meeting"
  | "timeline"
  | "contract"
  | "offer"
  | "deadline";

type WeddingCalendarEvent = {
  date: string;
  type: WeddingEventType;
  label: string;
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

function eventIcon(type: WeddingEventType) {
  if (type === "wedding") return Camera;
  if (type === "meeting") return MessageCircle;
  if (type === "timeline") return Timer;
  if (type === "contract") return FileSignature;
  return CalendarHeart;
}

function eventTone(type: WeddingEventType) {
  if (type === "wedding") return "text-clay";
  if (type === "meeting") return "text-rose";
  if (type === "timeline") return "text-olive";
  if (type === "contract") return "text-charcoal";
  return "text-muted";
}

function eventPillClass(type: WeddingEventType) {
  if (type === "wedding") return "border-clay/30 bg-clay/15 text-clay";
  if (type === "meeting") return "border-rose/30 bg-rose/15 text-rose";
  if (type === "timeline") return "border-olive/30 bg-olive/15 text-olive";
  if (type === "contract") return "border-charcoal/20 bg-charcoal/10 text-charcoal";
  if (type === "offer") return "border-line bg-mist text-ink";
  return "border-line bg-paper text-muted";
}

function eventDotClass(type: WeddingEventType) {
  if (type === "wedding") return "bg-clay";
  if (type === "meeting") return "bg-rose";
  if (type === "timeline") return "bg-olive";
  if (type === "contract") return "bg-charcoal";
  if (type === "offer") return "bg-ink";
  return "bg-muted";
}

function eventDetails(event: WeddingCalendarEvent) {
  return [
    `${event.label}: ${event.project.project_name || event.project.client_name}`,
    formatDate(event.date),
    event.type === "wedding" && event.project.shoot_time
      ? `Ura: ${event.project.shoot_time}`
      : "",
    event.project.location ? `Lokacija: ${event.project.location}` : "",
    `Status: ${event.project.workflow_status}`,
    event.project.wedding_package ? `Foto paket: ${event.project.wedding_package}` : "",
    event.project.wedding_video_enabled ? "Snemanje vključeno" : "",
    event.project.wedding_photobooth_enabled ? "Photobooth vključen" : ""
  ].filter(Boolean);
}

function canGoNext(month: Date) {
  return month < maxCalendarMonth;
}

function createWeddingEvents(project: Project, monthStart: string, monthEnd: string) {
  const events: WeddingCalendarEvent[] = [];
  const weddingDates = project.wedding_status_dates ?? {};

  function pushEvent(date: string | undefined, type: WeddingEventType, label: string) {
    if (!date || date < monthStart || date > monthEnd) return;
    events.push({ date, type, label, project });
  }

  pushEvent(project.shoot_date, "wedding", "Poroka");
  pushEvent(project.delivery_due, "deadline", "Deadline oddaje");
  pushEvent(weddingDates["Ponudba poslana"], "offer", "Ponudba poslana");
  pushEvent(weddingDates["Ponudba potrjena"], "offer", "Ponudba potrjena");
  pushEvent(weddingDates["Avansna pogodba poslana"], "contract", "Avansna pogodba");
  pushEvent(weddingDates["Pogodba poslana"], "contract", "Pogodba poslana");
  pushEvent(weddingDates["Pogodba podpisana"], "contract", "Pogodba podpisana");
  pushEvent(weddingDates.Sestanek, "meeting", "Sestanek");
  pushEvent(weddingDates["Časovnica"], "timeline", "Časovnica");

  return events;
}

export default function WeddingCalendarPage() {
  const { projects, loading } = useProjects();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const weddingProjects = useMemo(() => {
    return projects.filter((project) =>
      String(project.shoot_type).toLowerCase().includes("poroka")
    );
  }, [projects]);

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

  const monthEvents = useMemo(() => {
    const monthStart = dateKey(month);
    const monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));

    return weddingProjects
      .flatMap((project) => createWeddingEvents(project, monthStart, monthEnd))
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.type !== b.type) return a.type === "wedding" ? -1 : 1;
        return (a.project.shoot_time || "").localeCompare(b.project.shoot_time || "");
      });
  }, [month, weddingProjects]);

  const agendaGroups = useMemo(() => {
    return monthEvents.reduce<Array<{ date: string; events: WeddingCalendarEvent[] }>>(
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
    return monthEvents.filter((event) => event.date === key);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/weddings" className="button-ghost mb-4 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Poroke
          </Link>
          <p className="eyebrow">Poročni koledar</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Koledar porok
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Datumi porok, sestankov, pogodb, časovnic in deadlineov.
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
            disabled={!canGoNext(month)}
            aria-label="Naslednji mesec"
            title={canGoNext(month) ? "Naslednji mesec" : "Koledar je nastavljen do decembra 2027"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-semibold capitalize text-ink">
            {monthLabel(month)}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <LegendItem type="wedding" label="Poroka" />
            <LegendItem type="meeting" label="Sestanek" />
            <LegendItem type="contract" label="Pogodba" />
            <LegendItem type="timeline" label="Časovnica" />
            <LegendItem type="deadline" label="Deadline" />
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="h-28 animate-pulse rounded-lg bg-mist/70" />
          ) : agendaGroups.length ? (
            agendaGroups.map((group) => (
              <AgendaGroup key={group.date} date={group.date} events={group.events} />
            ))
          ) : (
            <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
              Ta mesec ni poročnih datumov.
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
                className="min-h-32 rounded-lg border border-line bg-white/50 p-2"
              >
                {day ? (
                  <>
                    <span
                      className={
                        isToday
                          ? "grid h-7 w-7 place-items-center rounded-lg bg-ink text-xs font-semibold text-paper"
                          : "text-xs font-semibold text-muted"
                      }
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-2 space-y-1">
                      {events.slice(0, 4).map((event) => (
                        <CalendarEventLink key={`${event.type}-${event.project.id}-${event.label}`} event={event} />
                      ))}
                      {events.length > 4 ? (
                        <p className="px-2 text-[11px] text-muted">
                          +{events.length - 4} več
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-4">
          <p className="eyebrow">Agenda</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Vsi poročni datumi v mesecu
          </h2>
        </div>
        <div className="space-y-3">
          {agendaGroups.length ? (
            agendaGroups.map((group) => (
              <AgendaGroup key={group.date} date={group.date} events={group.events} />
            ))
          ) : (
            <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
              Ni vpisanih poročnih datumov za ta mesec.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function AgendaGroup({
  date,
  events
}: {
  date: string;
  events: WeddingCalendarEvent[];
}) {
  return (
    <div className="rounded-lg border border-line bg-white/55 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-4 w-4 text-clay" />
          <p className="font-semibold text-ink">
            {formatDate(date, { weekday: "short" })}
          </p>
        </div>
        <span className="text-xs font-semibold text-muted">
          {events.length} {events.length === 1 ? "vnos" : "vnosi"}
        </span>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <Link
            key={`${event.type}-${event.project.id}-${event.label}`}
            href={`/projects/${event.project.id}`}
            className={`block rounded-lg border p-3 transition hover:border-clay/35 ${eventPillClass(event.type)}`}
            title={eventDetails(event).join("\n")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <EventIcon event={event} />
                  <p className="truncate font-semibold text-ink">
                    {event.label}: {event.project.project_name || event.project.client_name}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {event.type === "wedding" && event.project.shoot_time ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {event.project.shoot_time}
                    </span>
                  ) : null}
                  {event.project.location ? (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{event.project.location}</span>
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
  );
}

function CalendarEventLink({ event }: { event: WeddingCalendarEvent }) {
  const details = eventDetails(event);

  return (
    <Link
      href={`/projects/${event.project.id}`}
      className={`group relative block truncate rounded-md border px-2 py-1 text-[11px] font-semibold transition hover:z-20 hover:overflow-visible hover:shadow-soft ${eventPillClass(event.type)}`}
      title={details.join("\n")}
    >
      <span>{event.label}</span>{" "}
      <span className="font-medium">{event.project.project_name || event.project.client_name}</span>
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-lg border border-line bg-white p-3 text-left text-xs font-medium text-ink shadow-soft group-hover:block">
        {details.map((detail) => (
          <span key={detail} className="block whitespace-normal leading-5">
            {detail}
          </span>
        ))}
      </span>
    </Link>
  );
}

function EventIcon({ event }: { event: WeddingCalendarEvent }) {
  const Icon = eventIcon(event.type);
  return <Icon className={`h-4 w-4 shrink-0 ${eventTone(event.type)}`} />;
}

function LegendItem({ type, label }: { type: WeddingEventType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${eventDotClass(type)}`} />
      {label}
    </span>
  );
}
