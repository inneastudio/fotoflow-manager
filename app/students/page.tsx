"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  Clock,
  Mail,
  Plus,
  Send,
  Trash2,
  UserRound,
  WalletCards
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import {
  calculateShiftHours,
  useStudentSchedules
} from "@/lib/use-student-schedules";
import {
  paymentMethods,
  studentShiftBillingStatuses,
  studentWorkTypes,
  type PaymentMethod,
  type StudentShift,
  type StudentShiftBillingStatus,
  type StudentWorkType
} from "@/lib/types";
import { cn, formatCurrency, formatDate, toDateInputValue } from "@/lib/utils";

const studioOpenSlots = [
  { label: "Ponedeljek studio", dayIndex: 0, start: "10:00", end: "15:00" },
  { label: "Sreda studio", dayIndex: 2, start: "08:00", end: "17:00" },
  { label: "Petek studio", dayIndex: 4, start: "10:00", end: "13:00" }
];

function startOfWeek(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekDays(weekValue: string) {
  const monday = startOfWeek(weekValue);
  return Array.from({ length: 7 }).map((_, index) => addDays(monday, index));
}

function monthDays(month: string) {
  if (!month) return [];
  const [year, monthPart] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthPart, 0).getDate();

  return Array.from({ length: daysInMonth }).map(
    (_, index) => new Date(year, monthPart - 1, index + 1, 12)
  );
}

function weekLabel(weekValue: string) {
  const days = weekDays(weekValue);
  return `${formatDate(toDateInputValue(days[0]))} - ${formatDate(toDateInputValue(days[6]))}`;
}

