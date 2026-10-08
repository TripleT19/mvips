"use client";

import {
  AlertCircle, ArrowLeft, Calendar, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, ClipboardCheck, Download, Eye, FileCheck2,
  FileText, Gavel, GraduationCap, Loader2, MessageSquare, Pencil, Plus,
  Printer, RefreshCw, Search, ShieldCheck, Trash2, UserCheck, UserRound,
  Users, X, XCircle,
} from "lucide-react";
import {
  FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN_KEY = "admin_token";

const ENDPOINTS = {
  dashboard: `${API_URL}/api/admin/admissions/dashboard`,
  applications: `${API_URL}/api/admin/admissions/applications`,
  formOptions: `${API_URL}/api/admin/admissions/form-options`,
};

const REQUIRED_DOCUMENT_TYPES = [
  "birth_certificate_or_passport",
  "passport_photograph_1",
  "passport_photograph_2",
];

const LIVE_WITH_OPTIONS = [
  "Both Parents", "Mother", "Father", "Guardian", "Grandparent", "Other",
];

const HOUSE_OPTIONS = [
  "Eagles House", "Lake House", "Baobab", "Sunbird House",
];

const CLASS_OPTIONS = [
  "Early Years",
  "Nursery",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown",
];

const MOUNTVIEW_EMAIL_DOMAIN = "@mountviewmw.com";

const PHONE_LENGTH = 10;

type Status =
  | "draft" | "submitted" | "document_verification"
  | "assessment_scheduled" | "assessment_completed" | "principal_review"
  | "approved" | "denied" | "waitlisted" | "enrolled"
  | "transferred" | "withdrawn";

type ApplicationListRow = {
  id: number;
  application_number: string;
  legal_first_name: string;
  middle_name: string | null;
  legal_surname: string;
  status: Status;
  source: string;
  submitted: boolean;
  submitted_at: string | null;
  physical_file_status: string | null;
  created_at: string;
  academic_year?: { id: number; name: string } | null;
  class_applied?: { id: number; name: string } | null;
  documents_count?: number;
  assessments_count?: number;
};

type Parent = {
  id?: number;
  full_name: string;
  relationship: string;
  phone_number: string | null;
  email: string | null;
  occupation: string | null;
  position_title: string | null;
  employer: string | null;
  work_address: string | null;
  work_phone: string | null;
  employer_pays_fees: boolean;
  employer_payment_percentage: number | null;
  physical_address: string | null;
  postal_address: string | null;
  emergency_contact: boolean;
  preferred_communication: string | null;
  is_primary: boolean;
};

type Doc = {
  id: number;
  document_type: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  verification_status: "pending" | "verified" | "rejected";
  physical_received: boolean;
  physical_received_at: string | null;
  verification_notes: string | null;
  verified_at: string | null;
};

type AssessmentResult = {
  id: number;
  area: string;
  score: string | number | null;
  maximum_score: string | number | null;
  comments: string | null;
};

type Assessment = {
  id: number;
  assessment_date: string;
  assessment_time: string | null;
  location: string | null;
  assessment_type: string | null;
  result: string | null;
  comments: string | null;
  recommendation: string | null;
  assessor?: { id: number; name: string } | null;
  results: AssessmentResult[];
};

type Decision = {
  id: number;
  decision: "approved" | "denied" | "waitlisted";
  decision_date: string;
  comments: string | null;
  principal_comments: string | null;
  decided_by?: { id: number; name: string } | null;
  approved_class?: { id: number; name: string } | null;
  house?: { id: number; name: string } | null;
  academic_year?: { id: number; name: string } | null;
};

type Comment = {
  id: number;
  body: string;
  role_snapshot: string | null;
  created_at: string;
  user?: { id: number; name: string } | null;
};

type ApplicationDetail = ApplicationListRow & {
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  nationality: string | null;
  first_language: string | null;
  religion: string | null;
  weight_kg: string | number | null;
  height_cm: string | number | null;
  emergency_contact: string | null;
  family_member_count: number | null;
  student_lives_with: string | null;
  children_at_mount_view: number | null;
  siblings_at_mount_view: string[] | null;
  email_with_mount_view: string | null;
  physical_address: string | null;

  medical_conditions: string | null;
  allergies: string | null;
  learning_needs: string | null;
  family_doctor_name: string | null;
  family_doctor_phone: string | null;

  previous_school_name: string | null;
  previous_school_address: string | null;
  previous_class: string | null;
  previous_year: string | null;
  reason_for_leaving: string | null;
  previous_school_contact: string | null;
  previous_school_country: string | null;
  previous_school_language: string | null;

  contact_email: string | null;
  physical_file_status: string | null;
  parent_notes: string | null;
  admissions_notes: string | null;
  administrator_comments: string | null;
  principal_comments: string | null;
  parents: Parent[];
  documents: Doc[];
  assessments: Assessment[];
  decisions: Decision[];
  comments: Comment[];
  student?: any;
};

type FormOptions = {
  classes: { id: number; name: string; code: string | null }[];
  academic_years: { id: number; name: string; is_current: boolean }[];
  houses: { id: number; name: string; colour: string | null }[];
};

type DashboardStats = {
  total: number;
  submitted: number;
  document_verification: number;
  assessments_scheduled: number;
  assessments_completed: number;
  awaiting_approval: number;
  approved: number;
  denied: number;
  waitlisted: number;
  enrolled: number;
};

type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "document_verification", label: "Document Verification" },
  { value: "assessment_scheduled", label: "Assessment Scheduled" },
  { value: "assessment_completed", label: "Assessment Completed" },
  { value: "principal_review", label: "Principal Review" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "enrolled", label: "Enrolled" },
  { value: "transferred", label: "Transferred" },
  { value: "withdrawn", label: "Withdrawn" },
];

const EDIT_STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "document_verification", label: "Document Verification" },
  { value: "assessment_scheduled", label: "Assessment Scheduled" },
  { value: "assessment_completed", label: "Assessment Completed" },
  { value: "principal_review", label: "Principal Review" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "enrolled", label: "Enrolled" },
  { value: "transferred", label: "Transferred" },
  { value: "withdrawn", label: "Withdrawn" },
];

const DOCUMENT_LABELS: Record<string, string> = {
  birth_certificate_or_passport: "Birth Certificate or Main Passport Pages",
  passport_photograph_1: "Passport Photograph 1",
  passport_photograph_2: "Passport Photograph 2",
  school_report: "Original Mark Sheets / School Report",
};

const STATUS_STYLES: Record<Status, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400", label: "Draft" },
  submitted: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Submitted" },
  document_verification: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Document Verification" },
  assessment_scheduled: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", label: "Assessment Scheduled" },
  assessment_completed: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "Assessment Completed" },
  principal_review: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "Principal Review" },
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Approved" },
  denied: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Denied" },
  waitlisted: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", label: "Waitlisted" },
  enrolled: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Enrolled" },
  transferred: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500", label: "Transferred" },
  withdrawn: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Withdrawn" },
};

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  return digitsOnly(value).length === PHONE_LENGTH;
}

/**
 * Date of birth must be:
 *   • not in the future
 *   • at least 12 months ago (student must be older than a year)
 *   • not more than 30 years ago
 */
function validateDateOfBirth(value: string): string | null {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Please enter a valid date of birth.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d > today) return "Date of birth cannot be in the future.";

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (d > oneYearAgo) {
    return "The student must be at least 12 months old.";
  }

  const thirtyYearsAgo = new Date(today);
  thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);

  if (d < thirtyYearsAgo) {
    return "The date of birth is not realistic for an applicant.";
  }

  return null;
}

function dobMinDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 30);
  return d.toISOString().substring(0, 10);
}

function dobMaxDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d.toISOString().substring(0, 10);
}

function stripMountViewDomain(email: string | null | undefined): string {
  if (!email) return "";
  const lower = email.toLowerCase();
  if (lower.endsWith(MOUNTVIEW_EMAIL_DOMAIN)) {
    return email.slice(0, -MOUNTVIEW_EMAIL_DOMAIN.length);
  }
  return email;
}

function buildMountViewEmail(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  // Accept either bare local part or already-full email
  if (trimmed.toLowerCase().endsWith(MOUNTVIEW_EMAIL_DOMAIN)) return trimmed;
  return `${trimmed}${MOUNTVIEW_EMAIL_DOMAIN}`;
}

function isValidMountViewLocal(local: string): boolean {
  if (!local) return false;
  // Local part: letters, digits, dot, underscore, dash, plus
  return /^[a-zA-Z0-9._+-]+$/.test(local);
}

function authHeaders(json = true): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (json) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  }
  return data;
}

async function apiGet(path: string) {
  return parseResponse(await fetch(path, { headers: authHeaders(false) }));
}
async function apiPost(path: string, body?: any) {
  return parseResponse(await fetch(path, {
    method: "POST", headers: authHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
  }));
}
async function apiPut(path: string, body?: any) {
  return parseResponse(await fetch(path, {
    method: "PUT", headers: authHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
  }));
}
async function apiDelete(path: string) {
  return parseResponse(await fetch(path, {
    method: "DELETE", headers: authHeaders(false),
  }));
}

