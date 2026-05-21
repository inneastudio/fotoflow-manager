"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { SocialPost } from "@/lib/types";

const STORAGE_KEY = "fotoflow-manager-social-posts";

export type SocialPostFormValues = Omit<
  SocialPost,
  "id" | "user_id" | "created_at" | "updated_at" | "reminder_sent_at"
> & {
  reminder_sent_at?: string | null;
};

function ensurePostShape(post: SocialPost): SocialPost {
  return {
    ...post,
    status: post.status ?? "Osnutek",
    gallery_url: post.gallery_url ?? "",
    storage_urls: Array.isArray(post.storage_urls) ? post.storage_urls : [],
    notes: post.notes ?? "",
    reminder_sent_at: post.reminder_sent_at ?? null
  };
}

function readLocalPosts() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as SocialPost[];
    return Array.isArray(parsed) ? parsed.map(ensurePostShape) : [];
  } catch {
    return [];
  }
}

function writeLocalPosts(posts: SocialPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function buildPost(values: SocialPostFormValues, existing?: SocialPost): SocialPost {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    title: values.title.trim(),
    platform: values.platform,
    scheduled_at: new Date(values.scheduled_at).toISOString(),
    status: values.status,
    caption: values.caption.trim(),
    gallery_url: values.gallery_url.trim(),
    storage_urls: values.storage_urls ?? [],
    notes: values.notes.trim(),
    reminder_sent_at: values.reminder_sent_at ?? existing?.reminder_sent_at ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

export function useSocialPosts() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setPosts(readLocalPosts());
        setLoading(false);
        return;
      }

      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("social_posts")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setPosts([]);
      } else {
        setPosts((data ?? []).map(ensurePostShape));
      }

      setLoading(false);
    }

    loadPosts();
  }, [authLoading, demoMode, user]);

  const createPost = useCallback(
    async (values: SocialPostFormValues) => {
      const draft = buildPost(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("social_posts")
          .insert({ ...draft, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        setPosts((current) => [...current, ensurePostShape(data)].sort(sortPosts));
        return ensurePostShape(data);
      }

      setPosts((current) => {
        const next = [...current, draft].sort(sortPosts);
        writeLocalPosts(next);
        return next;
      });

      return draft;
    },
    [demoMode, user]
  );

  const updatePost = useCallback(
    async (postId: string, values: SocialPostFormValues) => {
      const existing = posts.find((post) => post.id === postId);
      const updated = buildPost(values, existing);

      if (supabase && user && !demoMode) {
        const {
          id: _id,
          user_id: _userId,
          created_at: _createdAt,
          ...updateValues
        } = updated;
        const { data, error: mutationError } = await supabase
          .from("social_posts")
          .update(updateValues)
          .eq("id", postId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        setPosts((current) =>
          current.map((post) => (post.id === postId ? ensurePostShape(data) : post)).sort(sortPosts)
        );
        return ensurePostShape(data);
      }

      setPosts((current) => {
        const next = current
          .map((post) => (post.id === postId ? updated : post))
          .sort(sortPosts);
        writeLocalPosts(next);
        return next;
      });

      return updated;
    },
    [demoMode, posts, user]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase
          .from("social_posts")
          .delete()
          .eq("id", postId);

        if (mutationError) throw new Error(mutationError.message);
      }

      setPosts((current) => {
        const next = current.filter((post) => post.id !== postId);
        if (demoMode) writeLocalPosts(next);
        return next;
      });
    },
    [demoMode, user]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return [];
      if (!supabase || !user || demoMode) {
        throw new Error("Upload slik potrebuje Supabase prijavo.");
      }

      const urls: string[] = [];
      for (const file of fileArray) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("social-media")
          .upload(path, file, { upsert: false });

        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from("social-media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      return urls;
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
      posts,
      loading,
      error,
      createPost,
      updatePost,
      deletePost,
      uploadFiles
    }),
    [createPost, deletePost, error, loading, posts, updatePost, uploadFiles]
  );
}

function sortPosts(a: SocialPost, b: SocialPost) {
  return a.scheduled_at.localeCompare(b.scheduled_at);
}
