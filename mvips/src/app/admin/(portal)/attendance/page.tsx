"use client";

import {
  AlertCircle, CalendarDays, CheckCircle2, ChevronDown, ClipboardList,
  Eye, History, Loader2, Lock, RefreshCw, Save, Search, ShieldAlert,
  Users, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ============================================================
 * CONFIG
 * ============================================================ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

const ALLOWED_ROLES = [
  "admin", "administrator",
  "headteacher", "principal",
  "admissions_officer",
  "bursar", "finance", "accountant",
  "hod", "head_of_department",
  "lead_teacher", "class_teacher", "assistant_teacher",
  "teacher", "subject_teacher", "teaching_assistant", "ta",
  "stream_lead", "club_lead",
];

type Status = "present" | "absent" | "late" | "excused" | "sick";

interface SectionLite {
  id: number;
  name: string;
  school_class_id: number;
  school_class_name?: string;
  stream_id: number;
  stream_name?: string;
  stream_colour?: string | null;
  can_mark: boolean;
}

interface RosterStudent {
  id: number;
  student_number: string;
  full_name: string;
  surname: string;
  photo_url: string | null;
  status: Status;
  remarks: string | null;
  marked: boolean;
}

interface RegisterMeta {
  id: number;
  status: string;
  marked_at: string | null;
  marked_by_name: string | null;
}

interface RosterResponse {
  date: string;
  is_today: boolean;
  class_stream: {
    id: number;
    name: string;
    school_class_name?: string;
    stream_name?: string;
    stream_colour?: string | null;
  };
  academic_year: { id: number; name: string } | null;
  register: RegisterMeta | null;
  students: RosterStudent[];
  statuses: Status[];
  can_mark: boolean;
  can_edit: boolean;
}

interface HistoryRow {
  id: number;
  date: string;
  status: string;
  marked_at: string | null;
  marked_by_name: string | null;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  sick_count: number;
  total_count: number;
  is_holiday: boolean;
}

interface SummaryStudent {
  student_id: number;
  student_number: string;
  full_name: string;
  photo_url: string | null;
  days_attended: number;
  days_present: number;
  days_late: number;
  days_absent: number;
  days_excused: number;
  days_sick: number;
  total_school_days: number;
  percentage: number;
}

interface SummaryResponse {
  class_stream: { id: number; name: string };
  period: { from: string | null; to: string };
  total_school_days: number;
  total_holiday_days: number;
  holiday_dates: string[];
  students: SummaryStudent[];
}

type Result = {
  type: "success" | "error";
  title: string;
  message: string;
};

/* ============================================================
 * HELPERS
 * ============================================================ */

function authHeaders(extra: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_META: Record<
  Status,
  { label: string; short: string; className: string; pill: string }
> = {
  present: { label: "Present", short: "P", className: "bg-emerald-500 text-white border-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  absent:  { label: "Absent",  short: "A", className: "bg-red-500 text-white border-red-500",         pill: "bg-red-50 text-red-700" },
  late:    { label: "Late",    short: "L", className: "bg-amber-500 text-white border-amber-500",     pill: "bg-amber-50 text-amber-700" },
  excused: { label: "Excused", short: "E", className: "bg-blue-500 text-white border-blue-500",       pill: "bg-blue-50 text-blue-700" },
  sick:    { label: "Sick",    short: "S", className: "bg-purple-500 text-white border-purple-500",   pill: "bg-purple-50 text-purple-700" },
};

const ALL_STATUSES: Status[] = ["present", "absent", "late", "excused", "sick"];

/* ============================================================
 * PAGE
 * ============================================================ */

export default function AttendancePage() {
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("admin_user");
    if (!raw) {
      window.location.href = "/admin/login";
      return;
    }
    try {
      const user = JSON.parse(raw);
      const role = String(user.role ?? "").toLowerCase();
      setIsAllowed(ALLOWED_ROLES.includes(role));
      setRoleChecked(true);
    } catch {
      window.location.href = "/admin/login";
    }
  }, []);

  if (!roleChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin text-[#F58220]" />
          Checking your permissions...
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <ShieldAlert size={26} className="text-red-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#172033]">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-500">
            Attendance registers are only available to teaching staff, admin,
            headteacher, admissions officer, and bursar.
          </p>
          <a
            href="/admin/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255]"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <AttendanceInner />;
}

/* ============================================================
 * INNER
 * ============================================================ */

function AttendanceInner() {
  const [sections, setSections] = useState<SectionLite[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [tab, setTab] = useState<"mark" | "history" | null>(null);

  const loadSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/attendance/sections`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setSections(data.data ?? []);
    } catch {
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const markableSections = useMemo(
    () => sections.filter((s) => s.can_mark),
    [sections]
  );
  const hasMarkableSection = markableSections.length > 0;

  // Choose the initial tab once sections load (only once), and if the
  // user cannot mark anything, force them onto History.
  useEffect(() => {
    if (sectionsLoading) return;

    if (tab === null) {
      setTab(hasMarkableSection ? "mark" : "history");
    } else if (tab === "mark" && !hasMarkableSection) {
      setTab("history");
    }
  }, [sectionsLoading, hasMarkableSection, tab]);

  if (sectionsLoading || tab === null) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">Loading your attendance workspace...</p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F58220]" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          {hasMarkableSection
            ? "Mark today's registers or review historical attendance for your classes."
            : "Review historical attendance registers across the school."}
        </p>
      </div>

      {hasMarkableSection && (
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <TabButton active={tab === "mark"} onClick={() => setTab("mark")} icon={<ClipboardList size={16} />}>
            Mark Register
          </TabButton>
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<History size={16} />}>
            View History
          </TabButton>
        </div>
      )}

      {tab === "mark" && hasMarkableSection && (
        <MarkTab
          markableSections={markableSections}
          sectionsLoading={sectionsLoading}
          refreshSections={loadSections}
        />
      )}
      {tab === "history" && (
        <HistoryTab sections={sections} sectionsLoading={sectionsLoading} />
      )}
    </div>
  );
}

/* ============================================================
 * TAB 1 — MARK REGISTER
 * ============================================================ */

function MarkTab({
  markableSections,
  sectionsLoading,
  refreshSections,
}: {
  markableSections: SectionLite[];
  sectionsLoading: boolean;
  refreshSections: () => Promise<void>;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "status" | "number">("name");

  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");

  const [draft, setDraft] = useState<Record<number, { status: Status; remarks: string }>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (selectedSectionId === null && markableSections.length > 0) {
      setSelectedSectionId(markableSections[0].id);
    }
  }, [markableSections, selectedSectionId]);

  useEffect(() => {
    if (!selectedSectionId) {
      setRoster(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setRosterLoading(true);
      setRosterError("");
      try {
        const params = new URLSearchParams({ date });
        const res = await fetch(
          `${API_URL}/api/admin/attendance/sections/${selectedSectionId}?${params.toString()}`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Load failed");
        if (cancelled) return;

        setRoster(data.data as RosterResponse);

        const seed: Record<number, { status: Status; remarks: string }> = {};
        for (const s of data.data.students as RosterStudent[]) {
          seed[s.id] = { status: s.status, remarks: s.remarks ?? "" };
        }
        setDraft(seed);
        setDirty(false);
      } catch (e: any) {
        if (!cancelled) setRosterError(e?.message || "Could not load roster.");
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, date]);

  const canEdit = !!roster?.can_edit;

  function setStatus(studentId: number, status: Status) {
    if (!canEdit) return;
    setDraft((d) => ({
      ...d,
      [studentId]: { status, remarks: d[studentId]?.remarks ?? "" },
    }));
    setDirty(true);
  }

  function setRemarks(studentId: number, remarks: string) {
    if (!canEdit) return;
    setDraft((d) => ({
      ...d,
      [studentId]: { status: d[studentId]?.status ?? "present", remarks },
    }));
    setDirty(true);
  }

  function markAll(status: Status) {
    if (!canEdit || !roster) return;
    const next: Record<number, { status: Status; remarks: string }> = {};
    for (const s of roster.students) {
      next[s.id] = { status, remarks: draft[s.id]?.remarks ?? "" };
    }
    setDraft(next);
    setDirty(true);
  }

  async function saveRegister() {
    if (!roster || !selectedSectionId || !canEdit) return;

    setSaving(true);
    try {
      const records = Object.entries(draft).map(([studentId, v]) => ({
        student_id: Number(studentId),
        status: v.status,
        remarks: v.remarks || null,
      }));

      if (records.length === 0) throw new Error("Nothing to save — roster is empty.");

      const res = await fetch(
        `${API_URL}/api/admin/attendance/sections/${selectedSectionId}`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ date, records }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");

      setResult({
        type: "success",
        title: "Register Saved",
        message: `Attendance for ${roster.class_stream.name} on ${date} has been recorded.`,
      });
      setDirty(false);

      const params = new URLSearchParams({ date });
      const fresh = await fetch(
        `${API_URL}/api/admin/attendance/sections/${selectedSectionId}?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      ).then((r) => r.json());
      if (fresh?.data) setRoster(fresh.data as RosterResponse);

      await refreshSections();
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const counts = useMemo(() => {
    const base: Record<Status, number> = { present: 0, absent: 0, late: 0, excused: 0, sick: 0 };
    if (!roster) return base;
    for (const s of roster.students) {
      const status = draft[s.id]?.status ?? s.status;
      base[status]++;
    }
    return base;
  }, [roster, draft]);

  const visibleStudents = useMemo(() => {
    if (!roster) return [];
    let list = roster.students;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.student_number.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sort === "number") {
      sorted.sort((a, b) => a.student_number.localeCompare(b.student_number));
    } else if (sort === "status") {
      const order: Record<Status, number> = { absent: 0, sick: 1, excused: 2, late: 3, present: 4 };
      sorted.sort((a, b) => {
        const sa = draft[a.id]?.status ?? a.status;
        const sb = draft[b.id]?.status ?? b.status;
        return order[sa] - order[sb];
      });
    }
    return sorted;
  }, [roster, search, sort, draft]);

  const totalStudents = roster?.students.length ?? 0;
  const today = todayIso();

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              My Class Section
            </label>
            {sectionsLoading ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            ) : markableSections.length === 0 ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm text-amber-800">
                <AlertCircle size={16} /> You are not assigned to any class
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedSectionId ?? ""}
                  onChange={(e) =>
                    setSelectedSectionId(e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
                >
                  {markableSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.stream_name ? ` · ${s.stream_name}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium outline-none focus:border-[#252B68]"
              />
            </div>
          </div>

          <div className="flex items-end">
            {canEdit ? (
              <button
                onClick={saveRegister}
                disabled={saving || !dirty || totalStudents === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d2255] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                {saving ? "Saving..." : dirty ? "Save Register" : "Saved"}
              </button>
            ) : (
              <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Lock size={14} /> View Only
              </div>
            )}
          </div>
        </div>
      </div>

      {rosterError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{rosterError}</p>
        </div>
      )}

      {rosterLoading && !roster && (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F58220]" />
            Loading register...
          </div>
        </div>
      )}

      {roster && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: roster.class_stream.stream_colour ?? "#252B68" }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#172033]">{roster.class_stream.name}</p>
                  <p className="text-xs text-slate-500">
                    {roster.class_stream.school_class_name}
                    {roster.class_stream.stream_name ? ` · ${roster.class_stream.stream_name}` : ""}
                    {" · "}
                    {roster.students.length} student{roster.students.length === 1 ? "" : "s"}
                    {" · "}
                    {roster.date}
                    {!roster.is_today && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Past
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ALL_STATUSES.map((s) => (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[s].pill}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        s === "present" ? "bg-emerald-500"
                        : s === "absent" ? "bg-red-500"
                        : s === "late" ? "bg-amber-500"
                        : s === "excused" ? "bg-blue-500"
                        : "bg-purple-500"
                      }`}
                    />
                    {STATUS_META[s].label} {counts[s]}
                  </span>
                ))}
              </div>
            </div>

            {roster.register && (
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-2.5 text-xs text-slate-500">
                <CheckCircle2 size={13} className="mr-1 inline text-emerald-600" />
                Last marked
                {roster.register.marked_by_name ? ` by ${roster.register.marked_by_name}` : ""}
                {roster.register.marked_at
                  ? ` · ${new Date(roster.register.marked_at).toLocaleString()}`
                  : ""}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/30 px-5 py-3">
              <div className="relative min-w-[180px] flex-1 max-w-sm">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#252B68]"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "name" | "status" | "number")}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-[#252B68]"
              >
                <option value="name">Sort: Name A→Z</option>
                <option value="number">Sort: Student #</option>
                <option value="status">Sort: Worst status first</option>
              </select>
              {canEdit && roster.students.length > 0 && (
                <>
                  <span className="ml-auto text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quick mark:
                  </span>
                  <button
                    onClick={() => markAll("present")}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => markAll("absent")}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    All Absent
                  </button>
                </>
              )}
            </div>

            {roster.students.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Users size={24} className="text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#172033]">No students in this section</p>
                <p className="mt-1 text-xs text-slate-500">
                  Enrol students or move them into {roster.class_stream.name}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleStudents.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No students match "{search}".
                  </div>
                ) : (
                  visibleStudents.map((student) => {
                    const d = draft[student.id];
                    const status: Status = d?.status ?? student.status;
                    const remarks = d?.remarks ?? student.remarks ?? "";

                    return (
                      <div
                        key={student.id}
                        className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#252B68] text-sm font-bold text-white">
                            {student.photo_url ? (
                              <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover" />
                            ) : (
                              initialsOf(student.full_name)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#172033]">{student.full_name}</p>
                            <p className="truncate text-xs text-slate-500">{student.student_number}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          {ALL_STATUSES.map((s) => {
                            const active = status === s;
                            const meta = STATUS_META[s];
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => setStatus(student.id, s)}
                                title={meta.label}
                                className={`inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded-lg border text-xs font-bold transition ${
                                  active
                                    ? meta.className
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                } ${!canEdit ? "cursor-not-allowed opacity-70" : ""}`}
                              >
                                {meta.short}
                              </button>
                            );
                          })}
                        </div>

                        <div className="w-full sm:w-56">
                          <input
                            type="text"
                            value={remarks}
                            onChange={(e) => setRemarks(student.id, e.target.value)}
                            disabled={!canEdit}
                            placeholder={canEdit ? "Add remark..." : ""}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-[#252B68] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {canEdit && roster.students.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-[#172033]">{totalStudents}</span> students ·{" "}
                  <span className="font-semibold text-emerald-600">{counts.present} present</span> ·{" "}
                  <span className="font-semibold text-red-600">{counts.absent} absent</span>
                </p>
                <button
                  onClick={saveRegister}
                  disabled={saving || !dirty}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {saving ? "Saving..." : "Save Register"}
                </button>
              </div>
            )}
          </div>

          {!canEdit && (
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <Eye size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-blue-900">View-only</p>
                <p className="mt-0.5 text-sm text-blue-800">
                  {!roster.is_today ? (
                    <>You are viewing a <strong>past date</strong>. Registers can only be edited for today.</>
                  ) : !roster.academic_year ? (
                    <>No <strong>current academic year</strong> is active. Ask an administrator to activate one before marking.</>
                  ) : (
                    <>You are not assigned as a class teacher, lead teacher, or assistant teacher for <strong>{roster.class_stream.name}</strong> this academic year.</>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * TAB 2 — VIEW HISTORY
 * ============================================================ */

function HistoryTab({
  sections,
  sectionsLoading,
}: {
  sections: SectionLite[];
  sectionsLoading: boolean;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [summarySort, setSummarySort] = useState<"pctAsc" | "pctDesc" | "name" | "attended">("pctAsc");

  const [registers, setRegisters] = useState<HistoryRow[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [viewDate, setViewDate] = useState<string | null>(null);

  const today = todayIso();

  useEffect(() => {
    if (selectedSectionId === null && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!selectedSectionId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const histParams = new URLSearchParams();
      if (from) histParams.set("from", from);
      if (to) histParams.set("to", to);
      if (search.trim()) histParams.set("search", search.trim());
      histParams.set("sort", sort);
      histParams.set("limit", "180");

      const sumParams = new URLSearchParams();
      if (from) sumParams.set("from", from);
      if (to) sumParams.set("to", to);

      const [histRes, sumRes] = await Promise.all([
        fetch(
          `${API_URL}/api/admin/attendance/sections/${selectedSectionId}/history?${histParams.toString()}`,
          { headers: authHeaders(), cache: "no-store" }
        ),
        fetch(
          `${API_URL}/api/admin/attendance/sections/${selectedSectionId}/summary?${sumParams.toString()}`,
          { headers: authHeaders(), cache: "no-store" }
        ),
      ]);

      const histData = await histRes.json();
      const sumData = await sumRes.json();

      if (!histRes.ok) throw new Error(histData?.message || "Could not load history.");
      if (!sumRes.ok) throw new Error(sumData?.message || "Could not load summary.");

      setRegisters(histData.data ?? []);
      setSummary(sumData.data as SummaryResponse);
    } catch (e: any) {
      setError(e?.message || "Failed to load history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSectionId, from, to, search, sort]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  );

  const sortedSummaryStudents = useMemo(() => {
    if (!summary) return [];
    const list = [...summary.students];
    switch (summarySort) {
      case "pctDesc": list.sort((a, b) => b.percentage - a.percentage); break;
      case "name":    list.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
      case "attended":list.sort((a, b) => b.days_attended - a.days_attended); break;
      case "pctAsc":
      default:        list.sort((a, b) => a.percentage - b.percentage); break;
    }
    return list;
  }, [summary, summarySort]);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_140px_1fr_140px_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Class Section
            </label>
            {sectionsLoading ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            ) : sections.length === 0 ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm text-amber-800">
                <AlertCircle size={16} /> No sections available
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedSectionId ?? ""}
                  onChange={(e) =>
                    setSelectedSectionId(e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.stream_name ? ` · ${s.stream_name}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
            <input
              type="date"
              value={from}
              max={today}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
            <input
              type="date"
              value={to}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Date or marked by..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#252B68]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={refreshing || !selectedSectionId}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !summary && (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F58220]" />
            Loading history...
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total School Days"
            value={summary.total_school_days}
            sublabel="Days where at least one student was present or late"
            accent="text-[#252B68]"
            bg="bg-[#252B68]/10"
          />
          <StatCard
            label="Holidays"
            value={summary.total_holiday_days}
            sublabel="Days skipped by the whole class (excluded)"
            accent="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            label="Students"
            value={summary.students.length}
            sublabel={
              summary.students.length > 0
                ? `Average ${Math.round(
                    summary.students.reduce((sum, s) => sum + s.percentage, 0) /
                      summary.students.length
                  )}% attendance`
                : "No students in section"
            }
            accent="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      )}

      {summary && summary.students.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Attendance Summary · {summary.class_stream.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {summary.period.from ? `From ${summary.period.from} to ` : ""}
                {summary.period.to} · {summary.total_school_days} school day
                {summary.total_school_days === 1 ? "" : "s"} · {summary.total_holiday_days} holiday
                {summary.total_holiday_days === 1 ? "" : "s"} excluded
              </p>
            </div>
            <select
              value={summarySort}
              onChange={(e) => setSummarySort(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-[#252B68]"
            >
              <option value="pctAsc">Sort: Lowest % first</option>
              <option value="pctDesc">Sort: Highest % first</option>
              <option value="attended">Sort: Most days attended</option>
              <option value="name">Sort: Name A→Z</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-center">Attended</th>
                  <th className="px-4 py-3 text-center">Present</th>
                  <th className="px-4 py-3 text-center">Late</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                  <th className="px-4 py-3 text-center">Excused</th>
                  <th className="px-4 py-3 text-center">Sick</th>
                  <th className="px-4 py-3 text-center">Total Days</th>
                  <th className="px-4 py-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSummaryStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252B68] text-xs font-bold text-white">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
                          ) : (
                            initialsOf(s.full_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#172033]">{s.full_name}</p>
                          <p className="truncate text-xs text-slate-500">{s.student_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-emerald-700">{s.days_attended}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.days_present}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.days_late}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.days_absent}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.days_excused}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.days_sick}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{s.total_school_days}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              s.percentage >= 90 ? "bg-emerald-500" : s.percentage >= 75 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(s.percentage, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`inline-flex min-w-[52px] justify-end rounded-md px-2 py-0.5 text-xs font-bold ${
                            s.percentage >= 90
                              ? "bg-emerald-50 text-emerald-700"
                              : s.percentage >= 75
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {s.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {summary.holiday_dates.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Holidays (excluded from totals)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {summary.holiday_dates.map((d) => (
                  <span key={d} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">
              Register History {selectedSection ? `· ${selectedSection.name}` : ""}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {registers.length} register{registers.length === 1 ? "" : "s"} · Future dates not shown
            </p>
          </div>
        </div>

        {registers.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <History size={24} className="text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#172033]">No registers found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting the date range or search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Present</th>
                  <th className="px-4 py-3 text-center">Late</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                  <th className="px-4 py-3 text-center">Excused</th>
                  <th className="px-4 py-3 text-center">Sick</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3">Marked By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#252B68]">{r.date}</span>
                        {r.is_holiday && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700">
                            Holiday
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-700">{r.present_count}</td>
                    <td className="px-4 py-3 text-center text-sm text-amber-700">{r.late_count}</td>
                    <td className="px-4 py-3 text-center text-sm text-red-700">{r.absent_count}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-700">{r.excused_count}</td>
                    <td className="px-4 py-3 text-center text-sm text-purple-700">{r.sick_count}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-700">{r.total_count}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.marked_by_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewDate(r.date)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewDate && selectedSectionId && (
        <RegisterViewModal
          sectionId={selectedSectionId}
          date={viewDate}
          onClose={() => setViewDate(null)}
        />
      )}
    </>
  );
}

/* ============================================================
 * REGISTER VIEW MODAL (read-only)
 * ============================================================ */

function RegisterViewModal({
  sectionId,
  date,
  onClose,
}: {
  sectionId: number;
  date: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<RosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ date });
        const res = await fetch(
          `${API_URL}/api/admin/attendance/sections/${sectionId}?${params.toString()}`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Could not load register.");
        if (!cancelled) setData(json.data as RosterResponse);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load register.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sectionId, date]);

  const counts = useMemo(() => {
    const base: Record<Status, number> = { present: 0, absent: 0, late: 0, excused: 0, sick: 0 };
    if (data) for (const s of data.students) base[s.status]++;
    return base;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.students;
    const q = search.trim().toLowerCase();
    return data.students.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div
      className="fixed inset-0 z-[180] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#172033]">
              Register · {data?.class_stream.name ?? "Loading..."}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {date}
              {data?.register?.marked_by_name
                ? ` · marked by ${data.register.marked_by_name}`
                : data
                ? " · not marked"
                : ""}
              {data?.register?.marked_at
                ? ` · ${new Date(data.register.marked_at).toLocaleString()}`
                : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading && !data && (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-[#F58220]" />
                Loading register...
              </div>
            </div>
          )}

          {data && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {ALL_STATUSES.map((s) => (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[s].pill}`}
                  >
                    {STATUS_META[s].label} {counts[s]}
                  </span>
                ))}
                <div className="relative ml-auto min-w-[180px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#252B68]"
                  />
                </div>
              </div>

              {data.students.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <Users size={20} className="text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#172033]">No students recorded</p>
                  <p className="mt-1 text-xs text-slate-500">
                    This register has no saved records for {date}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Student</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visible.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                            No students match "{search}".
                          </td>
                        </tr>
                      ) : (
                        visible.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252B68] text-[11px] font-bold text-white">
                                  {s.photo_url ? (
                                    <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
                                  ) : (
                                    initialsOf(s.full_name)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#172033]">{s.full_name}</p>
                                  <p className="truncate text-[11px] text-slate-500">{s.student_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              {s.marked ? (
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STATUS_META[s.status].pill}`}
                                >
                                  {STATUS_META[s.status].label}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Unmarked
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              {s.remarks?.trim() ? s.remarks : <span className="text-slate-400">—</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#252B68] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d2255]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * SHARED
 * ============================================================ */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-[#252B68] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
  bg,
}: {
  label: string;
  value: number;
  sublabel: string;
  accent: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className={`mt-2 text-3xl font-black ${accent}`}>{value}</p>
          <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
        </div>
        <div className={`h-10 w-10 shrink-0 rounded-xl ${bg}`} />
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function ResultModal({
  type,
  title,
  message,
  onClose,
}: {
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              type === "success" ? "bg-emerald-50" : "bg-red-50"
            }`}
          >
            {type === "success" ? (
              <CheckCircle2 size={22} className="text-emerald-600" />
            ) : (
              <AlertCircle size={22} className="text-red-600" />
            )}
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#172033]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
        </div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#252B68] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}