"use client";

import {
  AlertCircle, ArrowLeft, Calendar, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, ClipboardCheck, Download, Eye, FileCheck2,
  FileText, Gavel, GraduationCap, Loader2, MessageSquare, Pencil, Plus,
  Printer, RefreshCw, Search, ShieldAlert, ShieldCheck, Trash2, UserCheck,
  UserRound, Users, X, XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN_KEY = "admin_token";
const MOUNTVIEW_DOMAIN = "@mountviewmw.com";

const ENDPOINTS = {
  dashboard: `${API_URL}/api/admin/admissions/dashboard`,
  applications: `${API_URL}/api/admin/admissions/applications`,
  formOptions: `${API_URL}/api/admin/admissions/form-options`,
};

const REQUIRED_DOCUMENT_TYPES = ["birth_certificate_or_passport", "passport_photograph_1", "passport_photograph_2"];
const LIVE_WITH_OPTIONS = ["Both Parents", "Mother", "Father", "Guardian", "Grandparent", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const PHONE_LENGTH = 10;

/* Classes that do NOT require previous school by default */
const NO_PREVIOUS_SCHOOL_CLASSES = [
  "early learners", "early learner", "early years", "early year",
  "nursery", "pre-nursery", "pre nursery", "prek", "pre-k", "pre k",
];

type Status = "draft" | "submitted" | "document_verification" | "assessment_scheduled" | "assessment_completed" | "principal_review" | "approved" | "denied" | "waitlisted" | "enrolled" | "transferred" | "withdrawn";
type PhysicalFile = "pending" | "received" | "not_required";

type ApplicationListRow = {
  id: number; application_number: string; legal_first_name: string;
  middle_name: string | null; legal_surname: string; status: Status;
  source: string; submitted: boolean; submitted_at: string | null;
  physical_file_status: string | null; created_at: string; gender: string | null;
  academic_year?: { id: number; name: string } | null;
  class_applied?: { id: number; name: string } | null;
  documents_count?: number; assessments_count?: number;
};

type Parent = {
  id?: number; full_name: string; relationship: string; phone_number: string | null;
  email: string | null; occupation: string | null; position_title: string | null;
  employer: string | null; work_address: string | null; work_phone: string | null;
  employer_pays_fees: boolean; employer_payment_percentage: number | null;
  physical_address: string | null; postal_address: string | null;
  emergency_contact: boolean; preferred_communication: string | null; is_primary: boolean;
};

type Doc = {
  id: number; document_type: string; original_name: string; mime_type: string | null;
  file_size: number | null; verification_status: "pending" | "verified" | "rejected";
  physical_received: boolean; physical_received_at: string | null;
  verification_notes: string | null; verified_at: string | null;
};

type Assessment = {
  id: number; assessment_date: string | null; assessment_time: string | null;
  location: string | null; assessment_type: string | null; result: string | null;
  comments: string | null; recommendation: string | null;
  assessor?: { id: number; name: string } | null;
  results: { id: number; area: string; score: string | number | null; maximum_score: string | number | null; comments: string | null }[];
};

type Decision = {
  id: number; decision: "approved" | "denied" | "waitlisted";
  decision_date: string; comments: string | null; principal_comments: string | null;
  decided_by?: { id: number; name: string } | null;
  approved_class?: { id: number; name: string } | null;
  house?: { id: number; name: string } | null;
  academic_year?: { id: number; name: string } | null;
};

type Comment = { id: number; body: string; role_snapshot: string | null; created_at: string; user?: { id: number; name: string } | null };

type StudentRecord = {
  id: number; student_number: string; current_class_id: number | null;
  current_class_stream_id: number | null; house_id: number | null;
  current_class?: { id: number; name: string } | null;
  current_class_stream?: { id: number; name: string; stream?: { id: number; name: string } } | null;
  house?: { id: number; name: string } | null;
  academic_year?: { id: number; name: string } | null;
  admission_date?: string | null; status?: string;
};

type ApplicationDetail = ApplicationListRow & {
  date_of_birth: string | null; gender: string | null; blood_group: string | null;
  nationality: string | null; first_language: string | null; religion: string | null;
  weight_kg: string | number | null; height_cm: string | number | null;
  emergency_contact: string | null; family_member_count: number | null;
  student_lives_with: string | null; children_at_mount_view: number | null;
  siblings_at_mount_view: string[] | null; email_with_mount_view: string | null;
  physical_address: string | null; medical_conditions: string | null; allergies: string | null;
  learning_needs: string | null; family_doctor_name: string | null; family_doctor_phone: string | null;
  previous_school_name: string | null; previous_school_address: string | null;
  previous_class: string | null; previous_year: string | null;
  previous_school_contact: string | null; previous_school_country: string | null;
  previous_school_language: string | null;
  contact_email: string | null; physical_file_status: string | null;
  principal_comments: string | null;
  parents: Parent[]; documents: Doc[]; assessments: Assessment[];
  decisions: Decision[]; comments: Comment[];
  student?: StudentRecord | null;
};

type FormOptions = {
  classes: { id: number; name: string; code: string | null }[];
  class_streams: { id: number; school_class_id: number; stream_id: number; name: string; stream?: { id: number; name: string } }[];
  academic_years: { id: number; name: string; is_current: boolean }[];
  houses: { id: number; name: string; colour: string | null }[];
};

type DashboardStats = { total: number; submitted: number; document_verification: number; assessments_scheduled: number; assessments_completed: number; awaiting_approval: number; approved: number; denied: number; waitlisted: number; enrolled: number };
type Paginated<T> = { current_page: number; data: T[]; last_page: number; per_page: number; total: number };

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
const EDIT_STATUS_OPTIONS = [{ value: "draft", label: "Draft" }, ...STATUS_OPTIONS];
const PHYSICAL_FILE_OPTIONS: { value: PhysicalFile; label: string }[] = [
  { value: "pending", label: "Pending — not yet received" },
  { value: "received", label: "Received — physical file on hand" },
  { value: "not_required", label: "Not required" },
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

function readCurrentUser(): { id?: number; name?: string; role?: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("admin_user") || "null"); } catch { return null; }
}
const isHeadteacherRole = (r?: string) => !!r && ["headteacher", "principal", "administrator"].includes(r);
const isAdmissionsRole = (r?: string) => !!r && ["admissions_officer", "administrator", "headteacher", "principal"].includes(r);

function digitsOnly(v: string): string { return (v || "").replace(/\D/g, ""); }
function isValidPhone(v: string): boolean { return digitsOnly(v).length === PHONE_LENGTH; }

function validateDateOfBirth(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Please enter a valid date of birth.";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d > today) return "Date of birth cannot be in the future.";
  const one = new Date(today); one.setFullYear(one.getFullYear() - 1);
  if (d > one) return "The student must be at least 12 months old.";
  const thirty = new Date(today); thirty.setFullYear(thirty.getFullYear() - 30);
  if (d < thirty) return "The date of birth is not realistic for an applicant.";
  return null;
}
function dobMinDate(): string { const d = new Date(); d.setFullYear(d.getFullYear() - 30); return d.toISOString().substring(0, 10); }
function dobMaxDate(): string { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().substring(0, 10); }

function stripMountViewDomain(email: string | null | undefined): string {
  if (!email) return "";
  const lower = email.toLowerCase();
  if (lower.endsWith(MOUNTVIEW_DOMAIN)) return email.slice(0, -MOUNTVIEW_DOMAIN.length);
  return email;
}
function buildMountViewEmail(local: string): string | null {
  const t = (local || "").trim();
  if (!t) return null;
  if (t.toLowerCase().endsWith(MOUNTVIEW_DOMAIN)) return t;
  return `${t}${MOUNTVIEW_DOMAIN}`;
}
function isValidMountViewLocal(local: string): boolean {
  if (!local) return true;
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
  if (!response.ok) throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  return data;
}
async function apiGet(path: string) { return parseResponse(await fetch(path, { headers: authHeaders(false) })); }
async function apiPost(path: string, body?: any) { return parseResponse(await fetch(path, { method: "POST", headers: authHeaders(true), body: body ? JSON.stringify(body) : undefined })); }
async function apiPut(path: string, body?: any) { return parseResponse(await fetch(path, { method: "PUT", headers: authHeaders(true), body: body ? JSON.stringify(body) : undefined })); }
async function apiDelete(path: string) { return parseResponse(await fetch(path, { method: "DELETE", headers: authHeaders(false) })); }

function fullName(app: { legal_first_name: string; middle_name?: string | null; legal_surname: string }) {
  return [app.legal_first_name, app.middle_name, app.legal_surname].filter(Boolean).join(" ");
}
function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return v; }
}
function formatDateTime(v: string | null | undefined) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return v; }
}
function fileSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadDocument(applicationId: number, doc: Doc, studentName: string) {
  const response = await fetch(`${ENDPOINTS.applications}/${applicationId}/documents/${doc.id}/download`, { headers: authHeaders(false) });
  if (!response.ok) throw new Error("Unable to download the document.");
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const ext = (doc.original_name.split(".").pop() || "pdf").toLowerCase();
  const fallback = `${studentName.replace(/\s+/g, "_")}_${doc.document_type}.${ext}`;
  const filename = match?.[1] || fallback;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function allRequiredDocumentsVerified(documents: Doc[]): boolean {
  return REQUIRED_DOCUMENT_TYPES.every((t) =>
    documents.some((d) => d.document_type === t && d.verification_status === "verified")
  );
}
function hasCompletedAssessment(assessments: Assessment[]): boolean {
  return assessments.some((a) => Boolean(a.result));
}
function hasPassedAssessment(assessments: Assessment[]): boolean {
  return assessments.some((a) => a.result === "pass" || a.result === "recommended");
}
function resolveClassSelection(detail: ApplicationDetail, formOptions: FormOptions): string {
  if (!detail.class_applied) return "";
  if (formOptions.classes.length > 0) return String(detail.class_applied.id);
  return detail.class_applied.name;
}
function classRequiresPreviousSchool(className: string): boolean {
  const n = (className || "").trim().toLowerCase();
  if (!n) return true;
  return !NO_PREVIOUS_SCHOOL_CLASSES.some((k) => n.includes(k));
}
function scrollToFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[data-field-error="true"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement).focus?.();
    }
  });
}

