import type { Database } from "@/lib/database.types";
import { isEmailConfigured, sendResendEmail } from "@/lib/email-server";
import {
  defaultShootReminderEmailHtml,
  defaultShootReminderEmailSubject,
  defaultShootReminderEmailText
} from "@/lib/use-studio-settings";
import { formatDate } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

function toLjubljanaDateValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getTomorrowDateValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLjubljanaDateValue(tomorrow);
}

function replaceVariables(template: string, project: {
  client_name: string;
  shoot_type: string;
  shoot_date: string;
  shoot_time: string;
  location: string;
}) {
  const values: Record<string, string> = {
    ime_stranke: project.client_name,
    tip_fotografiranja: project.shoot_type,
    datum_fotografiranja: formatDate(project.shoot_date),
    ura_fotografiranja: project.shoot_time || "ura po dogovoru",
    lokacija: project.location || "lokacija po dogovoru"
  };

  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{${key}}`, value),
    template
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildReminderEmail(project: {
  client_name: string;
  shoot_type: string;
  shoot_date: string;
  shoot_time: string;
  location: string;
}, template: {
  subject: string;
  html: string;
  text: string;
}) {
  const title = replaceVariables(template.subject, project);
  const htmlContent = replaceVariables(template.html, project);
  const text = replaceVariables(template.text, project);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#171717;max-width:640px;margin:0 auto;padding:24px">
      <p style="font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:#777">FIORA</p>
      <h1 style="font-size:28px;line-height:1.15;margin:8px 0 16px">${escapeHtml(title)}</h1>
      ${htmlContent}
    </div>
  `;

  return { subject: title, html, text };
}

async function loadEmailTemplate(admin: SupabaseClient<Database>, userId: string | null | undefined) {
  if (!userId) {
    return {
      subject: defaultShootReminderEmailSubject,
      html: defaultShootReminderEmailHtml,
      text: defaultShootReminderEmailText
    };
  }

  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", "studio_settings")
    .maybeSingle();
  const value = data?.value as {
    shootReminderEmailSubject?: string;
    shootReminderEmailHtml?: string;
    shootReminderEmailText?: string;
  } | null | undefined;

  return {
    subject: value?.shootReminderEmailSubject || defaultShootReminderEmailSubject,
    html: value?.shootReminderEmailHtml || defaultShootReminderEmailHtml,
    text: value?.shootReminderEmailText || defaultShootReminderEmailText
  };
}

export async function sendShootReminderEmails(
  admin: SupabaseClient<Database>
) {
  if (!isEmailConfigured()) {
    return { sent: 0, failed: 0, skipped: true };
  }

  const tomorrow = getTomorrowDateValue();
  const { data: projects, error } = await admin
    .from("projects")
    .select("*")
    .eq("shoot_date", tomorrow)
    .is("shoot_reminder_sent_at", null)
    .not("email", "is", null)
    .neq("email", "");

  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  const templates = new Map<string, Awaited<ReturnType<typeof loadEmailTemplate>>>();

  await Promise.all(
    (projects ?? []).map(async (project) => {
      const templateKey = project.user_id ?? "default";
      let template = templates.get(templateKey);
      if (!template) {
        template = await loadEmailTemplate(admin, project.user_id);
        templates.set(templateKey, template);
      }
      const email = buildReminderEmail(project, template);

      try {
        await sendResendEmail({
          to: project.email,
          subject: email.subject,
          html: email.html,
          text: email.text
        });
        sent += 1;

        await admin
          .from("projects")
          .update({ shoot_reminder_sent_at: new Date().toISOString() })
          .eq("id", project.id);
      } catch {
        failed += 1;
      }
    })
  );

  return { sent, failed, skipped: false };
}