function fullName(app: { legal_first_name: string; middle_name?: string | null; legal_surname: string }) {
  return [app.legal_first_name, app.middle_name, app.legal_surname].filter(Boolean).join(" ");
}
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return value; }
}
function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return value; }
}
function fileSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadDocument(applicationId: number, doc: Doc, studentName: string) {
  const response = await fetch(
    `${ENDPOINTS.applications}/${applicationId}/documents/${doc.id}/download`,
    { headers: authHeaders(false) }
  );
  if (!response.ok) throw new Error("Unable to download the document.");
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const extension = (doc.original_name.split(".").pop() || "pdf").toLowerCase();
  const fallback = `${studentName.replace(/\s+/g, "_")}_${doc.document_type}.${extension}`;
  const filename = match?.[1] || fallback;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function allRequiredDocumentsVerified(documents: Doc[]): boolean {
  return REQUIRED_DOCUMENT_TYPES.every((type) =>
    documents.some((d) => d.document_type === type && d.verification_status === "verified")
  );
}
function hasCompletedAssessment(assessments: Assessment[]): boolean {
  return assessments.some((a) => Boolean(a.result));
}

function resolveClassSelection(detail: ApplicationDetail, formOptions: FormOptions): string {
  if (!detail.class_applied) return "";
  if (formOptions.classes.length > 0) return String(detail.class_applied.id);
  return detail.class_applied.name;
}

/* ================================================================== */
/* Main page                                                           */
/* ================================================================== */

export default function AdminAdmissionsPage() {
  const searchParams = useSearchParams();
  const applicationFromUrl = searchParams.get("application");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<Paginated<ApplicationListRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [formOptions, setFormOptions] = useState<FormOptions>({
    classes: [], academic_years: [], houses: [],
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [physicalFileFilter, setPhysicalFileFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editModal, setEditModal] = useState<{
    mode: "create" | "edit";
    application: ApplicationDetail | null;
  } | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (physicalFileFilter) params.set("physical_file_status", physicalFileFilter);
    params.set("page", String(page));
    params.set("per_page", "25");
    return params.toString();
  }, [search, statusFilter, sourceFilter, physicalFileFilter, page]);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await apiGet(ENDPOINTS.dashboard);
      setStats(response.data as DashboardStats);
    } catch { /* non-fatal */ }
  }, []);

  const loadFormOptions = useCallback(async () => {
    try {
      const response = await apiGet(ENDPOINTS.formOptions);
      setFormOptions(response.data ?? { classes: [], academic_years: [], houses: [] });
    } catch { /* non-fatal */ }
  }, []);

  const loadApplications = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const response = await apiGet(`${ENDPOINTS.applications}?${buildQuery()}`);
      setApplications(response.data as Paginated<ApplicationListRow>);
    } catch (e: any) {
      setError(e?.message || "Unable to load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQuery]);

  const loadDetail = useCallback(
    async (id: number, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) {
        setDetailLoading(true);
        setDetail(null);
      }
      setDetailError("");
      try {
        const response = await apiGet(`${ENDPOINTS.applications}/${id}`);
        setDetail(response.data as ApplicationDetail);
      } catch (e: any) {
        setDetailError(e?.message || "Unable to load application.");
      } finally {
        if (!opts.silent) setDetailLoading(false);
      }
    }, []
  );

  useEffect(() => {
    loadDashboard();
    loadFormOptions();
  }, [loadDashboard, loadFormOptions]);

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQuery]);

  useEffect(() => {
    if (applicationFromUrl) {
      const id = Number(applicationFromUrl);
      if (!Number.isNaN(id)) setSelectedId(id);
    }
  }, [applicationFromUrl]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, sourceFilter, physicalFileFilter]);

  async function refreshAll() {
    await Promise.all([
      loadDashboard(),
      loadApplications({ silent: true }),
      selectedId ? loadDetail(selectedId, { silent: true }) : Promise.resolve(),
    ]);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          try { await refreshAll(); } finally { setRefreshing(false); }
        }}
        onNewApplication={() => setEditModal({ mode: "create", application: null })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {stats && <StatsRow stats={stats} />}

        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
          source={sourceFilter}
          onSourceChange={(v) => { setSourceFilter(v); setPage(1); }}
          physicalFile={physicalFileFilter}
          onPhysicalFileChange={(v) => { setPhysicalFileFilter(v); setPage(1); }}
        />

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
            <button type="button" onClick={() => setError("")}
              className="ml-auto rounded-lg p-1 hover:bg-red-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}

        <ApplicationsTable
          data={applications}
          loading={loading}
          onOpen={(id) => setSelectedId(id)}
          onPageChange={setPage}
        />
      </div>

      {selectedId && (
        <DetailDrawer
          loading={detailLoading}
          error={detailError}
          detail={detail}
          formOptions={formOptions}
          onClose={() => { setSelectedId(null); setDetail(null); setDetailError(""); }}
          onRefresh={refreshAll}
          onEdit={(app) => setEditModal({ mode: "edit", application: app })}
        />
      )}

      {editModal && (
        <ApplicationEditModal
          mode={editModal.mode}
          application={editModal.application}
          options={formOptions}
          onClose={() => setEditModal(null)}
          onSaved={async () => {
            setEditModal(null);

            // Refresh stats + list + currently open drawer (if any) in parallel
            // so any newly-added documents, assessments, decisions, notes and
            // comments are visible immediately after saving.
            await Promise.all([
              loadDashboard(),
              loadApplications({ silent: true }),
              selectedId ? loadDetail(selectedId, { silent: true }) : Promise.resolve(),
            ]);
          }}
        />
      )}
    </main>
  );
}

/* ================================================================== */
/* Header / Stats / Filters / Table                                    */
/* ================================================================== */

