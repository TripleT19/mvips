"use client";

import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

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

type Result = {
  type: "success" | "error";
  title: string;
  message: string;
};

function authHeaders(extra: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function AcademicYearsTermsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  const [showYearModal, setShowYearModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearForm, setYearForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
    is_active: true,
  });
  const [savingYear, setSavingYear] = useState(false);

  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [termForm, setTermForm] = useState({
    academic_year_id: 0,
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
    is_published: false,
  });
  const [savingTerm, setSavingTerm] = useState(false);

  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null);
  const [deleteTerm, setDeleteTerm] = useState<AcademicTerm | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [result, setResult] = useState<Result | null>(null);

  /* -------- Load -------- */
  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const [yRes, tRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/academic-years`, {
          headers: authHeaders(),
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/admin/academic-terms`, {
          headers: authHeaders(),
          cache: "no-store",
        }),
      ]);

      const yData = await yRes.json();
      const tData = await tRes.json();

      if (!yRes.ok) throw new Error(yData?.message || "Could not load years.");
      if (!tRes.ok) throw new Error(tData?.message || "Could not load terms.");

      const listYears: AcademicYear[] = yData.data ?? [];
      const listTerms: AcademicTerm[] = tData.data ?? [];

      setYears(listYears);
      setTerms(listTerms);

      // Auto-select the current year, else the first year
      if (selectedYearId === null) {
        const current = listYears.find((y) => y.is_current);
        setSelectedYearId(current?.id ?? listYears[0]?.id ?? null);
      } else if (!listYears.some((y) => y.id === selectedYearId)) {
        setSelectedYearId(listYears[0]?.id ?? null);
      }
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Unable to Load",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Year actions -------- */
  function openNewYear() {
    const yearNum = new Date().getFullYear();
    setEditingYear(null);
    setYearForm({
      name: `${yearNum}-${yearNum + 1}`,
      start_date: "",
      end_date: "",
      is_current: years.length === 0,
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
    setSavingYear(true);
    try {
      const url = editingYear
        ? `${API_URL}/api/admin/academic-years/${editingYear.id}`
        : `${API_URL}/api/admin/academic-years`;
      const method = editingYear ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
      await load(false);
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Unable to Save",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setSavingYear(false);
    }
  }

  async function confirmDeleteYear() {
    if (!deleteYear) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/academic-years/${deleteYear.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not delete year.");

      setDeleteYear(null);
      setResult({
        type: "success",
        title: "Year Deleted",
        message: data?.message || "The academic year was deleted.",
      });
      await load(false);
    } catch (e: any) {
      setDeleteYear(null);
      setResult({
        type: "error",
        title: "Unable to Delete",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setDeleting(false);
    }
  }

  /* -------- Term actions -------- */
  function openNewTerm() {
    if (!selectedYearId) {
      setResult({
        type: "error",
        title: "No Year Selected",
        message: "Select an academic year before adding a term.",
      });
      return;
    }
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
    setSavingTerm(true);
    try {
      const url = editingTerm
        ? `${API_URL}/api/admin/academic-terms/${editingTerm.id}`
        : `${API_URL}/api/admin/academic-terms`;
      const method = editingTerm ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
        message: data?.message || "The academic term was saved.",
      });
      await load(false);
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Unable to Save",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setSavingTerm(false);
    }
  }

  async function confirmDeleteTerm() {
    if (!deleteTerm) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/academic-terms/${deleteTerm.id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not delete term.");

      setDeleteTerm(null);
      setResult({
        type: "success",
        title: "Term Deleted",
        message: data?.message || "The academic term was deleted.",
      });
      await load(false);
    } catch (e: any) {
      setDeleteTerm(null);
      setResult({
        type: "error",
        title: "Unable to Delete",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setDeleting(false);
    }
  }

  const selectedYear = years.find((y) => y.id === selectedYearId) ?? null;
  const visibleTerms = terms.filter((t) => t.academic_year_id === selectedYearId);

  /* -------- Render -------- */
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin text-[#F58220]" />
          Loading academic years...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        {/* YEARS COLUMN */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-[#252B68]" />
              <h3 className="text-sm font-bold text-[#172033]">Academic Years</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => load(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                title="Refresh"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              </button>
              <button
                onClick={openNewYear}
                className="rounded-lg bg-[#F58220] p-1.5 text-white hover:bg-[#df7014]"
                title="Add Year"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {years.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                <AlertCircle size={22} className="text-amber-600" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#172033]">
                No academic years yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add one to start using the subjects and assignments tabs.
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
              {years.map((y) => {
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
                        <div className="flex shrink-0 gap-1">
                          {y.is_current && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* TERMS COLUMN */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                {selectedYear ? `Terms — ${selectedYear.name}` : "Terms"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedYear
                  ? `${visibleTerms.length} term${visibleTerms.length === 1 ? "" : "s"} in this year`
                  : "Select a year on the left to see its terms."}
              </p>
            </div>
            <div className="flex gap-2">
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F58220] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#df7014] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={13} />
                Add Term
              </button>
            </div>
          </div>

          {!selectedYear ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Calendar size={32} className="text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-[#172033]">
                Select an academic year
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Terms belong to a specific academic year. Choose one on the left.
              </p>
            </div>
          ) : visibleTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Calendar size={32} className="text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-[#172033]">
                No terms in {selectedYear.name} yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Most schools use Term 1, Term 2, and Term 3.
              </p>
              <button
                onClick={openNewTerm}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus size={14} />
                Add First Term
              </button>
            </div>
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
                      title="Edit term"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTerm(t)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete term"
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

      {/* YEAR MODAL */}
      {showYearModal && (
        <Modal
          onClose={() => setShowYearModal(false)}
          title={editingYear ? "Edit Academic Year" : "Add Academic Year"}
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

            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={yearForm.is_current}
                  onChange={(e) =>
                    setYearForm((c) => ({ ...c, is_current: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#252B68]"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Mark as the current academic year
                  </p>
                  <p className="text-xs text-slate-500">
                    Only one year can be current at a time.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={yearForm.is_active}
                  onChange={(e) =>
                    setYearForm((c) => ({ ...c, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#252B68]"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Active
                </span>
              </label>
            </div>

            <ModalFooter
              onCancel={() => setShowYearModal(false)}
              saving={savingYear}
              label={editingYear ? "Save Changes" : "Create Year"}
            />
          </form>
        </Modal>
      )}

      {/* TERM MODAL */}
      {showTermModal && (
        <Modal
          onClose={() => setShowTermModal(false)}
          title={editingTerm ? "Edit Academic Term" : "Add Academic Term"}
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
                {years.map((y) => (
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

            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={termForm.is_current}
                  onChange={(e) =>
                    setTermForm((c) => ({ ...c, is_current: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#252B68]"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Mark as the current term
                  </p>
                  <p className="text-xs text-slate-500">
                    Also makes its parent year the current year.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={termForm.is_published}
                  onChange={(e) =>
                    setTermForm((c) => ({
                      ...c,
                      is_published: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#252B68]"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Published
                  </p>
                  <p className="text-xs text-slate-500">
                    Report cards for this term become visible to staff.
                  </p>
                </div>
              </label>
            </div>

            <ModalFooter
              onCancel={() => setShowTermModal(false)}
              saving={savingTerm}
              label={editingTerm ? "Save Changes" : "Create Term"}
            />
          </form>
        </Modal>
      )}

      {/* DELETE MODALS */}
      {deleteYear && (
        <ConfirmDelete
          title="Delete Academic Year?"
          message={
            <>
              You are about to delete{" "}
              <strong className="text-slate-700">{deleteYear.name}</strong>.
              All its terms will be deleted too. If the year is linked to
              admission applications, deletion will be blocked — deactivate it
              instead.
            </>
          }
          deleting={deleting}
          onCancel={() => setDeleteYear(null)}
          onConfirm={confirmDeleteYear}
        />
      )}

      {deleteTerm && (
        <ConfirmDelete
          title="Delete Academic Term?"
          message={
            <>
              You are about to delete{" "}
              <strong className="text-slate-700">{deleteTerm.name}</strong>.
              This action cannot be undone.
            </>
          }
          deleting={deleting}
          onCancel={() => setDeleteTerm(null)}
          onConfirm={confirmDeleteTerm}
        />
      )}

      {result && (
        <ResultModal
          type={result.type}
          title={result.title}
          message={result.message}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}

/* ---------- Shared small UI ---------- */

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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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
  deleting,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: React.ReactNode;
  deleting: boolean;
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
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            {deleting ? "Deleting..." : "Delete"}
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