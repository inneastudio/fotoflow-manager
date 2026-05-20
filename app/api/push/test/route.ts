import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase service role ni nastavljen." },
      { status: 500 }
    );
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Manjka prijava." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Prijava ni veljavna." }, { status: 401 });
  }

  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json(
      { error: "Najprej dovoli obvestila na tej napravi." },
      { status: 400 }
    );
  }

  await Promise.all(
    subscriptions.map((subscription) =>
      sendPushNotification(subscription, {
        title: "FotoFlow test",
        body: "Potisna obvestila so pripravljena.",
        url: "/projects"
      })
    )
  );

  return NextResponse.json({ sent: subscriptions.length });
}
