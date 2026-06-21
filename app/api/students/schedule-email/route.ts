import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendResendEmail } from "@/lib/email-server";

type EmailShift = {
  dateLabel: string;
  start_time: string;
  end_time: string;
  work_type: string;
  location: string;
  notes: string;
};

type StudentScheduleEmailRequest = {
  weekLabel: string;
  students: Array<{
    name: string;
    email: string;
    shifts: EmailShift[];
  }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderShift(shift: EmailShift) {
  return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(shift.dateLabel)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(shift.start_time)}-${escapeHtml(shift.end_time)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(shift.work_type)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(shift.location || "-")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(shift.notes || "")}</td>
    </tr>
  `;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    let confirmationEmail = process.env.RESEND_REPLY_TO_EMAIL || "";

    if (supabaseUrl && supabaseAnonKey) {
      if (!token) {
        return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { authorization: `Bearer ${token}` } }
      });
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Prijava ni veljavna." }, { status: 401 });
      }

      confirmationEmail = data.user.email || confirmationEmail;
    }

    const body = (await request.json()) as StudentScheduleEmailRequest;
    const students = body.students.filter((student) => student.email && student.shifts.length);

    if (!students.length) {
      return NextResponse.json(
        { error: "Ni študentov z emailom in izmenami za ta teden." },
        { status: 400 }
      );
    }

    const results = [];

    for (const student of students) {
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;color:#1f1d1b;line-height:1.5;">
          <h1 style="margin:0 0 8px;font-size:24px;">Urnik za ${escapeHtml(body.weekLabel)}</h1>
          <p style="margin:0 0 18px;color:#6f6a64;">Živjo ${escapeHtml(student.name)}, spodaj je tvoj urnik za izbrani teden.</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f6f3ee;text-align:left;">
                <th style="padding:10px 12px;">Dan</th>
                <th style="padding:10px 12px;">Ura</th>
                <th style="padding:10px 12px;">Delo</th>
                <th style="padding:10px 12px;">Lokacija</th>
                <th style="padding:10px 12px;">Opomba</th>
              </tr>
            </thead>
            <tbody>${student.shifts.map(renderShift).join("")}</tbody>
          </table>
          <p style="margin:18px 0 0;color:#6f6a64;">Če kaj ne štima, prosim sporoči čim prej.</p>
        </div>
      `;
      const text = `Urnik za ${body.weekLabel}\n\n${student.shifts
        .map(
          (shift) =>
            `${shift.dateLabel}: ${shift.start_time}-${shift.end_time}, ${shift.work_type}, ${shift.location}`
        )
        .join("\n")}`;

      results.push(
        await sendResendEmail({
          to: student.email,
          subject: `Urnik za ${body.weekLabel}`,
          html,
          text
        })
      );
    }

    if (confirmationEmail) {
      const totalShifts = students.reduce((sum, student) => sum + student.shifts.length, 0);
      const sentRows = students
        .map(
          (student) =>
            `<li><strong>${escapeHtml(student.name)}</strong> (${escapeHtml(student.email)}): ${student.shifts.length} izmen</li>`
        )
        .join("");

      await sendResendEmail({
        to: confirmationEmail,
        subject: `Potrditev: urnik poslan za ${body.weekLabel}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;color:#1f1d1b;line-height:1.5;">
            <h1 style="margin:0 0 8px;font-size:24px;">Urnik je bil poslan</h1>
            <p style="margin:0 0 14px;color:#6f6a64;">Teden: ${escapeHtml(body.weekLabel)}</p>
            <p style="margin:0 0 14px;">Poslano študentom: <strong>${students.length}</strong><br />Skupaj poslanih izmen: <strong>${totalShifts}</strong></p>
            <ul style="margin:0;padding-left:20px;">${sentRows}</ul>
          </div>
        `,
        text: `Urnik je bil poslan za ${body.weekLabel}. Poslano študentom: ${students.length}. Skupaj izmen: ${totalShifts}.`
      });
    }

    return NextResponse.json({ sent: results.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pošiljanje urnika ni uspelo." },
      { status: 500 }
    );
  }
}
