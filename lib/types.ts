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

export const paymentStatuses = [
  "Neplačano",
  "Delno plačano",
  "Plačano"
] as const;

export const photographers = ["Žan", "Teja"] as const;
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
export type PaymentStatus = (typeof paymentStatuses)[number];
export type Photographer = (typeof photographers)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type ShootType = (typeof shootTypes)[number] | string;

export type Project = {
  id: string;
  user_id?: string | null;
  client_name: string;
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
  balance?: number;
};

export type ProjectMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: "clay" | "olive" | "rose" | "charcoal";
};
