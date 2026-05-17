import type { DocumentTemplates } from "@/lib/document-templates";
import type { Project } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function projectVariables(project: Project) {
  return {
    ime_projekta: project.project_name || project.client_name,
    ime_stranke: project.client_name,
    email: project.email || "",
    telefon: project.phone || "",
    tip_fotografiranja: String(project.shoot_type),
    datum_fotografiranja: formatDate(project.shoot_date),
    ura_fotografiranja: project.shoot_time || "",
    lokacija: project.location || "",
    fotograf: project.photographer || "",
    znesek: formatCurrency(project.amount),
    avans: formatCurrency(project.deposit),
    preostanek: formatCurrency(project.balance),
    rok_oddaje: formatDate(project.delivery_due),
    foto_paket: project.wedding_package || "",
    cena_foto_paketa: formatCurrency(project.wedding_package_price || 0),
    snemanje_paket: project.wedding_video_package || "",
    cena_snemanja: formatCurrency(project.wedding_video_price || 0),
    photobooth_paket: project.wedding_photobooth_package || "",
    cena_photobooth: formatCurrency(project.wedding_photobooth_price || 0)
  };
}

export function fillTemplate(text: string, project: Project) {
  const variables = projectVariables(project);
  return Object.entries(variables).reduce((content, [key, value]) => {
    return content.replaceAll(`{${key}}`, value);
  }, text);
}

function documentShell(title: string, body: string) {
  return `<!doctype html>
<html lang="sl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; background: #f6f1e8; color: #231f1b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { width: min(840px, calc(100vw - 32px)); margin: 32px auto; background: #fffaf2; border: 1px solid #e2d2bd; border-radius: 18px; padding: 48px; box-shadow: 0 24px 70px rgba(59, 45, 30, 0.12); }
    .toolbar { width: min(840px, calc(100vw - 32px)); margin: 24px auto 0; display: flex; justify-content: flex-end; gap: 8px; }
    button { border: 1px solid #d8c3aa; border-radius: 12px; background: #231f1b; color: #fffaf2; padding: 10px 16px; font-weight: 700; cursor: pointer; }
    h1 { font-size: 38px; line-height: 1.05; margin: 0 0 10px; letter-spacing: 0; }
    h2 { font-size: 18px; margin: 28px 0 8px; }
    p { line-height: 1.65; margin: 0 0 12px; }
    .muted { color: #786f66; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 28px 0; }
    .box { border: 1px solid #e2d2bd; border-radius: 12px; padding: 12px; background: #fffdf8; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #786f66; font-weight: 800; }
    .value { margin-top: 4px; font-weight: 700; }
    .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 56px; }
    .line { border-top: 1px solid #231f1b; padding-top: 10px; }
    .timeline-row { display: grid; grid-template-columns: 90px 1fr; gap: 16px; padding: 16px 0; border-bottom: 1px solid #eadccc; }
    .time { font-weight: 800; color: #a9704f; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .page { width: auto; margin: 0; border: none; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Shrani kot PDF / Natisni</button></div>
  <main class="page">${body}</main>
</body>
</html>`;
}

function metaBlock(project: Project) {
  const items = [
    ["Stranka", project.client_name],
    ["Projekt", project.project_name || project.client_name],
    ["Datum", formatDate(project.shoot_date)],
    ["Lokacija", project.location || "Ni dodano"],
    ["Fotograf", project.photographer || "Ni dodano"],
    ["Znesek", formatCurrency(project.amount)]
  ];

  return `<div class="meta">${items
    .map(
      ([label, value]) =>
        `<div class="box"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`
    )
    .join("")}</div>`;
}

export function buildContractHtml(project: Project, templates: DocumentTemplates) {
  const clauses = templates.contractClauses
    .map(
      (clause, index) => `<section>
        <h2>${index + 1}. ${escapeHtml(fillTemplate(clause.title, project))}</h2>
        <p>${escapeHtml(fillTemplate(clause.body, project)).replaceAll("\n", "<br />")}</p>
      </section>`
    )
    .join("");

  return documentShell(
    `Pogodba - ${project.project_name || project.client_name}`,
    `<h1>Pogodba</h1>
    <p class="muted">${escapeHtml(fillTemplate(templates.contractIntro, project))}</p>
    ${metaBlock(project)}
    ${clauses}
    <div class="signatures">
      <div class="line">Izvajalec</div>
      <div class="line">Naročnik</div>
    </div>`
  );
}

export function buildTimelineHtml(project: Project, templates: DocumentTemplates) {
  const rows = templates.timelineItems
    .map(
      (item) => `<div class="timeline-row">
        <div class="time">${escapeHtml(fillTemplate(item.time, project))}</div>
        <div>
          <h2 style="margin-top:0">${escapeHtml(fillTemplate(item.title, project))}</h2>
          <p>${escapeHtml(fillTemplate(item.note, project)).replaceAll("\n", "<br />")}</p>
        </div>
      </div>`
    )
    .join("");

  return documentShell(
    `Časovnica - ${project.project_name || project.client_name}`,
    `<h1>Časovnica</h1>
    <p class="muted">${escapeHtml(fillTemplate(templates.timelineIntro, project))}</p>
    ${metaBlock(project)}
    ${rows}`
  );
}

export function openGeneratedDocument(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