function Header({
  refreshing, onRefresh, onNewApplication,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onNewApplication: () => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">Mount View Admin</p>
            <h1 className="text-base font-black text-[#252B68]">Admission Applications</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onRefresh} disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" onClick={onNewApplication}
            className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-4 py-2 text-sm font-bold text-white hover:bg-[#1c2156]">
            <Plus size={16} />
            New Application
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Submitted", value: stats.submitted },
    { label: "Documents", value: stats.document_verification },
    { label: "Assessments", value: stats.assessments_scheduled },
    { label: "Awaiting Approval", value: stats.awaiting_approval },
    { label: "Approved", value: stats.approved },
    { label: "Enrolled", value: stats.enrolled },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
          <p className="mt-1 text-2xl font-black text-[#252B68]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function FiltersBar({
  search, onSearchChange, status, onStatusChange, source, onSourceChange,
  physicalFile, onPhysicalFileChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  source: string;
  onSourceChange: (v: string) => void;
  physicalFile: string;
  onPhysicalFileChange: (v: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, application number, phone…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
        </label>
        <SelectFilter value={status} onChange={onStatusChange} placeholder="All statuses"
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
        <SelectFilter value={source} onChange={onSourceChange} placeholder="All sources"
          options={[{ value: "online", label: "Online" }, { value: "paper", label: "Paper" }]} />
        <SelectFilter value={physicalFile} onChange={onPhysicalFileChange} placeholder="Physical file"
          options={[
            { value: "pending", label: "Pending" },
            { value: "received", label: "Received" },
            { value: "not_required", label: "Not required" },
          ]} />
      </div>
    </div>
  );
}

function SelectFilter({
  value, onChange, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10">
        <option value="">{placeholder}</option>
        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function ApplicationsTable({
  data, loading, onOpen, onPageChange,
}: {
  data: Paginated<ApplicationListRow> | null;
  loading: boolean;
  onOpen: (id: number) => void;
  onPageChange: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
        <Loader2 size={20} className="animate-spin" /> Loading applications…
      </div>
    );
  }
  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ClipboardCheck size={22} />
        </div>
        <p className="mt-4 font-bold text-[#172033]">No applications found</p>
        <p className="mt-1 text-sm text-slate-500">Try adjusting the filters above.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Docs</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.data.map((app) => {
              const style = STATUS_STYLES[app.status] ?? STATUS_STYLES.draft;
              return (
                <tr key={app.id} className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => onOpen(app.id)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#252B68]">{app.application_number}</td>
                  <td className="px-4 py-3 font-semibold text-[#172033]">{fullName(app)}</td>
                  <td className="px-4 py-3 text-slate-600">{app.class_applied?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{app.academic_year?.name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge style={style} /></td>
                  <td className="px-4 py-3 text-center text-slate-600">{app.documents_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">{app.submitted_at ? formatDate(app.submitted_at) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68]">
                      View <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {data.data.map((app) => {
          const style = STATUS_STYLES[app.status] ?? STATUS_STYLES.draft;
          return (
            <button key={app.id} type="button" onClick={() => onOpen(app.id)}
              className="block w-full px-4 py-4 text-left transition hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-[#252B68]">{app.application_number}</p>
                  <p className="mt-1 font-bold text-[#172033]">{fullName(app)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {app.class_applied?.name || "—"} · {app.academic_year?.name || "—"}
                  </p>
                </div>
                <StatusBadge style={style} />
              </div>
            </button>
          );
        })}
      </div>
      {data.last_page > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Page {data.current_page} of {data.last_page} · {data.total} total
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onPageChange(data.current_page - 1)}
              disabled={data.current_page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" onClick={() => onPageChange(data.current_page + 1)}
              disabled={data.current_page >= data.last_page}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ style }: { style: { bg: string; text: string; dot: string; label: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

/* ================================================================== */
/* Detail Drawer                                                       */
/* ================================================================== */

function DetailDrawer({
  loading, error, detail, formOptions, onClose, onRefresh, onEdit,
}: {
  loading: boolean;
  error: string;
  detail: ApplicationDetail | null;
  formOptions: FormOptions;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onEdit: (app: ApplicationDetail) => void;
}) {
  const [printError, setPrintError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handlePrint() {
    if (!detail) return;
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (!token) { setPrintError("Your session has expired. Please log in again to print."); return; }
    setPrintError("");
    const url = `${ENDPOINTS.applications}/${detail.id}/print?token=${encodeURIComponent(token)}`;
    const newTab = window.open(url, "_blank");
    if (!newTab) setPrintError("Please allow pop-ups for this site to print the application.");
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col overflow-hidden bg-slate-50 shadow-2xl">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">Application</p>
                <p className="font-mono text-sm font-bold text-[#252B68]">{detail?.application_number || "…"}</p>
              </div>
            </div>
            {detail && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onEdit(detail)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1c2156]">
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Printer size={13} /> Print
                </button>
                <StatusBadge style={STATUS_STYLES[detail.status] ?? STATUS_STYLES.draft} />
              </div>
            )}
          </div>
          {printError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle size={13} /> {printError}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !detail && (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2 size={20} className="animate-spin" /> Loading application…
            </div>
          )}
          {error && !loading && (
            <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {detail && !error && (
            <ApplicationDetailView detail={detail} formOptions={formOptions} onRefresh={onRefresh} />
          )}
        </div>
      </aside>
    </div>
  );
}

function ApplicationDetailView({
  detail, formOptions, onRefresh,
}: {
  detail: ApplicationDetail;
  formOptions: FormOptions;
  onRefresh: () => Promise<void>;
}) {
  const docsVerified = allRequiredDocumentsVerified(detail.documents);
  const assessmentDone = hasCompletedAssessment(detail.assessments);

  const currentUser = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("admin_user") || "null"); } catch { return null; } })()
    : null;

  const canComment =
    currentUser?.role === "administrator" ||
    currentUser?.role === "principal" ||
    currentUser?.role === "headteacher";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SummaryCard detail={detail} />
      <WorkflowActions detail={detail} />
      <StudentDetailsSection detail={detail} />
      <MedicalSection detail={detail} />
      <ParentsSection detail={detail} />
      <PreviousSchoolSection detail={detail} />

      <DocumentsSection
        applicationId={detail.id}
        documents={detail.documents}
        studentName={`${detail.legal_first_name} ${detail.legal_surname}`.trim()}
        onRefresh={onRefresh}
      />

      <AssessmentsSection
        applicationId={detail.id}
        assessments={detail.assessments}
        canSchedule={docsVerified}
        onRefresh={onRefresh}
      />

      <DecisionsSection
        applicationId={detail.id}
        decisions={detail.decisions}
        canDecide={assessmentDone}
        formOptions={formOptions}
        onRefresh={onRefresh}
        status={detail.status}
      />

      <CommentsSection
        applicationId={detail.id}
        comments={detail.comments || []}
        canComment={canComment}
        currentUserId={currentUser?.id ?? null}
        isAdministrator={currentUser?.role === "administrator"}
        onRefresh={onRefresh}
      />

      <NotesSection detail={detail} />

      {detail.status === "approved" && (
        <EnrolSection
          applicationId={detail.id}
          detail={detail}
          formOptions={formOptions}
          onRefresh={onRefresh}
          existingStudent={detail.student}
        />
      )}
    </div>
  );
}

function SummaryCard({ detail }: { detail: ApplicationDetail }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <h2 className="text-xl font-black text-[#252B68]">{fullName(detail)}</h2>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Row label="Class applied for" value={detail.class_applied?.name} />
        <Row label="Academic year" value={detail.academic_year?.name} />
        <Row label="Date of birth" value={formatDate(detail.date_of_birth)} />
        <Row label="Gender" value={detail.gender} />
        <Row label="Contact email" value={detail.contact_email} />
        <Row label="Submitted" value={formatDateTime(detail.submitted_at)} />
        <Row label="Source" value={detail.source} />
        <Row label="Physical file status" value={detail.physical_file_status} />
      </div>
    </section>
  );
}

function StudentDetailsSection({ detail }: { detail: ApplicationDetail }) {
  const siblings = Array.isArray(detail.siblings_at_mount_view)
    ? detail.siblings_at_mount_view
    : [];

  return (
    <Section title="Student Information" icon={<UserRound size={17} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoField label="Legal First Name" value={detail.legal_first_name} />
        <InfoField label="Middle Name" value={detail.middle_name} />
        <InfoField label="Legal Surname" value={detail.legal_surname} />
        <InfoField label="Date of Birth" value={formatDate(detail.date_of_birth)} />
        <InfoField label="Gender" value={detail.gender} />
        <InfoField label="Blood Group" value={detail.blood_group} />
        <InfoField label="Nationality" value={detail.nationality} />
        <InfoField label="First Language" value={detail.first_language} />
        <InfoField label="Religion" value={detail.religion} />
        <InfoField label="Weight (kg)" value={detail.weight_kg} />
        <InfoField label="Height (cm)" value={detail.height_cm} />
        <InfoField label="Emergency Contact" value={detail.emergency_contact} />
        <InfoField label="Family Members" value={detail.family_member_count} />
        <InfoField label="Student Lives With" value={detail.student_lives_with} />
        <InfoField label="Children at Mount View" value={detail.children_at_mount_view} />
        <InfoField
          label="Siblings at Mount View"
          value={siblings.length > 0 ? siblings.join(", ") : "None"}
        />
        <InfoField label="Email with Mount View" value={detail.email_with_mount_view} />
        <InfoField label="Contact Email" value={detail.contact_email} />
        <InfoField label="Physical File Status" value={detail.physical_file_status} />
      </div>
      <div className="mt-4">
        <InfoField label="Physical Address" value={detail.physical_address} block />
      </div>
    </Section>
  );
}

function MedicalSection({ detail }: { detail: ApplicationDetail }) {
  const hasAny =
    detail.medical_conditions ||
    detail.allergies ||
    detail.learning_needs ||
    detail.family_doctor_name ||
    detail.family_doctor_phone;

  if (!hasAny) return null;

  return (
    <Section title="Medical Information" icon={<UserRound size={17} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoField label="Medical Conditions" value={detail.medical_conditions || "None"} />
        <InfoField label="Allergies" value={detail.allergies || "None"} />
        <InfoField label="Learning Needs" value={detail.learning_needs || "None"} />
        <InfoField label="Family Doctor" value={detail.family_doctor_name} />
        <InfoField label="Doctor's Phone" value={detail.family_doctor_phone} />
      </div>
    </Section>
  );
}

function ParentsSection({ detail }: { detail: ApplicationDetail }) {
  return (
    <Section title="Parents & Guardians" icon={<Users size={17} />}>
      {!detail.parents || detail.parents.length === 0 ? (
        <p className="text-sm text-slate-500">No parents recorded.</p>
      ) : (
        <div className="space-y-4">
          {detail.parents.map((parent, index) => (
            <div key={parent.id ?? index} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="font-bold text-[#172033]">{parent.full_name || "—"}</p>
                {parent.is_primary && (
                  <span className="rounded-full bg-[#F58220]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F58220]">Primary</span>
                )}
                {parent.emergency_contact && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">Emergency</span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField label="Relationship" value={parent.relationship} />
                <InfoField label="Phone" value={parent.phone_number} />
                <InfoField label="Email" value={parent.email} />
                <InfoField label="Occupation" value={parent.occupation} />
                <InfoField label="Position / Title" value={parent.position_title} />
                <InfoField label="Employer" value={parent.employer} />
                <InfoField label="Work Phone" value={parent.work_phone} />
                <InfoField
                  label="Employer Pays Fees"
                  value={
                    parent.employer_pays_fees
                      ? `Yes · ${parent.employer_payment_percentage ?? "—"}%`
                      : "No"
                  }
                />
                <InfoField label="Preferred Contact" value={parent.preferred_communication} />
              </div>
              {(parent.work_address || parent.physical_address || parent.postal_address) && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {parent.work_address && <InfoField label="Work Address" value={parent.work_address} block />}
                  {parent.physical_address && <InfoField label="Physical Address" value={parent.physical_address} block />}
                  {parent.postal_address && <InfoField label="Postal Address" value={parent.postal_address} block />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function PreviousSchoolSection({ detail }: { detail: ApplicationDetail }) {
  const hasAny =
    detail.previous_school_name || detail.previous_school_address ||
    detail.previous_class || detail.previous_year ||
    detail.reason_for_leaving || detail.previous_school_contact ||
    detail.previous_school_country || detail.previous_school_language;
  return (
    <Section title="Previous School" icon={<GraduationCap size={17} />}>
      {!hasAny ? (
        <p className="text-sm text-slate-500">No previous school recorded.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="School Name" value={detail.previous_school_name} />
            <InfoField label="Country" value={detail.previous_school_country} />
            <InfoField label="Previous Class" value={detail.previous_class} />
            <InfoField label="Instructional Language" value={detail.previous_school_language} />
            <InfoField label="Previous Year" value={detail.previous_year} />
            <InfoField label="School Contact" value={detail.previous_school_contact} />
          </div>
          {detail.previous_school_address && (
            <div className="mt-4"><InfoField label="School Address" value={detail.previous_school_address} block /></div>
          )}
          {detail.reason_for_leaving && (
            <div className="mt-4"><InfoField label="Reason for Leaving" value={detail.reason_for_leaving} block /></div>
          )}
        </>
      )}
    </Section>
  );
}

function NotesSection({ detail }: { detail: ApplicationDetail }) {
  const hasAny =
    detail.parent_notes || detail.admissions_notes ||
    detail.administrator_comments || detail.principal_comments;
  if (!hasAny) return null;
  return (
    <Section title="Notes & Comments" icon={<FileText size={17} />}>
      <div className="space-y-4">
        {detail.parent_notes && <InfoField label="Parent Notes" value={detail.parent_notes} block />}
        {detail.admissions_notes && <InfoField label="Admissions Notes" value={detail.admissions_notes} block />}
        {detail.administrator_comments && <InfoField label="Administrator Comments" value={detail.administrator_comments} block />}
        {detail.principal_comments && <InfoField label="Principal Comments" value={detail.principal_comments} block />}
      </div>
    </Section>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-[#252B68]">{icon}</span>}
        <h3 className="text-sm font-black uppercase tracking-wider text-[#252B68]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, block }: { label: string; value: ReactNode; block?: boolean }) {
  return (
    <div className={block ? "mt-3 border-t border-slate-100 pt-3" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#172033]">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function InfoField({
  label, value, block,
}: {
  label: string;
  value: string | number | null | undefined;
  block?: boolean;
}) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words whitespace-pre-line text-sm font-semibold text-[#172033]">{display}</p>
    </div>
  );
}

/* ================================================================== */
/* Documents                                                           */
/* ================================================================== */

function DocumentsSection({
  applicationId, documents, studentName, onRefresh,
}: {
  applicationId: number;
  documents: Doc[];
  studentName: string;
  onRefresh: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState<{ doc: Doc; url: string; isImage: boolean } | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  async function verify(documentId: number, status: "verified" | "rejected" | "pending", physicalReceived: boolean) {
    setBusyId(documentId); setError("");
    try {
      await apiPost(`${ENDPOINTS.applications}/${applicationId}/documents/${documentId}/verify`, {
        verification_status: status, physical_received: physicalReceived,
      });
      await onRefresh();
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e: any) { setError(e?.message || "Unable to update document."); }
    finally { setBusyId(null); }
  }
  async function handlePreview(doc: Doc) {
    setError("");
    try {
      const response = await fetch(
        `${ENDPOINTS.applications}/${applicationId}/documents/${doc.id}/preview`,
        { headers: authHeaders(false) }
      );
      if (!response.ok) throw new Error("Unable to load the document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const isImage = (doc.mime_type || "").startsWith("image/");
      setPreviewing({ doc, url, isImage });
    } catch (e: any) { setError(e?.message || "Unable to preview document."); }
  }
  async function handleDownload(doc: Doc) {
    setError("");
    try { await downloadDocument(applicationId, doc, studentName); }
    catch (e: any) { setError(e?.message || "Unable to download document."); }
  }

  useEffect(() => () => { if (previewing?.url) URL.revokeObjectURL(previewing.url); }, [previewing]);

  return (
    <div ref={sectionRef} className="scroll-mt-4">
      <Section title="Documents" icon={<FileCheck2 size={17} />}>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const busy = busyId === doc.id;
              const verified = doc.verification_status === "verified";
              const statusStyles = {
                pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
                verified: { bg: "bg-green-50", text: "text-green-700", label: "Verified" },
                rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
              }[doc.verification_status];
              return (
                <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#252B68]">
                        <FileText size={17} />
                      </div>
                      <div>
                        <p className="font-bold text-[#172033]">{DOCUMENT_LABELS[doc.document_type] || doc.document_type}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{doc.original_name} · {fileSize(doc.file_size)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusStyles.bg} ${statusStyles.text}`}>
                      {statusStyles.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    <button type="button" onClick={() => handlePreview(doc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      <Eye size={13} /> Preview
                    </button>
                    <button type="button" onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      <Download size={13} /> Download
                    </button>
                    {!verified && (
                      <>
                        <button type="button" disabled={busy} onClick={() => verify(doc.id, "verified", true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
                          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Verify
                        </button>
                        <button type="button" disabled={busy} onClick={() => verify(doc.id, "rejected", false)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                          {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
                        </button>
                        {doc.verification_status === "rejected" && (
                          <button type="button" disabled={busy} onClick={() => verify(doc.id, "pending", false)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                            <RefreshCw size={13} /> Reset
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {previewing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3">
            <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#F58220]">Document Preview</p>
                  <p className="text-sm font-bold text-[#252B68]">
                    {DOCUMENT_LABELS[previewing.doc.document_type] || previewing.doc.document_type}
                  </p>
                </div>
                <button type="button"
                  onClick={() => { URL.revokeObjectURL(previewing.url); setPreviewing(null); }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close preview">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 p-3">
                {previewing.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewing.url} alt="Document" className="mx-auto max-h-[75vh] rounded-lg bg-white shadow" />
                ) : (
                  <iframe src={previewing.url} title="Document preview" className="h-[75vh] w-full rounded-lg border-0 bg-white" />
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <button type="button" onClick={() => handleDownload(previewing.doc)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156]">
                  <Download size={13} /> Download
                </button>
                <button type="button"
                  onClick={() => { URL.revokeObjectURL(previewing.url); setPreviewing(null); }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ================================================================== */
/* Assessments                                                         */
/* ================================================================== */

function AssessmentsSection({
  applicationId, assessments, canSchedule, onRefresh,
}: {
  applicationId: number;
  assessments: Assessment[];
  canSchedule: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  return (
    <Section title="Assessments" icon={<ClipboardCheck size={17} />}>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {assessments.length === 0 ? (
        <p className="text-sm text-slate-500">No assessments scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-[#172033]">{assessment.assessment_type || "Assessment"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(assessment.assessment_date)}
                    {assessment.assessment_time ? ` · ${assessment.assessment_time}` : ""}
                    {assessment.location ? ` · ${assessment.location}` : ""}
                  </p>
                  {assessment.assessor && (
                    <p className="mt-1 text-xs text-slate-500">Assessor: {assessment.assessor.name}</p>
                  )}
                </div>
                {assessment.result ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    {assessment.result}
                  </span>
                ) : (
                  <button type="button" onClick={() => setCompletingId(assessment.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1c2156]">
                    <Check size={13} /> Complete
                  </button>
                )}
              </div>
              {assessment.results.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Area</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assessment.results.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 font-semibold text-[#172033]">{r.area}</td>
                          <td className="px-3 py-2 text-slate-600">{r.score ?? "—"}{r.maximum_score ? ` / ${r.maximum_score}` : ""}</td>
                          <td className="px-3 py-2 text-slate-600">{r.comments || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {assessment.recommendation && (
                <p className="mt-3 text-xs text-slate-600">
                  <span className="font-bold">Recommendation:</span> {assessment.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {canSchedule && !showSchedule && (
        <button type="button" onClick={() => setShowSchedule(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#252B68] px-4 py-2 text-xs font-bold text-[#252B68] hover:bg-[#252B68]/5">
          <Calendar size={14} /> Schedule Assessment
        </button>
      )}
      {!canSchedule && assessments.length === 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <AlertCircle size={13} />
          All required documents must be verified before an assessment can be scheduled.
        </p>
      )}
      {showSchedule && (
        <ScheduleAssessmentForm
          applicationId={applicationId}
          onCancel={() => setShowSchedule(false)}
          onSuccess={async () => { setShowSchedule(false); await onRefresh(); }}
        />
      )}
      {completingId !== null && (
        <CompleteAssessmentForm
          assessmentId={completingId}
          onCancel={() => setCompletingId(null)}
          onSuccess={async () => { setCompletingId(null); await onRefresh(); }}
          onError={(msg) => setError(msg)}
        />
      )}
    </Section>
  );
}

function ScheduleAssessmentForm({
  applicationId, onCancel, onSuccess,
}: {
  applicationId: number;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessmentTime, setAssessmentTime] = useState("");
  const [location, setLocation] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!assessmentDate) { setError("Please choose a date."); return; }
    setBusy(true); setError("");
    try {
      await apiPost(`${ENDPOINTS.applications}/${applicationId}/assessments`, {
        assessment_date: assessmentDate,
        assessment_time: assessmentTime || null,
        location: location || null,
        assessment_type: assessmentType || null,
      });
      await onSuccess();
    } catch (e: any) { setError(e?.message || "Unable to schedule assessment."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-[#252B68]/20 bg-[#252B68]/5 p-4">
      <p className="text-sm font-black text-[#252B68]">Schedule New Assessment</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date *">
          <input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} required className="input-admin" />
        </Field>
        <Field label="Time">
          <input type="time" value={assessmentTime} onChange={(e) => setAssessmentTime(e.target.value)} className="input-admin" />
        </Field>
        <Field label="Location">
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Hall" className="input-admin" />
        </Field>
        <Field label="Type">
          <input type="text" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Entrance Assessment" className="input-admin" />
        </Field>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Schedule
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CompleteAssessmentForm({
  assessmentId, onCancel, onSuccess, onError,
}: {
  assessmentId: number;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [result, setResult] = useState("pass");
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await apiPost(`${API_URL}/api/admin/admissions/assessments/${assessmentId}/complete`, {
        result, comments: comments || null, recommendation: recommendation || null,
      });
      await onSuccess();
    } catch (e: any) {
      const msg = e?.message || "Unable to complete assessment.";
      setError(msg); onError(msg);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <p className="text-sm font-black text-[#252B68]">Complete Assessment</p>
      <Field label="Result *">
        <select value={result} onChange={(e) => setResult(e.target.value)} className="input-admin">
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="pending">Pending</option>
          <option value="recommended">Recommended</option>
          <option value="not_recommended">Not Recommended</option>
        </select>
      </Field>
      <Field label="Comments">
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="input-admin" />
      </Field>
      <Field label="Recommendation">
        <textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={2} className="input-admin" />
      </Field>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Result
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* Decisions                                                           */
/* ================================================================== */

function DecisionsSection({
  applicationId, decisions, canDecide, formOptions, onRefresh, status,
}: {
  applicationId: number;
  decisions: Decision[];
  canDecide: boolean;
  formOptions: FormOptions;
  onRefresh: () => Promise<void>;
  status: Status;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const statusBlocks = ["approved", "denied", "enrolled", "transferred", "withdrawn"].includes(status);
  const showRecordButton = canDecide && !statusBlocks;

  async function deleteDecision(id: number) {
    if (!window.confirm("Delete this decision? This cannot be undone.")) return;
    setDeletingId(id); setError("");
    try {
      await apiDelete(`${ENDPOINTS.applications}/${applicationId}/decisions/${id}`);
      await onRefresh();
    } catch (e: any) {
      setError(e?.message || "Unable to delete decision.");
    } finally { setDeletingId(null); }
  }

  return (
    <Section title="Admission Decision" icon={<Gavel size={17} />}>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {decisions.length === 0 ? (
        <p className="text-sm text-slate-500">No decision recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    d.decision === "approved"
                      ? "bg-green-50 text-green-700"
                      : d.decision === "denied"
                      ? "bg-red-50 text-red-700"
                      : "bg-purple-50 text-purple-700"
                  }`}>
                    {d.decision}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(d.decision_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setEditingDecision(d); setShowCreateForm(false); }}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-200" aria-label="Edit decision" title="Edit decision">
                    <Pencil size={13} />
                  </button>
                  <button type="button" disabled={deletingId === d.id} onClick={() => deleteDecision(d.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label="Delete decision" title="Delete decision">
                    {deletingId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <Row label="Decided by" value={d.decided_by?.name} />
                <Row label="Approved class" value={d.approved_class?.name} />
                <Row label="House" value={d.house?.name} />
                <Row label="Academic year" value={d.academic_year?.name} />
              </div>
              {(d.comments || d.principal_comments) && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
                  {d.comments && <p><span className="font-bold">Comments:</span> {d.comments}</p>}
                  {d.principal_comments && (
                    <p><span className="font-bold">Principal comments:</span> {d.principal_comments}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRecordButton && !showCreateForm && !editingDecision && (
        <button type="button" onClick={() => setShowCreateForm(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2 text-xs font-bold text-white hover:bg-[#dd6e13]">
          <Gavel size={14} /> Record Decision
        </button>
      )}
      {!canDecide && decisions.length === 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <AlertCircle size={13} /> An assessment must be completed before a decision can be recorded.
        </p>
      )}
      {showCreateForm && (
        <DecisionForm
          applicationId={applicationId}
          formOptions={formOptions}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={async () => { setShowCreateForm(false); await onRefresh(); }}
          onError={(msg) => setError(msg)}
        />
      )}
      {editingDecision && (
        <DecisionForm
          applicationId={applicationId}
          formOptions={formOptions}
          existingDecision={editingDecision}
          onCancel={() => setEditingDecision(null)}
          onSuccess={async () => { setEditingDecision(null); await onRefresh(); }}
          onError={(msg) => setError(msg)}
        />
      )}
    </Section>
  );
}

function DecisionForm({
  applicationId, formOptions, existingDecision, onCancel, onSuccess, onError,
}: {
  applicationId: number;
  formOptions: FormOptions;
  existingDecision?: Decision | null;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const isEdit = Boolean(existingDecision);
  const [decision, setDecision] = useState<"approved" | "denied" | "waitlisted">(
    (existingDecision?.decision as any) ?? "approved"
  );
  const [approvedClassId, setApprovedClassId] = useState(
    existingDecision?.approved_class?.id ? String(existingDecision.approved_class.id) : ""
  );
  const [houseName, setHouseName] = useState(existingDecision?.house?.name ?? "");
  const [academicYearId, setAcademicYearId] = useState(
    existingDecision?.academic_year?.id
      ? String(existingDecision.academic_year.id)
      : formOptions.academic_years.find((y) => y.is_current)?.id?.toString() ?? ""
  );
  const [comments, setComments] = useState(existingDecision?.comments ?? "");
  const [principalComments, setPrincipalComments] = useState(
    existingDecision?.principal_comments ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasClasses = formOptions.classes.length > 0;
  const classChoices = hasClasses
    ? formOptions.classes.map((c) => ({ id: String(c.id), name: c.name }))
    : CLASS_OPTIONS.map((name) => ({ id: name, name }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (decision === "approved" && !approvedClassId) {
      setError("An approved class is required when approving.");
      return;
    }
    setBusy(true); setError("");
    try {
      const approvedClassPayload = hasClasses
        ? { approved_class_id: Number(approvedClassId) }
        : { approved_class_id: null, approved_class_name: approvedClassId };

      const payload = {
        decision,
        ...approvedClassPayload,
        house_name: houseName || null,
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        comments: comments || null,
        principal_comments: principalComments || null,
      };

      if (isEdit && existingDecision) {
        await apiPut(
          `${ENDPOINTS.applications}/${applicationId}/decisions/${existingDecision.id}`,
          payload
        );
      } else {
        await apiPost(`${ENDPOINTS.applications}/${applicationId}/decision`, payload);
      }
      await onSuccess();
    } catch (e: any) {
      const msg = e?.message || `Unable to ${isEdit ? "update" : "record"} decision.`;
      setError(msg); onError(msg);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
      <p className="text-sm font-black text-[#252B68]">
        {isEdit ? "Edit Admission Decision" : "Record Admission Decision"}
      </p>

      <Field label="Decision *">
        <select value={decision}
          onChange={(e) => setDecision(e.target.value as "approved" | "denied" | "waitlisted")}
          className="input-admin">
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="waitlisted">Waitlisted</option>
        </select>
      </Field>

      {decision === "approved" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Approved Class *">
            <select value={approvedClassId} onChange={(e) => setApprovedClassId(e.target.value)} className="input-admin">
              <option value="">Select class</option>
              {classChoices.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="House">
            <select value={houseName} onChange={(e) => setHouseName(e.target.value)} className="input-admin">
              <option value="">Select house</option>
              {HOUSE_OPTIONS.map((h) => (<option key={h} value={h}>{h}</option>))}
            </select>
          </Field>
          <Field label="Academic Year">
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input-admin">
              <option value="">Select academic year</option>
              {formOptions.academic_years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}{y.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <Field label="Comments">
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="input-admin" />
      </Field>
      <Field label="Principal Comments">
        <textarea value={principalComments} onChange={(e) => setPrincipalComments(e.target.value)} rows={2} className="input-admin" />
      </Field>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F58220] px-4 py-2 text-xs font-bold text-white hover:bg-[#dd6e13] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {isEdit ? "Save Changes" : "Save Decision"}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* Comments                                                            */
/* ================================================================== */

function CommentsSection({
  applicationId, comments, canComment, currentUserId, isAdministrator, onRefresh,
}: {
  applicationId: number;
  comments: Comment[];
  canComment: boolean;
  currentUserId: number | null;
  isAdministrator: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true); setError("");
    try {
      await apiPost(`${ENDPOINTS.applications}/${applicationId}/comments`, { body: body.trim() });
      setBody("");
      await onRefresh();
    } catch (err: any) { setError(err?.message || "Unable to add comment."); }
    finally { setBusy(false); }
  }

  function beginEdit(comment: Comment) {
    setEditingId(comment.id); setEditingBody(comment.body); setError("");
  }
  function cancelEdit() { setEditingId(null); setEditingBody(""); }
  async function saveEdit(commentId: number) {
    if (!editingBody.trim()) return;
    setSavingEdit(true); setError("");
    try {
      await apiPut(
        `${ENDPOINTS.applications}/${applicationId}/comments/${commentId}`,
        { body: editingBody.trim() }
      );
      cancelEdit();
      await onRefresh();
    } catch (err: any) { setError(err?.message || "Unable to update comment."); }
    finally { setSavingEdit(false); }
  }
  async function deleteComment(commentId: number) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingId(commentId); setError("");
    try {
      await apiDelete(`${ENDPOINTS.applications}/${applicationId}/comments/${commentId}`);
      await onRefresh();
    } catch (err: any) { setError(err?.message || "Unable to delete comment."); }
    finally { setDeletingId(null); }
  }

  return (
    <Section title="Comments" icon={<MessageSquare size={17} />}>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const isEditing = editingId === c.id;
            const canEditOrDelete =
              canComment &&
              (isAdministrator || (currentUserId !== null && c.user?.id === currentUserId));
            return (
              <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#172033]">{c.user?.name || "Unknown"}</p>
                    {c.role_snapshot && (
                      <span className="rounded-full bg-[#252B68]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#252B68]">
                        {c.role_snapshot}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-slate-400">{formatDateTime(c.created_at)}</p>
                    {canEditOrDelete && !isEditing && (
                      <>
                        <button type="button" onClick={() => beginEdit(c)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200" aria-label="Edit comment" title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button type="button" disabled={deletingId === c.id} onClick={() => deleteComment(c.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label="Delete comment" title="Delete">
                          {deletingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea value={editingBody} onChange={(e) => setEditingBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                        Cancel
                      </button>
                      <button type="button" disabled={savingEdit || !editingBody.trim()} onClick={() => saveEdit(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
                        {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{c.body}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canComment ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            placeholder="Add a comment about this application…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
          <div className="flex justify-end">
            <button type="submit" disabled={busy || !body.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          Only the headteacher or an administrator can add comments.
        </p>
      )}
    </Section>
  );
}

/* ================================================================== */
/* Enrol                                                               */
/* ================================================================== */

function EnrolSection({
  applicationId, detail, formOptions, onRefresh, existingStudent,
}: {
  applicationId: number;
  detail: ApplicationDetail;
  formOptions: FormOptions;
  onRefresh: () => Promise<void>;
  existingStudent?: any;
}) {
  const initialClassId = resolveClassSelection(detail, formOptions);
  const decidedHouseName = detail.decisions?.find((d) => d.house?.name)?.house?.name ?? "";
  const initialAcademicYearId = detail.academic_year?.id
    ? String(detail.academic_year.id)
    : formOptions.academic_years.find((y) => y.is_current)?.id?.toString() ?? "";

  const [classId, setClassId] = useState(initialClassId);
  const [houseName, setHouseName] = useState(decidedHouseName);
  const [academicYearId, setAcademicYearId] = useState(initialAcademicYearId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setClassId(resolveClassSelection(detail, formOptions));
    setHouseName(decidedHouseName);
    setAcademicYearId(initialAcademicYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.class_applied?.id, detail.class_applied?.name, detail.academic_year?.id, decidedHouseName]);

  const classChoices = formOptions.classes.length > 0
    ? formOptions.classes.map((c) => ({ id: String(c.id), name: c.name }))
    : CLASS_OPTIONS.map((name) => ({ id: name, name }));

  const isNumericClassId = /^\d+$/.test(classId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!classId) { setError("Please select a class."); return; }
    if (!academicYearId) { setError("Please select an academic year."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const payload: any = {
        house_name: houseName || null,
        academic_year_id: Number(academicYearId),
      };
      if (isNumericClassId) payload.class_id = Number(classId);
      else payload.class_name = classId;

      const response = await apiPost(
        `${ENDPOINTS.applications}/${applicationId}/enrol`, payload
      );
      setSuccess(response?.message || "Student enrolled successfully.");
      await onRefresh();
    } catch (e: any) { setError(e?.message || "Unable to enrol student."); }
    finally { setBusy(false); }
  }

  if (existingStudent) {
    return (
      <Section title="Enrolment" icon={<UserCheck size={17} />}>
        <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <p className="font-bold text-green-800">Student already enrolled</p>
            <p className="mt-1 text-sm text-green-700">
              Student number:{" "}
              <span className="font-mono font-bold">{existingStudent.student_number}</span>
            </p>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Enrol Student" icon={<UserCheck size={17} />}>
      <p className="mb-4 text-sm text-slate-600">
        This application has been <strong>approved</strong>. The class, house,
        and academic year have been pre-filled from the saved application.
        Adjust only if needed, then confirm.
      </p>
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Class *">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-admin" required>
              <option value="">Select class</option>
              {classChoices.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="House">
            <select value={houseName} onChange={(e) => setHouseName(e.target.value)} className="input-admin">
              <option value="">Select house</option>
              {HOUSE_OPTIONS.map((h) => (<option key={h} value={h}>{h}</option>))}
            </select>
          </Field>
          <Field label="Academic Year *">
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input-admin" required>
              <option value="">Select academic year</option>
              {formOptions.academic_years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}{y.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle size={13} /> {error}
          </p>
        )}
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />} Enrol Student
        </button>
      </form>
    </Section>
  );
}

/* ================================================================== */
/* Workflow                                                            */
/* ================================================================== */

function WorkflowActions({ detail }: { detail: ApplicationDetail }) {
  const hints = useMemo(() => {
    const allDocsVerified = allRequiredDocumentsVerified(detail.documents);
    const hasAssessment = detail.assessments.length > 0;
    const hasCompleted = hasCompletedAssessment(detail.assessments);
    const hasDecision = detail.decisions.length > 0;
    return [
      { label: "Documents verified", done: allDocsVerified },
      { label: "Assessment scheduled", done: hasAssessment },
      { label: "Assessment completed", done: hasCompleted },
      { label: "Decision recorded", done: hasDecision },
    ];
  }, [detail]);

  return (
    <Section title="Workflow" icon={<ShieldCheck size={17} />}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {hints.map((hint) => (
          <div key={hint.label}
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
              hint.done
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}>
            {hint.done ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {hint.label}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ================================================================== */
/* Edit / Create Modal                                                 */
/* ================================================================== */

function ApplicationEditModal({
  mode, application, options, onClose, onSaved,
}: {
  mode: "create" | "edit";
  application: ApplicationDetail | null;
  options: FormOptions;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const currentYear = options.academic_years.find((y) => y.is_current) ?? options.academic_years[0];
  const classChoices = options.classes.length > 0
    ? options.classes.map((c) => ({ id: String(c.id), name: c.name }))
    : CLASS_OPTIONS.map((name) => ({ id: name, name }));

  const [status, setStatus] = useState<Status>((application?.status as Status) ?? "draft");
  const [source, setSource] = useState<"online" | "paper">((application?.source as "online" | "paper") ?? "paper");
  const [academicYearId, setAcademicYearId] = useState<string>(
    application?.academic_year?.id ? String(application.academic_year.id) :
    currentYear ? String(currentYear.id) : ""
  );
  const [classAppliedId, setClassAppliedId] = useState<string>(
    application?.class_applied?.id ? String(application.class_applied.id) : ""
  );
  const [contactEmail, setContactEmail] = useState(application?.contact_email ?? "");

  const [student, setStudent] = useState({
    legal_first_name: application?.legal_first_name ?? "",
    middle_name: application?.middle_name ?? "",
    legal_surname: application?.legal_surname ?? "",
    date_of_birth: application?.date_of_birth ? String(application.date_of_birth).substring(0, 10) : "",
    gender: application?.gender ?? "",
    blood_group: application?.blood_group ?? "",
    weight_kg: application?.weight_kg ? String(application.weight_kg) : "",
    height_cm: application?.height_cm ? String(application.height_cm) : "",
    first_language: application?.first_language ?? "",
    nationality: application?.nationality ?? "",
    religion: application?.religion ?? "",
    emergency_contact: application?.emergency_contact ?? "",
    family_member_count: application?.family_member_count ? String(application.family_member_count) : "",
    student_lives_with: application?.student_lives_with ?? "",
    children_at_mount_view: application?.children_at_mount_view
      ? String(application.children_at_mount_view) : "",
    siblings_at_mount_view: Array.isArray(application?.siblings_at_mount_view)
      ? application.siblings_at_mount_view
      : [],
    mountview_email_local: stripMountViewDomain(application?.email_with_mount_view),
    physical_address: application?.physical_address ?? "",
    medical_conditions: application?.medical_conditions ?? "",
    allergies: application?.allergies ?? "",
    learning_needs: application?.learning_needs ?? "",
    family_doctor_name: application?.family_doctor_name ?? "",
    family_doctor_phone: application?.family_doctor_phone ?? "",
    previous_school_name: application?.previous_school_name ?? "",
    previous_school_address: application?.previous_school_address ?? "",
    previous_class: application?.previous_class ?? "",
    previous_year: application?.previous_year ?? "",
    reason_for_leaving: application?.reason_for_leaving ?? "",
    previous_school_contact: application?.previous_school_contact ?? "",
    previous_school_country: application?.previous_school_country ?? "",
    previous_school_language: application?.previous_school_language ?? "",
  });

  const [parents, setParents] = useState<Parent[]>(
    application?.parents?.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      relationship: p.relationship,
      phone_number: p.phone_number,
      email: p.email,
      occupation: p.occupation,
      position_title: p.position_title,
      employer: p.employer,
      work_address: p.work_address,
      work_phone: p.work_phone,
      employer_pays_fees: Boolean(p.employer_pays_fees),
      employer_payment_percentage: p.employer_payment_percentage,
      physical_address: p.physical_address,
      postal_address: p.postal_address,
      emergency_contact: p.emergency_contact,
      preferred_communication: p.preferred_communication ?? "Phone",
      is_primary: p.is_primary,
    })) ?? [{
      full_name: "", relationship: "", phone_number: "", email: "",
      occupation: "", position_title: "", employer: "", work_address: "",
      work_phone: "", employer_pays_fees: false,
      employer_payment_percentage: null,
      physical_address: "", postal_address: "",
      emergency_contact: false, preferred_communication: "Phone", is_primary: true,
    }]
  );

  /* -------- Files / notes state -------- */
  const [physicalFileStatus, setPhysicalFileStatus] = useState<string>(
    application?.physical_file_status ?? "pending"
  );
  const [parentNotes, setParentNotes] = useState(application?.parent_notes ?? "");
  const [admissionsNotes, setAdmissionsNotes] = useState(application?.admissions_notes ?? "");
  const [administratorComments, setAdministratorComments] = useState(
    application?.administrator_comments ?? ""
  );
  const [principalComments, setPrincipalComments] = useState(
    application?.principal_comments ?? ""
  );

  /* -------- Historical records state -------- */
  const [recordHistoricalAssessment, setRecordHistoricalAssessment] = useState(false);
  const [historicalAssessmentDate, setHistoricalAssessmentDate] = useState("");
  const [historicalAssessmentType, setHistoricalAssessmentType] = useState("Entrance Assessment");
  const [historicalAssessmentResult, setHistoricalAssessmentResult] = useState("pass");
  const [historicalAssessmentComments, setHistoricalAssessmentComments] = useState("");

  const [recordHistoricalDecision, setRecordHistoricalDecision] = useState(false);
  const [historicalDecision, setHistoricalDecision] = useState<"approved" | "denied" | "waitlisted">(
    "approved"
  );
  const [historicalDecisionClassId, setHistoricalDecisionClassId] = useState("");
  const [historicalDecisionComments, setHistoricalDecisionComments] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* DOB bounds */
  const minDob = dobMinDate();
  const maxDob = dobMaxDate();

  function updateStudent(field: keyof typeof student, value: any) {
    setStudent((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`student.${field}`];
      return next;
    });
  }

  function updateParent(index: number, field: keyof Parent, value: any) {
    setParents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "employer_pays_fees" && value === false) {
        next[index].employer_payment_percentage = null;
      }
      return next;
    });
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`parent.${index}.${field}`];
      return next;
    });
  }

  function addParent() {
    setParents((prev) => [...prev, {
      full_name: "", relationship: "", phone_number: "", email: "",
      occupation: "", position_title: "", employer: "", work_address: "",
      work_phone: "", employer_pays_fees: false,
      employer_payment_percentage: null,
      physical_address: "", postal_address: "",
      emergency_contact: false, preferred_communication: "Phone", is_primary: false,
    }]);
  }

  function removeParent(index: number) {
    setParents((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Resize the siblings array when the "Children at Mount View" number changes.
   */
  function handleChildrenCountChange(value: string) {
    const parsed = Math.max(0, parseInt(value || "0", 10));
    setStudent((prev) => {
      const existing = [...(prev.siblings_at_mount_view || [])];
      let siblings = existing;
      if (parsed > existing.length) {
        while (siblings.length < parsed) siblings.push("");
      } else if (parsed < existing.length) {
        siblings = siblings.slice(0, parsed);
      }
      return {
        ...prev,
        children_at_mount_view: value,
        siblings_at_mount_view: siblings,
      };
    });
  }

  function updateSibling(index: number, value: string) {
    setStudent((prev) => {
      const siblings = [...(prev.siblings_at_mount_view || [])];
      siblings[index] = value;
      return { ...prev, siblings_at_mount_view: siblings };
    });
  }

  function removeSibling(index: number) {
    setStudent((prev) => ({
      ...prev,
      siblings_at_mount_view: (prev.siblings_at_mount_view || [])
        .filter((_, i) => i !== index),
    }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!student.legal_first_name.trim()) {
      errors["student.legal_first_name"] = "Legal first name is required.";
    }
    if (!student.legal_surname.trim()) {
      errors["student.legal_surname"] = "Legal surname is required.";
    }

    const dobError = validateDateOfBirth(student.date_of_birth);
    if (dobError) errors["student.date_of_birth"] = dobError;

    if (
      student.mountview_email_local.trim() &&
      !isValidMountViewLocal(student.mountview_email_local.trim())
    ) {
      errors["student.mountview_email_local"] =
        "Only letters, numbers, dot, underscore, plus and dash are allowed.";
    }

    parents.forEach((p, index) => {
      if (!p.full_name.trim() && !p.relationship.trim()) return;
      if (p.phone_number && !isValidPhone(p.phone_number)) {
        errors[`parent.${index}.phone_number`] =
          "Phone number must be exactly 10 digits.";
      }
      if (p.work_phone && !isValidPhone(p.work_phone)) {
        errors[`parent.${index}.work_phone`] =
          "Work phone must be exactly 10 digits.";
      }
      if (
        p.employer_pays_fees &&
        (p.employer_payment_percentage == null ||
          p.employer_payment_percentage < 1 ||
          p.employer_payment_percentage > 100)
      ) {
        errors[`parent.${index}.employer_payment_percentage`] =
          "Please enter a percentage between 1 and 100.";
      }
    });

    /* Historical section validation */
    if (recordHistoricalAssessment && !historicalAssessmentDate) {
      errors["historical.assessment_date"] = "Please choose the assessment date.";
    }
    if (recordHistoricalDecision && historicalDecision === "approved" && !historicalDecisionClassId) {
      errors["historical.decision_class"] = "Please choose the approved class.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (!validate()) return;

    setBusy(true);
    try {
      const isNumericId = classAppliedId && /^\d+$/.test(classAppliedId);

      const payload: any = {
        status, source,
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        contact_email: contactEmail.trim() || null,
        physical_file_status: physicalFileStatus || null,
        parent_notes: parentNotes.trim() || null,
        admissions_notes: admissionsNotes.trim() || null,
        administrator_comments: administratorComments.trim() || null,
        principal_comments: principalComments.trim() || null,
        student: {
          legal_first_name: student.legal_first_name.trim(),
          middle_name: student.middle_name.trim() || null,
          legal_surname: student.legal_surname.trim(),
          date_of_birth: student.date_of_birth || null,
          gender: student.gender || null,
          blood_group: student.blood_group || null,
          weight_kg: student.weight_kg ? Number(student.weight_kg) : null,
          height_cm: student.height_cm ? Number(student.height_cm) : null,
          first_language: student.first_language || null,
          nationality: student.nationality || null,
          religion: student.religion || null,
          emergency_contact: student.emergency_contact || null,
          family_member_count: student.family_member_count ? Number(student.family_member_count) : null,
          student_lives_with: student.student_lives_with || null,
          children_at_mount_view: student.children_at_mount_view
            ? Number(student.children_at_mount_view) : null,
          siblings_at_mount_view: (student.siblings_at_mount_view || [])
            .map((n) => n.trim())
            .filter((n) => n !== ""),
          email_with_mount_view: buildMountViewEmail(student.mountview_email_local),
          physical_address: student.physical_address || null,
          medical_conditions: student.medical_conditions || null,
          allergies: student.allergies || null,
          learning_needs: student.learning_needs || null,
          family_doctor_name: student.family_doctor_name || null,
          family_doctor_phone: student.family_doctor_phone || null,
          previous_school_name: student.previous_school_name || null,
          previous_school_address: student.previous_school_address || null,
          previous_class: student.previous_class || null,
          previous_year: student.previous_year || null,
          reason_for_leaving: student.reason_for_leaving || null,
          previous_school_contact: student.previous_school_contact || null,
          previous_school_country: student.previous_school_country || null,
          previous_school_language: student.previous_school_language || null,
        },
        parents: parents
          .filter((p) => p.full_name.trim())
          .map((p) => ({
            full_name: p.full_name.trim(),
            relationship: p.relationship.trim() || "Guardian",
            phone_number: p.phone_number
              ? digitsOnly(p.phone_number) : null,
            email: p.email || null,
            occupation: p.occupation || null,
            position_title: p.position_title || null,
            employer: p.employer || null,
            work_address: p.work_address || null,
            work_phone: p.work_phone ? digitsOnly(p.work_phone) : null,
            employer_pays_fees: Boolean(p.employer_pays_fees),
            employer_payment_percentage: p.employer_pays_fees &&
              p.employer_payment_percentage != null
              ? Number(p.employer_payment_percentage)
              : null,
            physical_address: p.physical_address || null,
            postal_address: p.postal_address || null,
            emergency_contact: Boolean(p.emergency_contact),
            preferred_communication: p.preferred_communication || null,
            is_primary: Boolean(p.is_primary),
          })),
      };

      if (isNumericId) {
        payload.class_applied_id = Number(classAppliedId);
      } else if (classAppliedId) {
        payload.class_applied_id = null;
        payload.class_applied_name = classAppliedId;
      } else {
        payload.class_applied_id = null;
      }

      /* ---- Base application save ---- */
      let savedAppId: number | null = application?.id ?? null;
      if (mode === "create") {
        const created = await apiPost(ENDPOINTS.applications, payload);
        savedAppId = created?.data?.id ?? created?.id ?? null;
      } else if (application) {
        await apiPut(`${ENDPOINTS.applications}/${application.id}`, payload);
        savedAppId = application.id;
      }

      /* ---- Historical assessment ---- */
      if (savedAppId && recordHistoricalAssessment && historicalAssessmentDate) {
        const aResp = await apiPost(
          `${ENDPOINTS.applications}/${savedAppId}/assessments`,
          {
            assessment_date: historicalAssessmentDate,
            assessment_time: null,
            location: null,
            assessment_type: historicalAssessmentType || null,
          }
        );
        const newAssessmentId = aResp?.data?.id ?? aResp?.id;
        if (newAssessmentId) {
          await apiPost(
            `${API_URL}/api/admin/admissions/assessments/${newAssessmentId}/complete`,
            {
              result: historicalAssessmentResult,
              comments: historicalAssessmentComments.trim() || null,
              recommendation: null,
            }
          );
        }
      }

      /* ---- Historical decision ---- */
      if (savedAppId && recordHistoricalDecision) {
        const isNumericDecisionClass =
          historicalDecisionClassId && /^\d+$/.test(historicalDecisionClassId);

        const decisionPayload: any = {
          decision: historicalDecision,
          comments: historicalDecisionComments.trim() || null,
          principal_comments: null,
        };

        if (historicalDecision === "approved") {
          if (isNumericDecisionClass) {
            decisionPayload.approved_class_id = Number(historicalDecisionClassId);
          } else if (historicalDecisionClassId) {
            decisionPayload.approved_class_id = null;
            decisionPayload.approved_class_name = historicalDecisionClassId;
          }
        }

        await apiPost(
          `${ENDPOINTS.applications}/${savedAppId}/decision`,
          decisionPayload
        );
      }

      await onSaved();
    } catch (e: any) {
      setError(e?.message || "Unable to save application.");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form onSubmit={handleSubmit}
        className="my-4 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              {mode === "create" ? "New application" : "Edit application"}
            </p>
            <h2 className="mt-1 text-lg font-black">
              {mode === "create" ? "Create admission application" : application?.application_number}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Application */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Application</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="input-admin">
                  {EDIT_STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </Field>
              <Field label="Source">
                <select value={source} onChange={(e) => setSource(e.target.value as "online" | "paper")} className="input-admin">
                  <option value="paper">Paper</option>
                  <option value="online">Online</option>
                </select>
              </Field>
              <Field label="Contact email">
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="parent@example.com" className="input-admin" />
              </Field>
              <Field label="Academic year">
                <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input-admin">
                  <option value="">Select academic year</option>
                  {options.academic_years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_current ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Class applied for">
                <select value={classAppliedId} onChange={(e) => setClassAppliedId(e.target.value)} className="input-admin">
                  <option value="">Select class</option>
                  {classChoices.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </Field>
            </div>
          </section>

          {/* Student Information */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Student Information</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Legal first name *" error={fieldErrors["student.legal_first_name"]}>
                <input type="text" value={student.legal_first_name}
                  onChange={(e) => updateStudent("legal_first_name", e.target.value)}
                  className={inputClass(fieldErrors["student.legal_first_name"])} required />
              </Field>
              <Field label="Middle name">
                <input type="text" value={student.middle_name}
                  onChange={(e) => updateStudent("middle_name", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Legal surname *" error={fieldErrors["student.legal_surname"]}>
                <input type="text" value={student.legal_surname}
                  onChange={(e) => updateStudent("legal_surname", e.target.value)}
                  className={inputClass(fieldErrors["student.legal_surname"])} required />
              </Field>

              <Field label="Date of birth *" error={fieldErrors["student.date_of_birth"]}>
                <input type="date" value={student.date_of_birth}
                  min={minDob}
                  max={maxDob}
                  onChange={(e) => updateStudent("date_of_birth", e.target.value)}
                  className={inputClass(fieldErrors["student.date_of_birth"])} />
                <p className="mt-1 text-[10px] text-slate-500">
                  Must be between {minDob} and {maxDob}
                </p>
              </Field>

              <Field label="Gender">
                <select value={student.gender} onChange={(e) => updateStudent("gender", e.target.value)} className="input-admin">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Blood group">
                <select value={student.blood_group}
                  onChange={(e) => updateStudent("blood_group", e.target.value)}
                  className="input-admin">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </Field>

              <Field label="Weight (kg)">
                <input type="number" step="0.01" value={student.weight_kg}
                  onChange={(e) => updateStudent("weight_kg", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Height (cm)">
                <input type="number" step="0.01" value={student.height_cm}
                  onChange={(e) => updateStudent("height_cm", e.target.value)} className="input-admin" />
              </Field>
              <Field label="First language">
                <input type="text" value={student.first_language}
                  onChange={(e) => updateStudent("first_language", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Nationality">
                <input type="text" value={student.nationality}
                  onChange={(e) => updateStudent("nationality", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Religion">
                <input type="text" value={student.religion}
                  onChange={(e) => updateStudent("religion", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Emergency contact">
                <input type="text" value={student.emergency_contact}
                  onChange={(e) => updateStudent("emergency_contact", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Family member count">
                <input type="number" min="0" value={student.family_member_count}
                  onChange={(e) => updateStudent("family_member_count", e.target.value)} className="input-admin" />
              </Field>

              <Field label="Children at Mount View">
                <input type="number" min="0"
                  value={student.children_at_mount_view}
                  onChange={(e) => handleChildrenCountChange(e.target.value)}
                  className="input-admin" />
              </Field>

              <Field label="Student lives with">
                <select value={student.student_lives_with}
                  onChange={(e) => updateStudent("student_lives_with", e.target.value)} className="input-admin">
                  <option value="">Select</option>
                  {LIVE_WITH_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </Field>

              <Field label="Email with Mount View"
                error={fieldErrors["student.mountview_email_local"]}>
                <div className={`flex h-11 items-center rounded-xl border overflow-hidden focus-within:ring-4 ${
                  fieldErrors["student.mountview_email_local"]
                    ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/10"
                    : "border-slate-200 focus-within:border-[#252B68] focus-within:ring-[#252B68]/10"
                }`}>
                  <input type="text"
                    value={student.mountview_email_local}
                    onChange={(e) => updateStudent("mountview_email_local", e.target.value)}
                    placeholder="parent.name"
                    className="h-full flex-1 border-0 bg-white px-4 text-sm outline-none" />
                  <span className="flex h-full items-center bg-slate-100 px-3 text-xs font-bold text-slate-600">
                    {MOUNTVIEW_EMAIL_DOMAIN}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Enter only the part before {MOUNTVIEW_EMAIL_DOMAIN}
                </p>
              </Field>
            </div>

            {/* Siblings — appear based on Children at Mount View */}
            {(student.siblings_at_mount_view?.length || 0) > 0 && (
              <div className="mt-4 rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
                  Siblings at Mount View
                </p>
                <div className="space-y-2">
                  {student.siblings_at_mount_view.map((name, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#252B68]">
                        {index + 1}
                      </span>
                      <input type="text" value={name}
                        onChange={(e) => updateSibling(index, e.target.value)}
                        placeholder={`Sibling ${index + 1} full name`}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                      <button type="button" onClick={() => removeSibling(index)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove sibling">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <Field label="Physical address">
                <textarea rows={2} value={student.physical_address}
                  onChange={(e) => updateStudent("physical_address", e.target.value)} className="input-admin" />
              </Field>
            </div>
          </section>

          {/* Medical */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Medical Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Medical Conditions">
                <textarea rows={2} value={student.medical_conditions}
                  onChange={(e) => updateStudent("medical_conditions", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Allergies">
                <textarea rows={2} value={student.allergies}
                  onChange={(e) => updateStudent("allergies", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Learning Needs">
                <textarea rows={2} value={student.learning_needs}
                  onChange={(e) => updateStudent("learning_needs", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Family Doctor">
                <input type="text" value={student.family_doctor_name}
                  onChange={(e) => updateStudent("family_doctor_name", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Family Doctor Phone">
                <input type="tel" value={student.family_doctor_phone}
                  onChange={(e) => updateStudent("family_doctor_phone", e.target.value)} className="input-admin" />
              </Field>
            </div>
          </section>

          {/* Previous School */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Previous School</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="School name">
                <input type="text" value={student.previous_school_name}
                  onChange={(e) => updateStudent("previous_school_name", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Country">
                <input type="text" value={student.previous_school_country}
                  onChange={(e) => updateStudent("previous_school_country", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Previous Class">
                <input type="text" value={student.previous_class}
                  onChange={(e) => updateStudent("previous_class", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Instructional Language">
                <input type="text" value={student.previous_school_language}
                  onChange={(e) => updateStudent("previous_school_language", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Previous Year">
                <input type="text" value={student.previous_year}
                  onChange={(e) => updateStudent("previous_year", e.target.value)} className="input-admin" />
              </Field>
              <Field label="School Contact">
                <input type="text" value={student.previous_school_contact}
                  onChange={(e) => updateStudent("previous_school_contact", e.target.value)} className="input-admin" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="School address">
                <textarea rows={2} value={student.previous_school_address}
                  onChange={(e) => updateStudent("previous_school_address", e.target.value)} className="input-admin" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Reason for leaving">
                <textarea rows={2} value={student.reason_for_leaving}
                  onChange={(e) => updateStudent("reason_for_leaving", e.target.value)} className="input-admin" />
              </Field>
            </div>
          </section>

          {/* Parents */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#252B68]">Parents / Guardians</h3>
              <button type="button" onClick={addParent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#252B68] px-3 py-1.5 text-xs font-bold text-[#252B68] hover:bg-[#252B68]/5">
                <Plus size={13} /> Add parent
              </button>
            </div>
            <div className="space-y-4">
              {parents.map((parent, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#252B68]">Parent / Guardian {index + 1}</p>
                    {parents.length > 1 && (
                      <button type="button" onClick={() => removeParent(index)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50" aria-label="Remove">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Full name">
                      <input type="text" value={parent.full_name}
                        onChange={(e) => updateParent(index, "full_name", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Relationship">
                      <input type="text" value={parent.relationship}
                        onChange={(e) => updateParent(index, "relationship", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Phone (10 digits)"
                      error={fieldErrors[`parent.${index}.phone_number`]}>
                      <input type="tel" inputMode="numeric" maxLength={PHONE_LENGTH}
                        value={parent.phone_number ?? ""}
                        onChange={(e) => updateParent(index, "phone_number", digitsOnly(e.target.value))}
                        className={inputClass(fieldErrors[`parent.${index}.phone_number`])} />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={parent.email ?? ""}
                        onChange={(e) => updateParent(index, "email", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Occupation">
                      <input type="text" value={parent.occupation ?? ""}
                        onChange={(e) => updateParent(index, "occupation", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Position / Title">
                      <input type="text" value={parent.position_title ?? ""}
                        onChange={(e) => updateParent(index, "position_title", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Employer">
                      <input type="text" value={parent.employer ?? ""}
                        onChange={(e) => updateParent(index, "employer", e.target.value)} className="input-admin" />
                    </Field>
                    <Field label="Work Phone (10 digits)"
                      error={fieldErrors[`parent.${index}.work_phone`]}>
                      <input type="tel" inputMode="numeric" maxLength={PHONE_LENGTH}
                        value={parent.work_phone ?? ""}
                        onChange={(e) => updateParent(index, "work_phone", digitsOnly(e.target.value))}
                        className={inputClass(fieldErrors[`parent.${index}.work_phone`])} />
                    </Field>
                  </div>

                  <div className="mt-3">
                    <Field label="Work Address">
                      <textarea rows={2} value={parent.work_address ?? ""}
                        onChange={(e) => updateParent(index, "work_address", e.target.value)} className="input-admin" />
                    </Field>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.emergency_contact}
                        onChange={(e) => updateParent(index, "emergency_contact", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                      Emergency contact
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.is_primary}
                        onChange={(e) => {
                          setParents((prev) => prev.map((p, i) => ({
                            ...p,
                            is_primary: i === index ? e.target.checked : false,
                          })));
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                      Primary contact
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.employer_pays_fees}
                        onChange={(e) => updateParent(index, "employer_pays_fees", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                      Employer will pay school fees
                    </label>
                  </div>

                  {parent.employer_pays_fees && (
                    <div className="mt-3">
                      <Field label="Employer Payment Percentage"
                        error={fieldErrors[`parent.${index}.employer_payment_percentage`]}>
                        <div className="relative">
                          <input type="number" min={1} max={100}
                            value={parent.employer_payment_percentage ?? ""}
                            onChange={(e) => updateParent(index, "employer_payment_percentage",
                              e.target.value === "" ? null : Number(e.target.value))}
                            className={`${inputClass(fieldErrors[`parent.${index}.employer_payment_percentage`])} pr-10`} />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">%</span>
                        </div>
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Files, Status & Notes */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Files, Status & Notes
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Physical file status">
                <select
                  value={physicalFileStatus}
                  onChange={(e) => setPhysicalFileStatus(e.target.value)}
                  className="input-admin"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="not_required">Not required</option>
                </select>
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Parent notes">
                <textarea
                  rows={2}
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="Admissions notes">
                <textarea
                  rows={2}
                  value={admissionsNotes}
                  onChange={(e) => setAdmissionsNotes(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="Administrator comments">
                <textarea
                  rows={2}
                  value={administratorComments}
                  onChange={(e) => setAdministratorComments(e.target.value)}
                  className="input-admin"
                />
              </Field>
              <Field label="Principal comments">
                <textarea
                  rows={2}
                  value={principalComments}
                  onChange={(e) => setPrincipalComments(e.target.value)}
                  className="input-admin"
                />
              </Field>
            </div>
          </section>

          {/* Historical Records */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Historical Records
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Use these to capture assessment and/or decision data for paper applications
              or files carried over from previous years. Ticking a box below will create
              a new record against this application when you save.
            </p>

            {/* Assessment */}
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-[#252B68]">
                <input
                  type="checkbox"
                  checked={recordHistoricalAssessment}
                  onChange={(e) => setRecordHistoricalAssessment(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
                />
                Assessment has already been given
              </label>

              {recordHistoricalAssessment && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Assessment date *"
                    error={fieldErrors["historical.assessment_date"]}>
                    <input
                      type="date"
                      value={historicalAssessmentDate}
                      onChange={(e) => setHistoricalAssessmentDate(e.target.value)}
                      className={inputClass(fieldErrors["historical.assessment_date"])}
                    />
                  </Field>
                  <Field label="Assessment type">
                    <input
                      type="text"
                      value={historicalAssessmentType}
                      onChange={(e) => setHistoricalAssessmentType(e.target.value)}
                      className="input-admin"
                    />
                  </Field>
                  <Field label="Result *">
                    <select
                      value={historicalAssessmentResult}
                      onChange={(e) => setHistoricalAssessmentResult(e.target.value)}
                      className="input-admin"
                    >
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="pending">Pending</option>
                      <option value="recommended">Recommended</option>
                      <option value="not_recommended">Not Recommended</option>
                    </select>
                  </Field>
                  <Field label="Comments">
                    <textarea
                      rows={2}
                      value={historicalAssessmentComments}
                      onChange={(e) => setHistoricalAssessmentComments(e.target.value)}
                      className="input-admin"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Decision */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-[#252B68]">
                <input
                  type="checkbox"
                  checked={recordHistoricalDecision}
                  onChange={(e) => setRecordHistoricalDecision(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
                />
                Decision has already been made
              </label>

              {recordHistoricalDecision && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Decision *">
                    <select
                      value={historicalDecision}
                      onChange={(e) =>
                        setHistoricalDecision(
                          e.target.value as "approved" | "denied" | "waitlisted"
                        )
                      }
                      className="input-admin"
                    >
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                      <option value="waitlisted">Waitlisted</option>
                    </select>
                  </Field>

                  {historicalDecision === "approved" && (
                    <Field label="Approved class *"
                      error={fieldErrors["historical.decision_class"]}>
                      <select
                        value={historicalDecisionClassId}
                        onChange={(e) => setHistoricalDecisionClassId(e.target.value)}
                        className={inputClass(fieldErrors["historical.decision_class"])}
                      >
                        <option value="">Select class</option>
                        {classChoices.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Comments">
                    <textarea
                      rows={2}
                      value={historicalDecisionComments}
                      onChange={(e) => setHistoricalDecisionComments(e.target.value)}
                      className="input-admin"
                    />
                  </Field>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {mode === "create" ? "Create application" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================================================================== */
/* Field                                                               */
/* ================================================================== */

function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </label>
  );
}

function inputClass(error?: string) {
  return `input-admin ${
    error ? "!border-red-400 focus:!border-red-500 focus:!ring-red-500/10" : ""
  }`;
}