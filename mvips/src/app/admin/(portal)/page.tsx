"use client";

import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Inbox,
  Loader2,
  Receipt,
  School,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

type RoleGroup =
  | "admin"
  | "headteacher"
  | "teacher"
  | "bursar"
  | "admissions"
  | "editor"
  | "parent";

interface StatItem {
  label: string;
  value: number | string;
  hint: string;
  tone: "blue" | "violet" | "amber" | "emerald" | "slate";
  icon: string;
}

interface Section {
  id: number;
  name: string;
  stream_colour: string | null;
  roles: string[];
  subjects: string[];
  is_class_teacher: boolean;
  student_count: number;
  attendance_marked: boolean;
  attendance_marked_at: string | null;
}

interface Submission {
  id: number;
  student: {
    id: number;
    student_number: string;
    full_name: string;
    photo_url: string | null;
  } | null;
  class_stream: string | null;
  term: string | null;
  status: string;
  submitted_at: string | null;
  submitted_by: string | null;
  updated_at: string | null;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label: string;
  is_active: boolean;
  created_at: string;
}

interface RecentStory {
  id: number;
  title: string;
  status: string;
  featured: boolean;
  author: string | null;
  category: string | null;
  created_at: string;
}

interface RecentApplication {
  id: number;
  number: string;
  name: string;
  status: string;
  submitted_at: string | null;
  class_applied: string | null;
  academic_year: string | null;
}

interface RecentPayment {
  id: number;
  student_name: string;
  amount: number;
  method: string;
  paid_on: string;
  bank_account: string | null;
}

interface TopOutstanding {
  invoice_id: number;
  student_name: string;
  student_number: string;
  structure: string | null;
  total: number;
  paid: number;
  balance: number;
  status: string;
}

interface FeesSnapshot {
  billed: number;
  collected: number;
  outstanding: number;
  collection_rate: number;
}

interface AttendanceToday {
  total: number;
  marked: number;
  percent: number;
}

interface Payload {
  stats: StatItem[];
  message?: string;

  sections?: Section[];
  recent_submissions?: Submission[];

  recent_users?: RecentUser[];
  recent_stories?: RecentStory[];

  admissions_pipeline?: Record<string, number>;
  recent_applications?: RecentApplication[];

  recent_payments?: RecentPayment[];
  top_outstanding?: TopOutstanding[];

  fees_snapshot?: FeesSnapshot;
  attendance_today?: AttendanceToday;
}

interface DashboardPayload {
  role_group: RoleGroup;
  role_label: string;
  name: string;
  subtitle: string;
  payload: Payload;
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso as string;
  }
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

const TONES: Record<
  StatItem["tone"],
  { bg: string; border: string; text: string; iconBg: string; iconText: string }
> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900",    iconBg: "bg-blue-100",    iconText: "text-blue-600" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-900",  iconBg: "bg-violet-100",  iconText: "text-violet-600" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   iconBg: "bg-amber-100",   iconText: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-800",   iconBg: "bg-slate-100",   iconText: "text-slate-500" },
};

