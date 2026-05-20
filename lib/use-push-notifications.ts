"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

type PushState =
  | "unsupported"
  | "missing-key"
  | "signed-out"
  | "default"
  | "denied"
  | "enabled";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function supportsPush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function usePushNotifications() {
  const { user } = useAuth();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<PushState>("default");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = useMemo(() => supportsPush(), []);

  useEffect(() => {
    if (!supported) {
      setState("unsupported");
      return;
    }

    if (!publicKey) {
      setState("missing-key");
      return;
    }

    if (!user) {
      setState("signed-out");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        setState(subscription ? "enabled" : "default");
      })
      .catch(() => setState(Notification.permission === "granted" ? "default" : "default"));
  }, [publicKey, supported, user]);

  const enableNotifications = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      if (!supported) throw new Error("Ta brskalnik ne podpira potisnih obvestil.");
      if (!publicKey) throw new Error("Manjka VAPID public key v env nastavitvah.");
      if (!supabase || !user) throw new Error("Za opomnike moraš biti prijavljen.");

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("denied");
        throw new Error("Obvestila so blokirana v brskalniku.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      const subscriptionJson = subscription.toJSON();
      if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys.auth) {
        throw new Error("Telefon ni vrnil veljavne naročnine za obvestila.");
      }

      const { error: upsertError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription: {
            endpoint: subscriptionJson.endpoint,
            expirationTime: subscriptionJson.expirationTime ?? null,
            keys: {
              p256dh: subscriptionJson.keys.p256dh,
              auth: subscriptionJson.keys.auth
            }
          },
          user_agent: navigator.userAgent
        },
        { onConflict: "endpoint" }
      );

      if (upsertError) throw upsertError;
      setState("enabled");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Vklop obvestil ni uspel."
      );
    } finally {
      setSaving(false);
    }
  }, [publicKey, supported, user]);

  const sendTestNotification = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Za test moraš biti prijavljen.");
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Za test moraš biti prijavljen.");

      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Testno obvestilo ni uspelo.");
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Testno obvestilo ni uspelo."
      );
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    enableNotifications,
    sendTestNotification,
    error,
    saving,
    state
  };
}
