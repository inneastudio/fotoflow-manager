import type { Project } from "@/lib/types";
import { getProjectReminders } from "@/lib/project-insights";
import { getProjectTitle } from "@/lib/utils";

export type ReminderSummary = {
  title: string;
  body: string;
  total: number;
  url: string;
};

function listTitles(projects: Project[], limit = 3) {
  const names = projects.slice(0, limit).map((project) => getProjectTitle(project));
  const extra = projects.length - names.length;

  if (!names.length) return "";
  return `${names.join(", ")}${extra > 0 ? ` +${extra}` : ""}`;
}

export function buildReminderSummary(projects: Project[], date = new Date()): ReminderSummary | null {
  const reminders = getProjectReminders(projects, date);
  const sections = [
    {
      label: "fotografiranje danes",
      count: reminders.todayShoots.length,
      projects: reminders.todayShoots.map((item) => item.project)
    },
    {
      label: "deadline do 3 dni",
      count: reminders.deadlines.length,
      projects: reminders.deadlines.map((item) => item.project)
    },
    {
      label: "ni shranjeno",
      count: reminders.unsaved.length,
      projects: reminders.unsaved.map((item) => item.project)
    },
    {
      label: "izbor za poslati",
      count: reminders.selectionLate.length,
      projects: reminders.selectionLate.map((item) => item.project)
    }
  ].filter((section) => section.count > 0);

  const total = sections.reduce((sum, section) => sum + section.count, 0);
  if (!total) return null;

  const firstWithProjects = sections.find((section) => section.projects.length);
  const headline = sections
    .map((section) => `${section.count} ${section.label}`)
    .join(" · ");
  const examples = firstWithProjects ? listTitles(firstWithProjects.projects) : "";

  return {
    title: `FotoFlow: ${total} opomnikov danes`,
    body: examples ? `${headline}. Prvo: ${examples}` : headline,
    total,
    url: "/projects"
  };
}
