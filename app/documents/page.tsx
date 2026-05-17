"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  Mail,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import {
  buildContractHtml,
  buildSignedDocumentHtml,
  buildTimelineHtml,
  openGeneratedDocument
} from "@/lib/document-generator";
import { useDocumentTemplates } from "@/lib/document-templates";
import type { DocumentType, Project, StudioDocument } from "@/lib/types";
import { useDocuments } from "@/lib/use-documents";
import { useProjects } from "@/lib/use-projects";
import { formatDate } from "@/lib/utils";

const documentTypeLabels: Record<DocumentType, string> = {
  contract: "Poročna pogodba",
  timeline: "Časovnica",
  custom: "Dokument"
};

export default function DocumentsPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const {
    documents,
    loading: documentsLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument
  } = useDocuments();
  const { templates } = useDocumentTemplates();
  const weddingProjects = useMemo(
    () =>
      projects
        .filter((project) => String(project.shoot_type).toLowerCase().includes("poroka"))
        .sort((a, b) => a.shoot_date.localeCompare(b.shoot_date)),
    [projects]
  );
  const [projectId, setProjectId] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("contract");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const selectedProject = weddingProjects.find((project) => project.id === projectId);
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const loading = projectsLoading || documentsLoading;

  useEffect(() => {
    if (!projectId && weddingProjects[0]) {
      setProjectId(weddingProjects[0].id);
    }
  }, [projectId, weddingProjects]);

  async function handleCreateDocument() {
    const project = selectedProject ?? weddingProjects[0];
    if (!project) return;

    const html =
      documentType === "timeline"
        ? buildTimelineHtml(project, templates)
        : buildContractHtml(project, templates);
    const document = await createDocument(project, documentType, html);
    setSelectedDocumentId(document.id);
  }

  async function copySigningLink(document: StudioDocument) {
    const link = getSigningLink(document);
    await navigator.clipboard.writeText(link);
    setCopiedId(document.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Dokumenti</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Pogodbe, časovnice in podpisi
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Ustvari dokument iz podatkov poroke, izvozi PDF ali pošlji naročniku link
            za virtualni podpis.
          </p>
        </div>
      </div>

      <section className="surface rounded-lg p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_auto] lg:items-end">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Poročni projekt</span>
            <select
              className="input"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {weddingProjects.length ? (
                weddingProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name || project.client_name} · {formatDate(project.shoot_date)}
                  </option>
                ))
              ) : (
                <option value="">Ni poročnih projektov</option>
              )}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink">Tip dokumenta</span>
            <select
              className="input"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as DocumentType)}
            >
              <option value="contract">Poročna pogodba</option>
              <option value="timeline">Časovnica</option>
            </select>
          </label>

          <button
            type="button"
            className="button-primary"
            disabled={!weddingProjects.length}
            onClick={handleCreateDocument}
          >
            <Plus className="h-4 w-4" />
            Ustvari
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose/20 bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
            {error}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Arhiv</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                Dokumenti
              </h2>
            </div>
            <span className="rounded-lg border border-line bg-white px-3 py-1 text-sm font-semibold text-muted">
              {documents.length}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="h-28 animate-pulse rounded-lg bg-mist/70" />
            ) : documents.length ? (
              documents.map((document) => (
                <DocumentArchiveRow
                  key={document.id}
                  document={document}
                  active={document.id === selectedDocument?.id}
                  copied={copiedId === document.id}
                  onSelect={() => setSelectedDocumentId(document.id)}
                  onOpen={() => openGeneratedDocument(buildSignedDocumentHtml(document))}
                  onCopy={() => copySigningLink(document)}
                  onMarkSent={() =>
                    updateDocument(document.id, { status: "Poslano" })
                  }
                  onDelete={() => deleteDocument(document.id)}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-white/60 p-5 text-sm text-muted">
                Arhiv je še prazen. Ustvari prvo pogodbo ali časovnico iz poročnega
                projekta.
              </div>
            )}
          </div>
        </div>

        <DocumentPreview document={selectedDocument} />
      </section>
    </div>
  );
}

function DocumentArchiveRow({
  document,
  active,
  copied,
  onSelect,
  onOpen,
  onCopy,
  onMarkSent,
  onDelete
}: {
  document: StudioDocument;
  active: boolean;
  copied: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onCopy: () => void;
  onMarkSent: () => void;
  onDelete: () => void;
}) {
  const mailto = getMailtoLink(document);

  return (
    <article
      className={[
        "rounded-lg border bg-white p-3 transition",
        active ? "border-clay shadow-soft" : "border-line hover:border-clay/50"
      ].join(" ")}
    >
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{document.title}</p>
            <p className="mt-1 text-xs text-muted">
              {documentTypeLabels[document.type]} · {document.client_name}
            </p>
          </div>
          <StatusBadge>{document.status}</StatusBadge>
        </div>
      </button>

      {document.signed_at ? (
        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-olive">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Podpisano {formatDate(document.signed_at)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={onOpen}>
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
        <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Kopirano" : "Link"}
        </button>
        <a className="button-secondary px-3 py-2 text-xs" href={mailto} onClick={onMarkSent}>
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
        <button type="button" className="button-ghost px-3 py-2 text-xs text-rose" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function DocumentPreview({ document }: { document?: StudioDocument }) {
  if (!document) {
    return (
      <section className="surface rounded-lg p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-4 font-display text-2xl font-semibold text-ink">
          Izberi dokument
        </p>
        <p className="mt-2 text-sm text-muted">
          Tukaj bo predogled pogodbe ali časovnice.
        </p>
      </section>
    );
  }

  return (
    <section className="surface overflow-hidden rounded-lg">
      <div className="border-b border-line p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Predogled</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {document.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Link za podpis: {getSigningLink(document)}
            </p>
          </div>
          <a
            className="button-primary"
            href={getSigningLink(document)}
            target="_blank"
            rel="noreferrer"
          >
            <FileSignature className="h-4 w-4" />
            Odpri podpis
          </a>
        </div>
      </div>
      <iframe
        title={document.title}
        className="h-[680px] w-full bg-white"
        srcDoc={buildSignedDocumentHtml(document)}
      />
    </section>
  );
}

function getSigningLink(document: StudioDocument) {
  if (typeof window === "undefined") return `/sign/${document.share_token}`;
  return `${window.location.origin}/sign/${document.share_token}`;
}

function getMailtoLink(document: StudioDocument) {
  const link = getSigningLink(document);
  const subject = encodeURIComponent(document.title);
  const body = encodeURIComponent(
    `Pozdravljeni,\n\nna spodnji povezavi lahko pregledate in potrdite dokument:\n${link}\n\nLep pozdrav,\nINNEA STUDIO`
  );

  return `mailto:${document.client_email}?subject=${subject}&body=${body}`;
}
