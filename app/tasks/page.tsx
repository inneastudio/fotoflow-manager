"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Circle,
  ClipboardList,
  Plus,
  Trash2
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import {
  studioTaskPriorities,
  type StudioTask,
  type StudioTaskPriority
} from "@/lib/types";
import {
  useStudioTasks,
  type StudioTaskFormValues
} from "@/lib/use-studio-tasks";
import { cn, formatDate, toDateInputValue } from "@/lib/utils";

function monthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDays(month: string) {
  if (!month) return [];
  const [year, monthPart] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthPart, 0).getDate();

  return Array.from({ length: daysInMonth }).map(
    (_, index) => new Date(year, monthPart - 1, index + 1, 12)
  );
}

function isWithinMonth(dateValue: string, month: string) {
  if (!dateValue || !month) return false;
  const [year, monthPart] = month.split("-").map(Number);
  const date = new Date(`${dateValue}T12:00:00`);
  return date.getFullYear() === year && date.getMonth() === monthPart - 1;
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", { weekday: "short" }).format(date);
}

function monthTitle(month: string) {
  if (!month) return "Izbran mesec";
  const [year, monthPart] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("sl-SI", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, monthPart - 1, 1));
}

function priorityTone(priority: StudioTaskPriority) {
  if (priority === "Visoka") return "border-rose/25 bg-rose/10 text-rose";
  if (priority === "Nizka") return "border-olive/25 bg-olive/10 text-olive";
  return "border-clay/25 bg-clay/10 text-clay";
}

const today = new Date().toISOString().slice(0, 10);

const emptyForm: StudioTaskFormValues = {
  task_date: today,
  title: "",
  description: "",
  priority: "Normalna",
  status: "Odprto"
};

