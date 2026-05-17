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

export type Project = {
  id: string;
  user_id?: string | null;
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
  contract_file_url?: string;
  timeline_file_url?: string;
  wedding_status_dates?: WeddingStatusDates;
  wedding_package?: string;
  wedding_package_price?: number;
  wedding_video_enabled?: boolean;
  wedding_video_package?: string;
  wedding_video_price?: number;
  wedding_photobooth_enabled?: boolean;
  wedding_photobooth_package?: string;
  wedding_photobooth_price?: number;
  selected_photos: number;
  notes: string;
  retouch_notes: string;
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
