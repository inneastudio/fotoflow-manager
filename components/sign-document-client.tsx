"use client";

import { CheckCircle2, FileSignature, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { buildSignedDocumentHtml } from "@/lib/document-generator";
import { getSharedDocument, signSharedDocument } from "@/lib/shared-documents";
import type { StudioDocument } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function SignDocumentClient({ token }: { token: string }) {
  const [document, setDocument] = useState<StudioDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signatureText, setSignatureText] = useState("");

  useEffect(() => {
    async function loadDocument() {
      try {
        const sharedDocument = await getSharedDocument(token);
        setDocument(sharedDocument);
        setSignerName(sharedDocument?.client_name ?? "");
        setSignerEmail(sharedDocument?.client_email ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Dokumenta ni bilo mogoče odpreti.");
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [token]);

  async function handleSign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const signedDocument = await signSharedDocument({
        token,
        signerName,
        signerEmail,
        signatureText
      });

      if (!signedDocument) throw new Error("Dokument ni bil najden.");
      setDocument(signedDocument);
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : "Podpis ni uspel.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="surface rounded-lg p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-clay" />
          <p className="mt-3 text-sm font-medium text-muted">Odpiram dokument.</p>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <section className="surface max-w-lg rounded-lg p-8 text-center">
          <FileSignature className="mx-auto h-10 w-10 text-muted" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
            Dokument ni najden
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Link je napačen ali dokument ni več aktiven.
          </p>
          {error ? <p className="mt-4 text-sm font-medium text-rose">{error}</p> : null}
        </section>
      </main>
    );
  }

  const signed = document.status === "Podpisano";

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_420px]">
        <section className="surface overflow-hidden rounded-lg">
          <div className="border-b border-line p-4 sm:p-5">
            <p className="eyebrow">INNEA STUDIO</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              {document.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Preglej dokument in ga potrdi na desni strani.
            </p>
          </div>
          <iframe
            title={document.title}
            className="h-[760px] w-full bg-white"
            srcDoc={buildSignedDocumentHtml(document)}
          />
        </section>

        <aside className="surface h-fit rounded-lg p-4 sm:p-5">
          {signed ? (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-olive/10 text-olive">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold text-ink">
                Dokument je podpisan
              </h2>
              <div className="mt-5 space-y-3 rounded-lg border border-line bg-white/70 p-4 text-sm">
                <p>
                  <span className="font-semibold text-muted">Ime: </span>
                  {document.signer_name}
                </p>
                <p>
                  <span className="font-semibold text-muted">Email: </span>
                  {document.signer_email}
                </p>
                <p>
                  <span className="font-semibold text-muted">Podpis: </span>
                  {document.signature_text}
                </p>
                <p>
                  <span className="font-semibold text-muted">Datum: </span>
                  {document.signed_at ? formatDate(document.signed_at) : "Ni določeno"}
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSign}>
              <div>
                <p className="eyebrow">Virtualni podpis</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                  Potrditev dokumenta
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  S potrditvijo se podpis vrne v FotoFlow arhiv dokumentov.
                </p>
              </div>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Ime in priimek</span>
                <input
                  className="input"
                  required
                  value={signerName}
                  onChange={(event) => setSignerName(event.target.value)}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Email</span>
                <input
                  className="input"
                  required
                  type="email"
                  value={signerEmail}
                  onChange={(event) => setSignerEmail(event.target.value)}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Podpis</span>
                <input
                  className="input font-display text-2xl"
                  required
                  value={signatureText}
                  onChange={(event) => setSignatureText(event.target.value)}
                  placeholder="Vpišite ime kot podpis"
                />
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-line bg-white/70 p-3 text-sm leading-6 text-muted">
                <input required type="checkbox" className="mt-1 h-4 w-4" />
                <span>
                  Potrjujem, da sem dokument prebral/a, razumem vsebino in ga
                  elektronsko podpisujem.
                </span>
              </label>

              {error ? (
                <p className="rounded-lg border border-rose/20 bg-rose/10 px-3 py-2 text-sm font-medium text-rose">
                  {error}
                </p>
              ) : null}

              <button className="button-primary w-full justify-center" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                {saving ? "Podpisujem" : "Podpiši in potrdi"}
              </button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