function StatIcon({ name, className }: { name: string; className?: string }) {
  const props = { size: 18, className };
  switch (name) {
    case "book":      return <BookOpen {...props} />;
    case "calendar":  return <Calendar {...props} />;
    case "image":     return <ImageIcon {...props} />;
    case "users":     return <Users {...props} />;
    case "school":    return <School {...props} />;
    case "clipboard": return <ClipboardList {...props} />;
    case "file":      return <FileText {...props} />;
    case "receipt":   return <Receipt {...props} />;
    case "wallet":    return <Wallet {...props} />;
    case "dollar":    return <DollarSign {...props} />;
    case "trending":  return <TrendingUp {...props} />;
    case "inbox":     return <Inbox {...props} />;
    case "check":     return <CheckCircle2 {...props} />;
    default:          return <ClipboardList {...props} />;
  }
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft:                 { bg: "bg-slate-100",   text: "text-slate-600",   label: "Draft" },
  submitted:             { bg: "bg-blue-100",    text: "text-blue-700",    label: "Submitted" },
  document_verification: { bg: "bg-indigo-100",  text: "text-indigo-700",  label: "Documents" },
  assessment_scheduled:  { bg: "bg-amber-100",   text: "text-amber-700",   label: "Assessment scheduled" },
  assessment_completed:  { bg: "bg-cyan-100",    text: "text-cyan-700",    label: "Assessment done" },
  principal_review:      { bg: "bg-purple-100",  text: "text-purple-700",  label: "Awaiting review" },
  approved:              { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  denied:                { bg: "bg-red-100",     text: "text-red-700",     label: "Denied" },
  waitlisted:            { bg: "bg-orange-100",  text: "text-orange-700",  label: "Waitlisted" },
  enrolled:              { bg: "bg-emerald-100", text: "text-emerald-700", label: "Enrolled" },
  published:             { bg: "bg-emerald-100", text: "text-emerald-700", label: "Published" },
  held:                  { bg: "bg-rose-100",    text: "text-rose-700",    label: "On hold" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: authHeaders(),
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load dashboard");

        const d = json.data as DashboardPayload;

        if (d.role_group === "parent") {
          router.replace("/parent");
          return;
        }

        setData(d);
      } catch (e: any) {
        setError(e?.message || "Failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Could not load dashboard</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#252B68] via-[#3A4087] to-[#F58220] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFE900]">
              {greeting()}
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              Hello, {data.name}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {data.role_label} · {data.subtitle}
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <GraduationCap size={28} />
          </div>
        </div>
      </div>

      {/* Empty-state message */}
      {data.payload.message && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{data.payload.message}</p>
        </div>
      )}

      {/* Stats */}
      {data.payload.stats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.payload.stats.map((s, i) => (
            <StatCard key={i} stat={s} />
          ))}
        </div>
      )}

      {/* ============== ADMIN ============== */}
      {data.role_group === "admin" && (
        <>
          {data.payload.recent_submissions && data.payload.recent_submissions.length > 0 && (
            <SubmissionsPanel
              title="Recent submissions"
              subtitle="Reports awaiting publish or on hold"
              href="/admin/results"
              hrefLabel="All results"
              items={data.payload.recent_submissions}
            />
          )}
          {data.payload.recent_users && data.payload.recent_users.length > 0 && (
            <RecentUsersPanel items={data.payload.recent_users} />
          )}
          {data.payload.recent_stories && data.payload.recent_stories.length > 0 && (
            <RecentStoriesPanel items={data.payload.recent_stories} />
          )}
        </>
      )}

      {/* ============== HEADTEACHER ============== */}
      {data.role_group === "headteacher" && (
        <>
          {data.payload.fees_snapshot && (
            <FeesSnapshotPanel snapshot={data.payload.fees_snapshot} />
          )}
          {data.payload.attendance_today && (
            <AttendanceTodayPanel snapshot={data.payload.attendance_today} />
          )}
          {data.payload.admissions_pipeline && (
            <AdmissionsPipelinePanel
              pipeline={data.payload.admissions_pipeline}
              compact
            />
          )}
          {data.payload.recent_submissions && data.payload.recent_submissions.length > 0 && (
            <SubmissionsPanel
              title="Recent submissions"
              subtitle="Reports awaiting publish"
              href="/admin/results"
              hrefLabel="All results"
              items={data.payload.recent_submissions}
            />
          )}
        </>
      )}

      {/* ============== TEACHER ============== */}
      {data.role_group === "teacher" && (
        <>
          {data.payload.sections && data.payload.sections.length > 0 && (
            <SectionsPanel sections={data.payload.sections} />
          )}
          {data.payload.recent_submissions && data.payload.recent_submissions.length > 0 && (
            <SubmissionsPanel
              title="Reports awaiting action"
              subtitle="Drafts to submit and reports already submitted"
              href="/admin/results"
              hrefLabel="All reports"
              items={data.payload.recent_submissions}
            />
          )}
        </>
      )}

      {/* ============== BURSAR ============== */}
      {data.role_group === "bursar" && (
        <>
          {data.payload.recent_payments && data.payload.recent_payments.length > 0 && (
            <RecentPaymentsPanel items={data.payload.recent_payments} />
          )}
          {data.payload.top_outstanding && data.payload.top_outstanding.length > 0 && (
            <TopOutstandingPanel items={data.payload.top_outstanding} />
          )}
        </>
      )}

      {/* ============== ADMISSIONS ============== */}
      {data.role_group === "admissions" && (
        <>
          {data.payload.admissions_pipeline && (
            <AdmissionsPipelinePanel pipeline={data.payload.admissions_pipeline} />
          )}
          {data.payload.recent_applications && data.payload.recent_applications.length > 0 && (
            <RecentApplicationsPanel items={data.payload.recent_applications} />
          )}
        </>
      )}

      {/* ============== EDITOR ============== */}
      {data.role_group === "editor" && data.payload.recent_stories && (
        <RecentStoriesPanel items={data.payload.recent_stories} />
      )}
    </div>
  );
}

