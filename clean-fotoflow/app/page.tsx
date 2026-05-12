"use client";

import { useEffect, useMemo, useState } from "react";

const workflowStatuses = [
  "Rezervirano",
  "Fotografirano",
  "Shranjeno",
  "Izbor poslan",
  "Izbor prejet",
  "Urejanje",
  "Poslano",
  "Plačano",
  "Zaključeno"
] as const;

const paymentStatuses = ["Neplačano", "Delno plačano", "Plačano"] as const;

type WorkflowStatus = (typeof workflowStatuses)[number];
type PaymentStatus = (typeof paymentStatuses)[number];

type ShootTypeOption = {
  name: string;
  workdays: number;
};

type Project = {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  shootType: string;
  shootDate: string;
  location: string;
  workflowStatus: WorkflowStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  deposit: number;
  deliveryWorkdays: number;
  deliveryDue: string;
  galleryUrl: string;
  driveUrl: string;
  selectedPhotos: number;
  notes: string;
  retouchNotes: string;
  updatedAt: string;
};

type DraftProject = Omit<Project, "id" | "updatedAt">;

const defaultShootTypes: ShootTypeOption[] = [
  { name: "Portret", workdays: 8 },
  { name: "Družina", workdays: 8 },
  { name: "Poroka", workdays: 25 },
  { name: "Branding", workdays: 10 },
  { name: "Nosečniško", workdays: 8 },
  { name: "Cake smash", workdays: 7 },
  { name: "Rojstni dan", workdays: 7 },
  { name: "Dogodek", workdays: 8 },
  { name: "Studio", workdays: 8 },
  { name: "Lifestyle", workdays: 8 }
];

const demoProjects: Project[] = [
  makeProject({
    clientName: "Eva Zupan",
    email: "eva.zupan@example.com",
    phone: "+386 41 770 402",
    shootType: "Nosečniško",
    shootDate: "2026-05-22",
    location: "Štanjel",
    workflowStatus: "Rezervirano",
    paymentStatus: "Neplačano",
    amount: 560,
    deposit: 0,
    deliveryWorkdays: 8,
    galleryUrl: "",
    driveUrl: "",
    selectedPhotos: 0,
    notes: "Zlata ura, vključiti partnerja in dve obleki.",
    retouchNotes: ""
  }),
  makeProject({
    clientName: "Ana in Luka",
    email: "ana.luka@example.com",
    phone: "+386 31 445 990",
    shootType: "Poroka",
    shootDate: "2026-05-16",
    location: "Vila Vipolže",
    workflowStatus: "Rezervirano",
    paymentStatus: "Delno plačano",
    amount: 2450,
    deposit: 800,
    deliveryWorkdays: 25,
    galleryUrl: "",
    driveUrl: "",
    selectedPhotos: 0,
    notes: "Civilni obred ob 16:00.",
    retouchNotes: "Topel ton."
  }),
  makeProject({
    clientName: "Maja Kovač",
    email: "maja.kovac@example.com",
    phone: "+386 40 212 888",
    shootType: "Branding",
    shootDate: "2026-05-11",
    location: "Ljubljana",
    workflowStatus: "Urejanje",
    paymentStatus: "Delno plačano",
    amount: 780,
    deposit: 250,
    deliveryWorkdays: 10,
    galleryUrl: "",
    driveUrl: "",
    selectedPhotos: 34,
    notes: "Tri stylingi, naravna svetloba.",
    retouchNotes: "Ohrani teksturo kože."
  })
];

const projectStorageKey = "clean-fotoflow-projects";
const settingsStorageKey = "clean-fotoflow-settings";

function today() {
  return toDateInput(new Date());
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function addBusinessDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  let added = 0;
  const target = Math.max(Number(days || 0), 0);

  while (added < target) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added += 1;
  }

  return toDateInput(date);
}

