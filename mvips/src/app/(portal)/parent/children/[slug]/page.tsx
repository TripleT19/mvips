"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Loader2,
  Lock,
  Printer,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface TermRow {
  term_id: number;
  term_name: string;
  academic_year_id: number;
  year_name: string;
  published_at: string | null;
  balance: number;
  is_available: boolean;
}

interface FeeBlock {
  balance: number;
  term_id: number;
  academic_year_id: number;
}

interface Attendance {
  total_sessions: number;
  present: number;
  late: number;
  percentage: number | null;
}

interface CoreSubject {
  subject_name: string;
  total_marks: number;
  scored_marks: number | null;
  percentage: number | null;
  grade: string | null;
  achievement: string | null;
  effort_shown: string | null;
  observation: string | null;
  strands: {
    strand_name: string;
    objectives: { name: string; rating: string | null }[];
  }[];
}

interface Specialist {
  subject_name: string;
  total_marks: number;
  scored_marks: number | null;
  percentage: number | null;
  grade: string | null;
  achievement: string | null;
}

interface WeekRow {
  week: number;
  score: number | null;
  max_score: number;
}

interface WeeklyTest {
  test_type: string;
  label: string;
  weeks: WeekRow[];
}

type TraitRating = "excellent" | "good" | "satisfactory" | "must_improve";
type ScholarTraits = Partial<Record<string, TraitRating>>;

