export const workflowStatuses = [
  "Rezervirano",
  "Fotografirano",
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
] as const;

export const weddingWorkflowStatuses = [
  "Ponudba poslana",
  "Ponudba potrjena",
  "Avansna pogodba poslana",
  "Avans plačan",
  "Pogodba poslana",
  "Pogodba podpisana",
  "Sestanek",
  "Časovnica",
  "Fotografirano",
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Narejen izbor",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
] as const;

export const weddingDateStatuses = [
  "Ponudba poslana",
  "Ponudba potrjena",
  "Avansna pogodba poslana",
  "Avans plačan",
  "Pogodba poslana",
  "Pogodba podpisana",
  "Sestanek",
  "Časovnica"
] as const;

export const paymentStatuses = [
  "Neplačano",
  "Delno plačano",
  "Pošlji račun",
  "Račun poslan",
  "Plačano"
] as const;

export const photographers = ["Žan", "Teja", "Žan in Teja"] as const;
export const paymentMethods = ["Gotovina", "TRR"] as const;

export const shootTypes = [
  "Portret",
  "Družina",
  "Poroka",
  "Branding",
  "Nosečniško",
  "Cake smash",
  "Rojstni dan",
  "Dogodek",
  "Studio",
  "Lifestyle"
] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number] | string;
export type WeddingStatusDates = Partial<Record<(typeof weddingDateStatuses)[number] | string, string>>;
export type PaymentStatus = (typeof paymentStatuses)[number];
export type Photographer = (typeof photographers)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type ShootType = (typeof shootTypes)[number] | string;

export function getPaymentStatusesForMethod(
  paymentMethod: PaymentMethod | string,
  currentStatus?: PaymentStatus | string
) {
  const methodStatuses =
    paymentMethod === "TRR"
      ? ["Pošlji račun", "Račun poslan", "Plačano"]
      : ["Neplačano", "Delno plačano", "Plačano"];

  return Array.from(
    new Set([...methodStatuses, currentStatus].filter(Boolean))
  ) as PaymentStatus[];
}

export type Project = {
  id: string;
  user_id?: string | null;
  external_source?: string | null;
  external_id?: string | null;
  project_name: string;
  client_name: string;
  client_address?: string;
  email: string;
  phone: string;
  shoot_type: ShootType;
  photographer: Photographer;
  shoot_date: string;
  shoot_time: string;
  location: string;
  workflow_status: WorkflowStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  amount: number;
  deposit: number;
  balance: number;
  delivery_workdays: number;
  delivery_due: string;
  gallery_url: string;
  drive_url: string;
  shoot_reminder_sent_at?: string | null;
  contract_file_url?: string;
  timeline_file_url?: string;
  wedding_status_dates?: WeddingStatusDates;
  wedding_package?: string;
  wedding_package_price?: number;
  wedding_video_enabled?: boolean;
  wedding_video_package?: string;
  wedding_video_price?: number;
  wedding_video_provider_paid?: boolean;
  wedding_photobooth_enabled?: boolean;
  wedding_photobooth_package?: string;
  wedding_photobooth_price?: number;
  selected_photos: number;
  notes: string;
  retouch_notes: string;
  created_at: string;
  updated_at: string;
};

export type DocumentType = "contract" | "timeline" | "custom";
export type DocumentStatus = "Osnutek" | "Poslano" | "Podpisano";

export type StudioDocument = {
  id: string;
  user_id?: string | null;
  project_id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  client_name: string;
  client_email: string;
  document_html: string;
  share_token: string;
  signed_at?: string | null;
  signer_name?: string | null;
  signer_email?: string | null;
  signature_text?: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSetting = {
  id: string;
  user_id?: string | null;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PushSubscriptionRecord = {
  id: string;
  user_id?: string | null;
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
};

export const socialPlatforms = [
  "Instagram",
  "Facebook",
  "TikTok",
  "Pinterest",
  "LinkedIn",
  "Blog"
] as const;

export const socialPostStatuses = ["Osnutek", "Planirano", "Objavljeno"] as const;

export type SocialPlatform = (typeof socialPlatforms)[number];
export type SocialPostStatus = (typeof socialPostStatuses)[number];

export type SocialPost = {
  id: string;
  user_id?: string | null;
  title: string;
  platform: SocialPlatform;
  scheduled_at: string;
  status: SocialPostStatus;
  caption: string;
  gallery_url: string;
  storage_urls: string[];
  notes: string;
  reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectFormValues = Omit<
  Project,
  "id" | "user_id" | "created_at" | "updated_at" | "balance"
> & {
  contract_file_url: string;
  timeline_file_url: string;
  wedding_status_dates: WeddingStatusDates;
  wedding_package: string;
  wedding_package_price: number;
  wedding_video_enabled: boolean;
  wedding_video_package: string;
  wedding_video_price: number;
  wedding_video_provider_paid: boolean;
  wedding_photobooth_enabled: boolean;
  wedding_photobooth_package: string;
  wedding_photobooth_price: number;
  balance?: number;
};

export type ProjectMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: "clay" | "olive" | "rose" | "charcoal";
};
