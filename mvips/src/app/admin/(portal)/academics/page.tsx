"use client";

import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ============================================================
 * CONFIG
 * ============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";
const ALLOWED_ROLES = ["admin", "administrator", "headteacher", "principal"];

type Tab =
  | "years-terms"
  | "subjects"
  | "clubs"
  | "classes-streams"
  | "class-subjects"
  | "teacher-assignments"
  | "club-leads";

type SubjectGroup = "core" | "specialist";

type AssignmentRole =
  | "class_teacher"
  | "lead_teacher"
  | "subject_teacher"
  | "assistant_teacher"
  | "club_lead";

/* ============================================================
 * TYPES
 * ============================================================ */

interface AcademicYear {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  is_active: boolean;
}

interface AcademicTerm {
  id: number;
  academic_year_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  is_published: boolean;
  academic_year?: { id: number; name: string };
}

interface Subject {
  id: number;
  name: string;
  code: string;
  subject_group: SubjectGroup;
  max_marks: number;
  sort_order: number;
  is_active: boolean;
}

interface Club {
  id: number;
  name: string;
  description: string | null;
  colour: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Stream {
  id: number;
  name: string;
  code: string;
  colour: string | null;
}

interface SchoolClassLite {
  id: number;
  name: string;
  code?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

interface ClassStreamLite {
  id: number;
  school_class_id: number;
  stream_id: number;
  name: string;
  is_active?: boolean;
  stream?: Stream | null;
  school_class?: { id: number; name: string };
}

interface ClassRow extends SchoolClassLite {
  sort_order: number;
  is_active: boolean;
  class_streams: ClassStreamLite[];
}

interface TeacherLite {
  id: number;
  name: string;
  email: string;
  role: string;
  is_specialist?: boolean;
  is_class_level?: boolean;
}

interface TeacherAssignment {
  id: number;
  role: AssignmentRole;
  is_active: boolean;
  user: TeacherLite;
  school_class: SchoolClassLite | null;
  class_stream: ClassStreamLite | null;
  subject: Subject | null;
  club: Club | null;
  academic_year: { id: number; name: string };
}

interface ClassSubjectRow extends Subject {
  is_assigned: boolean;
}

interface Lookups {
  teachers: TeacherLite[];
  classes: SchoolClassLite[];
  class_streams: ClassStreamLite[];
  streams: Stream[];
  years: AcademicYear[];
  terms: AcademicTerm[];
  clubs: Club[];
  subjects: Subject[];
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

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
}

/**
 * The two "owner" roles that a section can have AT MOST ONE of each.
 * They are independent — a section may have one class teacher and one
 * lead teacher, and those two may be the same person (via the
 * `is_lead_teacher` checkbox on a class teacher row).
 */
const OWNER_ROLES: AssignmentRole[] = ["class_teacher", "lead_teacher"];

const ROLE_LABELS: Record<AssignmentRole, string> = {
  class_teacher: "Class Teacher",
  lead_teacher: "Lead Teacher",
  subject_teacher: "Subject Teacher",
  assistant_teacher: "Assistant Teacher",
  club_lead: "Club Lead",
};

const ROLE_COLORS: Record<AssignmentRole, string> = {
  class_teacher: "bg-purple-50 text-purple-700",
  lead_teacher: "bg-orange-50 text-orange-700",
  subject_teacher: "bg-emerald-50 text-emerald-700",
  assistant_teacher: "bg-amber-50 text-amber-700",
  club_lead: "bg-pink-50 text-pink-700",
};

const GROUP_COLORS: Record<SubjectGroup, string> = {
  core: "bg-blue-50 text-blue-700",
  specialist: "bg-violet-50 text-violet-700",
};

const GROUP_LABELS: Record<SubjectGroup, string> = {
  core: "Core",
  specialist: "Specialist",
};

function assignmentTarget(a: TeacherAssignment): string {
  switch (a.role) {
    case "subject_teacher":
      return a.subject
        ? `${a.subject.name} · ${
            a.class_stream?.name ?? a.school_class?.name ?? "—"
          }`
        : "—";
    case "club_lead":
      return a.club?.name ?? "—";
    default:
      return a.class_stream?.name ?? a.school_class?.name ?? "—";
  }
}

/**
 * Split teachers into two buckets so the dropdowns can show
 * a "Specialist Teachers" optgroup below the class-level staff.
 */
function groupTeachers(teachers: TeacherLite[]): {
  classLevel: TeacherLite[];
  specialists: TeacherLite[];
} {
  const isSpecialist = (t: TeacherLite) => {
    if (t.is_specialist) return true;
    const r = t.role?.toLowerCase() ?? "";
    if (
      r === "specialist" ||
      r === "specialist_teacher" ||
      r === "subject_teacher" ||
      r === "special_teacher" ||
      r === "spec_teacher"
    ) {
      return true;
    }
    if (r.endsWith("_teacher")) {
      return !["lead_teacher", "class_teacher", "assistant_teacher"].includes(r);
    }
    return false;
  };

  const specialists = teachers.filter(isSpecialist);
  const classLevel = teachers.filter((t) => !isSpecialist(t));
  return { classLevel, specialists };
}

/* ============================================================
 * PAGE + ROLE GUARD
 * ============================================================ */

export default function AcademicsPage() {
  const router = useRouter();
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("admin_user");
    if (!raw) {
      router.replace("/admin/login");
      return;
    }
    try {
      const user = JSON.parse(raw);
      const role = String(user.role ?? "").toLowerCase();
      if (!ALLOWED_ROLES.includes(role)) {
        setIsAllowed(false);
        setRoleChecked(true);
        return;
      }
      setIsAllowed(true);
      setRoleChecked(true);
    } catch {
      router.replace("/admin/login");
    }
  }, [router]);

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
          <h2 className="mt-4 text-xl font-bold text-[#172033]">
            Access Restricted
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            The Academics module is only available to Administrators and
            Headteachers.
          </p>
          <button
            onClick={() => router.replace("/admin/dashboard")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <AcademicsInner />;
}

/* ============================================================
 * INNER PAGE
 * ============================================================ */

function AcademicsInner() {
  const [tab, setTab] = useState<Tab>("years-terms");
  const [lookups, setLookups] = useState<Lookups>({
    teachers: [],
    classes: [],
    class_streams: [],
    streams: [],
    years: [],
    terms: [],
    clubs: [],
    subjects: [],
  });
  const [bootstrapped, setBootstrapped] = useState(false);

  const refreshLookups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/academic-lookups`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lookup failed");
      setLookups({
        teachers: data.data?.teachers ?? [],
        classes: data.data?.classes ?? [],
        class_streams: data.data?.class_streams ?? [],
        streams: data.data?.streams ?? [],
        years: data.data?.years ?? [],
        terms: data.data?.terms ?? [],
        clubs: data.data?.clubs ?? [],
        subjects: data.data?.subjects ?? [],
      });
    } catch {
      /* tabs show their own errors */
    } finally {
      setBootstrapped(true);
    }
  };

  useEffect(() => {
    refreshLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin text-[#F58220]" />
          Loading academic data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
          Academics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Academic years &amp; terms, subjects, clubs, classes &amp; streams,
          class subjects, teacher assignments and club leads.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton
          active={tab === "years-terms"}
          onClick={() => setTab("years-terms")}
          icon={<CalendarDays size={16} />}
        >
          Years &amp; Terms
        </TabButton>
        <TabButton
          active={tab === "subjects"}
          onClick={() => setTab("subjects")}
          icon={<BookOpen size={16} />}
        >
          Subjects
        </TabButton>
        <TabButton
          active={tab === "clubs"}
          onClick={() => setTab("clubs")}
          icon={<Trophy size={16} />}
        >
          Clubs
        </TabButton>
        <TabButton
          active={tab === "classes-streams"}
          onClick={() => setTab("classes-streams")}
          icon={<Building2 size={16} />}
        >
          Classes &amp; Streams
        </TabButton>
        <TabButton
          active={tab === "class-subjects"}
          onClick={() => setTab("class-subjects")}
          icon={<Users size={16} />}
        >
          Class Subjects
        </TabButton>
        <TabButton
          active={tab === "teacher-assignments"}
          onClick={() => setTab("teacher-assignments")}
          icon={<UserCheck size={16} />}
        >
          Teacher Assignments
        </TabButton>
        <TabButton
          active={tab === "club-leads"}
          onClick={() => setTab("club-leads")}
          icon={<Trophy size={16} />}
        >
          Club Leads
        </TabButton>
      </div>

      {tab === "years-terms" && (
        <YearsTermsTab lookups={lookups} refreshLookups={refreshLookups} />
      )}
      {tab === "subjects" && <SubjectsTab />}
      {tab === "clubs" && (
        <ClubsTab lookups={lookups} refreshLookups={refreshLookups} />
      )}
      {tab === "classes-streams" && (
        <ClassesStreamsTab lookups={lookups} refreshLookups={refreshLookups} />
      )}
      {tab === "class-subjects" && <ClassSubjectsTab lookups={lookups} />}
      {tab === "teacher-assignments" && (
        <TeacherAssignmentsTab
          lookups={lookups}
          refreshLookups={refreshLookups}
        />
      )}
      {tab === "club-leads" && (
        <ClubLeadsTab lookups={lookups} refreshLookups={refreshLookups} />
      )}
    </div>
  );
}

/* ============================================================
 * YEARS & TERMS
 * ============================================================ */

function YearsTermsTab({
  lookups,
  refreshLookups,
}: {
  lookups: Lookups;
  refreshLookups: () => Promise<void>;
}) {
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedYearId !== null) return;
    const current = lookups.years.find((y) => y.is_current);
    setSelectedYearId(current?.id ?? lookups.years[0]?.id ?? null);
  }, [lookups.years, selectedYearId]);

  const [showYearModal, setShowYearModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearForm, setYearForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
    is_active: true,
  });

  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [termForm, setTermForm] = useState({
    academic_year_id: 0,
    name: "Term 1",
    start_date: "",
    end_date: "",
    is_current: false,
    is_published: false,
  });

  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null);
  const [deleteTerm, setDeleteTerm] = useState<AcademicTerm | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const selectedYear =
    lookups.years.find((y) => y.id === selectedYearId) ?? null;
  const visibleTerms = lookups.terms.filter(
    (t) => t.academic_year_id === selectedYearId
  );

  function openNewYear() {
    const y = new Date().getFullYear();
    setEditingYear(null);
    setYearForm({
      name: `${y}-${y + 1}`,
      start_date: "",
      end_date: "",
      is_current: lookups.years.length === 0,
      is_active: true,
    });
    setShowYearModal(true);
  }
  function openEditYear(y: AcademicYear) {
    setEditingYear(y);
    setYearForm({
      name: y.name,
      start_date: y.start_date?.slice(0, 10) ?? "",
      end_date: y.end_date?.slice(0, 10) ?? "",
      is_current: y.is_current,
      is_active: y.is_active,
    });
    setShowYearModal(true);
  }

  async function saveYear(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editingYear
        ? `${API_URL}/api/admin/academic-years/${editingYear.id}`
        : `${API_URL}/api/admin/academic-years`;
      const res = await fetch(url, {
        method: editingYear ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...yearForm,
          start_date: yearForm.start_date || null,
          end_date: yearForm.end_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not save year.");
      setShowYearModal(false);
      setResult({
        type: "success",
        title: editingYear ? "Year Updated" : "Year Created",
        message: data?.message || "The academic year was saved.",
      });
      await refreshLookups();
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteYear() {
    if (!deleteYear) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/academic-years/${deleteYear.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not delete.");
      setDeleteYear(null);
      setResult({
        type: "success",
        title: "Year Deleted",
        message: data?.message || "Deleted.",
      });
      await refreshLookups();
    } catch (e: any) {
      setDeleteYear(null);
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  function openNewTerm() {
    if (!selectedYearId) return;
    setEditingTerm(null);
    setTermForm({
      academic_year_id: selectedYearId,
      name: "Term 1",
      start_date: "",
      end_date: "",
      is_current: false,
      is_published: false,
    });
    setShowTermModal(true);
  }
  function openEditTerm(t: AcademicTerm) {
    setEditingTerm(t);
    setTermForm({
      academic_year_id: t.academic_year_id,
      name: t.name,
      start_date: t.start_date?.slice(0, 10) ?? "",
      end_date: t.end_date?.slice(0, 10) ?? "",
      is_current: t.is_current,
      is_published: t.is_published,
    });
    setShowTermModal(true);
  }

  async function saveTerm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editingTerm
        ? `${API_URL}/api/admin/academic-terms/${editingTerm.id}`
        : `${API_URL}/api/admin/academic-terms`;
      const res = await fetch(url, {
        method: editingTerm ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...termForm,
          start_date: termForm.start_date || null,
          end_date: termForm.end_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not save term.");
      setShowTermModal(false);
      setResult({
        type: "success",
        title: editingTerm ? "Term Updated" : "Term Created",
        message: data?.message || "The term was saved.",
      });
      await refreshLookups();
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteTerm() {
    if (!deleteTerm) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/academic-terms/${deleteTerm.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not delete.");
      setDeleteTerm(null);
      setResult({
        type: "success",
        title: "Term Deleted",
        message: data?.message || "Deleted.",
      });
      await refreshLookups();
    } catch (e: any) {
      setDeleteTerm(null);
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-[#252B68]" />
              <h3 className="text-sm font-bold text-[#172033]">Academic Years</h3>
            </div>
            <button
              onClick={openNewYear}
              className="rounded-lg bg-[#F58220] p-1.5 text-white hover:bg-[#df7014]"
            >
              <Plus size={15} />
            </button>
          </div>

          {lookups.years.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <AlertCircle size={22} className="mx-auto text-amber-500" />
              <p className="mt-3 text-sm font-semibold text-[#172033]">
                No academic years yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add one to start using the other tabs.
              </p>
              <button
                onClick={openNewYear}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus size={14} />
                Add First Year
              </button>
            </div>
          ) : (
            <ul className="max-h-[520px] overflow-y-auto p-2">
              {lookups.years.map((y) => {
                const active = y.id === selectedYearId;
                return (
                  <li key={y.id}>
                    <button
                      onClick={() => setSelectedYearId(y.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-[#252B68] bg-[#252B68]/5"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {y.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {fmtDate(y.start_date)} – {fmtDate(y.end_date)}
                          </p>
                        </div>
                        {y.is_current && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                {selectedYear ? `Terms — ${selectedYear.name}` : "Terms"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedYear
                  ? `${visibleTerms.length} term${
                      visibleTerms.length === 1 ? "" : "s"
                    }`
                  : "Select a year on the left."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedYear && (
                <>
                  <button
                    onClick={() => openEditYear(selectedYear)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit Year
                  </button>
                  <button
                    onClick={() => setDeleteYear(selectedYear)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={openNewTerm}
                disabled={!selectedYear}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F58220] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#df7014] disabled:opacity-50"
              >
                <Plus size={13} />
                Add Term
              </button>
            </div>
          </div>

          {!selectedYear ? (
            <EmptyBlock
              icon={<Calendar size={32} className="text-slate-300" />}
              title="Select an academic year"
              subtitle="Terms belong to a specific year."
            />
          ) : visibleTerms.length === 0 ? (
            <EmptyBlock
              icon={<Calendar size={32} className="text-slate-300" />}
              title={`No terms in ${selectedYear.name}`}
              subtitle="Most schools use Term 1, Term 2 and Term 3."
              action={
                <button
                  onClick={openNewTerm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                  Add First Term
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleTerms.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
                    <Calendar size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#172033]">
                      {t.name}
                      {t.is_current && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                          Current
                        </span>
                      )}
                      {t.is_published && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
                          Published
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {fmtDate(t.start_date)} – {fmtDate(t.end_date)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditTerm(t)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTerm(t)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showYearModal && (
        <Modal
          title={editingYear ? "Edit Academic Year" : "Add Academic Year"}
          onClose={() => setShowYearModal(false)}
        >
          <form onSubmit={saveYear} className="space-y-4">
            <Field label="Year Name">
              <input
                required
                value={yearForm.name}
                onChange={(e) =>
                  setYearForm((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. 2025-2026"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start Date">
                <input
                  type="date"
                  value={yearForm.start_date}
                  onChange={(e) =>
                    setYearForm((c) => ({ ...c, start_date: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  value={yearForm.end_date}
                  onChange={(e) =>
                    setYearForm((c) => ({ ...c, end_date: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>
            <Checkbox
              checked={yearForm.is_current}
              onChange={(v) => setYearForm((c) => ({ ...c, is_current: v }))}
              label="Mark as the current academic year"
              hint="Only one year can be current."
            />
            <Checkbox
              checked={yearForm.is_active}
              onChange={(v) => setYearForm((c) => ({ ...c, is_active: v }))}
              label="Active"
            />
            <ModalFooter
              onCancel={() => setShowYearModal(false)}
              saving={busy}
              label={editingYear ? "Save Changes" : "Create Year"}
            />
          </form>
        </Modal>
      )}

      {showTermModal && (
        <Modal
          title={editingTerm ? "Edit Academic Term" : "Add Academic Term"}
          onClose={() => setShowTermModal(false)}
        >
          <form onSubmit={saveTerm} className="space-y-4">
            <Field label="Academic Year">
              <select
                required
                value={termForm.academic_year_id}
                onChange={(e) =>
                  setTermForm((c) => ({
                    ...c,
                    academic_year_id: Number(e.target.value),
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
              >
                <option value={0}>Choose a year</option>
                {lookups.years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Term Name">
              <input
                required
                value={termForm.name}
                onChange={(e) =>
                  setTermForm((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. Term 1"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start Date">
                <input
                  type="date"
                  value={termForm.start_date}
                  onChange={(e) =>
                    setTermForm((c) => ({ ...c, start_date: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  value={termForm.end_date}
                  onChange={(e) =>
                    setTermForm((c) => ({ ...c, end_date: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>
            <Checkbox
              checked={termForm.is_current}
              onChange={(v) => setTermForm((c) => ({ ...c, is_current: v }))}
              label="Mark as the current term"
              hint="Also makes its parent year current."
            />
            <Checkbox
              checked={termForm.is_published}
              onChange={(v) => setTermForm((c) => ({ ...c, is_published: v }))}
              label="Published"
              hint="Report cards become visible to staff."
            />
            <ModalFooter
              onCancel={() => setShowTermModal(false)}
              saving={busy}
              label={editingTerm ? "Save Changes" : "Create Term"}
            />
          </form>
        </Modal>
      )}

      {deleteYear && (
        <ConfirmDelete
          title="Delete Academic Year?"
          message={`You are about to delete "${deleteYear.name}" and all its terms. If the year is linked to applications, deletion will be blocked.`}
          busy={busy}
          onCancel={() => setDeleteYear(null)}
          onConfirm={confirmDeleteYear}
        />
      )}
      {deleteTerm && (
        <ConfirmDelete
          title="Delete Academic Term?"
          message={`You are about to delete "${deleteTerm.name}".`}
          busy={busy}
          onCancel={() => setDeleteTerm(null)}
          onConfirm={confirmDeleteTerm}
        />
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * SUBJECTS
 * ============================================================ */

function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState({ core: 0, specialist: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    subject_group: "core" as SubjectGroup,
    max_marks: 100,
    sort_order: 0,
    is_active: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function load(spin = true) {
    if (spin) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (groupFilter) params.set("group", groupFilter);
      const res = await fetch(
        `${API_URL}/api/admin/subjects?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setSubjects(data.data ?? []);
      setGroups(data.groups ?? { core: 0, specialist: 0 });
    } catch (e: any) {
      setResult({ type: "error", title: "Load Failed", message: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, groupFilter]);

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      subject_group: "core",
      max_marks: 100,
      sort_order: 0,
      is_active: true,
    });
    setShowModal(true);
  }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      subject_group: s.subject_group,
      max_marks: s.max_marks,
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setShowModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editing
        ? `${API_URL}/api/admin/subjects/${editing.id}`
        : `${API_URL}/api/admin/subjects`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      setShowModal(false);
      setResult({
        type: "success",
        title: editing ? "Subject Updated" : "Subject Created",
        message: data?.message || "Saved.",
      });
      await load(false);
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/subjects/${deleteTarget.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setDeleteTarget(null);
      setResult({
        type: "success",
        title: "Subject Deleted",
        message: data?.message || "Deleted.",
      });
      await load(false);
    } catch (e: any) {
      setDeleteTarget(null);
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Subjects"
          value={groups.core + groups.specialist}
          color="text-[#252B68]"
          bg="bg-[#252B68]/10"
        />
        <StatCard
          label="Core"
          value={groups.core}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Specialist"
          value={groups.specialist}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subjects..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:bg-white"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white"
            >
              <option value="">All groups</option>
              <option value="core">Core</option>
              <option value="specialist">Specialist</option>
            </select>
            <button
              onClick={() => load(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 hover:bg-[#df7014]"
          >
            <Plus size={17} />
            Add Subject
          </button>
        </div>

        {loading ? (
          <LoadingBlock label="Loading subjects..." />
        ) : subjects.length === 0 ? (
          <EmptyBlock
            icon={<BookOpen size={26} className="text-slate-400" />}
            title="No subjects yet"
            subtitle="Add your first subject to build the catalog."
            action={
              <button
                onClick={openNew}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Subject
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  {["Name", "Code", "Group", "Max Marks", "Status", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                          i === 5 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-[#172033]">
                      {s.name}
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-600">
                      {s.code}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${GROUP_COLORS[s.subject_group]}`}
                      >
                        {GROUP_LABELS[s.subject_group]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {s.max_marks}
                    </td>
                    <td className="px-5 py-4">
                      {s.is_active ? (
                        <StatusPill label="Active" colour="emerald" />
                      ) : (
                        <StatusPill label="Inactive" colour="slate" />
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Subject" : "Add Subject"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, name: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <Field label="Code">
                <input
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. MATH"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>
            <Field label="Group">
              <div className="grid grid-cols-2 gap-2">
                {(["core", "specialist"] as SubjectGroup[]).map((g) => {
                  const active = form.subject_group === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setForm((c) => ({
                          ...c,
                          subject_group: g,
                          max_marks: g === "core" ? 100 : 50,
                        }))
                      }
                      className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${
                        active
                          ? "border-[#252B68] bg-[#252B68]/5 ring-2 ring-[#252B68]/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {GROUP_LABELS[g]}
                      <p className="mt-0.5 text-xs font-normal text-slate-500">
                        {g === "core"
                          ? "Taught to every student"
                          : "Rotation subject"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Max Marks">
                <input
                  type="number"
                  min={1}
                  value={form.max_marks}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      max_marks: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <Field label="Sort Order">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      sort_order: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>
            <Checkbox
              checked={form.is_active}
              onChange={(v) => setForm((c) => ({ ...c, is_active: v }))}
              label="Active subject"
            />
            <ModalFooter
              onCancel={() => setShowModal(false)}
              saving={busy}
              label={editing ? "Save Changes" : "Create Subject"}
            />
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDelete
          title="Delete Subject?"
          message={`Delete "${deleteTarget.name}"? Deletion is blocked if it's used by classes or teacher assignments.`}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * CLUBS
 * ============================================================ */

function ClubsTab({
  lookups,
  refreshLookups,
}: {
  lookups: Lookups;
  refreshLookups: () => Promise<void>;
}) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    colour: "#252B68",
    sort_order: 0,
    is_active: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function load(spin = true) {
    if (spin) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(
        `${API_URL}/api/admin/clubs?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setClubs(data.data ?? []);
    } catch (e: any) {
      setResult({ type: "error", title: "Load Failed", message: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      colour: "#252B68",
      sort_order: 0,
      is_active: true,
    });
    setShowModal(true);
  }
  function openEdit(c: Club) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      colour: c.colour ?? "#252B68",
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setShowModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editing
        ? `${API_URL}/api/admin/clubs/${editing.id}`
        : `${API_URL}/api/admin/clubs`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      setShowModal(false);
      setResult({
        type: "success",
        title: editing ? "Club Updated" : "Club Created",
        message: data?.message || "Saved.",
      });
      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/clubs/${deleteTarget.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setDeleteTarget(null);
      setResult({
        type: "success",
        title: "Club Deleted",
        message: data?.message || "Deleted.",
      });
      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setDeleteTarget(null);
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clubs..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:bg-white"
              />
            </div>
            <button
              onClick={() => load(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 hover:bg-[#df7014]"
          >
            <Plus size={17} />
            Add Club
          </button>
        </div>

        {loading ? (
          <LoadingBlock label="Loading clubs..." />
        ) : clubs.length === 0 ? (
          <EmptyBlock
            icon={<Trophy size={26} className="text-slate-400" />}
            title="No clubs yet"
            subtitle="Add clubs so teachers can be assigned as club leads."
            action={
              <button
                onClick={openNew}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Club
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {clubs.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: c.colour ?? "#252B68" }}
                >
                  <Trophy size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#172033]">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {c.description}
                    </p>
                  )}
                </div>
                {c.is_active ? (
                  <StatusPill label="Active" colour="emerald" />
                ) : (
                  <StatusPill label="Inactive" colour="slate" />
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Club" : "Add Club"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. Football Club"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((c) => ({ ...c, description: e.target.value }))
                }
                rows={3}
                placeholder="What does this club do?"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#252B68]"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Colour">
                <input
                  type="color"
                  value={form.colour}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, colour: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-1 outline-none"
                />
              </Field>
              <Field label="Sort Order">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      sort_order: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>
            <Checkbox
              checked={form.is_active}
              onChange={(v) => setForm((c) => ({ ...c, is_active: v }))}
              label="Active club"
            />
            <ModalFooter
              onCancel={() => setShowModal(false)}
              saving={busy}
              label={editing ? "Save Changes" : "Create Club"}
            />
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDelete
          title="Delete Club?"
          message={`Delete "${deleteTarget.name}"? Deletion is blocked if the club has active teacher assignments.`}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * CLASSES & STREAMS
 * ============================================================ */

function ClassesStreamsTab({
  lookups,
  refreshLookups,
}: {
  lookups: Lookups;
  refreshLookups: () => Promise<void>;
}) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    sort_order: 0,
    is_active: true,
    stream_ids: [] as number[],
  });
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function load(spin = true) {
    if (spin) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(
        `${API_URL}/api/admin/school-classes?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setClasses(data.data ?? []);
    } catch (e: any) {
      setResult({ type: "error", title: "Load Failed", message: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      sort_order: 0,
      is_active: true,
      stream_ids: [],
    });
    setShowModal(true);
  }

  function openEdit(c: ClassRow) {
    setEditing(c);
    setForm({
      name: c.name,
      code: c.code ?? "",
      sort_order: c.sort_order ?? 0,
      is_active: c.is_active ?? true,
      stream_ids: (c.class_streams ?? [])
        .filter((s) => s.is_active !== false)
        .map((s) => s.stream_id),
    });
    setShowModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editing
        ? `${API_URL}/api/admin/school-classes/${editing.id}`
        : `${API_URL}/api/admin/school-classes`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: form.name,
          code: form.code || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
          stream_ids: form.stream_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      setShowModal(false);
      setResult({
        type: "success",
        title: editing ? "Class Updated" : "Class Created",
        message: data?.message || "Saved.",
      });
      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/school-classes/${deleteTarget.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setDeleteTarget(null);
      setResult({
        type: "success",
        title: "Class Deleted",
        message: data?.message || "Deleted.",
      });
      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setDeleteTarget(null);
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  function toggleStream(id: number) {
    setForm((c) => ({
      ...c,
      stream_ids: c.stream_ids.includes(id)
        ? c.stream_ids.filter((x) => x !== id)
        : [...c.stream_ids, id],
    }));
  }

  const totalSections = classes.reduce(
    (sum, c) =>
      sum + (c.class_streams ?? []).filter((s) => s.is_active !== false).length,
    0
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Classes"
          value={classes.length}
          color="text-[#252B68]"
          bg="bg-[#252B68]/10"
        />
        <StatCard
          label="Sections"
          value={totalSections}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          label="Streams Available"
          value={lookups.streams.length}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:bg-white"
              />
            </div>
            <button
              onClick={() => load(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 hover:bg-[#df7014]"
          >
            <Plus size={17} />
            Add Class
          </button>
        </div>

        {loading ? (
          <LoadingBlock label="Loading classes..." />
        ) : classes.length === 0 ? (
          <EmptyBlock
            icon={<Building2 size={26} className="text-slate-400" />}
            title="No classes yet"
            subtitle="Add Year 1 once, then tick the streams it's taught in."
            action={
              <button
                onClick={openNew}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Class
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  {["Class", "Code", "Sections", "Status", "Sort", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                          i === 5 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => {
                  const activeSections = (c.class_streams ?? []).filter(
                    (s) => s.is_active !== false
                  );
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-semibold text-[#172033]">
                        {c.name}
                      </td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-600">
                        {c.code ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {activeSections.length === 0 ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            No streams yet
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeSections.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${
                                    s.stream?.colour ?? "#252B68"
                                  }1A`,
                                  color: s.stream?.colour ?? "#252B68",
                                }}
                              >
                                {s.stream?.name ?? s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {c.is_active ? (
                          <StatusPill label="Active" colour="emerald" />
                        ) : (
                          <StatusPill label="Inactive" colour="slate" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {c.sort_order}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(c)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Class" : "Add Class"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Class Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="e.g. Year 1"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <Field label="Code (optional)">
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. Y1"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-[#252B68]"
                />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Streams for this class
              </p>
              {lookups.streams.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  No streams exist yet. Add streams (East / West / North / South)
                  before creating classes.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {lookups.streams.map((s) => {
                      const selected = form.stream_ids.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStream(s.id)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-[#252B68] bg-[#252B68]/5 ring-2 ring-[#252B68]/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#172033]">
                              {s.name}
                            </p>
                            {selected && (
                              <CheckCircle2
                                size={16}
                                className="text-[#252B68]"
                              />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {form.name
                              ? `${form.name} ${s.name}`
                              : `e.g. Year 1 ${s.name}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Ticking a stream creates a section (e.g.{" "}
                    <span className="font-medium">
                      {form.name || "Year 1"} {lookups.streams[0]?.name || "East"}
                    </span>
                    ). Un-ticking is blocked if the section has students or
                    teachers assigned.
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Sort Order">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      sort_order: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                />
              </Field>
              <label className="flex items-end">
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, is_active: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#252B68]"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Active
                  </span>
                </div>
              </label>
            </div>

            <ModalFooter
              onCancel={() => setShowModal(false)}
              saving={busy}
              label={editing ? "Save Changes" : "Create Class"}
            />
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDelete
          title="Delete Class?"
          message={`Delete "${deleteTarget.name}"? Deletion is blocked if the class has students or teacher assignments.`}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * CLASS SUBJECTS
 * ============================================================ */

function ClassSubjectsTab({ lookups }: { lookups: Lookups }) {
  const [classId, setClassId] = useState<number | "">("");
  const [yearId, setYearId] = useState<number | "">("");
  const [rows, setRows] = useState<ClassSubjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (yearId === "") {
      const current =
        lookups.years.find((y) => y.is_current) ?? lookups.years[0];
      if (current) setYearId(current.id);
    }
    if (classId === "" && lookups.classes.length > 0) {
      setClassId(lookups.classes[0].id);
    }
  }, [lookups]);

  useEffect(() => {
    if (classId === "" || yearId === "") {
      setRows([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          school_class_id: String(classId),
          academic_year_id: String(yearId),
        });
        const res = await fetch(
          `${API_URL}/api/admin/class-subjects?${params.toString()}`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Load failed");
        setRows(data.data?.subjects ?? []);
      } catch (e: any) {
        setResult({ type: "error", title: "Load Failed", message: e?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, yearId]);

  function toggle(id: number) {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, is_assigned: !r.is_assigned } : r))
    );
  }
  function toggleGroup(g: SubjectGroup) {
    const inGroup = rows.filter((r) => r.subject_group === g);
    const allOn = inGroup.every((r) => r.is_assigned);
    setRows((rs) =>
      rs.map((r) =>
        r.subject_group === g ? { ...r, is_assigned: !allOn } : r
      )
    );
  }

  async function save() {
    if (classId === "" || yearId === "") return;
    setSaving(true);
    try {
      const subject_ids = rows.filter((r) => r.is_assigned).map((r) => r.id);
      const res = await fetch(`${API_URL}/api/admin/class-subjects`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          school_class_id: classId,
          academic_year_id: yearId,
          subject_ids,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      setResult({
        type: "success",
        title: "Subjects Saved",
        message: data?.message || "The class subjects were updated.",
      });
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const coreRows = rows.filter((r) => r.subject_group === "core");
  const specialistRows = rows.filter((r) => r.subject_group === "specialist");

  if (lookups.years.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle size={24} className="mx-auto text-amber-600" />
        <h3 className="mt-3 text-sm font-bold text-amber-900">
          No academic year exists yet
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          Create one on the <strong>Years &amp; Terms</strong> tab first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Class">
            <select
              value={classId}
              onChange={(e) =>
                setClassId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
            >
              <option value="">Select a class</option>
              {lookups.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Academic Year">
            <select
              value={yearId}
              onChange={(e) =>
                setYearId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
            >
              <option value="">Select a year</option>
              {lookups.years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Subjects apply to the whole class — all sections (East, West, North,
          South) study the same subjects.
        </p>
      </div>

      {classId !== "" && yearId !== "" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <LoadingBlock label="Loading subjects..." />
          ) : (
            <>
              <div className="border-b border-slate-200 p-5">
                <h3 className="text-base font-bold text-[#172033]">
                  Which subjects are taught in this class?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tick every subject that applies. Saved per class and academic
                  year.
                </p>
              </div>

              <SubjectBlock
                title="Core Subjects"
                rows={coreRows}
                onToggle={toggle}
                onToggleAll={() => toggleGroup("core")}
                badge={GROUP_COLORS.core}
              />
              <SubjectBlock
                title="Specialist Subjects"
                rows={specialistRows}
                onToggle={toggle}
                onToggleAll={() => toggleGroup("specialist")}
                badge={GROUP_COLORS.specialist}
              />

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-[#252B68]">
                    {rows.filter((r) => r.is_assigned).length}
                  </span>{" "}
                  of {rows.length} subjects selected
                </p>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {saving ? "Saving..." : "Save Class Subjects"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

function SubjectBlock({
  title,
  rows,
  onToggle,
  onToggleAll,
  badge,
}: {
  title: string;
  rows: ClassSubjectRow[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  badge: string;
}) {
  const allOn = rows.length > 0 && rows.every((r) => r.is_assigned);
  return (
    <div className="border-b border-slate-100 p-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge}`}
          >
            {title}
          </span>
          <span className="text-xs text-slate-400">
            {rows.filter((r) => r.is_assigned).length}/{rows.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-semibold text-[#252B68] hover:underline"
        >
          {allOn ? "Deselect all" : "Select all"}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No subjects in this group.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                r.is_assigned
                  ? "border-[#252B68] bg-[#252B68]/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={r.is_assigned}
                onChange={() => onToggle(r.id)}
                className="h-4 w-4 accent-[#252B68]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#172033]">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.code} · {r.max_marks} marks
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * TEACHER ASSIGNMENTS
 * ============================================================ */

type BulkRow = {
  id: string;
  role: AssignmentRole;
  user_id: number;
  subject_id: number;
  /** Only meaningful when `role === "class_teacher"` — when true, the
   *  same teacher is also created as a lead_teacher for this section. */
  is_lead_teacher: boolean;
};

function makeBulkRow(): BulkRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    role: "assistant_teacher",
    user_id: 0,
    subject_id: 0,
    is_lead_teacher: false,
  };
}

function TeacherAssignmentsTab({
  lookups,
  refreshLookups,
}: {
  lookups: Lookups;
  refreshLookups: () => Promise<void>;
}) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterSection, setFilterSection] = useState<number | "">("");
  const [filterRole, setFilterRole] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalClassStreamId, setModalClassStreamId] = useState<number>(0);
  const [modalYearId, setModalYearId] = useState<number>(0);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { ...makeBulkRow(), role: "class_teacher" },
  ]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const { classLevel: classLevelTeachers, specialists: specialistTeachers } =
    useMemo(() => groupTeachers(lookups.teachers), [lookups.teachers]);

  useEffect(() => {
    if (filterYear === "") {
      const current =
        lookups.years.find((y) => y.is_current) ?? lookups.years[0];
      if (current) setFilterYear(current.id);
    }
  }, [lookups.years, filterYear]);

  async function load(spin = true) {
    if (spin) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filterYear !== "")
        params.set("academic_year_id", String(filterYear));
      if (filterSection !== "")
        params.set("class_stream_id", String(filterSection));
      if (filterRole) params.set("role", filterRole);
      params.set("status", "active");
      const res = await fetch(
        `${API_URL}/api/admin/teacher-assignments?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setAssignments(
        (data.data ?? []).filter(
          (a: TeacherAssignment) => a.role !== "club_lead"
        )
      );
    } catch (e: any) {
      setResult({ type: "error", title: "Load Failed", message: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterSection, filterRole]);

  function openNew() {
    const current =
      lookups.years.find((y) => y.is_current) ?? lookups.years[0];
    setModalYearId(current?.id ?? 0);
    setModalClassStreamId(lookups.class_streams[0]?.id ?? 0);
    setBulkRows([{ ...makeBulkRow(), role: "class_teacher" }]);
    setShowModal(true);
  }

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setBulkRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  function addRow() {
    setBulkRows((rows) => [...rows, makeBulkRow()]);
  }

  function removeRow(id: string) {
    setBulkRows((rows) => {
      if (rows.length === 1) return rows;
      return rows.filter((r) => r.id !== id);
    });
  }

  async function saveBulk() {
    if (!modalClassStreamId || !modalYearId) {
      setResult({
        type: "error",
        title: "Missing Information",
        message: "Choose a class section and academic year.",
      });
      return;
    }

    const filled = bulkRows.filter((r) => r.user_id > 0);

    if (filled.length === 0) {
      setResult({
        type: "error",
        title: "No Teachers Selected",
        message: "Pick at least one teacher for this section.",
      });
      return;
    }

    /* ---------- duplicate (role, user) guard ---------- */
    const pairs = filled.map((r) => `${r.role}:${r.user_id}`);
    if (pairs.length !== new Set(pairs).size) {
      setResult({
        type: "error",
        title: "Duplicate Assignment",
        message: "The same teacher appears more than once with the same role.",
      });
      return;
    }

    /* ---------- owner role cardinality ---------- */
    const classTeacherCount = filled.filter(
      (r) => r.role === "class_teacher"
    ).length;
    if (classTeacherCount > 1) {
      setResult({
        type: "error",
        title: "Too Many Class Teachers",
        message: "Only one class teacher may be assigned per section.",
      });
      return;
    }

    // A "lead teacher" can come from two places:
    //   1. A class teacher row with `is_lead_teacher` ticked
    //   2. A standalone `lead_teacher` row
    // Only one lead is allowed in total.
    const leadViaClassTeacher = filled.filter(
      (r) => r.role === "class_teacher" && r.is_lead_teacher
    ).length;
    const leadStandalone = filled.filter(
      (r) => r.role === "lead_teacher"
    ).length;

    if (leadViaClassTeacher + leadStandalone > 1) {
      setResult({
        type: "error",
        title: "Too Many Lead Teachers",
        message:
          "Only one lead teacher per section. Either tick “Also Lead Teacher” on the class teacher or add a single Lead Teacher row — not both.",
      });
      return;
    }

    /* ---------- subject teachers need a subject ---------- */
    const badSubjectRow = filled.find(
      (r) => r.role === "subject_teacher" && !r.subject_id
    );
    if (badSubjectRow) {
      setResult({
        type: "error",
        title: "Missing Subject",
        message: "Subject teachers need a subject assigned.",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/teacher-assignments/bulk`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          academic_year_id: modalYearId,
          class_stream_id: modalClassStreamId,
          assignments: filled.map((r) => ({
            role: r.role,
            user_id: r.user_id,
            subject_id: r.role === "subject_teacher" ? r.subject_id : null,
            is_lead_teacher:
              r.role === "class_teacher" ? !!r.is_lead_teacher : false,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      setShowModal(false);
      setResult({
        type: "success",
        title: "Assignments Created",
        message:
          data?.message ||
          `${filled.length} teacher(s) assigned to the section.`,
      });
      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: TeacherAssignment) {
    setRefreshing(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/teacher-assignments/${a.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setResult({
        type: "success",
        title: "Assignment Removed",
        message: data?.message || "Removed.",
      });
      await load(false);
    } catch (e: any) {
      setResult({ type: "error", title: "Delete Failed", message: e?.message });
    } finally {
      setRefreshing(false);
    }
  }

  if (lookups.years.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle size={24} className="mx-auto text-amber-600" />
        <h3 className="mt-3 text-sm font-bold text-amber-900">
          No academic year exists yet
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          Create one on the <strong>Years &amp; Terms</strong> tab first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">All years</option>
              {lookups.years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            <select
              value={filterSection}
              onChange={(e) =>
                setFilterSection(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">All sections</option>
              {lookups.class_streams.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                </option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">All roles</option>
              <option value="class_teacher">Class Teacher</option>
              <option value="lead_teacher">Lead Teacher</option>
              <option value="subject_teacher">Subject Teacher</option>
              <option value="assistant_teacher">Assistant Teacher</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 hover:bg-[#df7014]"
            >
              <UserPlus size={17} />
              Assign Teachers
            </button>
          </div>
        </div>

        {lookups.class_streams.length === 0 ? (
          <EmptyBlock
            icon={<AlertCircle size={26} className="text-amber-500" />}
            title="No class sections yet"
            subtitle="Create classes and tick their streams on the Classes & Streams tab first."
          />
        ) : loading ? (
          <LoadingBlock label="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <EmptyBlock
            icon={<UserCheck size={26} className="text-slate-400" />}
            title="No assignments yet"
            subtitle="Assign a class teacher and lead teacher to a specific section."
            action={
              <button
                onClick={openNew}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <UserPlus size={16} />
                Assign Teachers
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  {["Teacher", "Role", "Assigned To", "Year", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                          i === 4 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#172033]">
                          {a.user.name}
                        </p>
                        {specialistTeachers.some(
                          (t) => t.id === a.user.id
                        ) && (
                          <span className="rounded-md bg-[#F58220]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F58220]">
                            Specialist
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{a.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[a.role]}`}
                      >
                        {ROLE_LABELS[a.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {assignmentTarget(a)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {a.academic_year?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => remove(a)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Remove assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="Assign Teachers to a Section"
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Class section">
                <select
                  required
                  value={modalClassStreamId}
                  onChange={(e) =>
                    setModalClassStreamId(Number(e.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                >
                  <option value={0}>Choose a section</option>
                  {lookups.class_streams.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.name}
                    </option>
                  ))}
                </select>
                {lookups.class_streams.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No sections yet. Add classes &amp; streams first.
                  </p>
                )}
              </Field>
              <Field label="Academic Year">
                <select
                  required
                  value={modalYearId}
                  onChange={(e) => setModalYearId(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                >
                  <option value={0}>Choose a year</option>
                  {lookups.years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.is_current ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#172033]">
                    Teachers to assign
                  </p>
                  <p className="text-xs text-slate-500">
                    Add one class teacher (optionally also lead teacher), plus
                    any number of assistants or subject teachers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#252B68]/30 px-3 py-1.5 text-xs font-semibold text-[#252B68] hover:border-[#252B68] hover:bg-[#252B68]/5"
                >
                  <Plus size={13} />
                  Add Row
                </button>
              </div>

              <div className="space-y-2">
                {bulkRows.map((row, i) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Row {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={bulkRows.length === 1}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <select
                        value={row.role}
                        onChange={(e) =>
                          updateRow(row.id, {
                            role: e.target.value as AssignmentRole,
                            subject_id: 0,
                            is_lead_teacher: false,
                          })
                        }
                        className="h-10 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#252B68]"
                      >
                        <option value="class_teacher">Class Teacher</option>
                        <option value="lead_teacher">
                          Lead Teacher (if different)
                        </option>
                        <option value="assistant_teacher">
                          Assistant Teacher
                        </option>
                        <option value="subject_teacher">
                          Subject Teacher
                        </option>
                      </select>

                      <select
                        value={row.user_id}
                        onChange={(e) =>
                          updateRow(row.id, {
                            user_id: Number(e.target.value),
                          })
                        }
                        className="h-10 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#252B68]"
                      >
                        <option value={0}>Choose a teacher</option>

                        {classLevelTeachers.length > 0 && (
                          <optgroup label="Class Teachers & Assistants">
                            {classLevelTeachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} — {t.email}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {specialistTeachers.length > 0 && (
                          <optgroup label="Specialist Teachers">
                            {specialistTeachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} — {t.email}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>

                      {/* Column 3 varies by role */}
                      {row.role === "subject_teacher" ? (
                        <select
                          value={row.subject_id}
                          onChange={(e) =>
                            updateRow(row.id, {
                              subject_id: Number(e.target.value),
                            })
                          }
                          className="h-10 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#252B68]"
                        >
                          <option value={0}>Choose a subject</option>
                          <optgroup label="Core">
                            {lookups.subjects
                              .filter((s) => s.subject_group === "core")
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.code})
                                </option>
                              ))}
                          </optgroup>
                          {lookups.subjects.filter(
                            (s) => s.subject_group === "specialist"
                          ).length > 0 && (
                            <optgroup label="Specialist">
                              {lookups.subjects
                                .filter((s) => s.subject_group === "specialist")
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      ) : row.role === "class_teacher" ? (
                        <label
                          className={`flex h-10 items-center gap-2 rounded-lg border px-2 transition ${
                            row.is_lead_teacher
                              ? "border-orange-300 bg-orange-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={row.is_lead_teacher}
                            onChange={(e) =>
                              updateRow(row.id, {
                                is_lead_teacher: e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#F58220]"
                          />
                          <span
                            className={`text-xs font-semibold ${
                              row.is_lead_teacher
                                ? "text-orange-800"
                                : "text-slate-600"
                            }`}
                          >
                            Also Lead Teacher
                          </span>
                        </label>
                      ) : row.role === "lead_teacher" ? (
                        <div className="flex h-10 items-center rounded-lg border border-dashed border-orange-200 bg-orange-50/40 px-3 text-xs text-orange-700">
                          One lead per section
                        </div>
                      ) : (
                        <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 px-3 text-xs text-slate-400">
                          Supports the class teacher
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <strong>Note:</strong> Each section has at most one class teacher
              and one lead teacher. Tick{" "}
              <strong>&ldquo;Also Lead Teacher&rdquo;</strong> on a class teacher
              row when the same person should hold both roles. If the lead
              teacher is a different person, use the{" "}
              <strong>Lead Teacher (if different)</strong> role instead — but not
              both. Assigning a new class teacher replaces the previous class
              teacher <em>and</em> its lead teacher link.
            </p>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBulk}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <UserCheck size={17} />
                )}
                {busy
                  ? "Saving..."
                  : `Save ${
                      bulkRows.filter((r) => r.user_id > 0).length
                    } Assignment(s)`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * CLUB LEADS
 * ============================================================ */

function ClubLeadsTab({
  lookups,
  refreshLookups,
}: {
  lookups: Lookups;
  refreshLookups: () => Promise<void>;
}) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [savingClubId, setSavingClubId] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const { classLevel: classLevelTeachers, specialists: specialistTeachers } =
    useMemo(() => groupTeachers(lookups.teachers), [lookups.teachers]);

  useEffect(() => {
    if (filterYear === "") {
      const current =
        lookups.years.find((y) => y.is_current) ?? lookups.years[0];
      if (current) setFilterYear(current.id);
    }
  }, [lookups.years, filterYear]);

  async function load(spin = true) {
    if (spin) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filterYear !== "")
        params.set("academic_year_id", String(filterYear));
      params.set("role", "club_lead");
      params.set("status", "active");
      const res = await fetch(
        `${API_URL}/api/admin/teacher-assignments?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setAssignments(
        (data.data ?? []).filter(
          (a: TeacherAssignment) => a.role === "club_lead"
        )
      );
    } catch (e: any) {
      setResult({ type: "error", title: "Load Failed", message: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear]);

  const currentYearId = typeof filterYear === "number" ? filterYear : 0;

  const leadByClub = useMemo(() => {
    const map = new Map<number, TeacherAssignment>();
    for (const a of assignments) {
      if (a.club?.id) map.set(a.club.id, a);
    }
    return map;
  }, [assignments]);

  const visibleClubs = useMemo(() => {
    if (!search.trim()) return lookups.clubs;
    const s = search.toLowerCase();
    return lookups.clubs.filter((c) => c.name.toLowerCase().includes(s));
  }, [lookups.clubs, search]);

  async function assignLead(club: Club, newUserId: number | null) {
    setSavingClubId(club.id);

    try {
      if (newUserId === null) {
        const current = leadByClub.get(club.id);
        if (!current) {
          setSavingClubId(null);
          return;
        }
        const res = await fetch(
          `${API_URL}/api/admin/teacher-assignments/${current.id}`,
          { method: "DELETE", headers: authHeaders() }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Could not remove.");
        setResult({
          type: "success",
          title: "Club Lead Removed",
          message: `${current.user.name} is no longer leading ${club.name}.`,
        });
      } else {
        if (!currentYearId) {
          setSavingClubId(null);
          setResult({
            type: "error",
            title: "No Academic Year",
            message: "Select an academic year before assigning club leads.",
          });
          return;
        }
        const res = await fetch(
          `${API_URL}/api/admin/teacher-assignments`,
          {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              academic_year_id: currentYearId,
              user_id: newUserId,
              role: "club_lead",
              school_class_id: null,
              class_stream_id: null,
              subject_id: null,
              club_id: club.id,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Could not assign.");

        const teacher = lookups.teachers.find((t) => t.id === newUserId);
        setResult({
          type: "success",
          title: "Club Lead Assigned",
          message: `${teacher?.name ?? "The teacher"} is now leading ${
            club.name
          }.`,
        });
      }

      await Promise.all([load(false), refreshLookups()]);
    } catch (e: any) {
      setResult({ type: "error", title: "Save Failed", message: e?.message });
    } finally {
      setSavingClubId(null);
    }
  }

  if (lookups.years.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle size={24} className="mx-auto text-amber-600" />
        <h3 className="mt-3 text-sm font-bold text-amber-900">
          No academic year exists yet
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          Create one on the <strong>Years &amp; Terms</strong> tab first — club
          leads are assigned per academic year.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">All years</option>
              {lookups.years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clubs..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingBlock label="Loading club leads..." />
        ) : visibleClubs.length === 0 ? (
          <EmptyBlock
            icon={<Trophy size={26} className="text-slate-400" />}
            title={
              lookups.clubs.length === 0 ? "No clubs yet" : "No matches"
            }
            subtitle={
              lookups.clubs.length === 0
                ? "Add clubs on the Clubs tab first."
                : "No clubs match your search."
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleClubs.map((club) => {
              const lead = leadByClub.get(club.id);
              const isSaving = savingClubId === club.id;

              return (
                <div
                  key={club.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: club.colour ?? "#252B68" }}
                    >
                      <Trophy size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#172033]">
                        {club.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {lead ? `Lead: ${lead.user.name}` : "No lead assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={lead?.user.id ?? ""}
                      onChange={(e) =>
                        assignLead(
                          club,
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      disabled={isSaving}
                      className={`h-10 w-64 max-w-full rounded-lg border px-2 text-sm outline-none transition disabled:opacity-60 ${
                        lead
                          ? "border-slate-200 bg-white text-slate-700"
                          : "border-amber-300 bg-amber-50 text-amber-800"
                      }`}
                    >
                      <option value="">— Unassigned —</option>

                      {classLevelTeachers.length > 0 && (
                        <optgroup label="Class Teachers & Assistants">
                          {classLevelTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} — {t.email}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {specialistTeachers.length > 0 && (
                        <optgroup label="Specialist Teachers">
                          {specialistTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} — {t.email}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {isSaving && (
                      <Loader2
                        size={16}
                        className="animate-spin text-slate-400"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {result && <ResultModal {...result} onClose={() => setResult(null)} />}
    </>
  );
}

/* ============================================================
 * SHARED UI
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
        active
          ? "bg-[#252B68] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50"
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
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl ${bg}`} />
      </div>
    </div>
  );
}

function StatusPill({
  label,
  colour,
}: {
  label: string;
  colour: "emerald" | "amber" | "slate" | "blue" | "violet";
}) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${map[colour]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          colour === "emerald"
            ? "bg-emerald-500"
            : colour === "amber"
            ? "bg-amber-500"
            : colour === "slate"
            ? "bg-slate-400"
            : colour === "blue"
            ? "bg-blue-500"
            : "bg-violet-500"
        }`}
      />
      {label}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#252B68]"
      />
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const width = size === "lg" ? "max-w-3xl" : "max-w-xl";
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#172033]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  saving,
  label,
}: {
  onCancel: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
      >
        {saving ? <Loader2 size={17} className="animate-spin" /> : null}
        {saving ? "Saving..." : label}
      </button>
    </div>
  );
}

function ConfirmDelete({
  title,
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <Trash2 size={22} className="text-red-600" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#172033]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {message}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
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
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {message}
          </p>
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

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Loader2 size={20} className="animate-spin text-[#F58220]" />
        {label}
      </div>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#172033]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      {action}
    </div>
  );
}