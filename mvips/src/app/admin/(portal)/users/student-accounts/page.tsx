"use client";

import {
  AlertCircle, CheckCircle2, ChevronDown, Download,
  FileSpreadsheet, Loader2, Mail, Save, Search, User,
  Users, X, Upload, Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface Section {
  id: number;
  name: string;
  school_class_name?: string;
  stream_name?: string;
  stream_colour?: string | null;
  student_count: number;
}

interface Guardian {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  relationship: string | null;
  is_primary: boolean;
}

interface RosterStudent {
  id: number;
  student_number: string;
  full_name: string;
  first_name: string;
  surname: string;
  photo_url: string | null;
  has_account: boolean;
  primary_email: string | null;
  guardians: Guardian[];
}

interface PreviewRow {
  student_id: number;
  student_number: string;
  student_name: string;
  email_local: string;
  email: string;
  relationship: string;
  name: string | null;
}

interface Preview {
  matched: number;
  unmatched: number;
  issues: string[];
  preview: PreviewRow[];
}

type Toast = { type: "success" | "error"; message: string };

/* ============================================================
 * HELPERS
 * ============================================================ */

function authHeaders(extra: Record<string, string> = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function initialsOf(name: string): string {
  return (name || "").split(" ").filter(Boolean).slice(0, 2)
    .map(p => p[0]).join("").toUpperCase() || "?";
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function StudentAccountsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [domain, setDomain] = useState("mountviewmw.com");
  const [sectionId, setSectionId] = useState<number | null>(null);

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [tab, setTab] = useState<"individual" | "bulk">("individual");

  // Per-row email drafts, keyed by student_id
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [rowSaving, setRowSaving] = useState<Record<number, boolean>>({});

  // Bulk
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  /* ---------- Load sections ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/student-accounts/sections`, {
          headers: authHeaders(), cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load sections");

        setSections(data.data ?? []);
        setDomain(data.domain ?? "mountviewmw.com");
        if (data.data?.length) setSectionId(data.data[0].id);
      } catch (e: any) {
        setToast({ type: "error", message: e?.message || "Failed." });
      }
    })();
  }, []);

  /* ---------- Load students ---------- */
  const loadStudents = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/student-accounts/students?class_stream_id=${sectionId}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setStudents(data.data.students ?? []);
      setDomain(data.data.domain ?? "mountviewmw.com");
      setDrafts({});
      setPreview(null);
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q)
    );
  }, [students, search]);

  const stats = useMemo(() => ({
    total: students.length,
    withAccount: students.filter(s => s.has_account).length,
    without: students.filter(s => !s.has_account).length,
  }), [students]);

  const currentSection = sections.find(s => s.id === sectionId);

  /* ============================================================
   * HANDLERS
   * ============================================================ */

  async function saveOne(student: RosterStudent) {
    const local = (drafts[student.id] || "").trim().toLowerCase();
    if (!local) return;

    if (!/^[a-z0-9._-]+$/.test(local)) {
      setToast({ type: "error", message: "Email can only contain letters, numbers, dots, hyphens and underscores." });
      return;
    }

    setRowSaving(s => ({ ...s, [student.id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/admin/student-accounts`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          student_id: student.id,
          email_local: local,
          relationship: "parent",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");

      setToast({ type: "success", message: data.message });
      setDrafts(d => { const c = { ...d }; delete c[student.id]; return c; });
      await loadStudents();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    } finally {
      setRowSaving(s => ({ ...s, [student.id]: false }));
    }
  }

  async function unlinkGuardian(student: RosterStudent, guardian: Guardian) {
    if (!confirm(`Remove ${guardian.email}'s access to ${student.full_name}?`)) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/student-accounts/${student.id}/guardians/${guardian.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setToast({ type: "success", message: data.message });
      await loadStudents();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewing(true);
    setPreview(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_URL}/api/admin/student-accounts/preview`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to parse file");

      setPreview(data.data);
      if (!data.data.preview.length) {
        setToast({ type: "error", message: "No valid rows found in the file." });
      }
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    } finally {
      setPreviewing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmBulk() {
    if (!preview || !preview.preview.length) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/student-accounts/bulk`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          rows: preview.preview.map(r => ({
            student_id: r.student_id,
            email_local: r.email_local,
            relationship: r.relationship || "parent",
            name: r.name,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");

      const { successful, failed, total } = data.summary;
      setToast({
        type: failed === 0 ? "success" : "error",
        message: `${successful}/${total} account(s) created${failed ? `, ${failed} failed` : ""}.`,
      });
      setPreview(null);
      await loadStudents();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    } finally {
      setConfirming(false);
    }
  }

  function downloadTemplate() {
    const header = "student_number,email_local,relationship,name";
    const rows = students.map(s => `${s.student_number},,,`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-accounts-template-${currentSection?.name || "section"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ============================================================
   * RENDER GUARDS
   * ============================================================ */

  if (!sections.length && !loading) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        No active class sections. Create a class and add students first.
      </div>
    );
  }

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Student Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create parent / guardian logins so they can view their children&apos;s
          results. One email can be shared by multiple children (siblings).
        </p>
      </div>

      {/* Section picker + stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Class Section
            </label>
            <div className="relative">
              <select
                value={sectionId ?? ""}
                onChange={(e) => setSectionId(Number(e.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.student_count} student{s.student_count === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <StatPill label="Total" value={stats.total} tone="bg-slate-50 text-[#172033]" />
          <StatPill label="With account" value={stats.withAccount} tone="bg-emerald-50 text-emerald-800" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <TabBtn
          active={tab === "individual"}
          onClick={() => setTab("individual")}
          icon={<User size={15} />}
        >
          Individual
        </TabBtn>
        <TabBtn
          active={tab === "bulk"}
          onClick={() => setTab("bulk")}
          icon={<FileSpreadsheet size={15} />}
        >
          Bulk Import
        </TabBtn>
      </div>

      {tab === "individual" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-[#172033]">
                {filtered.length} student{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="relative w-64">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#252B68]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-[#F58220]" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(student => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    domain={domain}
                    draft={drafts[student.id] ?? ""}
                    saving={!!rowSaving[student.id]}
                    onChange={(v) => setDrafts(d => ({ ...d, [student.id]: v }))}
                    onSave={() => saveOne(student)}
                    onUnlink={(g) => unlinkGuardian(student, g)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "bulk" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#172033]">Upload a CSV</h3>
            <p className="mt-1 text-xs text-slate-500">
              Columns: <code className="rounded bg-slate-100 px-1 py-0.5">student_number</code>,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">email_local</code>,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">relationship</code>{" "}
              (optional), <code className="rounded bg-slate-100 px-1 py-0.5">name</code> (optional).
              The <code>@{domain}</code> suffix is added automatically.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={downloadTemplate}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download size={15} /> Download template
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={previewing}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
              >
                {previewing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {previewing ? "Uploading..." : "Choose CSV file"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {preview && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[#172033]">Preview</p>
                  <p className="text-xs text-slate-500">
                    {preview.matched} matched · {preview.unmatched} issues
                  </p>
                </div>
                <button
                  onClick={() => { setPreview(null); }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X size={13} /> Clear
                </button>
              </div>

              {preview.issues.length > 0 && (
                <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertCircle size={13} /> Skipped rows
                  </p>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto pl-5 text-xs text-amber-800">
                    {preview.issues.map((msg, i) => <li key={i} className="list-disc">{msg}</li>)}
                  </ul>
                </div>
              )}

              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Number</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Relationship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-sm font-medium text-[#172033]">{row.student_name}</td>
                        <td className="px-4 py-2 text-xs font-mono text-slate-600">{row.student_number}</td>
                        <td className="px-4 py-2 text-sm text-[#252B68]">{row.email}</td>
                        <td className="px-4 py-2 text-xs capitalize text-slate-600">{row.relationship}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  onClick={() => setPreview(null)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulk}
                  disabled={confirming || !preview.preview.length}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F58220] px-5 text-sm font-semibold text-white hover:bg-[#d97212] disabled:opacity-50"
                >
                  {confirming ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {confirming ? "Creating..." : `Create ${preview.matched} account(s)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <ToastBox {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`flex h-11 flex-col justify-center rounded-xl px-3 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function TabBtn({
  active, onClick, children, icon,
}: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
        active ? "bg-white text-[#252B68] shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StudentRow({
  student, domain, draft, saving, onChange, onSave, onUnlink,
}: {
  student: RosterStudent;
  domain: string;
  draft: string;
  saving: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
  onUnlink: (g: Guardian) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      {/* Avatar + name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-xs font-bold text-white shadow-sm ring-2 ring-white">
          {student.photo_url
            ? <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover" />
            : initialsOf(student.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#172033]">{student.full_name}</p>
          <p className="text-[11px] text-slate-500">
            {student.student_number}
            {student.has_account && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 size={9} /> {student.guardians.length} guardian{student.guardians.length === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Guardian chips */}
      {student.has_account && (
        <div className="flex flex-wrap gap-1.5 sm:flex-1">
          {student.guardians.map(g => (
            <div
              key={g.id}
              className="group inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-1 pl-2 pr-1 text-xs font-medium text-emerald-800"
            >
              <Mail size={11} />
              {g.email}
              <button
                onClick={() => onUnlink(g)}
                title="Remove this guardian"
                className="flex h-5 w-5 items-center justify-center rounded text-emerald-700/60 hover:bg-emerald-100 hover:text-red-600"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Email entry (only when no account yet) */}
      {!student.has_account && (
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex h-9 flex-1 items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#252B68]">
            <input
              value={draft}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
              placeholder="e.g. j.smith"
              className="h-full flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <span className="border-l border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-500">
              @{domain}
            </span>
          </div>
          <button
            onClick={onSave}
            disabled={saving || !draft.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#252B68] px-3 text-xs font-bold text-white hover:bg-[#1d2255] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function ToastBox({ type, message, onClose }: Toast & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-full max-w-sm">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}>
        {type === "success"
          ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
        <p className="flex-1 text-sm">{message}</p>
        <button onClick={onClose}><X size={16} /></button>
      </div>
    </div>
  );
}