function businessDaysBetween(startValue: string, endValue: string) {
  const start = new Date(`${startValue}T12:00:00`);
  const end = new Date(`${endValue}T12:00:00`);
  const cursor = new Date(start);
  let count = 0;

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) count += 1;
  }

  return Math.max(count, 0);
}

function makeProject(input: Omit<DraftProject, "deliveryDue"> & { deliveryDue?: string }): Project {
  return {
    ...input,
    id: crypto.randomUUID(),
    deliveryDue: input.deliveryDue ?? addBusinessDays(input.shootDate, input.deliveryWorkdays),
    updatedAt: new Date().toISOString()
  };
}

function emptyDraft(types: ShootTypeOption[]): DraftProject {
  const shootType = types[0] ?? defaultShootTypes[0];
  const shootDate = today();

  return {
    clientName: "",
    email: "",
    phone: "",
    shootType: shootType.name,
    shootDate,
    location: "",
    workflowStatus: "Rezervirano",
    paymentStatus: "Neplačano",
    amount: 0,
    deposit: 0,
    deliveryWorkdays: shootType.workdays,
    deliveryDue: addBusinessDays(shootDate, shootType.workdays),
    galleryUrl: "",
    driveUrl: "",
    selectedPhotos: 0,
    notes: "",
    retouchNotes: ""
  };
}

function euro(value: number) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function balance(project: Pick<Project, "amount" | "deposit" | "paymentStatus">) {
  if (project.paymentStatus === "Plačano") return 0;
  return Math.max(Number(project.amount || 0) - Number(project.deposit || 0), 0);
}

function nextStatus(status: WorkflowStatus) {
  const index = workflowStatuses.indexOf(status);
  return workflowStatuses[Math.min(index + 1, workflowStatuses.length - 1)];
}