function dayLabel(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("sl-SI", { weekday: "long" }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatDate(dateValue)}`;
}

function defaultWeekValue() {
  return toDateInputValue(startOfWeek(new Date().toISOString().slice(0, 10)));
}

function monthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function selectedYearValue(date = new Date()) {
  return String(date.getFullYear());
}

function isWithinMonth(dateValue: string, month: string) {
  if (!month) return false;
  const [yearValue, monthValuePart] = month.split("-");
  const date = new Date(`${dateValue}T12:00:00`);
  return (
    date.getFullYear() === Number(yearValue) &&
    date.getMonth() === Number(monthValuePart) - 1
  );
}

function isWithinYear(dateValue: string, year: string) {
  if (!year) return false;
  const date = new Date(`${dateValue}T12:00:00`);
  return date.getFullYear() === Number(year);
}

function monthLabel(value: string) {
  if (!value) return "Izbran mesec";
  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("sl-SI", {
    month: "long",
    year: "numeric"
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

function summarizeShifts(shiftsToSummarize: StudentShift[]) {
  const hours = shiftsToSummarize.reduce((sum, shift) => sum + Number(shift.hours || 0), 0);
  const amount = shiftsToSummarize.reduce((sum, shift) => sum + Number(shift.amount || 0), 0);
  const unpaid = shiftsToSummarize
    .filter((shift) => shift.billing_status !== "Plačano")
    .reduce((sum, shift) => sum + Number(shift.amount || 0), 0);

  return {
    shifts: shiftsToSummarize.length,
    hours,
    amount,
    unpaid
  };
}

function shouldSendShift(shift: StudentShift) {
  if (!shift.email_sent_at) return true;
  return new Date(shift.updated_at).getTime() > new Date(shift.email_sent_at).getTime();
}

function shiftRangeLabel(shiftsToLabel: StudentShift[]) {
  const dates = shiftsToLabel.map((shift) => shift.shift_date).sort();
  if (!dates.length) return "nove izmene";

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  if (firstDate === lastDate) {
    return `izmene za ${formatDate(firstDate)}`;
  }

  return `izmene od ${formatDate(firstDate)} do ${formatDate(lastDate)}`;
}

export default function StudentsPage() {
  const { session, demoMode } = useAuth();
  const {
    students,
    shifts,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    createShift,
    updateShift,
    deleteShift
  } = useStudentSchedules();
  const [selectedWeek, setSelectedWeek] = useState(defaultWeekValue());
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    hourly_rate: 7,
    notes: ""
  });
  const [shiftForm, setShiftForm] = useState({
    student_id: "",
    shift_date: defaultWeekValue(),
    start_time: "10:00",
    end_time: "15:00",
    work_type: "Studio" as StudentWorkType,
    hourly_rate: 7,
    billing_status: "Ni obračunano" as StudentShiftBillingStatus,
    payment_method: "TRR" as PaymentMethod,
    location: "Studio",
    notes: ""
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthValue());
  const [selectedYear, setSelectedYear] = useState(selectedYearValue());
  const [message, setMessage] = useState<string | null>(null);
  const [copyingCalendarLink, setCopyingCalendarLink] = useState(false);

  const activeStudents = students.filter((student) => student.active);
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const days = weekDays(selectedWeek);
  const weekStart = toDateInputValue(days[0]);
  const weekEnd = toDateInputValue(days[6]);
  const weekShifts = useMemo(
    () =>
      shifts.filter(
        (shift) =>
          shift.shift_date >= weekStart &&
          shift.shift_date <= weekEnd &&
          (!selectedStudentId || shift.student_id === selectedStudentId)
      ),
    [selectedStudentId, shifts, weekEnd, weekStart]
  );
  const totalHours = weekShifts.reduce((sum, shift) => sum + Number(shift.hours || 0), 0);
  const totalAmount = weekShifts.reduce((sum, shift) => sum + Number(shift.amount || 0), 0);
  const unpaidAmount = weekShifts
    .filter((shift) => shift.billing_status !== "Plačano")
    .reduce((sum, shift) => sum + Number(shift.amount || 0), 0);
  const filteredShifts = useMemo(
    () => shifts.filter((shift) => !selectedStudentId || shift.student_id === selectedStudentId),
    [selectedStudentId, shifts]
  );
  const monthShifts = useMemo(
    () => filteredShifts.filter((shift) => isWithinMonth(shift.shift_date, selectedMonth)),
    [filteredShifts, selectedMonth]
  );
  const yearShifts = useMemo(
    () => filteredShifts.filter((shift) => isWithinYear(shift.shift_date, selectedYear)),
    [filteredShifts, selectedYear]
  );
  const selectedMonthDays = useMemo(() => monthDays(selectedMonth), [selectedMonth]);
  const monthSummary = summarizeShifts(monthShifts);
  const yearSummary = summarizeShifts(yearShifts);
  const studentMonthlySummaries = students
    .map((student) => {
      const studentShifts = monthShifts.filter((shift) => shift.student_id === student.id);
      return {
        student,
        ...summarizeShifts(studentShifts)
      };
    })
    .filter((row) => row.shifts > 0);
  const studentYearlySummaries = students
    .map((student) => {
      const studentShifts = yearShifts.filter((shift) => shift.student_id === student.id);
      return {
        student,
        ...summarizeShifts(studentShifts)
      };
    })
    .filter((row) => row.shifts > 0);

  function studentName(studentId: string) {
    return students.find((student) => student.id === studentId)?.name ?? "Neznan študent";
  }

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentForm.name.trim()) return;
    setSavingStudent(true);
    setMessage(null);

    try {
      const student = await createStudent(studentForm);
      setSelectedStudentId(student.id);
      setShiftForm((current) => ({
        ...current,
        student_id: student.id,
        hourly_rate: student.hourly_rate
      }));
      setStudentForm({ name: "", email: "", phone: "", hourly_rate: 7, notes: "" });
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "Študenta ne morem shraniti.");
    } finally {
      setSavingStudent(false);
    }
  }

  async function handleCreateShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shiftForm.student_id) {
      setMessage("Najprej izberi študenta.");
      return;
    }
    setSavingShift(true);
    setMessage(null);

    try {
      await createShift(shiftForm);
      setShiftForm((current) => ({ ...current, notes: "" }));
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "Izmene ne morem shraniti.");
    } finally {
      setSavingShift(false);
    }
  }

  function applyStudioSlot(slot: (typeof studioOpenSlots)[number]) {
    const date = toDateInputValue(days[slot.dayIndex]);
    const rate = selectedStudent?.hourly_rate ?? shiftForm.hourly_rate;
    setShiftForm((current) => ({
      ...current,
      student_id: selectedStudentId || current.student_id,
      shift_date: date,
      start_time: slot.start,
      end_time: slot.end,
      work_type: "Studio",
      hourly_rate: rate,
      location: "Studio"
    }));
  }

  async function sendWeeklySchedule() {
    setMessage(null);
    const shiftsByStudent = activeStudents
      .map((student) => {
        const studentShifts = shifts
          .filter(
            (shift) =>
              shift.student_id === student.id &&
              shouldSendShift(shift)
          )
          .sort((a, b) => a.shift_date.localeCompare(b.shift_date) || a.start_time.localeCompare(b.start_time));

        return {
          student,
          shifts: studentShifts
        };
      })
      .filter((row) => row.student.email && row.shifts.length);

    if (!shiftsByStudent.length) {
      setMessage("Ni novih ali spremenjenih izmen za pošiljanje.");
      return;
    }

    if (!demoMode && !session?.access_token) {
      setMessage("Za pošiljanje urnika moraš biti prijavljen.");
      return;
    }

    const shiftsToSend = shiftsByStudent.flatMap((row) => row.shifts);
    const scheduleLabel = shiftRangeLabel(shiftsToSend);

    const response = await fetch("/api/students/schedule-email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify({
        weekLabel: scheduleLabel,
        students: shiftsByStudent.map(({ student, shifts: studentShifts }) => ({
          name: student.name,
          email: student.email,
          shifts: studentShifts.map((shift) => ({
            dateLabel: dayLabel(shift.shift_date),
            start_time: shift.start_time,
            end_time: shift.end_time,
            work_type: shift.work_type,
            location: shift.location,
            notes: shift.notes
          }))
        }))
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Pošiljanje ni uspelo.");
      return;
    }

    await Promise.all(
      shiftsByStudent.flatMap((row) =>
        row.shifts.map((shift) => updateShift(shift.id, { email_sent_at: new Date().toISOString() }))
      )
    );
    setMessage(
      `Nove/spremenjene izmene poslane študentom: ${result.sent}. Potrditev je bila poslana tudi tebi.`
    );
  }

  async function copyGoogleCalendarLink() {
    setMessage(null);
    setCopyingCalendarLink(true);

    try {
      if (!demoMode && !session?.access_token) {
        setMessage("Za Google Calendar link moraš biti prijavljen.");
        return;
      }

      const response = await fetch("/api/students/calendar-link", {
        headers: {
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {})
        }
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Google Calendar linka ni bilo mogoče pripraviti.");
        return;
      }

      await navigator.clipboard.writeText(result.url);
      setMessage(
        "Google Calendar link je kopiran. V Google Calendar izberi Other calendars > From URL in prilepi link."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Google Calendar linka ni bilo mogoče kopirati."
      );
    } finally {
      setCopyingCalendarLink(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Študenti"
        title="Urniki in obračun"
        description="Planiraj tedenske izmene, obračunaj ure in pošlji urnik študentom po emailu."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              className="button-secondary"
              disabled={copyingCalendarLink}
              type="button"
              onClick={copyGoogleCalendarLink}
            >
              <CalendarPlus className="h-4 w-4" />
              {copyingCalendarLink ? "Pripravljam ..." : "Google Calendar"}
            </button>
            <button className="button-primary" type="button" onClick={sendWeeklySchedule}>
              <Send className="h-4 w-4" />
              Pošlji nove izmene
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Aktivni študenti" value={String(activeStudents.length)} detail="Za planiranje izmen" icon={UserRound} tone="charcoal" />
        <MetricCard label="Izmene ta teden" value={String(weekShifts.length)} detail={weekLabel(selectedWeek)} icon={CalendarDays} tone="clay" />
        <MetricCard label="Skupaj ur" value={`${totalHours.toFixed(1)} h`} detail="Po izbranem filtru" icon={Clock} tone="olive" />
        <MetricCard label="Za izplačilo" value={formatCurrency(unpaidAmount)} detail={`Skupaj ${formatCurrency(totalAmount)}`} icon={WalletCards} tone="rose" />
      </section>

      {message || error ? (
        <p className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-medium text-ink">
          {message ?? error}
        </p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="surface rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Študenti</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Ekipa</h2>
              </div>
              <UserRound className="h-5 w-5 text-muted" />
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleCreateStudent}>
              <input className="input" value={studentForm.name} onChange={(event) => setStudentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ime študenta" />
              <input className="input" value={studentForm.email} onChange={(event) => setStudentForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" type="email" />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" value={studentForm.phone} onChange={(event) => setStudentForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Telefon" />
                <input className="input" min="0" step="0.5" type="number" value={studentForm.hourly_rate} onChange={(event) => setStudentForm((current) => ({ ...current, hourly_rate: Number(event.target.value) }))} placeholder="€/h" />
              </div>
              <input className="input" value={studentForm.notes} onChange={(event) => setStudentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Opombe" />
              <button className="button-primary w-full justify-center" disabled={savingStudent} type="submit">
                <Plus className="h-4 w-4" />
                Dodaj študenta
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {loading ? (
                <p className="rounded-lg border border-line p-3 text-sm text-muted">Nalagam ...</p>
              ) : students.length ? (
                students.map((student) => (
                  <div
                    key={student.id}
                    className={cn(
                      "rounded-lg border px-3 py-3 transition",
                      selectedStudentId === student.id
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:bg-mist"
                    )}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setShiftForm((current) => ({
                          ...current,
                          student_id: student.id,
                          hourly_rate: student.hourly_rate
                        }));
                      }}
                      type="button"
                    >
                      <span className="block font-semibold">{student.name}</span>
                      <span className={cn("mt-1 block text-xs", selectedStudentId === student.id ? "text-white/75" : "text-muted")}>
                        {student.email || "Brez emaila"} · {formatCurrency(student.hourly_rate)}/h
                      </span>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-semibold",
                          selectedStudentId === student.id
                            ? "border-white/20 text-white/80"
                            : "border-line text-muted"
                        )}
                        onClick={() => updateStudent(student.id, { active: !student.active })}
                        type="button"
                      >
                        {student.active ? "Aktiven" : "Neaktiven"}
                      </button>
                      <button
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-semibold",
                          selectedStudentId === student.id
                            ? "border-white/20 text-white/80"
                            : "border-line text-rose"
                        )}
                        onClick={() => deleteStudent(student.id)}
                        type="button"
                      >
                        Izbriši
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-line p-3 text-sm text-muted">Dodaj prvega študenta.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="surface rounded-lg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Teden</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{weekLabel(selectedWeek)}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <input className="input w-44" type="date" value={selectedWeek} onChange={(event) => setSelectedWeek(toDateInputValue(startOfWeek(event.target.value)))} />
                <select className="input w-52" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                  <option value="">Vsi študenti</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {studioOpenSlots.map((slot) => (
                <button className="button-secondary" key={slot.label} type="button" onClick={() => applyStudioSlot(slot)}>
                  {slot.label} {slot.start}-{slot.end}
                </button>
              ))}
            </div>

            <form className="mt-5 grid gap-3 lg:grid-cols-12" onSubmit={handleCreateShift}>
              <label className="lg:col-span-3">
                <span className="label">Študent</span>
                <select className="input mt-2" value={shiftForm.student_id} onChange={(event) => {
                  const student = students.find((item) => item.id === event.target.value);
                  setShiftForm((current) => ({
                    ...current,
                    student_id: event.target.value,
                    hourly_rate: student?.hourly_rate ?? current.hourly_rate
                  }));
                  setSelectedStudentId(event.target.value);
                }}>
                  <option value="">Izberi</option>
                  {activeStudents.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </label>
              <label className="lg:col-span-2">
                <span className="label">Datum</span>
                <input className="input mt-2" type="date" value={shiftForm.shift_date} onChange={(event) => setShiftForm((current) => ({ ...current, shift_date: event.target.value }))} />
              </label>
              <label className="lg:col-span-2">
                <span className="label">Od</span>
                <input className="input mt-2" type="time" value={shiftForm.start_time} onChange={(event) => setShiftForm((current) => ({ ...current, start_time: event.target.value }))} />
              </label>
              <label className="lg:col-span-2">
                <span className="label">Do</span>
                <input className="input mt-2" type="time" value={shiftForm.end_time} onChange={(event) => setShiftForm((current) => ({ ...current, end_time: event.target.value }))} />
              </label>
              <label className="lg:col-span-3">
                <span className="label">Tip dela</span>
                <select className="input mt-2" value={shiftForm.work_type} onChange={(event) => setShiftForm((current) => ({ ...current, work_type: event.target.value as StudentWorkType }))}>
                  {studentWorkTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="lg:col-span-2">
                <span className="label">€/h</span>
                <input className="input mt-2" min="0" step="0.5" type="number" value={shiftForm.hourly_rate} onChange={(event) => setShiftForm((current) => ({ ...current, hourly_rate: Number(event.target.value) }))} />
              </label>
              <label className="lg:col-span-2">
                <span className="label">Obračun</span>
                <select className="input mt-2" value={shiftForm.billing_status} onChange={(event) => setShiftForm((current) => ({ ...current, billing_status: event.target.value as StudentShiftBillingStatus }))}>
                  {studentShiftBillingStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="lg:col-span-2">
                <span className="label">Plačilo</span>
                <select className="input mt-2" value={shiftForm.payment_method} onChange={(event) => setShiftForm((current) => ({ ...current, payment_method: event.target.value as PaymentMethod }))}>
                  {paymentMethods.map((method) => <option key={method}>{method}</option>)}
                </select>
              </label>
              <label className="lg:col-span-3">
                <span className="label">Lokacija</span>
                <input className="input mt-2" value={shiftForm.location} onChange={(event) => setShiftForm((current) => ({ ...current, location: event.target.value }))} />
              </label>
              <label className="lg:col-span-3">
                <span className="label">Opomba</span>
                <input className="input mt-2" value={shiftForm.notes} onChange={(event) => setShiftForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
              <div className="flex items-end justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 lg:col-span-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Izračun</p>
                  <p className="font-display text-2xl font-semibold text-ink">
                    {formatCurrency(calculateShiftHours(shiftForm.start_time, shiftForm.end_time) * shiftForm.hourly_rate)}
                  </p>
                </div>
                <button className="button-primary" disabled={savingShift} type="submit">
                  Dodaj
                </button>
              </div>
            </form>
          </section>

          <section className="surface rounded-lg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="eyebrow">Obračun</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  Mesečni in letni pregled
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Pregled se upošteva po datumu izmene in izbranem študentu zgoraj.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  className="input w-44"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
                <input
                  className="input w-32"
                  min="2020"
                  max="2035"
                  type="number"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Mesec izmene"
                value={String(monthSummary.shifts)}
                detail={monthLabel(selectedMonth)}
                icon={CalendarDays}
                tone="charcoal"
              />
              <MetricCard
                label="Mesec ure"
                value={`${monthSummary.hours.toFixed(1)} h`}
                detail={formatCurrency(monthSummary.amount)}
                icon={Clock}
                tone="olive"
              />
              <MetricCard
                label="Leto izmene"
                value={String(yearSummary.shifts)}
                detail={selectedYear}
                icon={BarChart3}
                tone="clay"
              />
              <MetricCard
                label="Leto za izplačilo"
                value={formatCurrency(yearSummary.unpaid)}
                detail={`Skupaj ${formatCurrency(yearSummary.amount)}`}
                icon={WalletCards}
                tone="rose"
              />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <SummaryTable
                title={`Po študentih - ${monthLabel(selectedMonth)}`}
                rows={studentMonthlySummaries}
              />
              <SummaryTable
                title={`Po študentih - ${selectedYear}`}
                rows={studentYearlySummaries}
              />
            </div>
          </section>

          <section className="surface rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Izmene</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  Mesečni pregled izmen
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {monthLabel(selectedMonth)} · {monthSummary.shifts} izmen · {monthSummary.hours.toFixed(1)} h
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-muted" />
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-line">
              {selectedMonthDays.map((day) => {
                const dateValue = toDateInputValue(day);
                const dayShifts = monthShifts.filter((shift) => shift.shift_date === dateValue);

                return (
                  <div key={dateValue} className="border-b border-line last:border-b-0">
                    <div className="flex items-center justify-between gap-3 bg-mist px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{dayLabel(dateValue)}</p>
                      {dayShifts.length ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                          {dayShifts.length} izmen
                        </p>
                      ) : null}
                    </div>
                    {dayShifts.length ? (
                      <div className="divide-y divide-line">
                        {dayShifts.map((shift) => (
                          <ShiftRow
                            key={shift.id}
                            shift={shift}
                            studentName={studentName(shift.student_id)}
                            updateShift={updateShift}
                            deleteShift={deleteShift}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted">Ni vpisanih izmen.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Izmene</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Tedenski pregled</h2>
              </div>
              <Mail className="h-5 w-5 text-muted" />
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-line">
              {days.map((day) => {
                const dateValue = toDateInputValue(day);
                const dayShifts = weekShifts.filter((shift) => shift.shift_date === dateValue);

                return (
                  <div key={dateValue} className="border-b border-line last:border-b-0">
                    <div className="bg-mist px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{dayLabel(dateValue)}</p>
                    </div>
                    {dayShifts.length ? (
                      <div className="divide-y divide-line">
                        {dayShifts.map((shift) => (
                          <ShiftRow
                            key={shift.id}
                            shift={shift}
                            studentName={studentName(shift.student_id)}
                            updateShift={updateShift}
                            deleteShift={deleteShift}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-4 text-sm text-muted">Ni vpisanih izmen.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SummaryTable({
  title,
  rows
}: {
  title: string;
  rows: Array<{
    student: { id: string; name: string };
    shifts: number;
    hours: number;
    amount: number;
    unpaid: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="border-b border-line bg-mist px-4 py-3">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      </div>
      {rows.length ? (
        <div className="divide-y divide-line">
          {rows.map((row) => (
            <div
              key={row.student.id}
              className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1.3fr_0.7fr_0.8fr_1fr_1fr] sm:items-center"
            >
              <p className="font-semibold text-ink">{row.student.name}</p>
              <p className="text-muted">{row.shifts} izmen</p>
              <p className="text-muted">{row.hours.toFixed(1)} h</p>
              <p className="font-semibold text-ink">{formatCurrency(row.amount)}</p>
              <p className={cn("font-semibold", row.unpaid > 0 ? "text-rose" : "text-olive")}>
                {row.unpaid > 0 ? `${formatCurrency(row.unpaid)} odprto` : "Plačano"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-muted">Ni izmen za izbrani pregled.</p>
      )}
    </div>
  );
}

function ShiftRow({
  shift,
  studentName,
  updateShift,
  deleteShift
}: {
  shift: StudentShift;
  studentName: string;
  updateShift: (shiftId: string, values: Partial<StudentShift>) => Promise<StudentShift | null>;
  deleteShift: (shiftId: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-3 px-4 py-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr_auto] lg:items-center">
      <div>
        <p className="font-semibold text-ink">{studentName}</p>
        <p className="mt-1 text-sm text-muted">
          {shift.start_time}-{shift.end_time} · {shift.hours} h
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{shift.work_type}</p>
        <p className="mt-1 text-sm text-muted">{shift.location}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{formatCurrency(shift.amount)}</p>
        <p className="mt-1 text-sm text-muted">{formatCurrency(shift.hourly_rate)}/h</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <select
          className="input"
          value={shift.billing_status}
          onChange={(event) =>
            updateShift(shift.id, {
              billing_status: event.target.value as StudentShiftBillingStatus
            })
          }
        >
          {studentShiftBillingStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          className="input"
          value={shift.payment_method}
          onChange={(event) =>
            updateShift(shift.id, { payment_method: event.target.value as PaymentMethod })
          }
        >
          {paymentMethods.map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="button-secondary px-3 py-2"
          type="button"
          onClick={() => updateShift(shift.id, { billing_status: "Plačano" })}
        >
          Plačano
        </button>
        <button
          className="button-secondary px-3 py-2 text-rose"
          type="button"
          onClick={() => deleteShift(shift.id)}
          aria-label="Izbriši izmeno"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {shift.notes ? <p className="text-sm text-muted lg:col-span-5">{shift.notes}</p> : null}
    </div>
  );
}
