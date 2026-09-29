import { NextResponse } from "next/server";
import { sendShootReminderEmails } from "@/lib/shoot-email-reminders";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase service role ni nastavljen." },
      { status: 500 }
    );
  }

  const email = await sendShootReminderEmails(supabaseAdmin);

  return NextResponse.json({ email });
}
