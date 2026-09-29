import type { StudioTask } from "./types";

export function studioTaskDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function buildStudioTaskReminder(tasks: StudioTask[], date = new Date()) {
  const today = studioTaskDate(date);
  const priorities = { Visoka: 0, Normalna: 1, Nizka: 2 };
  const openTasks = tasks
    .filter((task) => task.task_date === today && task.status === "Odprto")
    .sort((a, b) => priorities[a.priority] - priorities[b.priority] || a.created_at.localeCompare(b.created_at));
  if (!openTasks.length) return null;

  const examples = openTasks.slice(0, 3).map((task) => {
    const title = task.title.replace(/\s+/g, " ").trim();
    return `${task.assignee ?? "Nedodeljeno"}: ${title.length > 70 ? `${title.slice(0, 67)}...` : title}`;
  });
  const extra = openTasks.length - examples.length;

  return {
    title: `FotoFlow: opravila danes (${openTasks.length})`,
    body: `${examples.join(" · ")}${extra ? ` · +${extra}` : ""}`,
    url: "/tasks"
  };
}