interface ResultsPayload {
  student: {
    id: number;
    slug: string;
    student_number: string;
    full_name: string;
    photo_url: string | null;
    date_of_birth?: string | null;
    house_name?: string | null;
  };
  class_stream: { name: string | null };
  term: { id: number; name: string };
  academic_year: { id: number; name: string };
  attendance: Attendance;
  core_subjects: CoreSubject[];
  specialist_subjects: Specialist[];
  weekly_tests: WeeklyTest[];
  total_weeks: number;
  observations: {
    class_teacher: string | null;
    skill_enhancement: string | null;
  };
  scholar_traits?: ScholarTraits | null;
  class_teacher_name?: string | null;
  lead_teacher_name?: string | null;
  published: { at: string | null; by: string | null };
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function money(n: number) {
  return `MWK ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso as string;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatPublishDate(iso: string | null | undefined): string {
  if (!iso) return "Not yet published";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return `${ordinal(d.getDate())} ${d.toLocaleDateString("en-GB", {
      month: "long",
    })}, ${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

/* ============================================================
 * PRINT CSS
 * ============================================================ */

const PRINT_CSS = `
  @media print {
    @page { margin: 12mm 10mm; size: A4; }
    html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
    aside, header.sticky, footer.border-t, .no-print { display: none !important; }
    .flex.min-h-screen.flex-col { margin-left: 0 !important; display: block !important; }
    main { padding: 0 !important; max-width: none !important; margin: 0 !important; }
    .report-shell { padding: 0 !important; max-width: none !important; margin: 0 !important; }
    .report-shell > * + * { margin-top: 6px !important; }
    .report-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; border-radius: 6px !important; margin-bottom: 0 !important; break-inside: auto !important; page-break-inside: auto !important; }
    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
    .section-header { break-after: avoid !important; page-break-after: avoid !important; }
    .atomic-row { break-inside: avoid !important; page-break-inside: avoid !important; }
    table { page-break-inside: auto !important; }
    tr { page-break-inside: avoid !important; page-break-after: auto !important; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    a { color: inherit !important; text-decoration: none !important; }
    img { max-width: 100% !important; }
  }
`;

/* ============================================================
 * TRAITS / GRADES
 * ============================================================ */

const TRAIT_LEVELS = [
  { key: "excellent" as const, label: "Excellent" },
  { key: "good" as const, label: "Good" },
  { key: "satisfactory" as const, label: "Satisfactory" },
  { key: "must_improve" as const, label: "Must Improve" },
];

const SCHOLAR_TRAITS: {
  key: string;
  trait: string;
  levels: Record<TraitRating, string>;
}[] = [
  {
    key: "responsibility_leadership",
    trait: "Responsibility and Leadership",
    levels: {
      excellent: "Always assertive and responsible",
      good: "Mostly empathetic and responsible",
      satisfactory: "Rarely responsible",
      must_improve: "Needs to be more responsible",
    },
  },
  {
    key: "general_appearance",
    trait: "General Appearance",
    levels: {
      excellent: "Always neat and appropriate",
      good: "Mostly neat and appropriate",
      satisfactory: "Rarely neat and appropriate",
      must_improve: "Needs More Effort",
    },
  },
  {
    key: "interaction_adults",
    trait: "Interaction With Adults In School",
    levels: {
      excellent: "Always polite and respectful to all adults in school",
      good: "Mostly polite and respectful to all adults in school",
      satisfactory: "Polite and respectful at times. Needs reminders sometimes",
      must_improve: "Needs to work on being polite and respectful",
    },
  },
  {
    key: "interaction_peers",
    trait: "Interaction With Peers",
    levels: {
      excellent:
        "Shares strong positive relationship with other students. Makes many friends with ease. Helpful and cooperative all the time.",
      good:
        "Mostly shares positive relationship with other students. Has a good number of friends. Mostly helpful and cooperative.",
      satisfactory:
        "Shares fairly good relationship with other students. Prefers a smaller group of friends. Helpful and cooperative.",
      must_improve:
        "Often faces challenges in relationship with other students. Needs to make steady friendships.",
    },
  },
  {
    key: "attitude_homework",
    trait: "Attitude Towards Homework And Classwork",
    levels: {
      excellent:
        "Always works independently and completes tasks to match the standards expected. Often takes pride in work.",
      good:
        "Mostly works independently and usually completes tasks to match the standards expected. Mostly regular and takes pride in work.",
      satisfactory:
        "Sometimes works independently and tries to complete tasks to match the standards expected. Often regular and gives in good work.",
      must_improve:
        "Needs additional support over most tasks to reach an average standard.",
    },
  },
  {
    key: "attitude_learning",
    trait: "Attitude Towards Learning",
    levels: {
      excellent:
        "Active participant in lessons and very involved. Asks insightful questions, listens carefully and follows instructions.",
      good:
        "Participate in lessons and is involved. Sometimes asks questions, listens and follows instructions.",
      satisfactory:
        "Sometimes participates in lessons. Rarely asks questions, but listens and follows instructions.",
      must_improve:
        "Is quite distracted during lessons and needs to be reminded to focus on the task at hand. Often seems disinterested in topics being discussed.",
    },
  },
];

const GRADE_TIERS = [
  { range: "81 – 100%", grade: "A+", label: "Outstanding", bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-800", badge: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200", desc: "Comprehensive mastery, deep knowledge, critical insight." },
  { range: "61 – 80%", grade: "A", label: "High", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", badge: "bg-indigo-100 text-indigo-800 ring-indigo-200", desc: "Very strong grasp, extended engagement." },
  { range: "41 – 60%", grade: "B", label: "Good", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800 ring-blue-200", desc: "Substantial engagement, well-developed analysis." },
  { range: "21 – 40%", grade: "C", label: "Aspiring", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-800 ring-emerald-200", desc: "Acceptable grasp, developing ideas." },
  { range: "10 – 20%", grade: "D", label: "Basic", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-800 ring-red-200", desc: "Basic grasp, lacking focus and structure." },
  { range: "Below 10%", grade: "E", label: "Unclassified", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-800", badge: "bg-sky-100 text-sky-800 ring-sky-200", desc: "Insufficient understanding, serious omissions." },
];

/* ============================================================
 * PAGE
 * ============================================================ */

export default function ParentChildResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [terms, setTerms] = useState<TermRow[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  const [data, setData] = useState<ResultsPayload | null>(null);
  const [feeBlock, setFeeBlock] = useState<FeeBlock | null>(null);

  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Inject print styles ---------- */
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = PRINT_CSS;
    styleEl.id = "parent-report-print-styles";
    document.head.appendChild(styleEl);
    return () => {
      document.getElementById("parent-report-print-styles")?.remove();
    };
  }, []);

  /* ---------- Load available terms ---------- */
  useEffect(() => {
    (async () => {
      setLoadingTerms(true);
      setError("");

      try {
        const res = await fetch(
          `${API_URL}/api/admin/parent/children/${slug}/terms`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load terms");

        const rows = (json.data ?? []) as TermRow[];
        setTerms(rows);
        if (rows.length) setSelectedTermId(rows[0].term_id);
      } catch (e: any) {
        setError(e?.message || "Failed to load.");
      } finally {
        setLoadingTerms(false);
      }
    })();
  }, [slug]);

  /* ---------- Load results ---------- */
  const loadResults = useCallback(
    async (termId: number) => {
      setLoadingResults(true);
      setError("");
      setFeeBlock(null);
      setData(null);

      try {
        const res = await fetch(
          `${API_URL}/api/admin/parent/children/${slug}/results?term_id=${termId}`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const json = await res.json();

        if (res.status === 402 && json?.code === "FEES_OUTSTANDING") {
          setFeeBlock(json.data);
          return;
        }

        if (!res.ok) throw new Error(json?.message || "Failed to load results");
        setData(json.data);
      } catch (e: any) {
        setError(e?.message || "Failed to load.");
      } finally {
        setLoadingResults(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (selectedTermId) loadResults(selectedTermId);
  }, [selectedTermId, loadResults]);

  /* ============================================================
   * GUARDS
   * ============================================================ */

  if (loadingTerms) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#252B68] hover:underline"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:p-5">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Could not load results</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!terms.length) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#252B68] hover:underline"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-10">
          <AlertCircle size={32} className="text-amber-600" />
          <p className="mt-3 text-sm font-bold text-amber-900">
            No published results yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-amber-800">
            Results for this student will appear here once the school publishes
            the term report.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
   * MAIN RENDER
   * ============================================================ */

  return (
    <div className="mx-auto max-w-4xl space-y-3 sm:space-y-5">
      {/* Toolbar */}
      <div className="no-print flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#252B68] hover:underline"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedTermId ?? ""}
              onChange={(e) => setSelectedTermId(Number(e.target.value))}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold outline-none focus:border-[#252B68] sm:w-auto"
            >
              {terms.map((t) => (
                <option
                  key={`${t.academic_year_id}-${t.term_id}`}
                  value={t.term_id}
                >
                  {t.term_name} · {t.year_name}
                  {!t.is_available ? ` — ${money(t.balance)} outstanding` : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {data && (
            <button
              onClick={() => window.print()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1d2255] sm:w-auto"
            >
              <Printer size={15} />
              Print / Save as PDF
            </button>
          )}
        </div>
      </div>

      {/* Loading results */}
      {loadingResults && (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 size={22} className="animate-spin text-[#F58220]" />
        </div>
      )}

      {/* Fee block */}
      {!loadingResults && feeBlock && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 sm:h-12 sm:w-12">
              <Lock size={20} className="sm:hidden" />
              <Lock size={22} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[#172033] sm:text-lg">
                Results are ready — balance outstanding
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                The results for this term have been published, but they are
                temporarily blocked until the outstanding balance is cleared.
              </p>

              <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3 sm:mt-4 sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Outstanding Balance
                </p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-black text-amber-900 sm:text-3xl">
                  <DollarSign size={18} className="sm:hidden" />
                  <DollarSign size={22} className="hidden sm:block" />
                  {money(feeBlock.balance)}
                </p>
              </div>

              <p className="mt-3 text-[11px] text-slate-500 sm:mt-4 sm:text-xs">
                Once the balance is settled, refresh this page and the full
                report will be visible immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report */}
      {!loadingResults && data && (
        <div className="report-shell space-y-3 sm:space-y-4">
          <ReportHeader data={data} />
          <AttendanceBlock data={data} />

          {data.core_subjects.map((subject, i) => (
            <CoreSubjectBlock key={i} subject={subject} />
          ))}

          {data.weekly_tests.length > 0 && (
            <WeeklyTestsBlock
              tests={data.weekly_tests}
              totalWeeks={data.total_weeks}
            />
          )}

          {data.specialist_subjects.length > 0 && (
            <SpecialistBlock subjects={data.specialist_subjects} />
          )}

          {(data.observations.skill_enhancement ||
            data.observations.class_teacher) && (
            <ObservationsBlock data={data} />
          )}

          <ScholarTraitsBlock traits={data.scholar_traits ?? null} />
          <GradeLegendBlock />
          <SignatureBlock data={data} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * REPORT HEADER
 * ============================================================ */

function ReportHeader({ data }: { data: ResultsPayload }) {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-2 bg-gradient-to-r from-[#252B68] via-[#3A4087] to-[#F58220]" />

      <div className="px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F58220] sm:text-[10px]">
              Mount View International Primary School
            </p>
            <h2 className="mt-1 text-base font-black leading-tight text-[#172033] sm:text-lg">
              {data.term.name} Progress Report · {data.academic_year.name}
            </h2>
          </div>
          <div className="sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px]">
              Date Published
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-700 sm:text-xs">
              {formatPublishDate(data.published.at)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-start gap-3 sm:mt-5 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-[#252B68] to-[#4A5496] text-xl font-black text-white shadow-md ring-1 ring-slate-200 sm:h-24 sm:w-24 sm:text-2xl">
            {data.student.photo_url ? (
              <img
                src={data.student.photo_url}
                alt={data.student.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(data.student.full_name)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black leading-tight text-[#172033] break-words sm:text-2xl">
              {data.student.full_name}
            </h1>

            <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 sm:text-sm">
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">ID:</span>{" "}
                {data.student.student_number}
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">Class:</span>{" "}
                {data.class_stream.name ?? "—"}
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">Date of Birth:</span>{" "}
                {fmtDate(data.student.date_of_birth)}
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">House:</span>{" "}
                {data.student.house_name ?? "—"}
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">Class Teacher:</span>{" "}
                {data.class_teacher_name ?? "—"}
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-800">Lead Teacher:</span>{" "}
                {data.lead_teacher_name ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * ATTENDANCE
 * ============================================================ */

function AttendanceBlock({ data }: { data: ResultsPayload }) {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <Clock size={13} className="sm:hidden" />
          <Clock size={14} className="hidden sm:block" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
          Attendance
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4 sm:gap-3 sm:px-5 sm:py-4">
        <AttendanceStat
          label="Sessions"
          value={data.attendance.total_sessions}
          tone="text-[#172033]"
        />
        <AttendanceStat
          label="Present"
          value={data.attendance.present}
          tone="text-emerald-700"
          icon={<CheckCircle2 size={12} />}
        />
        <AttendanceStat
          label="Late"
          value={data.attendance.late}
          tone="text-amber-700"
          icon={<Sparkles size={12} />}
        />
        <AttendanceStat
          label="Attendance"
          value={
            data.attendance.percentage !== null
              ? `${data.attendance.percentage}%`
              : "—"
          }
          tone="text-[#252B68]"
          icon={<TrendingUp size={12} />}
        />
      </div>
    </div>
  );
}

function AttendanceStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  tone: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <p className={`mt-1 text-lg font-black sm:text-xl ${tone}`}>{value}</p>
    </div>
  );
}

/* ============================================================
 * CORE SUBJECT
 * ============================================================ */

function CoreSubjectBlock({ subject }: { subject: CoreSubject }) {
  return (
    <div className="report-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-[#252B68]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white shadow-sm sm:h-9 sm:w-9">
            <BookOpen size={15} className="sm:hidden" />
            <BookOpen size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#172033] break-words sm:text-base">
              {subject.subject_name}
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px]">
              Total Marks: {subject.total_marks}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <MetricBox
            label="Scored"
            value={subject.scored_marks}
            suffix={`/ ${subject.total_marks}`}
          />
          <MetricBox
            label="Percentage"
            value={subject.percentage !== null ? `${subject.percentage}%` : "—"}
          />
          <GradeBadge grade={subject.grade} achievement={subject.achievement} />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Effort Shown:
        </p>
        <RatingBadge value={subject.effort_shown} />
      </div>

      <div className="space-y-2.5 px-4 py-3 sm:space-y-3 sm:px-5 sm:py-4">
        {subject.strands.length === 0 ? (
          <p className="text-xs italic text-slate-500">
            No assessment objectives recorded for this subject.
          </p>
        ) : (
          subject.strands.map((strand, i) => (
            <div key={i} className="atomic-row">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-[#252B68]">
                {strand.strand_name}
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {strand.objectives.map((obj, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5"
                  >
                    <p className="min-w-0 break-words text-xs font-medium text-[#172033]">
                      {obj.name}
                    </p>
                    <RatingBadge value={obj.rating} small />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {subject.observation && (
        <div className="border-t border-slate-100 bg-amber-50/40 px-4 py-2.5 sm:px-5 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
            Teacher&apos;s Observation
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            {subject.observation}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricBox({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
}) {
  return (
    <div className="min-w-[68px] rounded-lg bg-slate-100 px-2.5 py-1 text-center sm:min-w-[72px] sm:px-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-xs font-black text-[#252B68] sm:text-sm">
        {value ?? "—"}
        {suffix ? (
          <span className="ml-0.5 text-[10px] font-bold text-slate-400">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/* ============================================================
 * WEEKLY TESTS
 * ============================================================ */

function WeeklyTestsBlock({
  tests,
  totalWeeks,
}: {
  tests: WeeklyTest[];
  totalWeeks: number;
}) {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <Clock size={13} className="sm:hidden" />
          <Clock size={14} className="hidden sm:block" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
          Weekly Tests · {totalWeeks} weeks
        </h3>
      </div>

      <div className="space-y-3 px-4 py-3 sm:space-y-4 sm:px-5 sm:py-4">
        {tests.map((test) => (
          <div key={test.test_type}>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-[#252B68]">
              {test.label}
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12">
              {test.weeks.map((w) => (
                <div
                  key={w.week}
                  className={`rounded border px-1 py-1.5 text-center ${
                    w.score !== null
                      ? "border-[#252B68]/30 bg-[#252B68]/5"
                      : "border-slate-200 bg-slate-50/30"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-[9px]">
                    Wk {w.week}
                  </p>
                  <p
                    className={`text-sm font-black sm:text-xs ${
                      w.score !== null ? "text-[#252B68]" : "text-slate-300"
                    }`}
                  >
                    {w.score ?? "—"}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 sm:text-[9px]">
                    /{w.max_score}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * SPECIALIST SUBJECTS
 * ============================================================ */

function SpecialistBlock({ subjects }: { subjects: Specialist[] }) {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <Sparkles size={13} className="sm:hidden" />
          <Sparkles size={14} className="hidden sm:block" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
          Specialist Subjects
        </h3>
      </div>

      {/* Mobile: cards */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {subjects.map((s, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#172033] break-words">
                {s.subject_name}
              </p>
              <GradeBadge grade={s.grade} achievement={null} compact />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Total
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {s.total_marks}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Scored
                </p>
                <p className="text-xs font-semibold text-[#252B68]">
                  {s.scored_marks ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  %
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {s.percentage !== null ? `${s.percentage}%` : "—"}
                </p>
              </div>
            </div>
            {s.achievement && (
              <p className="mt-1.5 text-[10px] text-slate-500">
                {s.achievement}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/40 text-left text-[9px] font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-2">Subject</th>
              <th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center">Scored</th>
              <th className="px-3 py-2 text-center">%</th>
              <th className="px-3 py-2 text-center">Grade</th>
              <th className="px-5 py-2">Achievement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/40">
                <td className="px-5 py-2.5 text-sm font-semibold text-[#172033]">
                  {s.subject_name}
                </td>
                <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                  {s.total_marks}
                </td>
                <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-700">
                  {s.scored_marks ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                  {s.percentage !== null ? `${s.percentage}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <GradeBadge grade={s.grade} achievement={null} compact />
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-600">
                  {s.achievement ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
 * OBSERVATIONS
 * ============================================================ */

function ObservationsBlock({ data }: { data: ResultsPayload }) {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <Sparkles size={13} className="sm:hidden" />
          <Sparkles size={14} className="hidden sm:block" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
          Observations
        </h3>
      </div>

      <div className="space-y-3 px-4 py-3 sm:space-y-4 sm:px-5 sm:py-4">
        {data.observations.skill_enhancement && (
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Skill Enhancement Club
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {data.observations.skill_enhancement}
            </div>
          </div>
        )}

        {data.observations.class_teacher && (
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Class Teacher&apos;s Observation
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {data.observations.class_teacher}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * SCHOLAR'S TRAITS
 * ============================================================ */

function ScholarTraitsBlock({ traits }: { traits: ScholarTraits | null }) {
  return (
    <div className="report-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <Star size={13} className="sm:hidden" />
          <Star size={14} className="hidden sm:block" />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
            Mountview Scholar&apos;s Traits
          </h3>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Behaviour &amp; Engagement
          </p>
        </div>
      </div>

      {/* Mobile: stacked trait cards */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {SCHOLAR_TRAITS.map((t) => {
          const selected = traits?.[t.key] ?? null;
          return (
            <div key={t.key} className="px-4 py-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#172033]">
                {t.trait}
              </p>
              <div className="space-y-1.5">
                {TRAIT_LEVELS.map((level) => {
                  const isSelected = selected === level.key;
                  return (
                    <div
                      key={level.key}
                      className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 ${
                        isSelected
                          ? "border-[#252B68] bg-[#252B68]/5"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-[#252B68] bg-[#252B68]"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[9px] font-black uppercase tracking-wider ${
                            isSelected ? "text-[#252B68]" : "text-slate-500"
                          }`}
                        >
                          {level.label}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] leading-snug ${
                            isSelected
                              ? "font-semibold text-[#172033]"
                              : "text-slate-600"
                          }`}
                        >
                          {t.levels[level.key]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left text-[9px] font-black uppercase tracking-wider text-slate-600">
              <th className="w-[20%] border border-slate-200 px-2.5 py-2">
                Traits
              </th>
              {TRAIT_LEVELS.map((level) => (
                <th
                  key={level.key}
                  className="w-[20%] border border-slate-200 px-2.5 py-2 text-center"
                >
                  {level.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHOLAR_TRAITS.map((t) => {
              const selected = traits?.[t.key] ?? null;
              return (
                <tr key={t.key} className="atomic-row align-top">
                  <td className="border border-slate-200 bg-slate-50/40 px-2.5 py-2 text-[10px] font-bold text-[#172033]">
                    {t.trait}
                  </td>
                  {TRAIT_LEVELS.map((level) => {
                    const isSelected = selected === level.key;
                    return (
                      <td
                        key={level.key}
                        className={`border border-slate-200 px-2.5 py-2 align-top text-[10px] leading-snug ${
                          isSelected
                            ? "bg-[#252B68]/[0.08] font-semibold text-[#172033] ring-1 ring-inset ring-[#252B68]/30"
                            : "text-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#F58220]" />
                        )}
                        {t.levels[level.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!traits && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2.5 text-center sm:px-5">
          <p className="text-[10px] italic text-slate-500">
            Trait assessments are provided by the class teacher. All descriptor
            options are shown above.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * GRADE LEGEND
 * ============================================================ */

function GradeLegendBlock() {
  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="section-header flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white sm:h-7 sm:w-7">
          <TrendingUp size={13} className="sm:hidden" />
          <TrendingUp size={14} className="hidden sm:block" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-wider text-[#172033] sm:text-[11px]">
          Grade Legend
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2 sm:px-5 sm:py-4">
        {GRADE_TIERS.map((tier) => (
          <div
            key={tier.grade}
            className={`flex items-start gap-2.5 rounded-lg border ${tier.border} ${tier.bg} px-2.5 py-2 sm:gap-3 sm:px-3`}
          >
            <span
              className={`inline-flex min-w-[32px] shrink-0 justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black ring-1 sm:min-w-[36px] sm:px-2 sm:text-xs ${tier.badge}`}
            >
              {tier.grade}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-[10px] font-black uppercase tracking-wider sm:text-[11px] ${tier.text}`}
                >
                  {tier.label}
                </p>
                <p
                  className={`text-[9px] font-bold sm:text-[10px] ${tier.text} opacity-70`}
                >
                  {tier.range}
                </p>
              </div>
              <p
                className={`mt-0.5 text-[10px] leading-snug sm:text-[11px] ${tier.text} opacity-80`}
              >
                {tier.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * SIGNATURES
 * ============================================================ */

function SignatureBlock({ data }: { data: ResultsPayload }) {
  const publishedDate = formatPublishDate(data.published.at);

  return (
    <div className="report-card avoid-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:gap-6 sm:px-6 sm:py-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Head of Department
          </p>
          <div className="mt-1.5 border-b border-slate-300 pb-1 sm:mt-2">
            <p className="text-xs font-semibold text-[#172033] sm:text-sm">
              Ms. Dimpal Rawat
            </p>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Headteacher
          </p>
          <div className="mt-1.5 border-b border-slate-300 pb-1 sm:mt-2">
            <p className="text-xs font-semibold text-[#172033] sm:text-sm">
              Ms. Dimpal Rawat
            </p>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Place
          </p>
          <p className="mt-1.5 text-xs font-semibold text-[#172033] sm:mt-2 sm:text-sm">
            Blantyre
          </p>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Date
          </p>
          <p className="mt-1.5 text-xs font-semibold text-[#172033] sm:mt-2 sm:text-sm">
            {publishedDate}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center sm:px-6 sm:py-3">
        <p className="text-[10px] font-medium text-slate-500">
          Mount View International Primary School &amp; Early Years Centre ·
          Blantyre, Malawi
        </p>
        {data.published.at && (
          <p className="mt-1 text-[10px] text-slate-400">
            Published {publishedDate}
            {data.published.by ? ` by ${data.published.by}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * BADGES
 * ============================================================ */

function GradeBadge({
  grade,
  achievement,
  compact = false,
}: {
  grade: string | null;
  achievement: string | null;
  compact?: boolean;
}) {
  const tier = GRADE_TIERS.find((t) => t.grade === grade);
  if (!tier) {
    return (
      <span className="inline-flex min-w-[28px] items-center justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-black text-slate-400 sm:min-w-[32px] sm:px-2 sm:text-xs">
        —
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className={`inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black ring-1 sm:min-w-[32px] sm:px-2 sm:text-xs ${tier.badge}`}
      >
        {grade}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black ring-1 sm:min-w-[32px] sm:px-2 sm:text-xs ${tier.badge}`}
      >
        {grade}
      </span>
      {achievement && (
        <p
          className={`text-[8px] font-black uppercase tracking-wider sm:text-[9px] ${tier.text}`}
        >
          {achievement}
        </p>
      )}
    </div>
  );
}

function RatingBadge({
  value,
  small = false,
}: {
  value: string | null;
  small?: boolean;
}) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    exceeding: { bg: "bg-fuchsia-100", text: "text-fuchsia-800", label: "Exceeding" },
    high: { bg: "bg-indigo-100", text: "text-indigo-800", label: "High" },
    good: { bg: "bg-blue-100", text: "text-blue-800", label: "Good" },
    aspiring: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Aspiring" },
    basic: { bg: "bg-red-100", text: "text-red-800", label: "Basic" },
    unclassified: { bg: "bg-sky-100", text: "text-sky-800", label: "Unclassified" },
  };
  const cfg = map[(value ?? "").toLowerCase()];
  if (!cfg) {
    return (
      <span className="text-[10px] font-bold italic text-slate-400">—</span>
    );
  }
  const size = small
    ? "px-1.5 py-0.5 text-[9px]"
    : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded font-black uppercase tracking-wider ${cfg.bg} ${cfg.text} ${size}`}
    >
      {cfg.label}
    </span>
  );
}