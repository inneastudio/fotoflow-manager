"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type {
  PaymentMethod,
  Student,
  StudentShift,
  StudentShiftBillingStatus,
  StudentWorkType
} from "@/lib/types";

const STUDENTS_STORAGE_KEY = "fotoflow-manager-students";
const SHIFTS_STORAGE_KEY = "fotoflow-manager-student-shifts";

export type StudentFormValues = {
  name: string;
  email: string;
  phone: string;
  hourly_rate: number;
  notes: string;
};

export type StudentShiftFormValues = {
  student_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  work_type: StudentWorkType;
  hourly_rate: number;
  billing_status: StudentShiftBillingStatus;
  payment_method: PaymentMethod;
  location: string;
  notes: string;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return Number(hours || 0) * 60 + Number(minutes || 0);
}

export function calculateShiftHours(startTime: string, endTime: string) {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Math.max(Math.round((diff / 60) * 100) / 100, 0);
}

function ensureStudentShape(student: Student): Student {
  return {
    ...student,
    name: student.name ?? "",
    email: student.email ?? "",
    phone: student.phone ?? "",
    hourly_rate: Math.max(Number(student.hourly_rate ?? 0), 0),
    active: student.active ?? true,
    notes: student.notes ?? ""
  };
}

function ensureShiftShape(shift: StudentShift): StudentShift {
  const hours = Number(shift.hours ?? calculateShiftHours(shift.start_time, shift.end_time));
  const hourlyRate = Math.max(Number(shift.hourly_rate ?? 0), 0);

  return {
    ...shift,
    shift_date: shift.shift_date ?? new Date().toISOString().slice(0, 10),
    start_time: shift.start_time ?? "10:00",
    end_time: shift.end_time ?? "15:00",
    work_type: shift.work_type ?? "Studio",
    hourly_rate: hourlyRate,
    hours,
    amount: Number(shift.amount ?? hours * hourlyRate),
    billing_status: shift.billing_status ?? "Ni obračunano",
    payment_method: shift.payment_method ?? "TRR",
    location: shift.location ?? "Studio",
    notes: shift.notes ?? "",
    email_sent_at: shift.email_sent_at ?? null
  };
}

