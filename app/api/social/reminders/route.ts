import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push-server";
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
  const admin = supabaseAdmin;
  const now = new Date();
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

  const { data: posts, error: postsError } = await admin
    .from("social_posts")
    .select("*")
    .eq("status", "Planirano")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  await Promise.all(
    (posts ?? []).map(async (post) => {
      if (!post.user_id) return;
      const { data: subscriptions } = await admin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", post.user_id);

      await Promise.all(
        (subscriptions ?? []).map(async (subscription) => {
          try {
            await sendPushNotification(subscription, {
              title: `FotoFlow: objava čez 30 minut`,
              body: `${post.platform}: ${post.title}`,
              url: "/social"
            });
            sent += 1;
          } catch {
            failed += 1;
          }
        })
      );

      await admin
        .from("social_posts")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", post.id);
    })
  );

  return NextResponse.json({ sent, failed, posts: posts?.length ?? 0 });
}
