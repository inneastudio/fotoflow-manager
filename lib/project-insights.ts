import type { Project } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

export const editAndSendStatuses = [
  "Fotografirano",
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje"
];

export const savedOrLaterStatuses = [
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
];

export const selectionSentOrLaterStatuses = [
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
];

export const deliveredStatuses = ["Poslano", "Plačano", "Zaključeno"];

export type ReminderItem = {
  project: Project;
  label: string;
};

function projectDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function addDays(dateValue: string, days: number) {
  const date = projectDate(dateValue);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sortReminderItems(items: ReminderItem[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.project.shoot_date).getTime() -
      new Date(b.project.shoot_date).getTime()
  );
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getProjectReminders(projects: Project[], date = new Date()) {
  const todayValue = toDateOnly(date);
  const today = projectDate(todayValue);
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const openProjects = projects.filter(
    (project) => !deliveredStatuses.includes(String(project.workflow_status))
  );

  const todayShoots = projects
    .filter((project) => project.shoot_date === todayValue)
    .map((project) => ({
      project,
      label: project.shoot_time
        ? `Danes ob ${project.shoot_time}`
        : "Danes, ura ni določena"
    }));

  const deadlines = openProjects
    .filter((project) => {
      const due = projectDate(project.delivery_due);
      return due >= today && due <= threeDaysFromNow;
    })
    .map((project) => ({
      project,
      label: `Rok: ${formatShortDate(project.delivery_due)}`
    }));

  const unsaved = projects
    .filter((project) => {
      const shootDate = projectDate(project.shoot_date);
      return (
        shootDate <= today &&
        !savedOrLaterStatuses.includes(String(project.workflow_status))
      );
    })
    .map((project) => ({
      project,
      label: `Fotografirano: ${formatShortDate(project.shoot_date)}`
    }));

  const selectionLate = projects
    .filter((project) => {
      const shootDate = projectDate(project.shoot_date);
      const selectionDue = new Date(shootDate);
      selectionDue.setDate(selectionDue.getDate() + 2);

      return (
        today >= selectionDue &&
        savedOrLaterStatuses.includes(String(project.workflow_status)) &&
        !selectionSentOrLaterStatuses.includes(String(project.workflow_status))
      );
    })
    .map((project) => ({
      project,
      label: `Izbor do: ${formatShortDate(addDays(project.shoot_date, 2))}`
    }));

  const unpaidDeposits = projects
    .filter(
      (project) =>
        String(project.shoot_type).toLowerCase().includes("poroka") &&
        project.workflow_status === "Rezervirano" &&
        project.payment_status === "Neplačano" &&
        Number(project.deposit || 0) <= 0
    )
    .map((project) => ({
      project,
      label: `Termin: ${formatShortDate(project.shoot_date)}`
    }));

  return {
    todayShoots: sortReminderItems(todayShoots),
    deadlines: sortReminderItems(deadlines),
    unsaved: sortReminderItems(unsaved),
    selectionLate: sortReminderItems(selectionLate),
    unpaidDeposits: sortReminderItems(unpaidDeposits)
  };
}

export function countReminders(reminders: ReturnType<typeof getProjectReminders>) {
  return (
    reminders.todayShoots.length +
    reminders.deadlines.length +
    reminders.unsaved.length +
    reminders.selectionLate.length +
    reminders.unpaidDeposits.length
  );
}
