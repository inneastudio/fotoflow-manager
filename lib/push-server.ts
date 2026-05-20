import webpush from "web-push";
import type { PushSubscriptionRecord } from "@/lib/types";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:info@inneastudio.si";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function isPushConfigured() {
  return Boolean(publicKey && privateKey);
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: { title: string; body: string; url: string }
) {
  if (!isPushConfigured()) {
    throw new Error("Push obvestila niso nastavljena.");
  }

  return webpush.sendNotification(
    subscription.subscription,
    JSON.stringify(payload)
  );
}
