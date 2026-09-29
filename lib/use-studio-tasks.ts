"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { StudioTask, StudioTaskPriority, StudioTaskStatus } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-studio-tasks";

export type StudioTaskFormValues = {
  task_date: string;
  title: string;
  description: string;
  priority: StudioTaskPriority;
  status: StudioTaskStatus;
};

function ensureTaskShape(task: StudioTask): StudioTask {
  return {
    ...task,
    task_date: task.task_date ?? new Date().toISOString().slice(0, 10),
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority ?? "Normalna",
    status: task.status ?? "Odprto"
  };
}

function sortTasks(a: StudioTask, b: StudioTask) {
  const statusOrder = a.status.localeCompare(b.status);
  if (statusOrder !== 0) return statusOrder;
  return a.created_at.localeCompare(b.created_at);
}

function readLocalTasks() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as StudioTask[];
    return Array.isArray(parsed) ? parsed.map(ensureTaskShape).sort(sortTasks) : [];
  } catch {
    return [];
  }
}

function writeLocalTasks(tasks: StudioTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function buildTask(values: StudioTaskFormValues, existing?: StudioTask): StudioTask {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    task_date: values.task_date,
    title: values.title.trim(),
    description: values.description.trim(),
    priority: values.priority,
    status: values.status,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function taskPayload(task: StudioTask) {
  return {
    user_id: task.user_id,
    task_date: task.task_date,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    updated_at: task.updated_at
  };
}

export function useStudioTasks() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<StudioTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadTasks() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setTasks(readLocalTasks());
        setLoading(false);
        return;
      }

      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("studio_tasks")
        .select("*")
        .order("task_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setTasks([]);
      } else {
        setTasks((data ?? []).map(ensureTaskShape).sort(sortTasks));
      }

      setLoading(false);
    }

    loadTasks();
  }, [authLoading, demoMode, user]);

  const createTask = useCallback(
    async (values: StudioTaskFormValues) => {
      const task = buildTask(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("studio_tasks")
          .insert({ ...task, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedTask = ensureTaskShape(data);
        setTasks((current) => [...current, savedTask].sort(sortTasks));
        return savedTask;
      }

      setTasks((current) => {
        const next = [...current, task].sort(sortTasks);
        writeLocalTasks(next);
        return next;
      });

      return task;
    },
    [demoMode, user]
  );

  const updateTask = useCallback(
    async (taskId: string, values: StudioTaskFormValues) => {
      const existing = tasks.find((task) => task.id === taskId);
      if (!existing) return null;

      const updatedTask = buildTask(values, existing);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("studio_tasks")
          .update(taskPayload(updatedTask))
          .eq("id", taskId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const savedTask = ensureTaskShape(data);
        setTasks((current) =>
          current.map((task) => (task.id === taskId ? savedTask : task)).sort(sortTasks)
        );
        return savedTask;
      }

      setTasks((current) => {
        const next = current
          .map((task) => (task.id === taskId ? updatedTask : task))
          .sort(sortTasks);
        writeLocalTasks(next);
        return next;
      });

      return updatedTask;
    },
    [demoMode, tasks, user]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("studio_tasks")
          .delete()
          .eq("id", taskId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setTasks((current) => {
        const next = current.filter((task) => task.id !== taskId);
        if (demoMode) writeLocalTasks(next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      tasks,
      loading,
      error,
      createTask,
      updateTask,
      deleteTask
    }),
    [createTask, deleteTask, error, loading, tasks, updateTask]
  );
}