export default function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useStudioTasks();
  const [selectedMonth, setSelectedMonth] = useState(monthValue());
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<StudioTaskFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const days = useMemo(() => monthDays(selectedMonth), [selectedMonth]);
  const monthTasks = useMemo(
    () => tasks.filter((task) => isWithinMonth(task.task_date, selectedMonth)),
    [selectedMonth, tasks]
  );
  const selectedDateTasks = useMemo(
    () => tasks.filter((task) => task.task_date === selectedDate),
    [selectedDate, tasks]
  );
  const todayTasks = tasks.filter((task) => task.task_date === today);
  const openMonthTasks = monthTasks.filter((task) => task.status !== "Opravljeno");
  const doneMonthTasks = monthTasks.filter((task) => task.status === "Opravljeno");

  const tasksByDate = useMemo(() => {
    return monthTasks.reduce((map, task) => {
      const current = map.get(task.task_date) ?? [];
      map.set(task.task_date, [...current, task]);
      return map;
    }, new Map<string, StudioTask[]>());
  }, [monthTasks]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Dodaj naslov opravila.");
      return;
    }

    setSaving(true);
    try {
      await createTask({
        ...form,
        task_date: selectedDate,
        status: "Odprto"
      });
      setForm((current) => ({
        ...emptyForm,
        task_date: selectedDate,
        priority: current.priority
      }));
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Opravila trenutno ne morem shraniti."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: StudioTask) {
    await updateTask(task.id, {
      task_date: task.task_date,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status === "Opravljeno" ? "Odprto" : "Opravljeno"
    });
  }

  function selectDate(dateValue: string) {
    setSelectedDate(dateValue);
    setForm((current) => ({ ...current, task_date: dateValue }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan dela"
        title="Opravila po dnevih"
        description="Mesečni pregled nalog, ki jih je treba urediti po posameznih dnevih."
        actions={
          <a href="#novo-opravilo" className="button-primary">
            <Plus className="h-4 w-4" />
            Dodaj opravilo
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Danes"
          value={String(todayTasks.length)}
          detail="Opravila za današnji dan"
          icon={CalendarCheck2}
          tone="clay"
        />
        <MetricCard
          label="Ta mesec"
          value={String(monthTasks.length)}
          detail={monthTitle(selectedMonth)}
          icon={ClipboardList}
          tone="charcoal"
        />
        <MetricCard
          label="Odprto"
          value={String(openMonthTasks.length)}
          detail="Še ni označeno kot opravljeno"
          icon={Circle}
          tone="rose"
        />
        <MetricCard
          label="Opravljeno"
          value={String(doneMonthTasks.length)}
          detail="Zaključeno v izbranem mesecu"
          icon={CheckCircle2}
          tone="olive"
        />
      </section>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Mesec</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {monthTitle(selectedMonth)}
            </h2>
          </div>
          <label className="w-full max-w-xs space-y-1.5">
            <span className="text-sm font-medium text-ink">Izberi mesec</span>
            <input
              className="input"
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                const nextDate = `${event.target.value}-01`;
                selectDate(nextDate);
              }}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const dateValue = toDateInputValue(day);
            const dayTasks = tasksByDate.get(dateValue) ?? [];
            const openCount = dayTasks.filter((task) => task.status !== "Opravljeno").length;
            const doneCount = dayTasks.length - openCount;
            const selected = dateValue === selectedDate;

            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => selectDate(dateValue)}
                className={cn(
                  "min-h-28 rounded-lg border p-3 text-left transition",
                  selected
                    ? "border-ink bg-ink text-white shadow-card"
                    : "border-line bg-white/70 hover:border-clay/40 hover:bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn("text-xs font-semibold uppercase", selected ? "text-white/70" : "text-muted")}>
                      {weekdayLabel(day)}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {day.getDate()}
                    </p>
                  </div>
                  {dayTasks.length ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        selected ? "bg-white/15 text-white" : "bg-mist text-muted"
                      )}
                    >
                      {dayTasks.length}
                    </span>
                  ) : null}
                </div>
                <div className={cn("mt-4 text-xs", selected ? "text-white/75" : "text-muted")}>
                  {dayTasks.length ? (
                    <>
                      <span>{openCount} odprto</span>
                      <span className="mx-1">·</span>
                      <span>{doneCount} opravljeno</span>
                    </>
                  ) : (
                    "Brez opravil"
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div id="novo-opravilo" className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4">
            <p className="eyebrow">Nov vnos</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Dodaj opravilo
            </h2>
            <p className="mt-2 text-sm text-muted">
              Izbrani datum: {formatDate(selectedDate)}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Datum</span>
              <input
                className="input"
                type="date"
                value={selectedDate}
                onChange={(event) => selectDate(event.target.value)}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Naslov opravila</span>
              <input
                className="input"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="npr. Pripraviti galerijo, naročiti album ..."
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Prioriteta</span>
              <select
                className="input"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as StudioTaskPriority
                  }))
                }
              >
                {studioTaskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Opis</span>
              <textarea
                className="input min-h-28"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Opcijsko: kaj točno je treba narediti ..."
              />
            </label>

            {formError ? (
              <p className="rounded-lg border border-rose/20 bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
                {formError}
              </p>
            ) : null}

            <button className="button-primary w-full justify-center" disabled={saving} type="submit">
              <Plus className="h-4 w-4" />
              {saving ? "Shranjujem ..." : "Dodaj opravilo"}
            </button>
          </form>
        </div>

        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Dnevni seznam</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                {formatDate(selectedDate)}
              </h2>
            </div>
            <span className="rounded-lg border border-line bg-white/70 px-3 py-2 text-sm font-semibold text-muted">
              {selectedDateTasks.length} opravil
            </span>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-mist/70" />
          ) : error ? (
            <p className="rounded-lg border border-rose/20 bg-rose/10 p-3 text-sm font-medium text-rose">
              {error}
            </p>
          ) : selectedDateTasks.length ? (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <article
                  key={task.id}
                  className={cn(
                    "rounded-lg border p-3 transition",
                    task.status === "Opravljeno"
                      ? "border-line bg-mist/50"
                      : "border-line bg-white/70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                        task.status === "Opravljeno"
                          ? "border-olive/25 bg-olive/10 text-olive"
                          : "border-line bg-white text-muted hover:border-clay"
                      )}
                      onClick={() => toggleTask(task)}
                      aria-label="Označi opravilo"
                      title="Označi opravilo"
                    >
                      {task.status === "Opravljeno" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p
                            className={cn(
                              "font-semibold text-ink",
                              task.status === "Opravljeno" && "text-muted line-through"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              priorityTone(task.priority)
                            )}
                          >
                            {task.priority}
                          </span>
                          <button
                            type="button"
                            className="button-ghost h-8 w-8 p-0 text-rose hover:text-rose"
                            onClick={() => deleteTask(task.id)}
                            aria-label="Izbriši opravilo"
                            title="Izbriši"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-white/60 p-4 text-sm text-muted">
              Za ta dan še ni vpisanih opravil.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
