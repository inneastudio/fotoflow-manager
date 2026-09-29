import { NextResponse } from "next/server";
import { buildReminderSummary } from "@/lib/reminder-summary";
import { sendShootReminderEmails } from "@/lib/shoot-email-reminders";
import { sendPushNotification } from "@/lib/push-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildStudioTaskReminder, studioTaskDate } from "@/lib/studio-task-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase service role ni nastavljen." },
      { status: 500 }
    );
  }
  const admin = supabaseAdmin;
  // Email delivery must not prevent the independent push reminders.
  const emailReminders = await sendShootReminderEmails(admin).catch(() => ({
    error: "Pošiljanje e-poštnih opomnikov ni uspelo."
  }));
  const now = new Date();

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("*");

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  const userIds = Array.from(
    new Set((subscriptions ?? []).map((subscription) => subscription.user_id).filter(Boolean))
  ) as string[];

  if (!userIds.length) {
    return NextResponse.json({
      push: { sent: 0, users: 0 },
      email: emailReminders
    });
  }

  const { data: projects, error: projectError } = await admin
    .from("projects")
    .select("*")
    .in("user_id", userIds);

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  const { data: tasks, error: taskError } = await admin
    .from("studio_tasks")
    .select("*")
    .in("user_id", userIds)
    .eq("task_date", studioTaskDate(now))
    .eq("status", "Odprto");

  await Promise.all(
    userIds.map(async (userId) => {
      const userProjects = (projects ?? []).filter((project) => project.user_id === userId);
      const summaries = [
        buildReminderSummary(userProjects, now),
        buildStudioTaskReminder((tasks ?? []).filter((task) => task.user_id === userId), now)
      ].filter((summary) => summary !== null);
      if (!summaries.length) return;

      const userSubscriptions = (subscriptions ?? []).filter(
        (subscription) => subscription.user_id === userId
      );

      await Promise.all(
        userSubscriptions.map(async (subscription) => {
          for (const summary of summaries) {
            try {
              await sendPushNotification(subscription, summary);
              sent += 1;
            } catch (error) {
              failed += 1;
              const statusCode =
                typeof error === "object" && error && "statusCode" in error
                  ? Number((error as { statusCode?: number }).statusCode)
                  : 0;

              if (statusCode === 404 || statusCode === 410) {
                await admin
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", subscription.endpoint);
                break;
              }
            }
          }
        })
      );
    })
  );

  return NextResponse.json({
    push: { sent, failed, users: userIds.length },
    tasks: { error: taskError?.message ?? null },
    email: emailReminders
  });
}