export default function AppPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [types, setTypes] = useState<ShootTypeOption[]>(defaultShootTypes);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftProject>(() => emptyDraft(defaultShootTypes));
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("Vsi");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDays, setNewTypeDays] = useState(8);

  useEffect(() => {
    const savedProjects = window.localStorage.getItem(projectStorageKey);
    const savedSettings = window.localStorage.getItem(settingsStorageKey);

    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedSettings) setTypes(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(projectStorageKey, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(types));
  }, [types]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const search = `${project.clientName} ${project.email} ${project.phone} ${project.location}`.toLowerCase();
        const matchesQuery = search.includes(query.toLowerCase());
        const matchesWorkflow =
          workflowFilter === "Vsi" || project.workflowStatus === workflowFilter;
        return matchesQuery && matchesWorkflow;
      })
      .sort((a, b) => new Date(b.shootDate).getTime() - new Date(a.shootDate).getTime());
  }, [projects, query, workflowFilter]);

  const activeProjects = projects.filter((project) => project.workflowStatus !== "Zaključeno");
  const toEdit = projects.filter((project) =>
    ["Izbor prejet", "Urejanje"].includes(project.workflowStatus)
  );
  const unpaid = projects.reduce((sum, project) => sum + balance(project), 0);
  const paid = projects
    .filter((project) => project.paymentStatus === "Plačano")
    .reduce((sum, project) => sum + project.amount, 0);

  function openNewProject() {
    setEditing(null);
    setDraft(emptyDraft(types));
    setIsModalOpen(true);
  }

  function openEditProject(project: Project) {
    setEditing(project);
    setDraft({
      clientName: project.clientName,
      email: project.email,
      phone: project.phone,
      shootType: project.shootType,
      shootDate: project.shootDate,
      location: project.location,
      workflowStatus: project.workflowStatus,
      paymentStatus: project.paymentStatus,
      amount: project.amount,
      deposit: project.deposit,
      deliveryWorkdays: project.deliveryWorkdays,
      deliveryDue: project.deliveryDue,
      galleryUrl: project.galleryUrl,
      driveUrl: project.driveUrl,
      selectedPhotos: project.selectedPhotos,
      notes: project.notes,
      retouchNotes: project.retouchNotes
    });
    setIsModalOpen(true);
  }

  function saveProject() {
    const normalizedDraft = {
      ...draft,
      amount: Number(draft.amount || 0),
      deposit: Number(draft.deposit || 0),
      selectedPhotos: Number(draft.selectedPhotos || 0),
      deliveryWorkdays: Number(draft.deliveryWorkdays || 0)
    };

    if (editing) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editing.id
            ? { ...project, ...normalizedDraft, updatedAt: new Date().toISOString() }
            : project
        )
      );
    } else {
      setProjects((current) => [makeProject(normalizedDraft), ...current]);
    }

    setIsModalOpen(false);
  }

  function updateDraft(patch: Partial<DraftProject>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function setShootType(typeName: string) {
    const option = types.find((type) => type.name === typeName);
    const workdays = option?.workdays ?? draft.deliveryWorkdays;
    updateDraft({
      shootType: typeName,
      deliveryWorkdays: workdays,
      deliveryDue: addBusinessDays(draft.shootDate, workdays)
    });
  }

  function setShootDate(date: string) {
    updateDraft({
      shootDate: date,
      deliveryDue: addBusinessDays(date, draft.deliveryWorkdays)
    });
  }

  function setWorkdays(workdays: number) {
    updateDraft({
      deliveryWorkdays: Math.max(Number(workdays || 0), 0),
      deliveryDue: addBusinessDays(draft.shootDate, workdays)
    });
  }

  function setDueDate(date: string) {
    updateDraft({
      deliveryDue: date,
      deliveryWorkdays: businessDaysBetween(draft.shootDate, date)
    });
  }

  function updateWorkflow(project: Project, status: WorkflowStatus) {
    const paymentStatus =
      status === "Plačano" || status === "Zaključeno" ? "Plačano" : project.paymentStatus;

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? { ...item, workflowStatus: status, paymentStatus, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }

  const tabs = ["Dashboard", "Projekti", "Koledar", "Finance", "Stranke", "Nastavitve"];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <p className="brand-title">FotoFlow</p>
            <p className="brand-subtitle">Manager</p>
          </div>
        </div>
        <nav className="nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Interni studio CRM</p>
            <h1>{activeTab}</h1>
            <p className="muted">Rezervacije, workflow, roki in plačila v enem čistem pregledu.</p>
          </div>
          <button className="primary" onClick={openNewProject}>Dodaj projekt</button>
        </header>

        {activeTab === "Dashboard" && (
          <div className="grid">
            <section className="grid metrics">
              <Metric title="Aktivni projekti" value={String(activeProjects.length)} />
              <Metric title="Za urediti" value={String(toEdit.length)} />
              <Metric title="Neplačano" value={euro(unpaid)} />
              <Metric title="Plačano" value={euro(paid)} />
            </section>
            <section className="grid two">
              <div className="card">
                <h2>Zadnji projekti</h2>
                <div className="grid">
                  {filteredProjects.slice(0, 4).map((project) => (
                    <ProjectRow key={project.id} project={project} onEdit={openEditProject} />
                  ))}
                </div>
              </div>
              <div className="card">
                <h2>Neplačani projekti</h2>
                <div className="grid">
                  {projects.filter((project) => balance(project) > 0).map((project) => (
                    <ProjectRow key={project.id} project={project} onEdit={openEditProject} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Projekti" && (
          <div className="grid">
            <section className="card">
              <div className="form-grid">
                <label>
                  Išči
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stranka, email, lokacija..." />
                </label>
                <label>
                  Workflow status
                  <select value={workflowFilter} onChange={(event) => setWorkflowFilter(event.target.value)}>
                    <option>Vsi</option>
                    {workflowStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>
            </section>
            <section className="grid cards">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={openEditProject}
                  onDelete={() => setProjects((current) => current.filter((item) => item.id !== project.id))}
                  onWorkflow={updateWorkflow}
                />
              ))}
            </section>
          </div>
        )}

        {activeTab === "Koledar" && (
          <section className="card">
            <h2>Termini in roki</h2>
            <div className="grid">
              {projects
                .flatMap((project) => [
                  { date: project.shootDate, label: `Fotografiranje: ${project.clientName}`, project },
                  { date: project.deliveryDue, label: `Rok oddaje: ${project.clientName}`, project }
                ])
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((item) => (
                  <div className="row card" key={`${item.label}-${item.date}`}>
                    <div>
                      <strong>{item.label}</strong>
                      <p className="muted">{dateLabel(item.date)} · {item.project.location}</p>
                    </div>
                    <Badge value={item.project.workflowStatus} />
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeTab === "Finance" && (
          <section className="card">
            <h2>Finance</h2>
            <div className="grid">
              {projects.map((project) => (
                <div className="row card" key={project.id}>
                  <div>
                    <strong>{project.clientName}</strong>
                    <p className="muted">{project.shootType}</p>
                  </div>
                  <div className="badges">
                    <span className="badge">{euro(project.amount)}</span>
                    <span className="badge red">Ostane {euro(balance(project))}</span>
                    <Badge value={project.paymentStatus} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Stranke" && (
          <section className="grid cards">
            {projects.map((project) => (
              <div className="card" key={project.id}>
                <h2>{project.clientName}</h2>
                <p className="muted">{project.email}</p>
                <p className="muted">{project.phone}</p>
                <button className="secondary" onClick={() => openEditProject(project)}>Odpri projekt</button>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Nastavitve" && (
          <section className="grid">
            <div className="card">
              <h2>Tipi fotografiranja</h2>
              <div className="form-grid">
                <label>
                  Nov tip
                  <input value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} placeholder="npr. Mini session" />
                </label>
                <label>
                  Delovni dnevi
                  <input type="number" value={newTypeDays} onChange={(event) => setNewTypeDays(Number(event.target.value))} />
                </label>
              </div>
              <p />
              <button
                className="primary"
                onClick={() => {
                  if (!newTypeName.trim()) return;
                  setTypes((current) => [...current, { name: newTypeName.trim(), workdays: newTypeDays }]);
                  setNewTypeName("");
                  setNewTypeDays(8);
                }}
              >
                Dodaj tip
              </button>
            </div>
            <div className="grid cards">
              {types.map((type) => (
                <div className="card setting-row" key={type.name}>
                  <div>
                    <strong>{type.name}</strong>
                    <p className="muted">{type.workdays} delovnih dni do oddaje</p>
                  </div>
                  <button className="danger" onClick={() => setTypes((current) => current.filter((item) => item.name !== type.name))}>Odstrani</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {tabs.slice(0, 5).map((tab) => (
          <button key={tab} className={`nav-button ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <p className="eyebrow">{editing ? "Urejanje" : "Nov projekt"}</p>
              <h2>{editing ? editing.clientName : "Dodaj projekt"}</h2>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Ime stranke" value={draft.clientName} onChange={(value) => updateDraft({ clientName: value })} />
                <label>
                  Tip fotografiranja
                  <select value={draft.shootType} onChange={(event) => setShootType(event.target.value)}>
                    {types.map((type) => <option key={type.name}>{type.name}</option>)}
                  </select>
                </label>
                <Field label="Email" value={draft.email} onChange={(value) => updateDraft({ email: value })} />
                <Field label="Telefon" value={draft.phone} onChange={(value) => updateDraft({ phone: value })} />
                <label>
                  Datum fotografiranja
                  <input type="date" value={draft.shootDate} onChange={(event) => setShootDate(event.target.value)} />
                </label>
                <label>
                  Delovni dnevi do oddaje
                  <input type="number" min="0" value={draft.deliveryWorkdays} onChange={(event) => setWorkdays(Number(event.target.value))} />
                </label>
                <label>
                  Rok oddaje
                  <input type="date" value={draft.deliveryDue} onChange={(event) => setDueDate(event.target.value)} />
                </label>
                <Field label="Lokacija" value={draft.location} onChange={(value) => updateDraft({ location: value })} />
                <label>
                  Workflow status
                  <select value={draft.workflowStatus} onChange={(event) => updateDraft({ workflowStatus: event.target.value as WorkflowStatus })}>
                    {workflowStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  Status plačila
                  <select value={draft.paymentStatus} onChange={(event) => updateDraft({ paymentStatus: event.target.value as PaymentStatus })}>
                    {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <NumberField label="Znesek" value={draft.amount} onChange={(value) => updateDraft({ amount: value })} />
                <NumberField label="Avans" value={draft.deposit} onChange={(value) => updateDraft({ deposit: value })} />
                <NumberField label="Izbrane fotografije" value={draft.selectedPhotos} onChange={(value) => updateDraft({ selectedPhotos: value })} />
                <div className="fact">
                  <span>Preostanek</span>
                  <strong>{euro(balance(draft))}</strong>
                </div>
                <Field label="Link do galerije" value={draft.galleryUrl} onChange={(value) => updateDraft({ galleryUrl: value })} />
                <Field label="Google Drive mapa" value={draft.driveUrl} onChange={(value) => updateDraft({ driveUrl: value })} />
                <label className="span-2">
                  Opombe
                  <textarea value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} />
                </label>
                <label className="span-2">
                  Opombe za retušo
                  <textarea value={draft.retouchNotes} onChange={(event) => updateDraft({ retouchNotes: event.target.value })} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary" onClick={() => setIsModalOpen(false)}>Prekliči</button>
              <button className="primary" onClick={saveProject}>Shrani</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <p className="muted">{title}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}

function ProjectRow({ project, onEdit }: { project: Project; onEdit: (project: Project) => void }) {
  return (
    <div className="row">
      <div>
        <strong>{project.clientName}</strong>
        <p className="muted">{project.shootType} · {dateLabel(project.shootDate)}</p>
      </div>
      <button className="secondary" onClick={() => onEdit(project)}>Odpri</button>
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onWorkflow
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: () => void;
  onWorkflow: (project: Project, status: WorkflowStatus) => void;
}) {
  return (
    <article className="card">
      <div className="project-head">
        <div>
          <h2>{project.clientName}</h2>
          <div className="badges">
            <Badge value={project.workflowStatus} />
            <Badge value={project.paymentStatus} />
          </div>
        </div>
        <div className="badges">
          <button className="secondary" onClick={() => onEdit(project)}>Uredi</button>
          <button className="danger" onClick={onDelete}>Izbriši</button>
        </div>
      </div>

      <p className="muted">{dateLabel(project.shootDate)} · {project.location}</p>
      <div className="facts">
        <div className="fact"><span>Znesek</span><strong>{euro(project.amount)}</strong></div>
        <div className="fact"><span>Avans</span><strong>{euro(project.deposit)}</strong></div>
        <div className="fact"><span>Ostane</span><strong>{euro(balance(project))}</strong></div>
      </div>

      <div className="fact" style={{ marginTop: 12 }}>
        <span>Hitri workflow</span>
        <div className="form-grid" style={{ marginTop: 8 }}>
          <select value={project.workflowStatus} onChange={(event) => onWorkflow(project, event.target.value as WorkflowStatus)}>
            {workflowStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <button className="secondary" onClick={() => onWorkflow(project, nextStatus(project.workflowStatus))}>
            Naslednji: {nextStatus(project.workflowStatus)}
          </button>
        </div>
      </div>
    </article>
  );
}

function Badge({ value }: { value: string }) {
  const tone =
    value === "Plačano" || value === "Zaključeno" || value === "Poslano"
      ? "green"
      : value === "Neplačano"
        ? "red"
        : value === "Delno plačano" || value === "Urejanje"
          ? "amber"
          : "";

  return <span className={`badge ${tone}`}>{value}</span>;
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