/* ============================================================
 * STAT CARD
 * ============================================================ */

function StatCard({ stat }: { stat: StatItem }) {
  const t = TONES[stat.tone];
  return (
    <div className={`rounded-2xl border p-4 ${t.bg} ${t.border}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${t.text} opacity-70`}>
          {stat.label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.iconBg} ${t.iconText}`}>
          <StatIcon name={stat.icon} />
        </div>
      </div>
      <p className={`mt-2 text-2xl font-black sm:text-3xl ${t.text}`}>
        {stat.value}
      </p>
      <p className={`mt-0.5 text-[11px] ${t.text} opacity-70`}>{stat.hint}</p>
    </div>
  );
}

/* ============================================================
 * SECTIONS (teacher)
 * ============================================================ */

const ROLE_LABEL: Record<string, string> = {
  class_teacher: "Class Teacher",
  lead_teacher: "Lead Teacher",
  assistant_teacher: "Assistant Teacher",
  subject_teacher: "Subject Teacher",
  club_lead: "Club Lead",
};

function SectionsPanel({ sections }: { sections: Section[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252B68]/10 text-[#252B68]">
            <School size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">My Sections</h2>
            <p className="text-[11px] text-slate-500">
              {sections.length} section{sections.length === 1 ? "" : "s"} this academic year
            </p>
          </div>
        </div>
        <Link
          href="/admin/attendance"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          Attendance <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {sections.map((s) => {
          const roles = s.roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ");
          return (
            <div
              key={s.id}
              className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.stream_colour ?? "#252B68" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#172033]">{s.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {roles}
                    {s.subjects.length > 0 ? ` · ${s.subjects.join(", ")}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <Users size={10} />
                  {s.student_count}
                </span>

                {s.is_class_teacher &&
                  (s.attendance_marked ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 size={10} />
                      Marked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      <Clock size={10} />
                      Not marked
                    </span>
                  ))}

                <Link
                  href="/admin/assessment-sheet"
                  className="inline-flex items-center gap-1 rounded-md border border-[#252B68]/20 bg-white px-2 py-0.5 text-[10px] font-bold text-[#252B68] hover:bg-[#252B68]/5"
                >
                  Grade <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * SUBMISSIONS PANEL (admin / headteacher / teacher)
 * ============================================================ */

function SubmissionsPanel({
  title,
  subtitle,
  href,
  hrefLabel,
  items,
}: {
  title: string;
  subtitle: string;
  href: string;
  hrefLabel: string;
  items: Submission[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">{title}</h2>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          {hrefLabel} <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-[10px] font-bold text-white ring-2 ring-white">
                {p.student?.photo_url ? (
                  <img
                    src={p.student.photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(p.student?.full_name ?? "")
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#172033]">
                  {p.student?.full_name ?? "Unknown student"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {p.student?.student_number ?? "—"}
                  {p.class_stream ? ` · ${p.class_stream}` : ""}
                  {p.term ? ` · ${p.term}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <StatusBadge status={p.status} />
              <span className="text-[10px] text-slate-400">
                {fmtDateTime(p.submitted_at ?? p.updated_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * RECENT USERS (admin)
 * ============================================================ */

function RecentUsersPanel({ items }: { items: RecentUser[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252B68]/10 text-[#252B68]">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Recent users</h2>
            <p className="text-[11px] text-slate-500">Latest accounts created</p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          All users <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-xs font-bold text-white ring-2 ring-white">
                {initials(u.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#172033]">
                  {u.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {u.role_label}
              </span>
              {u.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 size={10} />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * FEES SNAPSHOT (headteacher)
 * ============================================================ */

function FeesSnapshotPanel({ snapshot }: { snapshot: FeesSnapshot }) {
  const { billed, collected, outstanding, collection_rate } = snapshot;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Wallet size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Fees · this term</h2>
            <p className="text-[11px] text-slate-500">Billed, collected and outstanding</p>
          </div>
        </div>
        <Link
          href="/admin/fees"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          Details <ChevronRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Billed
          </p>
          <p className="mt-1 text-base font-black text-[#252B68]">
            {money(billed)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-emerald-50/60 px-3 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
            Collected
          </p>
          <p className="mt-1 text-base font-black text-emerald-800">
            {money(collected)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-amber-50/60 px-3 py-2.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
            Outstanding
          </p>
          <p className="mt-1 text-base font-black text-amber-900">
            {money(outstanding)}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold">Collection rate</span>
          <span className="font-black text-[#172033]">{collection_rate}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#252B68] to-[#F58220]"
            style={{ width: `${Math.min(Math.max(collection_rate, 0), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * ATTENDANCE TODAY (headteacher)
 * ============================================================ */

function AttendanceTodayPanel({ snapshot }: { snapshot: AttendanceToday }) {
  const { total, marked, percent } = snapshot;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <ClipboardList size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Attendance · today
            </h2>
            <p className="text-[11px] text-slate-500">
              {marked} of {total} section{total === 1 ? "" : "s"} marked
            </p>
          </div>
        </div>
        <Link
          href="/admin/attendance"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          Open <ChevronRight size={12} />
        </Link>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Completion</span>
          <span className="font-black text-[#172033]">{percent}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              percent >= 80
                ? "bg-emerald-500"
                : percent >= 50
                ? "bg-amber-500"
                : "bg-rose-400"
            }`}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {percent === 100
            ? "All sections marked. Nice work!"
            : `${total - marked} section${
                total - marked === 1 ? "" : "s"
              } still pending today.`}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * ADMISSIONS PIPELINE (headteacher / admissions)
 * ============================================================ */

const PIPELINE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  document_verification: "Documents",
  assessments_scheduled: "Assessment scheduled",
  assessments_completed: "Assessment done",
  awaiting_approval: "Awaiting review",
  approved: "Approved",
  denied: "Denied",
  waitlisted: "Waitlisted",
  enrolled: "Enrolled",
};

const PIPELINE_TONES: Record<string, string> = {
  submitted: "bg-blue-500",
  document_verification: "bg-indigo-500",
  assessments_scheduled: "bg-amber-500",
  assessments_completed: "bg-cyan-500",
  awaiting_approval: "bg-purple-500",
  approved: "bg-emerald-500",
  denied: "bg-red-500",
  waitlisted: "bg-orange-500",
  enrolled: "bg-emerald-600",
};

function AdmissionsPipelinePanel({
  pipeline,
  compact = false,
}: {
  pipeline: Record<string, number>;
  compact?: boolean;
}) {
  const total = Object.values(pipeline).reduce((s, v) => s + v, 0);

  const keys = compact
    ? ["submitted", "awaiting_approval", "approved", "enrolled"]
    : Object.keys(PIPELINE_LABELS);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Inbox size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Admissions pipeline
            </h2>
            <p className="text-[11px] text-slate-500">
              {total} active application{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          Open <ChevronRight size={12} />
        </Link>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 px-5 py-4 ${
          compact
            ? "sm:grid-cols-4"
            : "sm:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {keys.map((key) => {
          const value = pipeline[key] ?? 0;
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5"
            >
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                {PIPELINE_LABELS[key]}
              </p>
              <p className="mt-1 text-xl font-black text-[#172033]">{value}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${PIPELINE_TONES[key] ?? "bg-slate-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * RECENT APPLICATIONS (admissions)
 * ============================================================ */

function RecentApplicationsPanel({
  items,
}: {
  items: RecentApplication[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252B68]/10 text-[#252B68]">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Recent applications
            </h2>
            <p className="text-[11px] text-slate-500">Latest submissions</p>
          </div>
        </div>
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          All applications <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172033]">
                {a.name}
              </p>
              <p className="font-mono text-[11px] text-slate-500">{a.number}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {a.class_applied && (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {a.class_applied}
                </span>
              )}
              <StatusBadge status={a.status} />
              <span className="text-[10px] text-slate-400">
                {fmtDate(a.submitted_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * RECENT PAYMENTS (bursar)
 * ============================================================ */

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
  cheque: "Cheque",
};

function RecentPaymentsPanel({ items }: { items: RecentPayment[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Wallet size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Recent payments
            </h2>
            <p className="text-[11px] text-slate-500">
              Last 6 across the term
            </p>
          </div>
        </div>
        <Link
          href="/admin/fees/payments"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          All payments <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172033]">
                {p.student_name}
              </p>
              <p className="text-[11px] text-slate-500">
                {METHOD_LABELS[p.method] ?? p.method}
                {p.bank_account ? ` · ${p.bank_account}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <p className="text-sm font-black text-emerald-700">
                {money(p.amount)}
              </p>
              <span className="text-[10px] text-slate-400">
                {fmtDate(p.paid_on)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * TOP OUTSTANDING (bursar)
 * ============================================================ */

function TopOutstandingPanel({ items }: { items: TopOutstanding[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <DollarSign size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Top outstanding invoices
            </h2>
            <p className="text-[11px] text-slate-500">
              Highest balances first
            </p>
          </div>
        </div>
        <Link
          href="/admin/fees/invoices"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          All invoices <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((inv) => (
          <div
            key={inv.invoice_id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172033]">
                {inv.student_name}
              </p>
              <p className="text-[11px] text-slate-500">
                {inv.student_number}
                {inv.structure ? ` · ${inv.structure}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-black text-amber-800">
                  {money(inv.balance)}
                </p>
                <p className="text-[10px] text-slate-400">
                  of {money(inv.total)} · paid {money(inv.paid)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * RECENT STORIES (editor / admin)
 * ============================================================ */

function RecentStoriesPanel({ items }: { items: RecentStory[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252B68]/10 text-[#252B68]">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Recent stories</h2>
            <p className="text-[11px] text-slate-500">Latest content</p>
          </div>
        </div>
        <Link
          href="/admin/stories"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          All stories <ChevronRight size={12} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172033]">
                {s.title}
              </p>
              <p className="text-[11px] text-slate-500">
                {s.category ?? "Uncategorised"}
                {s.author ? ` · ${s.author}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {s.featured && (
                <span className="inline-flex items-center rounded-full bg-[#FFE900] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#252B68]">
                  Featured
                </span>
              )}
              <StatusBadge status={s.status} />
              <span className="text-[10px] text-slate-400">
                {fmtDate(s.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}