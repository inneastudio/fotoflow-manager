"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { socialPlatforms, socialPostStatuses, type SocialPost } from "@/lib/types";
import { useSocialPosts, type SocialPostFormValues } from "@/lib/use-social-posts";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);
const defaultScheduledAt = `${today}T09:00`;

const emptyValues: SocialPostFormValues = {
  title: "",
  platform: "Instagram",
  scheduled_at: defaultScheduledAt,
  status: "Planirano",
  caption: "",
  gallery_url: "",
  storage_urls: [],
  notes: "",
  reminder_sent_at: null
};

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function SocialPage() {
  const {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    uploadFiles
  } = useSocialPosts();
  const [values, setValues] = useState<SocialPostFormValues>(emptyValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upcomingPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status !== "Objavljeno")
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [posts]
  );
  const publishedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "Objavljeno")
        .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    [posts]
  );
  const postsByDate = useMemo(() => {
    return upcomingPosts.reduce<Record<string, SocialPost[]>>((groups, post) => {
      const date = post.scheduled_at.slice(0, 10);
      groups[date] = [...(groups[date] ?? []), post];
      return groups;
    }, {});
  }, [upcomingPosts]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updatePost(editingId, values);
      } else {
        await createPost(values);
      }
      setValues(emptyValues);
      setEditingId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Shranjevanje ni uspelo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    try {
      const urls = await uploadFiles(files);
      setValues((current) => ({
        ...current,
        storage_urls: [...current.storage_urls, ...urls]
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload ni uspel.");
    } finally {
      setUploading(false);
    }
  }

  async function askAi() {
    setAiLoading(true);
    setError(null);

    try {
      const {
        data: { session }
      } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const response = await fetch("/api/social/ai", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "AI predlog ni uspel.");
      setAiOutput(payload.text ?? "");
    } catch (aiError) {
      setError(aiError instanceof Error ? aiError.message : "AI predlog ni uspel.");
    } finally {
      setAiLoading(false);
    }
  }

  function editPost(post: SocialPost) {
    setEditingId(post.id);
    setValues({
      title: post.title,
      platform: post.platform,
      scheduled_at: toDateTimeLocalValue(post.scheduled_at),
      status: post.status,
      caption: post.caption,
      gallery_url: post.gallery_url,
      storage_urls: post.storage_urls,
      notes: post.notes,
      reminder_sent_at: post.reminder_sent_at ?? null
    });
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Marketing"
        title="Socialna omrežja"
        description="Koledar objav, priprava zapisov, galerije slik in opomnik 30 minut pred objavo."
        actions={
          <div className="surface rounded-lg px-4 py-3">
            <p className="text-sm text-muted">Planirane objave</p>
            <p className="mt-1 font-display text-3xl font-semibold">{upcomingPosts.length}</p>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{editingId ? "Urejanje" : "Nova objava"}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Priprava objave
              </h2>
            </div>
            <button type="submit" className="button-primary" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Shranjujem" : "Shrani"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-ink">Naslov objave</span>
              <input
                className="input"
                value={values.title}
                onChange={(event) => setValues({ ...values, title: event.target.value })}
                placeholder="npr. Poroka Ana & Marko"
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Socialno omrežje</span>
              <select
                className="input"
                value={values.platform}
                onChange={(event) =>
                  setValues({ ...values, platform: event.target.value as SocialPost["platform"] })
                }
              >
                {socialPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Datum in ura objave</span>
              <input
                className="input"
                type="datetime-local"
                value={values.scheduled_at}
                onChange={(event) => setValues({ ...values, scheduled_at: event.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Status</span>
              <select
                className="input"
                value={values.status}
                onChange={(event) =>
                  setValues({ ...values, status: event.target.value as SocialPost["status"] })
                }
              >
                {socialPostStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink">Link galerije / shrambe</span>
              <input
                className="input"
                value={values.gallery_url}
                onChange={(event) => setValues({ ...values, gallery_url: event.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-ink">Zapis objave</span>
              <textarea
                className="input min-h-36"
                value={values.caption}
                onChange={(event) => setValues({ ...values, caption: event.target.value })}
                placeholder="Besedilo objave, CTA, hashtagi ..."
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-ink">Opombe</span>
              <textarea
                className="input min-h-20"
                value={values.notes}
                onChange={(event) => setValues({ ...values, notes: event.target.value })}
                placeholder="Ideja, cilj objave, kaj mora biti na sliki ..."
              />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-line bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">Slike za objavo</p>
                <p className="mt-1 text-sm text-muted">Naloži izbor slik ali dodaj link galerije.</p>
              </div>
              <label className="button-secondary cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Nalagam" : "Naloži slike"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => handleUpload(event.target.files)}
                />
              </label>
            </div>
            {values.storage_urls.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {values.storage_urls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square rounded-lg border border-line object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg border border-line bg-mist/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">AI pomočnik</p>
                <p className="mt-1 text-sm text-muted">
                  Predlaga ritem objav, zapis, CTA in hashtage.
                </p>
              </div>
              <button type="button" className="button-secondary" onClick={askAi} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Pomagaj mi
              </button>
            </div>
            {aiOutput ? (
              <div className="mt-4 whitespace-pre-wrap rounded-lg border border-line bg-white p-3 text-sm leading-6 text-ink">
                {aiOutput}
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-rose">{error}</p> : null}
        </form>

        <section className="space-y-4">
          <div className="surface rounded-lg p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-clay" />
              <h2 className="font-display text-2xl font-semibold">Koledar objav</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted">Nalagam objave ...</p>
            ) : Object.keys(postsByDate).length ? (
              <div className="space-y-4">
                {Object.entries(postsByDate).map(([date, datePosts]) => (
                  <div key={date}>
                    <p className="eyebrow">{formatDate(date)}</p>
                    <div className="mt-2 space-y-2">
                      {datePosts.map((post) => (
                        <SocialPostRow
                          key={post.id}
                          post={post}
                          onEdit={editPost}
                          onDelete={deletePost}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Ni planiranih objav.</p>
            )}
          </div>

          <div className="surface rounded-lg p-4 sm:p-5">
            <h2 className="font-display text-2xl font-semibold">Arhiv objav</h2>
            <div className="mt-4 space-y-2">
              {publishedPosts.length ? (
                publishedPosts.slice(0, 6).map((post) => (
                  <SocialPostRow
                    key={post.id}
                    post={post}
                    onEdit={editPost}
                    onDelete={deletePost}
                  />
                ))
              ) : (
                <p className="text-sm text-muted">Objavljene objave se bodo prikazale tukaj.</p>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function SocialPostRow({
  post,
  onEdit,
  onDelete
}: {
  post: SocialPost;
  onEdit: (post: SocialPost) => void;
  onDelete: (postId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            className="truncate text-left font-semibold text-ink hover:text-clay"
            onClick={() => onEdit(post)}
          >
            {post.title}
          </button>
          <p className="mt-1 text-sm text-muted">
            {post.platform} · {new Date(post.scheduled_at).toLocaleString("sl-SI", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        <StatusBadge>{post.status}</StatusBadge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Bell className="h-3.5 w-3.5" />
          30 min prej
        </span>
        {post.gallery_url ? (
          <a href={post.gallery_url} target="_blank" className="inline-flex items-center gap-1 hover:text-ink">
            <LinkIcon className="h-3.5 w-3.5" />
            Galerija
          </a>
        ) : null}
        {post.storage_urls.length ? <span>{post.storage_urls.length} slik</span> : null}
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 text-rose"
          onClick={() => onDelete(post.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Izbriši
        </button>
      </div>
    </article>
  );
}
