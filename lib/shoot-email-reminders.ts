import type { Database } from "@/lib/database.types";
import { isEmailConfigured, sendResendEmail } from "@/lib/email-server";
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
}) {
  const title = String(project.shoot_type).toLowerCase().includes("poroka")
    ? "Opomnik za poročno fotografiranje"
    : `Opomnik za fotografiranje: ${project.shoot_type}`;
  const time = project.shoot_time || "ura po dogovoru";
  const location = project.location || "lokacija po dogovoru";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#171717;max-width:640px;margin:0 auto;padding:24px">
      <p style="font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:#777">INNEA STUDIO</p>
      <h1 style="font-size:28px;line-height:1.15;margin:8px 0 16px">${escapeHtml(title)}</h1>
      <p>Živjo ${escapeHtml(project.client_name)},</p>
      <p>jutri imamo rezerviran termin za <strong>${escapeHtml(project.shoot_type)}</strong>.</p>
      <div style="border:1px solid #e5e5ea;border-radius:14px;padding:16px;margin:20px 0;background:#fafafa">
        <p style="margin:0"><strong>Datum:</strong> ${escapeHtml(formatDate(project.shoot_date))}</p>
        <p style="margin:6px 0 0"><strong>Ura:</strong> ${escapeHtml(time)}</p>
        <p style="margin:6px 0 0"><strong>Lokacija:</strong> ${escapeHtml(location)}</p>
      </div>
      <h2 style="font-size:18px;margin-top:24px">Kratka priprava</h2>
      <ul>
        <li>pridi nekaj minut prej, da začnemo sproščeno,</li>
        <li>oblačila naj bodo pripravljena in zlikana,</li>
        <li>izberi barve brez močnih napisov in velikih vzorcev,</li>
        <li>če imaš inspiracijo ali posebne želje, jih lahko pošlješ v odgovor na ta email,</li>
        <li>za zunanje fotografiranje spremljamo vreme in se po potrebi uskladimo.</li>
      </ul>
      <p>Se vidimo kmalu,<br/>INNEA STUDIO</p>
    </div>
  `;

  const text = `Živjo ${project.client_name},

jutri imamo rezerviran termin za ${project.shoot_type}.

Datum: ${formatDate(project.shoot_date)}
Ura: ${time}
Lokacija: ${location}

Kratka priprava:
- pridi nekaj minut prej,
- oblačila naj bodo pripravljena in zlikana,
- izberi barve brez močnih napisov in velikih vzorcev,
- če imaš posebne želje, jih lahko pošlješ v odgovor na ta email.

Se vidimo kmalu,
INNEA STUDIO`;

  return { subject: title, html, text };
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

  await Promise.all(
    (projects ?? []).map(async (project) => {
      const email = buildReminderEmail(project);

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
