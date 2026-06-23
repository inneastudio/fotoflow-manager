import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    new URL(request.url).origin
  );
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const calendarToken = process.env.STUDENT_CALENDAR_TOKEN;

  if (!calendarToken) {
    return NextResponse.json(
      { error: "Manjka STUDENT_CALENDAR_TOKEN v Vercel env nastavitvah." },
      { status: 500 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase service role ni nastavljen." },
      { status: 500 }
    );
  }

  if (!token) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Prijava ni veljavna." }, { status: 401 });
  }

  const url = new URL("/api/students/calendar", getBaseUrl(request));
  url.searchParams.set("user", data.user.id);
  url.searchParams.set("token", calendarToken);

  return NextResponse.json({ url: url.toString() });
}