function readLocal<T>(key: string, ensureShape: (value: T) => T) {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as T[];
    return Array.isArray(parsed) ? parsed.map(ensureShape) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, values: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

function sortStudents(a: Student, b: Student) {
  return a.name.localeCompare(b.name, "sl");
}

function sortShifts(a: StudentShift, b: StudentShift) {
  return (
    a.shift_date.localeCompare(b.shift_date) ||
    a.start_time.localeCompare(b.start_time)
  );
}

function buildStudent(values: StudentFormValues, existing?: Student): Student {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    hourly_rate: Math.max(Number(values.hourly_rate || 0), 0),
    active: existing?.active ?? true,
    notes: values.notes.trim(),
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function buildShift(values: StudentShiftFormValues, existing?: StudentShift): StudentShift {
  const now = new Date().toISOString();
  const hours = calculateShiftHours(values.start_time, values.end_time);
  const hourlyRate = Math.max(Number(values.hourly_rate || 0), 0);

  return {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: existing?.user_id ?? null,
    student_id: values.student_id,
    shift_date: values.shift_date,
    start_time: values.start_time,
    end_time: values.end_time,
    work_type: values.work_type,
    hourly_rate: hourlyRate,
    hours,
    amount: Math.round(hours * hourlyRate * 100) / 100,
    billing_status: values.billing_status,
    payment_method: values.payment_method,
    location: values.location.trim(),
    notes: values.notes.trim(),
    email_sent_at: existing?.email_sent_at ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };
}

function studentUpdatePayload(student: Student) {
  return {
    user_id: student.user_id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    hourly_rate: student.hourly_rate,
    active: student.active,
    notes: student.notes,
    updated_at: student.updated_at
  };
}

function shiftUpdatePayload(shift: StudentShift) {
  return {
    user_id: shift.user_id,
    student_id: shift.student_id,
    shift_date: shift.shift_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    work_type: shift.work_type,
    hourly_rate: shift.hourly_rate,
    hours: shift.hours,
    amount: shift.amount,
    billing_status: shift.billing_status,
    payment_method: shift.payment_method,
    location: shift.location,
    notes: shift.notes,
    email_sent_at: shift.email_sent_at,
    updated_at: shift.updated_at
  };
}

export function useStudentSchedules() {
  const { user, demoMode, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [shifts, setShifts] = useState<StudentShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      if (!supabase || demoMode) {
        setStudents(readLocal<Student>(STUDENTS_STORAGE_KEY, ensureStudentShape).sort(sortStudents));
        setShifts(readLocal<StudentShift>(SHIFTS_STORAGE_KEY, ensureShiftShape).sort(sortShifts));
        setLoading(false);
        return;
      }

      if (!user) {
        setStudents([]);
        setShifts([]);
        setLoading(false);
        return;
      }

      const [studentsResult, shiftsResult] = await Promise.all([
        supabase.from("students").select("*").order("name", { ascending: true }),
        supabase.from("student_shifts").select("*").order("shift_date", { ascending: true })
      ]);

      if (studentsResult.error || shiftsResult.error) {
        setError(studentsResult.error?.message ?? shiftsResult.error?.message ?? "Napaka pri nalaganju urnikov.");
        setStudents([]);
        setShifts([]);
      } else {
        setStudents((studentsResult.data ?? []).map(ensureStudentShape).sort(sortStudents));
        setShifts((shiftsResult.data ?? []).map(ensureShiftShape).sort(sortShifts));
      }

      setLoading(false);
    }

    loadData();
  }, [authLoading, demoMode, user]);

  const createStudent = useCallback(
    async (values: StudentFormValues) => {
      const student = buildStudent(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("students")
          .insert({ ...student, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const saved = ensureStudentShape(data);
        setStudents((current) => [...current, saved].sort(sortStudents));
        return saved;
      }

      setStudents((current) => {
        const next = [...current, student].sort(sortStudents);
        writeLocal(STUDENTS_STORAGE_KEY, next);
        return next;
      });

      return student;
    },
    [demoMode, user]
  );

  const updateStudent = useCallback(
    async (studentId: string, values: Partial<Student>) => {
      const currentStudent = students.find((student) => student.id === studentId);
      if (!currentStudent) return null;
      const updated = ensureStudentShape({
        ...currentStudent,
        ...values,
        updated_at: new Date().toISOString()
      });

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("students")
          .update(studentUpdatePayload(updated))
          .eq("id", studentId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const saved = ensureStudentShape(data);
        setStudents((current) =>
          current.map((student) => (student.id === studentId ? saved : student)).sort(sortStudents)
        );
        return saved;
      }

      setStudents((current) => {
        const next = current.map((student) => (student.id === studentId ? updated : student)).sort(sortStudents);
        writeLocal(STUDENTS_STORAGE_KEY, next);
        return next;
      });

      return updated;
    },
    [demoMode, students, user]
  );

  const deleteStudent = useCallback(
    async (studentId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase.from("students").delete().eq("id", studentId);
        if (mutationError) throw new Error(mutationError.message);
      }

      setStudents((current) => {
        const next = current.filter((student) => student.id !== studentId);
        writeLocal(STUDENTS_STORAGE_KEY, next);
        return next;
      });
      setShifts((current) => {
        const next = current.filter((shift) => shift.student_id !== studentId);
        writeLocal(SHIFTS_STORAGE_KEY, next);
        return next;
      });
    },
    [demoMode, user]
  );

  const createShift = useCallback(
    async (values: StudentShiftFormValues) => {
      const shift = buildShift(values);

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("student_shifts")
          .insert({ ...shift, user_id: user.id })
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const saved = ensureShiftShape(data);
        setShifts((current) => [...current, saved].sort(sortShifts));
        return saved;
      }

      setShifts((current) => {
        const next = [...current, shift].sort(sortShifts);
        writeLocal(SHIFTS_STORAGE_KEY, next);
        return next;
      });

      return shift;
    },
    [demoMode, user]
  );

  const updateShift = useCallback(
    async (shiftId: string, values: Partial<StudentShift>) => {
      const currentShift = shifts.find((shift) => shift.id === shiftId);
      if (!currentShift) return null;
      const updated = ensureShiftShape({
        ...currentShift,
        ...values,
        updated_at: new Date().toISOString()
      });

      if (supabase && user && !demoMode) {
        const { data, error: mutationError } = await supabase
          .from("student_shifts")
          .update(shiftUpdatePayload(updated))
          .eq("id", shiftId)
          .select()
          .single();

        if (mutationError) throw new Error(mutationError.message);
        const saved = ensureShiftShape(data);
        setShifts((current) =>
          current.map((shift) => (shift.id === shiftId ? saved : shift)).sort(sortShifts)
        );
        return saved;
      }

      setShifts((current) => {
        const next = current.map((shift) => (shift.id === shiftId ? updated : shift)).sort(sortShifts);
        writeLocal(SHIFTS_STORAGE_KEY, next);
        return next;
      });

      return updated;
    },
    [demoMode, shifts, user]
  );

  const deleteShift = useCallback(
    async (shiftId: string) => {
      if (supabase && user && !demoMode) {
        const { error: mutationError } = await supabase.from("student_shifts").delete().eq("id", shiftId);
        if (mutationError) throw new Error(mutationError.message);
      }

      setShifts((current) => {
        const next = current.filter((shift) => shift.id !== shiftId);
        writeLocal(SHIFTS_STORAGE_KEY, next);
        return next;
      });
    },
    [demoMode, user]
  );

  return useMemo(
    () => ({
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
    }),
    [
      createShift,
      createStudent,
      deleteShift,
      deleteStudent,
      error,
      loading,
      shifts,
      students,
      updateShift,
      updateStudent
    ]
  );
}
