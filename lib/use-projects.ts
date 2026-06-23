"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { demoProjects } from "@/lib/demo-data";
import { supabase } from "@/lib/supabase";
import type { Project, ProjectFormValues } from "@/lib/types";
import { weddingWorkflowStatuses } from "@/lib/types";
import { useStudioSettings } from "@/lib/use-studio-settings";
import {
  calculateBalance,
  getBusinessDaysBetween,
  getNextWorkflowStatus
} from "@/lib/utils";

const STORAGE_KEY = "fotoflow-manager-projects";

function ensureProjectShape(project: Project): Project {
  return {
    ...project,
    project_name: project.project_name ?? "",
    client_address: project.client_address ?? "",
    photographer: project.photographer ?? "Žan",
    payment_method: project.payment_method ?? "TRR",
    shoot_time: project.shoot_time ?? "",
    contract_file_url: project.contract_file_url ?? "",
    timeline_file_url: project.timeline_file_url ?? "",
    wedding_status_dates: project.wedding_status_dates ?? {},
    wedding_package: project.wedding_package ?? "",
    wedding_package_price: Number(project.wedding_package_price ?? 0),
    wedding_extra_hours: Number(project.wedding_extra_hours ?? 0),
    wedding_extra_hour_price: Number(project.wedding_extra_hour_price ?? 90),
    wedding_video_enabled: Boolean(project.wedding_video_enabled),
    wedding_video_package: project.wedding_video_package ?? "",
    wedding_video_price: Number(project.wedding_video_price ?? 0),
    wedding_video_provider_paid: Boolean(project.wedding_video_provider_paid),
    wedding_photobooth_enabled: Boolean(
      project.wedding_photobooth_enabled ??
        (project.wedding_photobooth_package ||
          Number(project.wedding_photobooth_price ?? 0) > 0)
    ),
    wedding_photobooth_package: project.wedding_photobooth_package ?? "",
    wedding_photobooth_price: Number(project.wedding_photobooth_price ?? 0),
    wedding_album_size: project.wedding_album_size ?? "",
    wedding_album_shape: project.wedding_album_shape ?? "",
    wedding_album_pages: Number(project.wedding_album_pages ?? 0),
    wedding_album_wishes: project.wedding_album_wishes ?? "",
    wedding_album_inscription: project.wedding_album_inscription ?? "",
    wedding_album_notes: project.wedding_album_notes ?? "",
    delivery_workdays:
      project.delivery_workdays ??
      getBusinessDaysBetween(project.shoot_date, project.delivery_due),
    shoot_reminder_sent_at: project.shoot_reminder_sent_at ?? null
  };
}

function readLocalProjects() {
  if (typeof window === "undefined") return demoProjects;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return demoProjects.map(ensureProjectShape);

  try {
    const parsed = JSON.parse(saved) as Project[];
    return Array.isArray(parsed)
      ? parsed.map(ensureProjectShape)
      : demoProjects.map(ensureProjectShape);
  } catch {
    return demoProjects.map(ensureProjectShape);
  }
}

function writeLocalProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function isMissingOptionalColumn(message: string) {
  return (
    message.includes("schema cache") &&
    (message.includes("client_address") ||
      message.includes("wedding_video_provider_paid") ||
      message.includes("wedding_extra_hours") ||
      message.includes("wedding_extra_hour_price") ||
      message.includes("shoot_reminder_sent_at"))
  );
}

function omitMissingOptionalColumns<
  T extends {
    client_address?: string;
    wedding_video_provider_paid?: boolean;
    wedding_extra_hours?: number;
    wedding_extra_hour_price?: number;
    shoot_reminder_sent_at?: string | null;
  }
>(value: T) {
  const {
    client_address: _clientAddress,
    wedding_video_provider_paid: _weddingVideoProviderPaid,
    wedding_extra_hours: _weddingExtraHours,
    wedding_extra_hour_price: _weddingExtraHourPrice,
    shoot_reminder_sent_at: _shootReminderSentAt,
    ...rest
  } = value;
  return rest;
}

