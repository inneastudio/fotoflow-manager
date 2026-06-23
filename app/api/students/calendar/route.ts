import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function cleanTime(value: string) {
  return value.slice(0, 5);
}

function toIcsDateTime(date: string, time: string) {
  return `${date.replaceAll("-", "")}T${cleanTime(time).replace(":", "")}00`;
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function foldIcsLine(line: string) {
  if (line.length <= 74) return line;

  const chunks = [];
  let current = line;
  while (current.length > 74) {
    chunks.push(current.slice(0, 74));
    current = current.slice(74);
  }
  chunks.push(current);
  return chunks.map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`)).join("\r\n");
}

export async function GET(request: Request) {
  const configuredToken = process.env.STUDENT_CALENDAR_TOKEN;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const userId = url.searchParams.get("user");

  if (!configuredToken || token !== configuredToken || !userId) {
    return NextResponse.json({ error: "Calendar feed ni veljaven." }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase service role ni nastavljen." },
      { status: 500 }
    );
  }

  const admin = supabaseAdmin;
  const [{ data: students, error: studentsError }, { data: shifts, error: shiftsError }] =
    await Promise.all([
      admin.from("students").select("id,name,email").eq("user_id", userId),
      admin
        .from("student_shifts")
        .select("*")
        .eq("user_id", userId)
        .order("shift_date", { ascending: true })
        .order("start_time", { ascending: true })
    ]);

  if (studentsError || shiftsError) {
    return NextResponse.json(
      { error: studentsError?.message ?? shiftsError?.message ?? "Napaka pri urniku." },
      { status: 500 }
    );
  }

  const studentsById = new Map(
    (students ?? []).map((student) => [
      student.id,
      {
        name: student.name || "Študent",
        email: student.email || ""
      }
    ])
  );
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FotoFlow Manager//Student Schedule//SL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FotoFlow urnik študentov",
    "X-WR-TIMEZONE:Europe/Ljubljana"
  ];

  for (const shift of shifts ?? []) {
    const student = studentsById.get(shift.student_id);
    const studentName = student?.name ?? "Študent";
    const summary = `Izmena: ${studentName} - ${shift.work_type}`;
    const description = [
      `Študent: ${studentName}`,
      student?.email ? `Email: ${student.email}` : "",
      `Delo: ${shift.work_type}`,
      `Ura: ${cleanTime(shift.start_time)}-${cleanTime(shift.end_time)}`,
      shift.location ? `Lokacija: ${shift.location}` : "",
      shift.notes ? `Opombe: ${shift.notes}` : "",
      `Obračun: ${shift.hours} h / ${shift.amount} EUR`,
      `Status: ${shift.billing_status}`
    ]
      .filter(Boolean)
      .join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:student-shift-${shift.id}@fotoflow-manager`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Ljubljana:${toIcsDateTime(shift.shift_date, shift.start_time)}`,
      `DTEND;TZID=Europe/Ljubljana:${toIcsDateTime(shift.shift_date, shift.end_time)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `LOCATION:${escapeIcs(shift.location || "Studio")}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LAST-MODIFIED:${new Date(shift.updated_at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.map(foldIcsLine).join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
