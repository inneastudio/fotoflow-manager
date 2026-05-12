import { clsx, type ClassValue } from "clsx";
import type { PaymentStatus, Project, WorkflowStatus } from "@/lib/types";
import { workflowStatuses } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Ni določeno";

  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export function isSameDay(dateA: string | Date, dateB: string | Date) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function calculateBalance(amount: number, deposit: number) {
  return Math.max(Number(amount || 0) - Number(deposit || 0), 0);
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addBusinessDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  const totalDays = Math.max(Number(days || 0), 0);
  let added = 0;

  if (!dateValue || Number.isNaN(date.getTime())) {
    return toDateInputValue(new Date());
  }

  while (added < totalDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }

  return toDateInputValue(date);
}

export function getBusinessDaysBetween(startValue: string, endValue: string) {
  const start = new Date(`${startValue}T12:00:00`);
  const end = new Date(`${endValue}T12:00:00`);

  if (!startValue || !endValue || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  if (end <= start) return 0;

  let count = 0;
  const cursor = new Date(start);

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }

  return count;
}

export function getNextWorkflowStatus(status: WorkflowStatus) {
  const index = workflowStatuses.indexOf(status);
  return workflowStatuses[Math.min(index + 1, workflowStatuses.length - 1)];
}

export function getStatusProgress(status: WorkflowStatus) {
  const index = workflowStatuses.indexOf(status);
  return Math.round(((index + 1) / workflowStatuses.length) * 100);
}

export function paymentTone(status: PaymentStatus) {
  if (status === "Plačano") return "bg-olive/10 text-olive border-olive/20";
  if (status === "Delno plačano") return "bg-clay/10 text-clay border-clay/20";
  return "bg-rose/10 text-rose border-rose/25";
}

export function workflowTone(status: WorkflowStatus) {
  if (["Poslano", "Plačano", "Zaključeno"].includes(status)) {
    return "bg-olive/10 text-olive border-olive/20";
  }

  if (["Urejanje", "Izbor prejet", "Izbor poslan"].includes(status)) {
    return "bg-clay/10 text-clay border-clay/20";
  }

  return "bg-charcoal/10 text-charcoal border-charcoal/20";
}

export function getMonthlyRevenue(projects: Project[], date = new Date()) {
  return projects
    .filter((project) => {
      const paidAt = new Date(project.updated_at || project.shoot_date);
      return (
        project.payment_status === "Plačano" &&
        paidAt.getMonth() === date.getMonth() &&
        paidAt.getFullYear() === date.getFullYear()
      );
    })
    .reduce((total, project) => total + project.amount, 0);
}

export function getOutstandingAmount(projects: Project[]) {
  return projects
    .filter((project) => project.payment_status !== "Plačano")
    .reduce((total, project) => total + project.balance, 0);
}

export function getRevenueSeries(projects: Project[]) {
  const now = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const value = projects
      .filter((project) => {
        const projectDate = new Date(project.updated_at || project.shoot_date);
        return (
          project.payment_status === "Plačano" &&
          projectDate.getMonth() === date.getMonth() &&
          projectDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, project) => sum + project.amount, 0);

    return {
      month: new Intl.DateTimeFormat("sl-SI", { month: "short" }).format(date),
      prihodki: value
    };
  });
}

export function sortByDateDesc(projects: Project[], key: keyof Project = "updated_at") {
  return [...projects].sort((a, b) => {
    return new Date(String(b[key])).getTime() - new Date(String(a[key])).getTime();
  });
}