/* ============================================================ */

export default function AdminAdmissionsPage() {
  const searchParams = useSearchParams();
  const applicationFromUrl = searchParams.get("application");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<Paginated<ApplicationListRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [permissionError, setPermissionError] = useState("");

  const [formOptions, setFormOptions] = useState<FormOptions>({ classes: [], class_streams: [], academic_years: [], houses: [] });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [physicalFileFilter, setPhysicalFileFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editModal, setEditModal] = useState<{ mode: "create" | "edit"; application: ApplicationDetail | null } | null>(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (statusFilter) p.set("status", statusFilter);
    if (sourceFilter) p.set("source", sourceFilter);
    if (physicalFileFilter) p.set("physical_file_status", physicalFileFilter);
    p.set("page", String(page));
    p.set("per_page", "25");
    return p.toString();
  }, [search, statusFilter, sourceFilter, physicalFileFilter, page]);

  const handleError = useCallback((e: any, fallback: string) => {
    const msg = String(e?.message || fallback);
    if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("access")) {
      setPermissionError(msg);
    } else {
      setError(msg);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try { const r = await apiGet(ENDPOINTS.dashboard); setStats(r.data as DashboardStats); }
    catch (e: any) { handleError(e, "Unable to load dashboard."); }
  }, [handleError]);

  const loadFormOptions = useCallback(async () => {
    try {
      const r = await apiGet(ENDPOINTS.formOptions);
      setFormOptions(r.data ?? { classes: [], class_streams: [], academic_years: [], houses: [] });
    } catch (e: any) { handleError(e, "Unable to load options."); }
  }, [handleError]);

  const loadApplications = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const r = await apiGet(`${ENDPOINTS.applications}?${buildQuery()}`);
      setApplications(r.data as Paginated<ApplicationListRow>);
      setPermissionError("");
    } catch (e: any) { handleError(e, "Unable to load applications."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [buildQuery, handleError]);

  const loadDetail = useCallback(async (id: number, opts: { silent?: boolean } = {}) => {
    if (!opts.silent) { setDetailLoading(true); setDetail(null); }
    setDetailError("");
    try { const r = await apiGet(`${ENDPOINTS.applications}/${id}`); setDetail(r.data as ApplicationDetail); }
    catch (e: any) { setDetailError(e?.message || "Unable to load application."); }
    finally { if (!opts.silent) setDetailLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); loadFormOptions(); }, [loadDashboard, loadFormOptions]);
  useEffect(() => { loadApplications(); }, [buildQuery]);
  useEffect(() => {
    if (applicationFromUrl) {
      const id = Number(applicationFromUrl);
      if (!Number.isNaN(id)) setSelectedId(id);
    }
  }, [applicationFromUrl]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 300); return () => clearTimeout(t); }, [search, statusFilter, sourceFilter, physicalFileFilter]);

  async function refreshAll() {
    await Promise.all([
      loadDashboard(),
      loadApplications({ silent: true }),
      selectedId ? loadDetail(selectedId, { silent: true }) : Promise.resolve(),
    ]);
  }

  if (permissionError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <ShieldAlert size={26} className="text-red-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#172033]">Access Denied</h2>
            <p className="mt-2 text-sm text-slate-500">{permissionError}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); try { await refreshAll(); } finally { setRefreshing(false); } }}
        onNewApplication={() => setEditModal({ mode: "create", application: null })}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {stats && <StatsRow stats={stats} />}
        <FiltersBar
          search={search} onSearchChange={setSearch}
          status={statusFilter} onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
          source={sourceFilter} onSourceChange={(v) => { setSourceFilter(v); setPage(1); }}
          physicalFile={physicalFileFilter} onPhysicalFileChange={(v) => { setPhysicalFileFilter(v); setPage(1); }}
        />
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
            <button type="button" onClick={() => setError("")} className="ml-auto rounded-lg p-1 hover:bg-red-100" aria-label="Close"><X size={18} /></button>
          </div>
        )}
        <ApplicationsTable data={applications} loading={loading} onOpen={(id) => setSelectedId(id)} onPageChange={setPage} />
      </div>

      {selectedId && (
        <DetailDrawer
          loading={detailLoading} error={detailError} detail={detail}
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

/* ============================================================ */

function Header({ refreshing, onRefresh, onNewApplication }: { refreshing: boolean; onRefresh: () => void; onNewApplication: () => void }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]"><GraduationCap size={22} /></div>
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
            <Plus size={16} /> New Application
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
    { label: "Awaiting", value: stats.awaiting_approval },
    { label: "Approved", value: stats.approved },
    { label: "Enrolled", value: stats.enrolled },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((i) => (
        <div key={i.label} className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{i.label}</p>
          <p className="mt-1 text-2xl font-black text-[#252B68]">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function FiltersBar({ search, onSearchChange, status, onStatusChange, source, onSourceChange, physicalFile, onPhysicalFileChange }: {
  search: string; onSearchChange: (v: string) => void;
  status: string; onStatusChange: (v: string) => void;
  source: string; onSourceChange: (v: string) => void;
  physicalFile: string; onPhysicalFileChange: (v: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <label className="relative block">
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

function SelectFilter({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10">
        <option value="">{placeholder}</option>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function ApplicationsTable({ data, loading, onOpen, onPageChange }: {
  data: Paginated<ApplicationListRow> | null; loading: boolean;
  onOpen: (id: number) => void; onPageChange: (page: number) => void;
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ClipboardCheck size={22} /></div>
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
                <tr key={app.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(app.id)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#252B68]">{app.application_number}</td>
                  <td className="px-4 py-3 font-semibold text-[#172033]">{fullName(app)}</td>
                  <td className="px-4 py-3 text-slate-600">{app.class_applied?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{app.academic_year?.name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge style={style} /></td>
                  <td className="px-4 py-3 text-center text-slate-600">{app.documents_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">{app.submitted_at ? formatDate(app.submitted_at) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68]">View <ChevronRight size={14} /></span>
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
            <button key={app.id} type="button" onClick={() => onOpen(app.id)} className="block w-full px-4 py-4 text-left transition hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-[#252B68]">{app.application_number}</p>
                  <p className="mt-1 font-bold text-[#172033]">{fullName(app)}</p>
                  <p className="mt-1 text-xs text-slate-500">{app.class_applied?.name || "—"} · {app.academic_year?.name || "—"}</p>
                </div>
                <StatusBadge style={style} />
              </div>
            </button>
          );
        })}
      </div>
      {data.last_page > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">Page {data.current_page} of {data.last_page} · {data.total} total</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onPageChange(data.current_page - 1)} disabled={data.current_page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" onClick={() => onPageChange(data.current_page + 1)} disabled={data.current_page >= data.last_page}
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
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} /> {style.label}
    </span>
  );
}

/* ============================================================ */

function DetailDrawer({ loading, error, detail, formOptions, onClose, onRefresh, onEdit }: {
  loading: boolean; error: string; detail: ApplicationDetail | null;
  formOptions: FormOptions;
  onClose: () => void; onRefresh: () => Promise<void>;
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
    if (!token) { setPrintError("Your session has expired."); return; }
    setPrintError("");
    const url = `${ENDPOINTS.applications}/${detail.id}/print?token=${encodeURIComponent(token)}`;
    const tab = window.open(url, "_blank");
    if (!tab) setPrintError("Please allow pop-ups to print.");
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col overflow-hidden bg-slate-50 shadow-2xl">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><ArrowLeft size={18} /></button>
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
          {printError && (<p className="flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} /> {printError}</p>)}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !detail && (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading…</div>
          )}
          {error && !loading && (
            <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={20} /><p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {detail && !error && <ApplicationDetailView detail={detail} formOptions={formOptions} onRefresh={onRefresh} />}
        </div>
      </aside>
    </div>
  );
}

function ApplicationDetailView({ detail, formOptions, onRefresh }: {
  detail: ApplicationDetail; formOptions: FormOptions; onRefresh: () => Promise<void>;
}) {
  const docsVerified = allRequiredDocumentsVerified(detail.documents);
  const assessmentDone = hasCompletedAssessment(detail.assessments);
  const assessmentPassed = hasPassedAssessment(detail.assessments);
  const physicalPending = detail.physical_file_status === "pending";

  const currentUser = readCurrentUser();
  const role = currentUser?.role;
  const canComment = isHeadteacherRole(role);
  const canRecordHeadDecision = isHeadteacherRole(role);
  const canRecordPaperDecision = isAdmissionsRole(role) && !isHeadteacherRole(role);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SummaryCard detail={detail} />
      <WorkflowActions detail={detail} />
      <StudentDetailsSection detail={detail} />
      <MedicalSection detail={detail} />
      <ParentsSection detail={detail} />
      <PreviousSchoolSection detail={detail} />

      <DocumentsSection applicationId={detail.id} documents={detail.documents}
        studentName={`${detail.legal_first_name} ${detail.legal_surname}`.trim()}
        onRefresh={onRefresh} />

      <AssessmentsSection applicationId={detail.id} assessments={detail.assessments}
        canSchedule={docsVerified} onRefresh={onRefresh} />

      {(canRecordHeadDecision || canRecordPaperDecision) && !detail.student && (
        <DecisionsSection applicationId={detail.id} decisions={detail.decisions}
          canDecide={canRecordHeadDecision ? assessmentDone : canRecordPaperDecision}
          mode={canRecordHeadDecision ? "head" : "paper"}
          formOptions={formOptions} onRefresh={onRefresh} status={detail.status} />
      )}

      {!canRecordHeadDecision && isAdmissionsRole(role) && !detail.student && !assessmentDone && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">Headteacher decision pending</p>
              <p className="mt-1 text-sm text-amber-800">
                When the assessment is marked as <strong>passed</strong>, headteachers are automatically emailed.
              </p>
            </div>
          </div>
        </div>
      )}

      <CommentsSection applicationId={detail.id} comments={detail.comments || []}
        canComment={canComment} currentUserId={currentUser?.id ?? null}
        isAdministrator={role === "administrator"} onRefresh={onRefresh} />

      {!detail.student && (
        <EnrolSection
          applicationId={detail.id}
          detail={detail}
          formOptions={formOptions}
          onRefresh={onRefresh}
          isHeadteacher={canRecordHeadDecision}
          isAdmissionsOfficer={canRecordPaperDecision}
          assessmentPassed={assessmentPassed}
          physicalPending={physicalPending}
        />
      )}

      {detail.student && <ReassignSection student={detail.student} onRefresh={onRefresh} />}
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
        <Row label="Physical file" value={detail.physical_file_status} />
      </div>
    </section>
  );
}

function StudentDetailsSection({ detail }: { detail: ApplicationDetail }) {
  const siblings = Array.isArray(detail.siblings_at_mount_view) ? detail.siblings_at_mount_view : [];
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
        <InfoField label="Siblings at Mount View" value={siblings.length > 0 ? siblings.join(", ") : "None"} />
        <InfoField label="Email with Mount View" value={detail.email_with_mount_view} />
        <InfoField label="Contact Email" value={detail.contact_email} />
      </div>
      <div className="mt-4"><InfoField label="Physical Address" value={detail.physical_address} block /></div>
    </Section>
  );
}

function MedicalSection({ detail }: { detail: ApplicationDetail }) {
  const hasAny = detail.medical_conditions || detail.allergies || detail.learning_needs || detail.family_doctor_name || detail.family_doctor_phone;
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
          {detail.parents.map((parent, i) => (
            <div key={parent.id ?? i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="font-bold text-[#172033]">{parent.full_name || "—"}</p>
                {parent.is_primary && (<span className="rounded-full bg-[#F58220]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F58220]">Primary</span>)}
                {parent.emergency_contact && (<span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">Emergency</span>)}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField label="Relationship" value={parent.relationship} />
                <InfoField label="Phone" value={parent.phone_number} />
                <InfoField label="Email" value={parent.email} />
                <InfoField label="Occupation" value={parent.occupation} />
                <InfoField label="Position / Title" value={parent.position_title} />
                <InfoField label="Employer" value={parent.employer} />
                <InfoField label="Work Phone" value={parent.work_phone} />
                <InfoField label="Employer Pays Fees" value={parent.employer_pays_fees ? `Yes · ${parent.employer_payment_percentage ?? "—"}%` : "No"} />
                <InfoField label="Preferred Contact" value={parent.preferred_communication} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function PreviousSchoolSection({ detail }: { detail: ApplicationDetail }) {
  const hasAny = detail.previous_school_name || detail.previous_school_address || detail.previous_class || detail.previous_year || detail.previous_school_contact || detail.previous_school_country || detail.previous_school_language;
  return (
    <Section title="Previous School" icon={<GraduationCap size={17} />}>
      {!hasAny ? (<p className="text-sm text-slate-500">No previous school recorded.</p>) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField label="School Name" value={detail.previous_school_name} />
          <InfoField label="Country" value={detail.previous_school_country} />
          <InfoField label="Previous Class" value={detail.previous_class} />
          <InfoField label="Instructional Language" value={detail.previous_school_language} />
          <InfoField label="Previous Year" value={detail.previous_year} />
          <InfoField label="School Contact" value={detail.previous_school_contact} />
        </div>
      )}
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
      <p className="mt-1 break-words text-sm font-semibold text-[#172033]">{value === null || value === undefined || value === "" ? "—" : value}</p>
    </div>
  );
}

function InfoField({ label, value, block }: { label: string; value: string | number | null | undefined; block?: boolean }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words whitespace-pre-line text-sm font-semibold text-[#172033]">{display}</p>
    </div>
  );
}

/* ============================================================ */

function DocumentsSection({ applicationId, documents, studentName, onRefresh }: {
  applicationId: number; documents: Doc[]; studentName: string; onRefresh: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState<{ doc: Doc; url: string; isImage: boolean } | null>(null);

  async function verify(documentId: number, status: "verified" | "rejected" | "pending", physicalReceived: boolean) {
    setBusyId(documentId); setError("");
    try {
      await apiPost(`${ENDPOINTS.applications}/${applicationId}/documents/${documentId}/verify`, {
        verification_status: status, physical_received: physicalReceived,
      });
      await onRefresh();
    } catch (e: any) { setError(e?.message || "Unable to update document."); }
    finally { setBusyId(null); }
  }
  async function handlePreview(doc: Doc) {
    setError("");
    try {
      const response = await fetch(`${ENDPOINTS.applications}/${applicationId}/documents/${doc.id}/preview`, { headers: authHeaders(false) });
      if (!response.ok) throw new Error("Unable to load the document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewing({ doc, url, isImage: (doc.mime_type || "").startsWith("image/") });
    } catch (e: any) { setError(e?.message || "Unable to preview."); }
  }
  async function handleDownload(doc: Doc) {
    setError("");
    try { await downloadDocument(applicationId, doc, studentName); } catch (e: any) { setError(e?.message || "Unable to download."); }
  }

  useEffect(() => () => { if (previewing?.url) URL.revokeObjectURL(previewing.url); }, [previewing]);

  return (
    <Section title="Documents" icon={<FileCheck2 size={17} />}>
      {error && (<div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</div>)}
      {documents.length === 0 ? (<p className="text-sm text-slate-500">No documents uploaded yet.</p>) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const busy = busyId === doc.id;
            const verified = doc.verification_status === "verified";
            const ss = {
              pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
              verified: { bg: "bg-green-50", text: "text-green-700", label: "Verified" },
              rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
            }[doc.verification_status];
            return (
              <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#252B68]"><FileText size={17} /></div>
                    <div>
                      <p className="font-bold text-[#172033]">{DOCUMENT_LABELS[doc.document_type] || doc.document_type}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{doc.original_name} · {fileSize(doc.file_size)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${ss.bg} ${ss.text}`}>{ss.label}</span>
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
                <p className="text-sm font-bold text-[#252B68]">{DOCUMENT_LABELS[previewing.doc.document_type] || previewing.doc.document_type}</p>
              </div>
              <button type="button" onClick={() => { URL.revokeObjectURL(previewing.url); setPreviewing(null); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-3">
              {previewing.isImage
                ? <img src={previewing.url} alt="Document" className="mx-auto max-h-[75vh] rounded-lg bg-white shadow" />
                : <iframe src={previewing.url} title="Document preview" className="h-[75vh] w-full rounded-lg border-0 bg-white" />}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ============================================================ */

function AssessmentsSection({ applicationId, assessments, canSchedule, onRefresh }: {
  applicationId: number; assessments: Assessment[]; canSchedule: boolean; onRefresh: () => Promise<void>;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  return (
    <Section title="Assessments" icon={<ClipboardCheck size={17} />}>
      {error && (<div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</div>)}
      {assessments.length === 0 ? (<p className="text-sm text-slate-500">No assessments scheduled yet.</p>) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-[#172033]">{a.assessment_type || "Assessment"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {a.assessment_date ? formatDate(a.assessment_date) : "Date not set"}
                    {a.assessment_time ? ` · ${a.assessment_time}` : ""}
                    {a.location ? ` · ${a.location}` : ""}
                  </p>
                  {a.assessor && (<p className="mt-1 text-xs text-slate-500">Assessor: {a.assessor.name}</p>)}
                </div>
                {a.result ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">{a.result}</span>
                ) : (
                  <button type="button" onClick={() => setCompletingId(a.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1c2156]">
                    <Check size={13} /> Complete
                  </button>
                )}
              </div>
              {a.results.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left font-bold uppercase tracking-wider text-slate-500">
                      <tr><th className="px-3 py-2">Area</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Comments</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {a.results.map((r) => (
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
              {a.recommendation && (<p className="mt-3 text-xs text-slate-600"><span className="font-bold">Recommendation:</span> {a.recommendation}</p>)}
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
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500"><AlertCircle size={13} /> All required documents must be verified first.</p>
      )}
      {showSchedule && <ScheduleAssessmentForm applicationId={applicationId} onCancel={() => setShowSchedule(false)} onSuccess={async () => { setShowSchedule(false); await onRefresh(); }} />}
      {completingId !== null && (
        <CompleteAssessmentForm assessmentId={completingId} onCancel={() => setCompletingId(null)} onSuccess={async () => { setCompletingId(null); await onRefresh(); }} onError={(msg) => setError(msg)} />
      )}
    </Section>
  );
}

function ScheduleAssessmentForm({ applicationId, onCancel, onSuccess }: { applicationId: number; onCancel: () => void; onSuccess: () => Promise<void> }) {
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessmentTime, setAssessmentTime] = useState("");
  const [location, setLocation] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await apiPost(`${ENDPOINTS.applications}/${applicationId}/assessments`, {
        assessment_date: assessmentDate || null,
        assessment_time: assessmentTime || null,
        location: location || null,
        assessment_type: assessmentType || null,
      });
      await onSuccess();
    } catch (e: any) { setError(e?.message || "Unable to schedule."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-[#252B68]/20 bg-[#252B68]/5 p-4">
      <p className="text-sm font-black text-[#252B68]">Schedule New Assessment</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date (optional)">
          <input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} className="input-admin" />
        </Field>
        <Field label="Time">
          <input type="time" value={assessmentTime} onChange={(e) => setAssessmentTime(e.target.value)} className="input-admin" />
        </Field>
        <Field label="Location"><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Hall" className="input-admin" /></Field>
        <Field label="Type"><input type="text" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Entrance Assessment" className="input-admin" /></Field>
      </div>
      {error && (<p className="flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} /> {error}</p>)}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Schedule
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
      </div>
    </form>
  );
}

function CompleteAssessmentForm({ assessmentId, onCancel, onSuccess, onError }: {
  assessmentId: number; onCancel: () => void; onSuccess: () => Promise<void>; onError: (msg: string) => void;
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
    } catch (e: any) { const msg = e?.message || "Unable to complete."; setError(msg); onError(msg); }
    finally { setBusy(false); }
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
      <Field label="Comments"><textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="input-admin" /></Field>
      <Field label="Recommendation"><textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={2} className="input-admin" /></Field>
      {error && (<p className="flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} /> {error}</p>)}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Result
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
      </div>
    </form>
  );
}

/* ============================================================ */

function DecisionsSection({ applicationId, decisions, canDecide, formOptions, onRefresh, status, mode }: {
  applicationId: number; decisions: Decision[]; canDecide: boolean;
  formOptions: FormOptions; onRefresh: () => Promise<void>;
  status: Status; mode: "paper" | "head";
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const statusBlocks = ["approved", "denied", "enrolled", "transferred", "withdrawn"].includes(status);
  const showRecordButton = canDecide && !statusBlocks && mode === "head";

  async function deleteDecision(id: number) {
    if (!window.confirm("Delete this decision?")) return;
    setDeletingId(id); setError("");
    try { await apiDelete(`${ENDPOINTS.applications}/${applicationId}/decisions/${id}`); await onRefresh(); }
    catch (e: any) { setError(e?.message || "Unable to delete."); }
    finally { setDeletingId(null); }
  }

  return (
    <Section title={mode === "paper" ? "Paper Decision" : "Admission Decision"} icon={<Gavel size={17} />}>
      {mode === "head" && (
        <p className="mb-3 text-xs text-slate-500">
          The headteacher records this decision. When an assessment is marked <strong>passed</strong>, headteachers are automatically emailed.
        </p>
      )}
      {error && (<div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</div>)}

      {decisions.length === 0 ? (<p className="text-sm text-slate-500">No decision recorded yet.</p>) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    d.decision === "approved" ? "bg-green-50 text-green-700" : d.decision === "denied" ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"
                  }`}>{d.decision}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(d.decision_date)}</span>
                </div>
                {mode === "head" && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setEditingDecision(d); setShowCreateForm(false); }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><Pencil size={13} /></button>
                    <button type="button" disabled={deletingId === d.id} onClick={() => deleteDecision(d.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50">
                      {deletingId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                )}
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
                  {d.principal_comments && <p><span className="font-bold">Principal comments:</span> {d.principal_comments}</p>}
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
          <AlertCircle size={13} />
          {mode === "head" ? "An assessment must be completed before a decision." : "Only the headteacher can record a decision."}
        </p>
      )}

      {showCreateForm && <DecisionForm applicationId={applicationId} formOptions={formOptions} onCancel={() => setShowCreateForm(false)} onSuccess={async () => { setShowCreateForm(false); await onRefresh(); }} onError={(msg) => setError(msg)} />}
      {editingDecision && <DecisionForm applicationId={applicationId} formOptions={formOptions} existingDecision={editingDecision} onCancel={() => setEditingDecision(null)} onSuccess={async () => { setEditingDecision(null); await onRefresh(); }} onError={(msg) => setError(msg)} />}
    </Section>
  );
}

function DecisionForm({ applicationId, formOptions, existingDecision, onCancel, onSuccess, onError }: {
  applicationId: number; formOptions: FormOptions; existingDecision?: Decision | null;
  onCancel: () => void; onSuccess: () => Promise<void>; onError: (msg: string) => void;
}) {
  const isEdit = Boolean(existingDecision);
  const [decision, setDecision] = useState<"approved" | "denied" | "waitlisted">((existingDecision?.decision as any) ?? "approved");
  const [approvedClassId, setApprovedClassId] = useState(existingDecision?.approved_class?.id ? String(existingDecision.approved_class.id) : "");
  const [houseId, setHouseId] = useState(existingDecision?.house?.id ? String(existingDecision.house.id) : "");
  const [academicYearId, setAcademicYearId] = useState(existingDecision?.academic_year?.id ? String(existingDecision.academic_year.id) : formOptions.academic_years.find((y) => y.is_current)?.id?.toString() ?? "");
  const [comments, setComments] = useState(existingDecision?.comments ?? "");
  const [principalComments, setPrincipalComments] = useState(existingDecision?.principal_comments ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (decision === "approved" && !approvedClassId) { setError("Approved class required."); return; }
    setBusy(true); setError("");
    try {
      const payload = {
        decision,
        approved_class_id: approvedClassId ? Number(approvedClassId) : null,
        house_id: houseId ? Number(houseId) : null,
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        comments: comments || null,
        principal_comments: principalComments || null,
      };
      if (isEdit && existingDecision) await apiPut(`${ENDPOINTS.applications}/${applicationId}/decisions/${existingDecision.id}`, payload);
      else await apiPost(`${ENDPOINTS.applications}/${applicationId}/decision`, payload);
      await onSuccess();
    } catch (e: any) { const msg = e?.message || `Unable to save decision.`; setError(msg); onError(msg); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
      <p className="text-sm font-black text-[#252B68]">{isEdit ? "Edit Decision" : "Record Decision"}</p>
      <Field label="Decision" required>
        <select value={decision} onChange={(e) => setDecision(e.target.value as any)} className="input-admin">
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="waitlisted">Waitlisted</option>
        </select>
      </Field>
      {decision === "approved" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Approved Class" required>
            <select value={approvedClassId} onChange={(e) => setApprovedClassId(e.target.value)} className="input-admin">
              <option value="">Select class</option>
              {formOptions.classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="House">
            <select value={houseId} onChange={(e) => setHouseId(e.target.value)} className="input-admin">
              <option value="">Select house</option>
              {formOptions.houses.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
            </select>
          </Field>
          <Field label="Academic Year">
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input-admin">
              <option value="">Select year</option>
              {formOptions.academic_years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.is_current ? " (current)" : ""}</option>))}
            </select>
          </Field>
        </div>
      )}
      <Field label="Comments"><textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="input-admin" /></Field>
      {readCurrentUser() && isHeadteacherRole(readCurrentUser()!.role) && (
        <Field label="Principal Comments"><textarea value={principalComments} onChange={(e) => setPrincipalComments(e.target.value)} rows={2} className="input-admin" /></Field>
      )}
      {error && (<p className="flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} /> {error}</p>)}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F58220] px-4 py-2 text-xs font-bold text-white hover:bg-[#dd6e13] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {isEdit ? "Save Changes" : "Save Decision"}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
      </div>
    </form>
  );
}

/* ============================================================ */

function CommentsSection({ applicationId, comments, canComment, currentUserId, isAdministrator, onRefresh }: {
  applicationId: number; comments: Comment[]; canComment: boolean;
  currentUserId: number | null; isAdministrator: boolean; onRefresh: () => Promise<void>;
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
    try { await apiPost(`${ENDPOINTS.applications}/${applicationId}/comments`, { body: body.trim() }); setBody(""); await onRefresh(); }
    catch (err: any) { setError(err?.message || "Unable to add comment."); }
    finally { setBusy(false); }
  }
  async function saveEdit(id: number) {
    if (!editingBody.trim()) return;
    setSavingEdit(true); setError("");
    try { await apiPut(`${ENDPOINTS.applications}/${applicationId}/comments/${id}`, { body: editingBody.trim() }); setEditingId(null); await onRefresh(); }
    catch (err: any) { setError(err?.message || "Unable to update."); }
    finally { setSavingEdit(false); }
  }
  async function remove(id: number) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingId(id); setError("");
    try { await apiDelete(`${ENDPOINTS.applications}/${applicationId}/comments/${id}`); await onRefresh(); }
    catch (err: any) { setError(err?.message || "Unable to delete."); }
    finally { setDeletingId(null); }
  }

  return (
    <Section title="Comments" icon={<MessageSquare size={17} />}>
      {error && (<div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</div>)}
      {comments.length === 0 ? (<p className="text-sm text-slate-500">No comments yet.</p>) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const isEditing = editingId === c.id;
            const canEditOrDelete = canComment && (isAdministrator || (currentUserId !== null && c.user?.id === currentUserId));
            return (
              <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#172033]">{c.user?.name || "Unknown"}</p>
                    {c.role_snapshot && (<span className="rounded-full bg-[#252B68]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#252B68]">{c.role_snapshot}</span>)}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-slate-400">{formatDateTime(c.created_at)}</p>
                    {canEditOrDelete && !isEditing && (
                      <>
                        <button type="button" onClick={() => { setEditingId(c.id); setEditingBody(c.body); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"><Pencil size={12} /></button>
                        <button type="button" disabled={deletingId === c.id} onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50">
                          {deletingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea value={editingBody} onChange={(e) => setEditingBody(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setEditingId(null); setEditingBody(""); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                      <button type="button" disabled={savingEdit || !editingBody.trim()} onClick={() => saveEdit(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
                        {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                      </button>
                    </div>
                  </div>
                ) : (<p className="mt-2 whitespace-pre-line text-sm text-slate-700">{c.body}</p>)}
              </div>
            );
          })}
        </div>
      )}
      {canComment ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            placeholder="Add a comment…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
          <div className="flex justify-end">
            <button type="submit" disabled={busy || !body.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add Comment
            </button>
          </div>
        </form>
      ) : (<p className="mt-4 text-xs text-slate-500">Only the headteacher or administrator can comment.</p>)}
    </Section>
  );
}

/* ============================================================ */

function EnrolSection({ applicationId, detail, formOptions, onRefresh, isHeadteacher, isAdmissionsOfficer, assessmentPassed, physicalPending }: {
  applicationId: number; detail: ApplicationDetail; formOptions: FormOptions;
  onRefresh: () => Promise<void>;
  isHeadteacher: boolean; isAdmissionsOfficer: boolean; assessmentPassed: boolean;
  physicalPending: boolean;
}) {
  const [paperEnrolment, setPaperEnrolment] = useState(false);
  const initialClassId = resolveClassSelection(detail, formOptions);
  const initialYearId = detail.academic_year?.id ? String(detail.academic_year.id)
    : formOptions.academic_years.find((y) => y.is_current)?.id?.toString() ?? "";

  const [classId, setClassId] = useState(initialClassId);
  const [classStreamId, setClassStreamId] = useState("");
  const [houseId, setHouseId] = useState("");
  const [academicYearId, setAcademicYearId] = useState(initialYearId);

  const [decision, setDecision] = useState<"approved" | "denied" | "waitlisted">("approved");
  const [decisionComments, setDecisionComments] = useState("");

  const [autoAssign, setAutoAssign] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setClassId(resolveClassSelection(detail, formOptions));
    setAcademicYearId(initialYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.class_applied?.id, detail.academic_year?.id]);

  const streamsForClass = formOptions.class_streams.filter((s) => s.school_class_id === Number(classId));

  async function submitStandard(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!classId) errors.class_id = "Select a class.";
    if (!academicYearId) errors.academic_year_id = "Select an academic year.";
    if (!autoAssign) {
      if (!classStreamId) errors.class_stream_id = "Select a section, or enable auto-balance.";
      if (!houseId) errors.house_id = "Select a house, or enable auto-balance.";
    }
    if (physicalPending) errors.general = "Physical file must be received before enrolment.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      scrollToFirstError();
      return;
    }

    setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      const res = await apiPost(`${ENDPOINTS.applications}/${applicationId}/enrol`, {
        class_id: Number(classId),
        class_stream_id: classStreamId ? Number(classStreamId) : null,
        house_id: houseId ? Number(houseId) : null,
        academic_year_id: Number(academicYearId),
        auto_assign: autoAssign,
      });
      setSuccess(res?.message || "Student enrolled.");
      await onRefresh();
    } catch (e: any) {
      setError(e?.message || "Unable to enrol.");
      scrollToFirstError();
    }
    finally { setBusy(false); }
  }

  async function submitPaper(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (decision === "approved") {
      if (!classId) errors.class_id = "Select a class.";
      if (!classStreamId) errors.class_stream_id = "Select the section the student is already in.";
      if (!houseId) errors.house_id = "Select the house the student is already in.";
    }
    if (!academicYearId) errors.academic_year_id = "Select an academic year.";
    if (physicalPending) errors.general = "Physical file must be received before enrolment.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      scrollToFirstError();
      return;
    }

    setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      const res = await apiPost(`${ENDPOINTS.applications}/${applicationId}/paper-enrol`, {
        decision,
        class_id: classId ? Number(classId) : null,
        class_stream_id: decision === "approved" ? Number(classStreamId) : null,
        house_id: decision === "approved" ? Number(houseId) : null,
        academic_year_id: Number(academicYearId),
        comments: decisionComments || null,
      });
      setSuccess(res?.message || "Paper enrolment complete.");
      await onRefresh();
    } catch (e: any) {
      setError(e?.message || "Unable to enrol.");
      scrollToFirstError();
    }
    finally { setBusy(false); }
  }

  if (physicalPending) {
    return (
      <Section title="Enrol Student" icon={<UserCheck size={17} />}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">Physical file not received</p>
              <p className="mt-1 text-sm text-amber-800">
                The student cannot be enrolled until the physical file is on hand. Use the <strong>Edit</strong> button
                at the top to update the physical file status to "Received" once the file arrives.
              </p>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  const showForm = paperEnrolment || isHeadteacher;

  return (
    <Section title="Enrol Student" icon={<UserCheck size={17} />}>
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {isAdmissionsOfficer && (
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <input type="checkbox" checked={paperEnrolment} onChange={(e) => setPaperEnrolment(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#F58220]" />
          <div>
            <p className="text-sm font-bold text-amber-900">Student is already enrolled on paper</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Fast-track: enter the class, section, and house the student is already in.
            </p>
          </div>
        </label>
      )}

      {!paperEnrolment && isAdmissionsOfficer && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-900">Headteacher decision required</p>
              <p className="mt-1 text-sm text-blue-800">
                {assessmentPassed
                  ? "Assessment passed — headteacher has been emailed to record the decision."
                  : "Headteacher decides after the assessment is marked as passed."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={paperEnrolment ? submitPaper : submitStandard} className="space-y-4">
          {paperEnrolment && (
            <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Decision</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Decision" required>
                  <select value={decision} onChange={(e) => setDecision(e.target.value as any)} className="input-admin">
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Comments">
                  <textarea rows={2} value={decisionComments} onChange={(e) => setDecisionComments(e.target.value)} className="input-admin" />
                </Field>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Class" required error={fieldErrors.class_id}>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setClassStreamId(""); }}
                className={`input-admin ${fieldErrors.class_id ? "!border-red-400" : ""}`}>
                <option value="">Select class</option>
                {formOptions.classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </Field>
            <Field label="Class Section" required={paperEnrolment} error={fieldErrors.class_stream_id}>
              <select value={classStreamId} onChange={(e) => setClassStreamId(e.target.value)}
                disabled={!paperEnrolment && autoAssign}
                className={`input-admin ${fieldErrors.class_stream_id ? "!border-red-400" : ""} ${!paperEnrolment && autoAssign ? "opacity-60" : ""}`}>
                <option value="">{!paperEnrolment && autoAssign ? "— Auto (balanced) —" : "Select section"}</option>
                {streamsForClass.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </Field>
            <Field label="House" required={paperEnrolment} error={fieldErrors.house_id}>
              <select value={houseId} onChange={(e) => setHouseId(e.target.value)}
                disabled={!paperEnrolment && autoAssign}
                className={`input-admin ${fieldErrors.house_id ? "!border-red-400" : ""} ${!paperEnrolment && autoAssign ? "opacity-60" : ""}`}>
                <option value="">{!paperEnrolment && autoAssign ? "— Auto (balanced) —" : "Select house"}</option>
                {formOptions.houses.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
              </select>
            </Field>
            <Field label="Academic Year" required error={fieldErrors.academic_year_id}>
              <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
                className={`input-admin ${fieldErrors.academic_year_id ? "!border-red-400" : ""}`}>
                <option value="">Select academic year</option>
                {formOptions.academic_years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.is_current ? " (current)" : ""}</option>))}
              </select>
            </Field>
          </div>

          {!paperEnrolment && isHeadteacher && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#252B68]" />
              <div>
                <p className="text-sm font-bold text-slate-700">Auto-balance section & house</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  For <strong>new students</strong> — the system picks the least-crowded section and the least-balanced house by gender.
                  Uncheck to pick manually.
                </p>
              </div>
            </label>
          )}

          {paperEnrolment && (
            <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <strong>Manual entry required.</strong> This student is already in a class, section, and house — enter exactly where they are.
              No auto-balance is applied in paper mode.
            </p>
          )}

          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
            {paperEnrolment ? "Enrol Student (Paper)" : (autoAssign ? "Enrol (Auto-Balance)" : "Enrol Student")}
          </button>
        </form>
      )}
    </Section>
  );
}

/* ============================================================ */

function ReassignSection({ student, onRefresh }: { student: StudentRecord; onRefresh: () => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({ classes: [], class_streams: [], academic_years: [], houses: [] });
  const [targetStreamId, setTargetStreamId] = useState<string>("");
  const [targetHouseId, setTargetHouseId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!showModal) return;
    fetch(`${API_URL}/api/admin/admissions/form-options`, { headers: authHeaders(false) })
      .then((r) => r.json())
      .then((d) => setFormOptions(d.data ?? formOptions))
      .catch(() => {});
    setTargetStreamId(student.current_class_stream_id ? String(student.current_class_stream_id) : "");
    setTargetHouseId(student.house_id ? String(student.house_id) : "");
  }, [showModal, student.current_class_stream_id, student.house_id]);

  async function save() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const res = await apiPost(`${API_URL}/api/admin/admissions/students/${student.id}/reassign`, {
        class_stream_id: targetStreamId ? Number(targetStreamId) : null,
        house_id: targetHouseId ? Number(targetHouseId) : null,
      });
      setSuccess(res?.message || "Reassigned.");
      setShowModal(false);
      await onRefresh();
    } catch (e: any) { setError(e?.message || "Unable to reassign."); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Student Class & House" icon={<Users size={17} />}>
      {success && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoField label="Class Section" value={student.current_class_stream?.name ?? student.current_class?.name ?? "—"} />
        <InfoField label="House" value={student.house?.name ?? "—"} />
        <InfoField label="Student Number" value={student.student_number} />
      </div>

      <button type="button" onClick={() => setShowModal(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#252B68] px-4 py-2 text-xs font-bold text-[#252B68] hover:bg-[#252B68]/5">
        <Pencil size={13} /> Change Class / House
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-[#172033]">Change Class & House</h2>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Changing class or house will unbalance the school</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Students are balanced by gender and count. Moving this student shifts the balance.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Field label="New class section">
                  <select value={targetStreamId} onChange={(e) => setTargetStreamId(e.target.value)} className="input-admin">
                    <option value="">— Leave unchanged —</option>
                    {formOptions.class_streams.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </Field>
                <Field label="New house">
                  <select value={targetHouseId} onChange={(e) => setTargetHouseId(e.target.value)} className="input-admin">
                    <option value="">— Leave unchanged —</option>
                    {formOptions.houses.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
                  </select>
                </Field>
              </div>
              {error && (<p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={13} /> {error}</p>)}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onClick={() => setShowModal(false)} disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={save} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F58220] px-4 py-2 text-xs font-bold text-white hover:bg-[#dd6e13] disabled:opacity-50">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ============================================================ */

function WorkflowActions({ detail }: { detail: ApplicationDetail }) {
  const hints = useMemo(() => [
    { label: "Documents verified", done: allRequiredDocumentsVerified(detail.documents) },
    { label: "Assessment scheduled", done: detail.assessments.length > 0 },
    { label: "Assessment completed", done: hasCompletedAssessment(detail.assessments) },
    { label: "Decision recorded", done: detail.decisions.length > 0 },
  ], [detail]);

  return (
    <Section title="Workflow" icon={<ShieldCheck size={17} />}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {hints.map((hint) => (
          <div key={hint.label}
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
              hint.done ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}>
            {hint.done ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {hint.label}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ */

function ApplicationEditModal({ mode, application, options, onClose, onSaved }: {
  mode: "create" | "edit"; application: ApplicationDetail | null;
  options: FormOptions; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const currentYear = options.academic_years.find((y) => y.is_current) ?? options.academic_years[0];

  const [status, setStatus] = useState<Status>((application?.status as Status) ?? "draft");
  const [source, setSource] = useState<"online" | "paper">((application?.source as any) ?? "paper");
  const [academicYearId, setAcademicYearId] = useState(application?.academic_year?.id ? String(application.academic_year.id) : currentYear ? String(currentYear.id) : "");
  const [classAppliedId, setClassAppliedId] = useState(application?.class_applied?.id ? String(application.class_applied.id) : "");
  const [contactEmail, setContactEmail] = useState(application?.contact_email ?? "");
  const [physicalFileStatus, setPhysicalFileStatus] = useState<PhysicalFile>((application?.physical_file_status as PhysicalFile) ?? "pending");

  const [paperEnrol, setPaperEnrol] = useState(false);
  const [paperDecision, setPaperDecision] = useState<"approved" | "denied" | "waitlisted">("approved");
  const [paperClassStreamId, setPaperClassStreamId] = useState("");
  const [paperHouseId, setPaperHouseId] = useState("");
  const [paperComments, setPaperComments] = useState("");
  const [paperPrincipalComments, setPaperPrincipalComments] = useState("");

  const isNoneish = (v: any) => !v || String(v).trim() === "" || String(v).trim().toLowerCase() === "none";
  const [hasMedicalConditions, setHasMedicalConditions] = useState(!isNoneish(application?.medical_conditions));
  const [hasAllergies, setHasAllergies] = useState(!isNoneish(application?.allergies));
  const [hasLearningNeeds, setHasLearningNeeds] = useState(!isNoneish(application?.learning_needs));

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
    children_at_mount_view: application?.children_at_mount_view ? String(application.children_at_mount_view) : "",
    siblings_at_mount_view: Array.isArray(application?.siblings_at_mount_view) ? application.siblings_at_mount_view : [],
    mountview_email_local: stripMountViewDomain(application?.email_with_mount_view),
    physical_address: application?.physical_address ?? "",
    medical_conditions: isNoneish(application?.medical_conditions) ? "" : (application?.medical_conditions ?? ""),
    allergies: isNoneish(application?.allergies) ? "" : (application?.allergies ?? ""),
    learning_needs: isNoneish(application?.learning_needs) ? "" : (application?.learning_needs ?? ""),
    family_doctor_name: application?.family_doctor_name ?? "",
    family_doctor_phone: application?.family_doctor_phone ?? "",
    previous_school_name: application?.previous_school_name ?? "",
    previous_school_address: application?.previous_school_address ?? "",
    previous_class: application?.previous_class ?? "",
    previous_year: application?.previous_year ?? "",
    previous_school_contact: application?.previous_school_contact ?? "",
    previous_school_country: application?.previous_school_country ?? "",
    previous_school_language: application?.previous_school_language ?? "",
  });

  const selectedClass = options.classes.find((c) => String(c.id) === classAppliedId);
  const requiresPreviousSchool = !selectedClass || classRequiresPreviousSchool(selectedClass.name);
  const [hasPreviousSchool, setHasPreviousSchool] = useState(!!application?.previous_school_name);
  const showPreviousSchool = requiresPreviousSchool || hasPreviousSchool;

  const [parents, setParents] = useState<Parent[]>(application?.parents?.map((p) => ({
    id: p.id, full_name: p.full_name, relationship: p.relationship, phone_number: p.phone_number,
    email: p.email, occupation: p.occupation, position_title: p.position_title, employer: p.employer,
    work_address: p.work_address, work_phone: p.work_phone, employer_pays_fees: Boolean(p.employer_pays_fees),
    employer_payment_percentage: p.employer_payment_percentage, physical_address: p.physical_address,
    postal_address: p.postal_address, emergency_contact: p.emergency_contact,
    preferred_communication: p.preferred_communication ?? "Phone", is_primary: p.is_primary,
  })) ?? [{
    full_name: "", relationship: "", phone_number: "", email: "", occupation: "", position_title: "",
    employer: "", work_address: "", work_phone: "", employer_pays_fees: false, employer_payment_percentage: null,
    physical_address: "", postal_address: "", emergency_contact: false, preferred_communication: "Phone", is_primary: true,
  }]);

  const [principalComments, setPrincipalComments] = useState(application?.principal_comments ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canEditPrincipal = isHeadteacherRole(readCurrentUser()?.role ?? "");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const minDob = dobMinDate();
  const maxDob = dobMaxDate();
  const streamsForClass = options.class_streams.filter((s) => s.school_class_id === Number(classAppliedId));
  const emailPreview = student.mountview_email_local.trim()
    ? `${student.mountview_email_local.trim()}${MOUNTVIEW_DOMAIN}`
    : `—${MOUNTVIEW_DOMAIN}`;

  function updateStudent(field: keyof typeof student, value: any) {
    setStudent((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((c) => { const n = { ...c }; delete n[`student.${field}`]; return n; });
  }
  function updateParent(index: number, field: keyof Parent, value: any) {
    setParents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "employer_pays_fees" && value === false) next[index].employer_payment_percentage = null;
      return next;
    });
    setFieldErrors((c) => { const n = { ...c }; delete n[`parent.${index}.${field}`]; return n; });
  }
  function addParent() {
    setParents((prev) => [...prev, {
      full_name: "", relationship: "", phone_number: "", email: "", occupation: "", position_title: "",
      employer: "", work_address: "", work_phone: "", employer_pays_fees: false, employer_payment_percentage: null,
      physical_address: "", postal_address: "", emergency_contact: false, preferred_communication: "Phone", is_primary: false,
    }]);
  }
  function removeParent(index: number) { setParents((prev) => prev.filter((_, i) => i !== index)); }

  function handleChildrenCountChange(value: string) {
    const parsed = Math.max(0, parseInt(value || "0", 10));
    setStudent((prev) => {
      const existing = [...(prev.siblings_at_mount_view || [])];
      let siblings = existing;
      if (parsed > existing.length) { while (siblings.length < parsed) siblings.push(""); }
      else if (parsed < existing.length) { siblings = siblings.slice(0, parsed); }
      return { ...prev, children_at_mount_view: value, siblings_at_mount_view: siblings };
    });
  }
  function updateSibling(i: number, v: string) {
    setStudent((prev) => { const s = [...(prev.siblings_at_mount_view || [])]; s[i] = v; return { ...prev, siblings_at_mount_view: s }; });
  }
  function removeSibling(i: number) {
    setStudent((prev) => ({ ...prev, siblings_at_mount_view: (prev.siblings_at_mount_view || []).filter((_, idx) => idx !== i) }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!student.legal_first_name.trim()) errors["student.legal_first_name"] = "Required.";
    if (!student.legal_surname.trim()) errors["student.legal_surname"] = "Required.";
    const dobErr = validateDateOfBirth(student.date_of_birth);
    if (dobErr) errors["student.date_of_birth"] = dobErr;

    if (!student.gender) errors["student.gender"] = "Gender is required.";
    if (!student.first_language.trim()) errors["student.first_language"] = "First language is required.";
    if (!student.nationality.trim()) errors["student.nationality"] = "Nationality is required.";
    if (!student.religion.trim()) errors["student.religion"] = "Religion is required.";

    if (!isValidMountViewLocal(student.mountview_email_local.trim())) {
      errors["student.mountview_email_local"] = "Only letters, numbers, dot, underscore, plus, dash.";
    }

    if (showPreviousSchool && !student.previous_school_name.trim()) {
      errors["student.previous_school_name"] = "School name is required.";
    }

    parents.forEach((p, i) => {
      if (!p.full_name.trim() && !p.relationship.trim()) return;
      if (p.phone_number && !isValidPhone(p.phone_number)) errors[`parent.${i}.phone_number`] = "10 digits.";
      if (p.work_phone && !isValidPhone(p.work_phone)) errors[`parent.${i}.work_phone`] = "10 digits.";
      if (p.employer_pays_fees && (p.employer_payment_percentage == null || p.employer_payment_percentage < 1 || p.employer_payment_percentage > 100)) {
        errors[`parent.${i}.employer_payment_percentage`] = "1–100.";
      }
    });

    if (paperEnrol) {
      if (!classAppliedId) errors.paper_class = "Class is required.";
      if (paperDecision === "approved") {
        if (!paperClassStreamId) errors.paper_class_stream = "Select the section the student is already in.";
        if (!paperHouseId) errors.paper_house = "Select the house the student is already in.";
        if (!physicalFileStatus || physicalFileStatus === "pending") {
          errors.paper_physical = "Physical file must be marked as received before enrolment.";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      scrollToFirstError();
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    if (!validate()) return;
    setBusy(true);
    try {
      const payload: any = {
        status, source,
        academic_year_id: academicYearId ? Number(academicYearId) : null,
        contact_email: contactEmail.trim() || null,
        physical_file_status: physicalFileStatus,
        student: {
          legal_first_name: student.legal_first_name.trim(),
          middle_name: student.middle_name.trim() || null,
          legal_surname: student.legal_surname.trim(),
          date_of_birth: student.date_of_birth || null,
          gender: student.gender || null,
          blood_group: student.blood_group || null,
          weight_kg: student.weight_kg ? Number(student.weight_kg) : null,
          height_cm: student.height_cm ? Number(student.height_cm) : null,
          first_language: student.first_language.trim() || null,
          nationality: student.nationality.trim() || null,
          religion: student.religion.trim() || null,
          emergency_contact: student.emergency_contact || null,
          family_member_count: student.family_member_count ? Number(student.family_member_count) : null,
          student_lives_with: student.student_lives_with || null,
          children_at_mount_view: student.children_at_mount_view ? Number(student.children_at_mount_view) : null,
          siblings_at_mount_view: (student.siblings_at_mount_view || []).map((n) => n.trim()).filter((n) => n),

          medical_conditions: hasMedicalConditions ? (student.medical_conditions.trim() || "None") : "None",
          allergies: hasAllergies ? (student.allergies.trim() || "None") : "None",
          learning_needs: hasLearningNeeds ? (student.learning_needs.trim() || "None") : "None",

          family_doctor_name: student.family_doctor_name.trim() || null,
          family_doctor_phone: student.family_doctor_phone.trim() || null,

          email_with_mount_view: buildMountViewEmail(student.mountview_email_local),
          physical_address: student.physical_address.trim() || null,

          previous_school_name: showPreviousSchool ? (student.previous_school_name.trim() || null) : null,
          previous_school_address: showPreviousSchool ? (student.previous_school_address.trim() || null) : null,
          previous_class: showPreviousSchool ? (student.previous_class.trim() || null) : null,
          previous_year: showPreviousSchool ? (student.previous_year.trim() || null) : null,
          previous_school_contact: showPreviousSchool ? (student.previous_school_contact.trim() || null) : null,
          previous_school_country: showPreviousSchool ? (student.previous_school_country.trim() || null) : null,
          previous_school_language: showPreviousSchool ? (student.previous_school_language.trim() || null) : null,
        },
        parents: parents.filter((p) => p.full_name.trim()).map((p) => ({
          full_name: p.full_name.trim(),
          relationship: p.relationship.trim() || "Guardian",
          phone_number: p.phone_number ? digitsOnly(p.phone_number) : null,
          email: p.email || null,
          occupation: p.occupation || null,
          position_title: p.position_title || null,
          employer: p.employer || null,
          work_address: p.work_address || null,
          work_phone: p.work_phone ? digitsOnly(p.work_phone) : null,
          employer_pays_fees: Boolean(p.employer_pays_fees),
          employer_payment_percentage: p.employer_pays_fees && p.employer_payment_percentage != null ? Number(p.employer_payment_percentage) : null,
          physical_address: p.physical_address || null,
          postal_address: p.postal_address || null,
          emergency_contact: Boolean(p.emergency_contact),
          preferred_communication: p.preferred_communication || null,
          is_primary: Boolean(p.is_primary),
        })),
      };

      if (classAppliedId) payload.class_applied_id = Number(classAppliedId);
      if (canEditPrincipal && principalComments.trim()) payload.principal_comments = principalComments.trim();

      if (mode === "create" && paperEnrol) {
        payload.paper_enrol = true;
        payload.paper_decision = paperDecision;
        payload.paper_class_stream_id = paperDecision === "approved" ? Number(paperClassStreamId) : null;
        payload.paper_house_id = paperDecision === "approved" ? Number(paperHouseId) : null;
        payload.paper_comments = paperComments.trim() || null;
        payload.paper_principal_comments = paperPrincipalComments.trim() || null;
        await apiPost(ENDPOINTS.applications, payload);
      } else if (mode === "create") {
        await apiPost(ENDPOINTS.applications, payload);
      } else if (application) {
        await apiPut(`${ENDPOINTS.applications}/${application.id}`, payload);
      }

      await onSaved();
    } catch (e: any) {
      const msg = e?.message || "Unable to save application.";
      setError(msg);
      if (msg.toLowerCase().includes("date of birth")) {
        setFieldErrors({ "student.date_of_birth": msg });
        scrollToFirstError();
      }
    } finally { setBusy(false); }
  }

  const showPaperSection = mode === "create" && paperEnrol;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="my-4 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">{mode === "create" ? "New application" : "Edit application"}</p>
            <h2 className="mt-1 text-lg font-black">{mode === "create" ? "Create admission application" : application?.application_number}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
          {error && (<div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}</div>)}

          {mode === "create" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input type="checkbox" checked={paperEnrol} onChange={(e) => setPaperEnrol(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#F58220]" />
              <div>
                <p className="text-sm font-bold text-amber-900">Student is already enrolled on paper</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Fast-track: enter the class, section, and house the student is already in. All fields must be entered manually.
                </p>
              </div>
            </label>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Application</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="input-admin" disabled={paperEnrol}>
                  {EDIT_STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </Field>
              <Field label="Source">
                <select value={source} onChange={(e) => setSource(e.target.value as any)} className="input-admin">
                  <option value="paper">Paper</option>
                  <option value="online">Online</option>
                </select>
              </Field>
              <Field label="Contact email">
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-admin" />
              </Field>
              <Field label="Academic year">
                <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input-admin">
                  <option value="">Select academic year</option>
                  {options.academic_years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.is_current ? " (current)" : ""}</option>))}
                </select>
              </Field>
              <Field label="Class applied for" required error={fieldErrors.paper_class}>
                <select value={classAppliedId} onChange={(e) => { setClassAppliedId(e.target.value); setPaperClassStreamId(""); }}
                  className={`input-admin ${fieldErrors.paper_class ? "!border-red-400" : ""}`}>
                  <option value="">Select class</option>
                  {options.classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </Field>
              <Field label="Physical file status" error={fieldErrors.paper_physical}>
                <select value={physicalFileStatus} onChange={(e) => setPhysicalFileStatus(e.target.value as PhysicalFile)}
                  className={`input-admin ${fieldErrors.paper_physical ? "!border-red-400" : ""}`}>
                  {PHYSICAL_FILE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </Field>
            </div>
          </section>

          {showPaperSection && (
            <section className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Paper Enrolment (manual)</h3>

              {physicalFileStatus === "pending" && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-white p-3 text-xs text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span><strong>Physical file is pending.</strong> Application will save, but the student will <strong>not</strong> be enrolled. Update physical file to "Received" to enable enrolment.</span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Decision" required>
                  <select value={paperDecision} onChange={(e) => setPaperDecision(e.target.value as any)} className="input-admin">
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </Field>
                {paperDecision === "approved" && (
                  <>
                    <Field label="Class Section" required error={fieldErrors.paper_class_stream}>
                      <select value={paperClassStreamId} onChange={(e) => setPaperClassStreamId(e.target.value)}
                        className={`input-admin ${fieldErrors.paper_class_stream ? "!border-red-400" : ""}`}>
                        <option value="">Select the section the student is in</option>
                        {streamsForClass.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                    </Field>
                    <Field label="House" required error={fieldErrors.paper_house}>
                      <select value={paperHouseId} onChange={(e) => setPaperHouseId(e.target.value)}
                        className={`input-admin ${fieldErrors.paper_house ? "!border-red-400" : ""}`}>
                        <option value="">Select the house the student is in</option>
                        {options.houses.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
                      </select>
                    </Field>
                  </>
                )}
              </div>

              {paperDecision === "approved" && (
                <p className="mt-3 rounded-lg border border-blue-200 bg-white p-3 text-xs text-blue-800">
                  <strong>Manual entry required.</strong> Enter exactly where the student is — no auto-balance is applied in paper mode.
                </p>
              )}

              <div className="mt-3">
                <Field label="Comments">
                  <textarea rows={2} value={paperComments} onChange={(e) => setPaperComments(e.target.value)} className="input-admin" />
                </Field>
              </div>

              {canEditPrincipal && (
                <div className="mt-3">
                  <Field label="Principal Comments">
                    <textarea rows={2} value={paperPrincipalComments} onChange={(e) => setPaperPrincipalComments(e.target.value)} className="input-admin" />
                  </Field>
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Student Information</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Legal first name" required error={fieldErrors["student.legal_first_name"]}>
                <input type="text" value={student.legal_first_name} onChange={(e) => updateStudent("legal_first_name", e.target.value)}
                  className={`input-admin ${fieldErrors["student.legal_first_name"] ? "!border-red-400" : ""}`} required />
              </Field>
              <Field label="Middle name">
                <input type="text" value={student.middle_name} onChange={(e) => updateStudent("middle_name", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Legal surname" required error={fieldErrors["student.legal_surname"]}>
                <input type="text" value={student.legal_surname} onChange={(e) => updateStudent("legal_surname", e.target.value)}
                  className={`input-admin ${fieldErrors["student.legal_surname"] ? "!border-red-400" : ""}`} required />
              </Field>
              <Field label="Date of birth" required error={fieldErrors["student.date_of_birth"]}>
                <input type="date" value={student.date_of_birth} min={minDob} max={maxDob}
                  onChange={(e) => updateStudent("date_of_birth", e.target.value)}
                  className={`input-admin ${fieldErrors["student.date_of_birth"] ? "!border-red-400" : ""}`} />
                <p className="mt-1 text-[10px] text-slate-500">Must be between {minDob} and {maxDob}</p>
              </Field>
              <Field label="Gender" required error={fieldErrors["student.gender"]}>
                <select value={student.gender} onChange={(e) => updateStudent("gender", e.target.value)}
                  className={`input-admin ${fieldErrors["student.gender"] ? "!border-red-400" : ""}`}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Blood group">
                <select value={student.blood_group} onChange={(e) => updateStudent("blood_group", e.target.value)} className="input-admin">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </Field>
              <Field label="First language" required error={fieldErrors["student.first_language"]}>
                <input type="text" value={student.first_language} onChange={(e) => updateStudent("first_language", e.target.value)}
                  className={`input-admin ${fieldErrors["student.first_language"] ? "!border-red-400" : ""}`} />
              </Field>
              <Field label="Nationality" required error={fieldErrors["student.nationality"]}>
                <input type="text" value={student.nationality} onChange={(e) => updateStudent("nationality", e.target.value)}
                  className={`input-admin ${fieldErrors["student.nationality"] ? "!border-red-400" : ""}`} />
              </Field>
              <Field label="Religion" required error={fieldErrors["student.religion"]}>
                <input type="text" value={student.religion} onChange={(e) => updateStudent("religion", e.target.value)}
                  className={`input-admin ${fieldErrors["student.religion"] ? "!border-red-400" : ""}`} />
              </Field>
              <Field label="Weight (kg)"><input type="number" step="0.01" value={student.weight_kg} onChange={(e) => updateStudent("weight_kg", e.target.value)} className="input-admin" /></Field>
              <Field label="Height (cm)"><input type="number" step="0.01" value={student.height_cm} onChange={(e) => updateStudent("height_cm", e.target.value)} className="input-admin" /></Field>
              <Field label="Emergency contact"><input type="text" value={student.emergency_contact} onChange={(e) => updateStudent("emergency_contact", e.target.value)} className="input-admin" /></Field>
              <Field label="Family member count"><input type="number" min="0" value={student.family_member_count} onChange={(e) => updateStudent("family_member_count", e.target.value)} className="input-admin" /></Field>
              <Field label="Children at Mount View"><input type="number" min="0" value={student.children_at_mount_view} onChange={(e) => handleChildrenCountChange(e.target.value)} className="input-admin" /></Field>
              <Field label="Student lives with">
                <select value={student.student_lives_with} onChange={(e) => updateStudent("student_lives_with", e.target.value)} className="input-admin">
                  <option value="">Select</option>
                  {LIVE_WITH_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </Field>
              <div className="sm:col-span-3">
                <Field label="Email with Mount View" error={fieldErrors["student.mountview_email_local"]}>
                  <div className={`flex h-11 w-full items-stretch overflow-hidden rounded-xl border ${fieldErrors["student.mountview_email_local"] ? "border-red-400" : "border-slate-200"} bg-white focus-within:border-[#252B68] focus-within:ring-4 focus-within:ring-[#252B68]/10`}>
                    <input type="text" value={student.mountview_email_local}
                      onChange={(e) => updateStudent("mountview_email_local", e.target.value)}
                      placeholder="first.last"
                      className="min-w-0 flex-1 border-0 bg-white px-3 text-sm outline-none" />
                    <span className="flex shrink-0 items-center whitespace-nowrap bg-slate-100 px-3 text-xs font-bold text-slate-600">
                      {MOUNTVIEW_DOMAIN}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Preview: <span className="font-semibold text-slate-700">{emailPreview}</span>
                  </p>
                </Field>
              </div>
            </div>

            {(student.siblings_at_mount_view?.length || 0) > 0 && (
              <div className="mt-4 rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Siblings at Mount View</p>
                <div className="space-y-2">
                  {student.siblings_at_mount_view.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#252B68]">{i + 1}</span>
                      <input type="text" value={name} onChange={(e) => updateSibling(i, e.target.value)} placeholder={`Sibling ${i + 1}`}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                      <button type="button" onClick={() => removeSibling(i)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <Field label="Physical address">
                <textarea rows={2} value={student.physical_address} onChange={(e) => updateStudent("physical_address", e.target.value)} className="input-admin" />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Medical Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={hasMedicalConditions} onChange={(e) => setHasMedicalConditions(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#252B68]" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Medical conditions</p>
                    <p className="text-[11px] text-slate-500">
                      {hasMedicalConditions ? "Describe the medical conditions below." : 'Will be recorded as "None".'}
                    </p>
                  </div>
                </label>
                {hasMedicalConditions && (
                  <textarea rows={2} value={student.medical_conditions} onChange={(e) => updateStudent("medical_conditions", e.target.value)}
                    placeholder="Describe the condition(s)…"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={hasAllergies} onChange={(e) => setHasAllergies(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#252B68]" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Allergies</p>
                    <p className="text-[11px] text-slate-500">
                      {hasAllergies ? "Describe the allergies below." : 'Will be recorded as "None".'}
                    </p>
                  </div>
                </label>
                {hasAllergies && (
                  <textarea rows={2} value={student.allergies} onChange={(e) => updateStudent("allergies", e.target.value)}
                    placeholder="Describe the allergies…"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={hasLearningNeeds} onChange={(e) => setHasLearningNeeds(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#252B68]" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Learning needs</p>
                    <p className="text-[11px] text-slate-500">
                      {hasLearningNeeds ? "Describe the learning needs below." : 'Will be recorded as "None".'}
                    </p>
                  </div>
                </label>
                {hasLearningNeeds && (
                  <textarea rows={2} value={student.learning_needs} onChange={(e) => updateStudent("learning_needs", e.target.value)}
                    placeholder="Describe the learning needs…"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                )}
              </div>

              <Field label="Family Doctor">
                <input type="text" value={student.family_doctor_name} onChange={(e) => updateStudent("family_doctor_name", e.target.value)} className="input-admin" />
              </Field>
              <Field label="Family Doctor Phone">
                <input type="tel" value={student.family_doctor_phone} onChange={(e) => updateStudent("family_doctor_phone", e.target.value)} className="input-admin" />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#252B68]">
                Previous School
                {requiresPreviousSchool && <span className="ml-1 text-red-500">*</span>}
              </h3>
              {!requiresPreviousSchool && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" checked={hasPreviousSchool} onChange={(e) => setHasPreviousSchool(e.target.checked)}
                    className="h-4 w-4 accent-[#252B68]" />
                  Has attended a previous school
                </label>
              )}
            </div>

            {!showPreviousSchool ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                Not required for this class. Tick "Has attended a previous school" above to add previous school details.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="School name" required={requiresPreviousSchool} error={fieldErrors["student.previous_school_name"]}>
                    <input type="text" value={student.previous_school_name} onChange={(e) => updateStudent("previous_school_name", e.target.value)}
                      className={`input-admin ${fieldErrors["student.previous_school_name"] ? "!border-red-400" : ""}`} />
                  </Field>
                  <Field label="Country"><input type="text" value={student.previous_school_country} onChange={(e) => updateStudent("previous_school_country", e.target.value)} className="input-admin" /></Field>
                  <Field label="Previous Class"><input type="text" value={student.previous_class} onChange={(e) => updateStudent("previous_class", e.target.value)} className="input-admin" /></Field>
                  <Field label="Instructional Language"><input type="text" value={student.previous_school_language} onChange={(e) => updateStudent("previous_school_language", e.target.value)} className="input-admin" /></Field>
                  <Field label="Previous Year"><input type="text" value={student.previous_year} onChange={(e) => updateStudent("previous_year", e.target.value)} className="input-admin" /></Field>
                  <Field label="School Contact"><input type="text" value={student.previous_school_contact} onChange={(e) => updateStudent("previous_school_contact", e.target.value)} className="input-admin" /></Field>
                </div>
                <div className="mt-3"><Field label="School address"><textarea rows={2} value={student.previous_school_address} onChange={(e) => updateStudent("previous_school_address", e.target.value)} className="input-admin" /></Field></div>
              </>
            )}
          </section>

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
                    {parents.length > 1 && (<button type="button" onClick={() => removeParent(index)} className="rounded-lg p-1 text-red-500 hover:bg-red-50"><X size={14} /></button>)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Full name"><input type="text" value={parent.full_name} onChange={(e) => updateParent(index, "full_name", e.target.value)} className="input-admin" /></Field>
                    <Field label="Relationship"><input type="text" value={parent.relationship} onChange={(e) => updateParent(index, "relationship", e.target.value)} className="input-admin" /></Field>
                    <Field label="Phone (10 digits)" error={fieldErrors[`parent.${index}.phone_number`]}>
                      <input type="tel" inputMode="numeric" maxLength={PHONE_LENGTH} value={parent.phone_number ?? ""}
                        onChange={(e) => updateParent(index, "phone_number", digitsOnly(e.target.value))}
                        className={`input-admin ${fieldErrors[`parent.${index}.phone_number`] ? "!border-red-400" : ""}`} />
                    </Field>
                    <Field label="Email"><input type="email" value={parent.email ?? ""} onChange={(e) => updateParent(index, "email", e.target.value)} className="input-admin" /></Field>
                    <Field label="Occupation"><input type="text" value={parent.occupation ?? ""} onChange={(e) => updateParent(index, "occupation", e.target.value)} className="input-admin" /></Field>
                    <Field label="Position / Title"><input type="text" value={parent.position_title ?? ""} onChange={(e) => updateParent(index, "position_title", e.target.value)} className="input-admin" /></Field>
                    <Field label="Employer"><input type="text" value={parent.employer ?? ""} onChange={(e) => updateParent(index, "employer", e.target.value)} className="input-admin" /></Field>
                    <Field label="Work Phone (10 digits)" error={fieldErrors[`parent.${index}.work_phone`]}>
                      <input type="tel" inputMode="numeric" maxLength={PHONE_LENGTH} value={parent.work_phone ?? ""}
                        onChange={(e) => updateParent(index, "work_phone", digitsOnly(e.target.value))}
                        className={`input-admin ${fieldErrors[`parent.${index}.work_phone`] ? "!border-red-400" : ""}`} />
                    </Field>
                  </div>
                  <div className="mt-3"><Field label="Work Address"><textarea rows={2} value={parent.work_address ?? ""} onChange={(e) => updateParent(index, "work_address", e.target.value)} className="input-admin" /></Field></div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.emergency_contact} onChange={(e) => updateParent(index, "emergency_contact", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#252B68]" /> Emergency contact
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.is_primary} onChange={(e) => setParents((prev) => prev.map((p, i) => ({ ...p, is_primary: i === index ? e.target.checked : false })))} className="h-4 w-4 rounded border-slate-300 text-[#252B68]" /> Primary contact
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={parent.employer_pays_fees} onChange={(e) => updateParent(index, "employer_pays_fees", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#252B68]" /> Employer pays fees
                    </label>
                  </div>
                  {parent.employer_pays_fees && (
                    <div className="mt-3">
                      <Field label="Employer Payment Percentage" error={fieldErrors[`parent.${index}.employer_payment_percentage`]}>
                        <div className="relative">
                          <input type="number" min={1} max={100} value={parent.employer_payment_percentage ?? ""}
                            onChange={(e) => updateParent(index, "employer_payment_percentage", e.target.value === "" ? null : Number(e.target.value))}
                            className={`input-admin pr-10 ${fieldErrors[`parent.${index}.employer_payment_percentage`] ? "!border-red-400" : ""}`} />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">%</span>
                        </div>
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {canEditPrincipal && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">Principal Comments</h3>
              <Field label="Principal Comments">
                <textarea rows={3} value={principalComments} onChange={(e) => setPrincipalComments(e.target.value)} className="input-admin" />
              </Field>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156] disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {showPaperSection
              ? (physicalFileStatus === "pending" ? "Save Application & Decision" : "Save & Enrol Student")
              : (mode === "create" ? "Create application" : "Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================ */

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block" data-field-error={error ? "true" : "false"}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && (<p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600"><AlertCircle size={11} /> {error}</p>)}
    </label>
  );
}