function normalizeProject(values: ProjectFormValues, existing?: Project): Project {
  const now = new Date().toISOString();
  const amount = Number(values.amount || 0);
  const isWedding = String(values.shoot_type).toLowerCase().includes("poroka");
  const deposit = isWedding ? Number(values.deposit || 0) : 0;
  const selectedPhotos = Number(values.selected_photos || 0);
  const balance =
    values.payment_status === "Plačano" ? 0 : calculateBalance(amount, deposit);

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    project_name: values.project_name.trim(),
    client_name: values.client_name.trim(),
    client_address: values.client_address?.trim() ?? "",
    email: values.email.trim(),
    phone: values.phone.trim(),
    shoot_type: values.shoot_type,
    photographer: values.photographer,
    shoot_date: values.shoot_date,
    shoot_time: values.shoot_time,
    location: values.location.trim(),
    workflow_status: values.workflow_status,
    payment_status: values.payment_status,
    payment_method: values.payment_method,
    amount,
    deposit,
    balance,
    delivery_workdays: Math.max(Number(values.delivery_workdays || 0), 0),
    delivery_due: values.delivery_due,
    gallery_url: values.gallery_url.trim(),
    drive_url: values.drive_url.trim(),
    shoot_reminder_sent_at:
      values.shoot_reminder_sent_at ?? existing?.shoot_reminder_sent_at ?? null,
    contract_file_url: values.contract_file_url?.trim() ?? "",
    timeline_file_url: values.timeline_file_url?.trim() ?? "",
    wedding_status_dates: values.wedding_status_dates ?? {},
    wedding_package: values.wedding_package?.trim() ?? "",
    wedding_package_price: Number(values.wedding_package_price || 0),
    wedding_extra_hours: Math.max(Number(values.wedding_extra_hours || 0), 0),
    wedding_extra_hour_price: Math.max(Number(values.wedding_extra_hour_price || 0), 0),
    wedding_video_enabled: Boolean(values.wedding_video_enabled),
    wedding_video_package: values.wedding_video_package?.trim() ?? "",
    wedding_video_price: Number(values.wedding_video_price || 0),
    wedding_video_provider_paid: Boolean(values.wedding_video_provider_paid),
    wedding_photobooth_enabled: Boolean(values.wedding_photobooth_enabled),
    wedding_photobooth_package: values.wedding_photobooth_package?.trim() ?? "",
    wedding_photobooth_price: Number(values.wedding_photobooth_price || 0),
    wedding_album_size: values.wedding_album_size?.trim() ?? "",
    wedding_album_shape: values.wedding_album_shape?.trim() ?? "",
    wedding_album_pages: Math.max(Number(values.wedding_album_pages || 0), 0),
    wedding_album_wishes: values.wedding_album_wishes?.trim() ?? "",
    wedding_album_inscription: values.wedding_album_inscription?.trim() ?? "",
    wedding_album_notes: values.wedding_album_notes?.trim() ?? "",
    selected_photos: selectedPhotos,
    notes: values.notes.trim(),
    retouch_notes: values.retouch_notes.trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

export function useProjects() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const { workflowStatuses } = useStudioSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        const localProjects = readLocalProjects();
        setProjects(localProjects);
        writeLocalProjects(localProjects);
        setLoading(false);
        return;
      }

      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("projects")
        .select("*")
        .order("shoot_date", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setProjects([]);
      } else {
        setProjects((data ?? []).map(ensureProjectShape));
      }

      setLoading(false);
    }

    loadProjects();
  }, [authLoading, demoMode, user]);

  const createProject = useCallback(
    async (values: ProjectFormValues) => {
      const project = normalizeProject(values);

      if (supabase && user && !demoMode) {
        const insertPayload = { ...project, user_id: user.id };
        let { data, error: mutationError } = await supabase
          .from("projects")
          .insert(insertPayload)
          .select()
          .single();

        if (mutationError && isMissingOptionalColumn(mutationError.message)) {
          const retry = await supabase
            .from("projects")
            .insert(omitMissingOptionalColumns(insertPayload))
            .select()
            .single();
          data = retry.data;
          mutationError = retry.error;
        }

        if (mutationError) throw new Error(mutationError.message);
        if (!data) throw new Error("Projekt ni bil shranjen.");

        const savedProject = ensureProjectShape(data);
        setProjects((current) => [savedProject, ...current]);
        return savedProject;
      }

      setProjects((current) => {
        const next = [project, ...current];
        writeLocalProjects(next);
        return next;
      });

      return project;
    },
    [demoMode, user]
  );

  const updateProject = useCallback(
    async (projectId: string, values: ProjectFormValues) => {
      const existing = projects.find((project) => project.id === projectId);
      if (!existing) throw new Error("Projekt ni najden.");

      const updated = normalizeProject(values, existing);

      if (supabase && user && !demoMode) {
        const updatePayload = {
          project_name: updated.project_name,
          client_name: updated.client_name,
          client_address: updated.client_address,
          email: updated.email,
          phone: updated.phone,
          shoot_type: updated.shoot_type,
          photographer: updated.photographer,
          shoot_date: updated.shoot_date,
          shoot_time: updated.shoot_time,
          location: updated.location,
          workflow_status: updated.workflow_status,
          payment_status: updated.payment_status,
          payment_method: updated.payment_method,
          amount: updated.amount,
          deposit: updated.deposit,
          balance: updated.balance,
          delivery_workdays: updated.delivery_workdays,
          delivery_due: updated.delivery_due,
          gallery_url: updated.gallery_url,
          drive_url: updated.drive_url,
          shoot_reminder_sent_at: updated.shoot_reminder_sent_at,
          contract_file_url: updated.contract_file_url,
          timeline_file_url: updated.timeline_file_url,
          wedding_status_dates: updated.wedding_status_dates,
          wedding_package: updated.wedding_package,
          wedding_package_price: updated.wedding_package_price,
          wedding_extra_hours: updated.wedding_extra_hours,
          wedding_extra_hour_price: updated.wedding_extra_hour_price,
          wedding_video_enabled: updated.wedding_video_enabled,
          wedding_video_package: updated.wedding_video_package,
          wedding_video_price: updated.wedding_video_price,
          wedding_video_provider_paid: updated.wedding_video_provider_paid,
          wedding_photobooth_enabled: updated.wedding_photobooth_enabled,
          wedding_photobooth_package: updated.wedding_photobooth_package,
          wedding_photobooth_price: updated.wedding_photobooth_price,
          wedding_album_size: updated.wedding_album_size,
          wedding_album_shape: updated.wedding_album_shape,
          wedding_album_pages: updated.wedding_album_pages,
          wedding_album_wishes: updated.wedding_album_wishes,
          wedding_album_inscription: updated.wedding_album_inscription,
          wedding_album_notes: updated.wedding_album_notes,
          selected_photos: updated.selected_photos,
          notes: updated.notes,
          retouch_notes: updated.retouch_notes,
          updated_at: updated.updated_at
        };
        let { data, error: mutationError } = await supabase
          .from("projects")
          .update(updatePayload)
          .eq("id", projectId)
          .select()
          .single();

        if (mutationError && isMissingOptionalColumn(mutationError.message)) {
          const retry = await supabase
            .from("projects")
            .update(omitMissingOptionalColumns(updatePayload))
            .eq("id", projectId)
            .select()
            .single();
          data = retry.data;
          mutationError = retry.error;
        }

        if (mutationError) throw new Error(mutationError.message);
        if (!data) throw new Error("Projekt ni bil shranjen.");

        const savedProject = ensureProjectShape(data);
        setProjects((current) =>
          current.map((project) => (project.id === projectId ? savedProject : project))
        );
        return savedProject;
      }

      setProjects((current) => {
        const next = current.map((project) =>
          project.id === projectId ? updated : project
        );
        writeLocalProjects(next);
        return next;
      });

      return updated;
    },
    [demoMode, projects, user]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setProjects((current) => {
        const next = current.filter((project) => project.id !== projectId);
        if (demoMode) writeLocalProjects(next);
        return next;
      });
    },
    [demoMode, user]
  );

  const moveToNextStatus = useCallback(
    async (projectId: string) => {
      const existing = projects.find((project) => project.id === projectId);
      if (!existing) throw new Error("Projekt ni najden.");

      const nextStatus = getNextWorkflowStatus(
        existing.workflow_status,
        String(existing.shoot_type).toLowerCase().includes("poroka")
          ? weddingWorkflowStatuses
          : workflowStatuses
      );
      const nextPaymentStatus =
        nextStatus === "Plačano" || nextStatus === "Zaključeno"
          ? "Plačano"
          : existing.payment_status;

      return updateProject(projectId, {
        ...existing,
        contract_file_url: existing.contract_file_url ?? "",
        timeline_file_url: existing.timeline_file_url ?? "",
        wedding_status_dates: existing.wedding_status_dates ?? {},
        wedding_package: existing.wedding_package ?? "",
        wedding_package_price: Number(existing.wedding_package_price ?? 0),
        wedding_extra_hours: Number(existing.wedding_extra_hours ?? 0),
        wedding_extra_hour_price: Number(existing.wedding_extra_hour_price ?? 90),
        wedding_video_enabled: Boolean(existing.wedding_video_enabled),
        wedding_video_package: existing.wedding_video_package ?? "",
        wedding_video_price: Number(existing.wedding_video_price ?? 0),
        wedding_video_provider_paid: Boolean(existing.wedding_video_provider_paid),
        wedding_photobooth_enabled: Boolean(existing.wedding_photobooth_enabled),
        wedding_photobooth_package: existing.wedding_photobooth_package ?? "",
        wedding_photobooth_price: Number(existing.wedding_photobooth_price ?? 0),
        wedding_album_size: existing.wedding_album_size ?? "",
        wedding_album_shape: existing.wedding_album_shape ?? "",
        wedding_album_pages: Number(existing.wedding_album_pages ?? 0),
        wedding_album_wishes: existing.wedding_album_wishes ?? "",
        wedding_album_inscription: existing.wedding_album_inscription ?? "",
        wedding_album_notes: existing.wedding_album_notes ?? "",
        workflow_status: nextStatus,
        payment_status: nextPaymentStatus
      });
    },
    [projects, updateProject, workflowStatuses]
  );

  return useMemo(
    () => ({
      projects,
      loading,
      error,
      createProject,
      updateProject,
      deleteProject,
      moveToNextStatus
    }),
    [
      createProject,
      deleteProject,
      error,
      loading,
      moveToNextStatus,
      projects,
      updateProject
    ]
  );
}
