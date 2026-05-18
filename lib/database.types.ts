import type { AppSetting, Project, StudioDocument } from "@/lib/types";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Project, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: StudioDocument;
        Insert: Omit<StudioDocument, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<StudioDocument, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: AppSetting;
        Insert: Omit<AppSetting, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AppSetting, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_shared_document: {
        Args: { share_token_input: string };
        Returns: StudioDocument[];
      };
      sign_shared_document: {
        Args: {
          share_token_input: string;
          signer_name_input: string;
          signer_email_input: string;
          signature_text_input: string;
        };
        Returns: StudioDocument[];
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
