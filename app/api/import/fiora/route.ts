import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/database.types";
import type { PaymentMethod, PaymentStatus, Photographer } from "@/lib/types";

export const dynamic = "force-dynamic";

type FioraImportPayload = {
  source?: string;
  sourceBookingId?: string;
  projectName?: string;
  clientName?: string;
  clientAddress?: string;
  email?: string;
  phone?: string;
  shootType?: string;
  shootDate?: string | null;
  shootTime?: string;
  location?: string;
  workflowStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  photographer?: string;
  amount?: number;
  deposit?: number;
  deliveryWorkdays?: number;
  selectedPhotos?: number;
  notes?: string;
  retouchNotes?: string;
};

const paymentStatuses: PaymentStatus[] = ["Neplačano", "Delno plačano", "Plačano"];
const paymentMethods: PaymentMethod[] = ["Gotovina", "TRR"];
const photographers: Photographer[] = ["Žan", "Teja", "Žan in Teja"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(number, 0) : 0;
}

function oneOf<T extends string>(value: unknown, options: T[], fallback: T) {
  const cleanValue = stringValue(value);
  return options.includes(cleanValue as T) ? (cleanValue as T) : fallback;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function addBusinessDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  let added = 0;

  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }

  return date.toISOString().slice(0, 10);
}

function projectUrl(projectId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/projects/${projectId}` : "";
}

export async function POST(request: Request) {
  const secret = process.env.FOTOFLOW_IMPORT_SECRET;
  const ownerUserId = process.env.FOTOFLOW_OWNER_USER_ID;
  const receivedSecret = request.headers.get("x-fotoflow-secret");

  if (!secret || receivedSecret !== secret) {
    return jsonError("Napačen FotoFlow import ključ.", 401);
  }

  if (!ownerUserId) {
    return jsonError("Manjka FOTOFLOW_OWNER_USER_ID.", 500);
  }

  if (!supabaseAdmin) {
    return jsonError("Supabase admin povezava ni nastavljena.", 500);
  }

  const payload = (await request.json().catch(() => null)) as FioraImportPayload | null;
  const sourceBookingId = stringValue(payload?.sourceBookingId);
  const clientName = stringValue(payload?.clientName);
  const shootDate = stringValue(payload?.shootDate);

  if (!sourceBookingId || !clientName || !shootDate) {
    return jsonError("Manjkajo obvezni podatki za uvoz.");
  }

  if (!isValidDate(shootDate)) {
    return jsonError("Datum fotografiranja mora biti v obliki YYYY-MM-DD.");
  }

  const deliveryWorkdays = Math.floor(numberValue(payload?.deliveryWorkdays ?? 8));
  const amount = numberValue(payload?.amount);
  const deposit = numberValue(payload?.deposit);
  const projectPayload: Database["public"]["Tables"]["projects"]["Insert"] = {
    user_id: ownerUserId,
    external_source: stringValue(payload?.source) || "fiora",
    external_id: sourceBookingId,
    project_name: stringValue(payload?.projectName) || clientName,
    client_name: clientName,
    client_address: stringValue(payload?.clientAddress),
    email: stringValue(payload?.email),
    phone: stringValue(payload?.phone),
    shoot_type: stringValue(payload?.shootType) || "Fotografiranje",
    photographer: oneOf(payload?.photographer, photographers, "Teja"),
    shoot_date: shootDate,
    shoot_time: stringValue(payload?.shootTime),
    location: stringValue(payload?.location),
    workflow_status: stringValue(payload?.workflowStatus) || "Rezervirano",
    payment_status: oneOf(payload?.paymentStatus, paymentStatuses, "Neplačano"),
    payment_method: oneOf(payload?.paymentMethod, paymentMethods, "TRR"),
    amount,
    deposit,
    balance: Math.max(amount - deposit, 0),
    delivery_workdays: deliveryWorkdays,
    delivery_due: addBusinessDays(shootDate, deliveryWorkdays),
    gallery_url: "",
    drive_url: "",
    selected_photos: Math.floor(numberValue(payload?.selectedPhotos)),
    notes: stringValue(payload?.notes),
    retouch_notes: stringValue(payload?.retouchNotes)
  };

  const { data, error } = await supabaseAdmin
    .from("projects")
    .upsert(projectPayload, {
      onConflict: "external_source,external_id"
    })
    .select("id")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  const projectId = data.id;

  return NextResponse.json({
    ok: true,
    projectId,
    projectUrl: projectUrl(projectId)
  });
}
