"use client";

import {
  AlertCircle, ArrowDown, ArrowUp, BookOpen, CheckCircle2, ChevronDown,
  Copy, Edit3, Loader2, Plus, Save, Trash2, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface CtxTerm { id: number; name: string }
interface CtxSubject { id: number; name: string; code?: string | null }
interface CtxClass { id: number; name: string }

interface ClassAccess {
  class_id: number;
  scope: "owner" | "subject" | "viewer";
  subject_ids: number[] | null; // null => all subjects
}

interface Ctx {
  current_academic_year: { id: number; name: string } | null;
  terms: CtxTerm[];
  subjects: CtxSubject[];
  classes: CtxClass[];
  class_access: ClassAccess[];
  is_viewer: boolean;
}

interface ObjectiveRow {
  id: number;
  name: string;
  description: string | null;
  order: number;
  results_count: number;
  editable: boolean;
}

interface StrandRow {
  id: number;
  name: string;
  order: number;
  objectives: ObjectiveRow[];
}

interface ListResponse { strands: StrandRow[]; editable: boolean }

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

/** Returns the subject ids the user may see for a given class, or null for "all". */
function allowedSubjectIdsFor(cid: number | null, ctx: Ctx | null): number[] | null {
  if (!ctx || !cid) return null;
  const access = ctx.class_access.find((a) => a.class_id === cid);
  if (!access) return [];
  return access.subject_ids; // null => all
}

/** Filters the context subjects to the ones visible for the given class. */
function subjectsForClass(ctx: Ctx | null, cid: number | null): CtxSubject[] {
  if (!ctx) return [];
  const allowed = allowedSubjectIdsFor(cid, ctx);
  if (allowed === null) return ctx.subjects;
  return ctx.subjects.filter((s) => allowed.includes(s.id));
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function AssessmentObjectivesPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [ctxErr, setCtxErr] = useState("");

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [termId, setTermId] = useState<number | null>(null);

  const [strands, setStrands] = useState<StrandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editable, setEditable] = useState(false);
  const [err, setErr] = useState("");

  const [toast, setToast] = useState<Toast | null>(null);

  /* ---- Load context ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/admin/assessment-objectives/context`,
          { headers: authHeaders(), cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load");

        const c: Ctx = data.data;
        setCtx(c);

        if (c.current_academic_year && c.terms.length && c.classes.length) {
          const firstClass = c.classes[0];
          const visible = subjectsForClass(c, firstClass.id);

          setClassId(firstClass.id);
          if (visible.length) setSubjectId(visible[0].id);
          if (c.terms.length) setTermId(c.terms[0].id);
        }
      } catch (e: any) {
        setCtxErr(e?.message || "Could not load.");
      }
    })();
  }, []);

  /* ---- Subjects visible for the currently selected class ---- */
  const visibleSubjects = useMemo(
    () => subjectsForClass(ctx, classId),
    [ctx, classId]
  );

  /* ---- Class change handler: keep subject in sync ---- */
  function handleClassChange(newClassId: number) {
    setClassId(newClassId);
    const visible = subjectsForClass(ctx, newClassId);
    if (visible.length === 0) {
      setSubjectId(null);
      return;
    }
    if (!visible.some((s) => s.id === subjectId)) {
      setSubjectId(visible[0].id);
    }
  }

  /* ---- Load objectives when scope changes ---- */
  const load = useCallback(async () => {
    if (!subjectId || !classId || !termId || !ctx?.current_academic_year) {
      setStrands([]);
      setEditable(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        subject_id: String(subjectId),
        school_class_id: String(classId),
        term_id: String(termId),
        academic_year_id: String(ctx.current_academic_year.id),
      });
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      const payload = data.data as ListResponse;
      setStrands(payload.strands ?? []);
      setEditable(!!payload.editable);
    } catch (e: any) {
      setErr(e?.message || "Could not load objectives.");
      setStrands([]);
      setEditable(false);
    } finally {
      setLoading(false);
    }
  }, [subjectId, classId, termId, ctx]);

  useEffect(() => {
    load();
  }, [load]);

  const totalObjectives = useMemo(
    () => strands.reduce((n, s) => n + s.objectives.length, 0),
    [strands]
  );

  // Authoritative — comes from the list response, already scoped to
  // (subject, class) by the backend.
  const canEdit = editable;

  /* ============================================================
   * HANDLERS
   * ============================================================ */

  async function addStrand(name: string) {
    if (!subjectId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/strands`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ subject_id: subjectId, name }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setToast({ type: "success", message: "Strand added." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function renameStrand(id: number, name: string) {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/strands/${id}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ name }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function deleteStrand(id: number) {
    if (!confirm("Delete this strand? All objectives inside it will be removed.")) {
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/strands/${id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setToast({ type: "success", message: data?.message || "Strand removed." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function addObjective(strandId: number, name: string) {
    if (!subjectId || !classId || !termId || !ctx?.current_academic_year) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/assessment-objectives`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          strand_id: strandId,
          subject_id: subjectId,
          school_class_id: classId,
          term_id: termId,
          academic_year_id: ctx.current_academic_year.id,
          name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function updateObjective(id: number, name: string) {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/${id}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ name }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function deleteObjective(id: number, resultsCount: number) {
    const msg =
      resultsCount > 0
        ? `This objective already has ${resultsCount} student result(s). It cannot be deleted — it will be archived instead. Continue?`
        : "Delete this objective?";
    if (!confirm(msg)) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/${id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setToast({ type: "success", message: data?.message || "Deleted." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  async function moveObjective(
    strandId: number,
    objectiveId: number,
    dir: -1 | 1
  ) {
    const strand = strands.find((s) => s.id === strandId);
    if (!strand) return;
    const idx = strand.objectives.findIndex((o) => o.id === objectiveId);
    if (idx < 0) return;
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= strand.objectives.length) return;

    const reordered = [...strand.objectives];
    [reordered[idx], reordered[swapWith]] = [
      reordered[swapWith],
      reordered[idx],
    ];

    const payload = reordered.map((o, i) => ({
      id: o.id,
      strand_id: strandId,
      order: i,
    }));

    setStrands((prev) =>
      prev.map((s) =>
        s.id === strandId ? { ...s, objectives: reordered } : s
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/reorder`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ items: payload }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Reorder failed");
      }
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed to reorder." });
      await load();
    }
  }

  async function copyFromTerm(fromTermId: number) {
    if (!subjectId || !classId || !termId || !ctx?.current_academic_year) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/assessment-objectives/copy-from`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            subject_id: subjectId,
            school_class_id: classId,
            academic_year_id: ctx.current_academic_year.id,
            from_term_id: fromTermId,
            to_term_id: termId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setToast({
        type: "success",
        message: `Copied ${data.data.count} objectives.`,
      });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Failed." });
    }
  }

  /* ============================================================
   * RENDER GUARDS
   * ============================================================ */

  if (ctxErr) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-red-600">
          <AlertCircle size={20} /> {ctxErr}
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (!ctx.current_academic_year) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        No current academic year is active. Ask an administrator to activate one first.
      </div>
    );
  }

  if (ctx.terms.length === 0 || ctx.classes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        {ctx.terms.length === 0
          ? "No academic terms exist yet. Add terms under Administration → Terms first."
          : "No classes are available for your role."}
      </div>
    );
  }

  const currentTerm = ctx.terms.find((t) => t.id === termId);
  const currentClass = ctx.classes.find((c) => c.id === classId);
  const otherTerms = ctx.terms.filter((t) => t.id !== termId);

  const currentAccess = ctx.class_access.find((a) => a.class_id === classId);
  const isSubjectScoped =
    currentAccess?.scope === "subject" && (currentAccess.subject_ids?.length ?? 0) > 0;

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
          Assessment Objectives
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Define what gets assessed in each core subject this term. These
          objectives drive the marking sheet and appear on the student report.
        </p>
      </div>

      {/* Context bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Academic Year">
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
              {ctx.current_academic_year.name}
            </div>
          </Field>

          <Field label="Class">
            <Select
              value={classId ?? ""}
              onChange={(v) => handleClassChange(Number(v))}
              options={ctx.classes.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Field>

          <Field label="Subject">
            {visibleSubjects.length === 0 ? (
              <div className="flex h-11 items-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800">
                No subjects available in this class
              </div>
            ) : (
              <Select
                value={subjectId ?? ""}
                onChange={(v) => setSubjectId(v ? Number(v) : null)}
                options={visibleSubjects.map((s) => ({
                  value: s.id,
                  label: s.code ? `${s.name} (${s.code})` : s.name,
                }))}
              />
            )}
          </Field>

          <Field label="Term">
            <Select
              value={termId ?? ""}
              onChange={(v) => setTermId(v ? Number(v) : null)}
              options={ctx.terms.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <BookOpen size={14} />
            {totalObjectives} objective{totalObjectives === 1 ? "" : "s"} ·{" "}
            {strands.length} strand{strands.length === 1 ? "" : "s"}
          </div>

          {canEdit && totalObjectives === 0 && otherTerms.length > 0 && (
            <CopyMenu
              terms={otherTerms}
              onPick={(fromId) => copyFromTerm(fromId)}
            />
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p>
          Objectives are shared across <strong>all sections</strong> of{" "}
          <strong>{currentClass?.name ?? "this class"}</strong> for{" "}
          <strong>{currentTerm?.name ?? "this term"}</strong>.{" "}
          {isSubjectScoped ? (
            <>
              You are viewing <strong>only the subject(s) you are assigned
              to teach</strong> in this class.
            </>
          ) : (
            <>Any teacher assigned to a section of this class can edit them.</>
          )}
        </p>
      </div>

      {err && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{err}</p>
        </div>
      )}

      {loading && strands.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F58220]" />
            Loading objectives...
          </div>
        </div>
      )}

      {!loading && !subjectId && visibleSubjects.length === 0 && (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center">
          <BookOpen size={26} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-[#172033]">
            You are not assigned to teach any core subject in this class.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Contact the administration if this is unexpected.
          </p>
        </div>
      )}

      {!loading && subjectId && (
        <div className="space-y-4">
          {strands.map((strand) => (
            <StrandCard
              key={strand.id}
              strand={strand}
              editable={canEdit}
              onRename={(name) => renameStrand(strand.id, name)}
              onDelete={() => deleteStrand(strand.id)}
              onAddObjective={(name) => addObjective(strand.id, name)}
              onUpdateObjective={updateObjective}
              onDeleteObjective={deleteObjective}
              onMoveObjective={(objId, dir) =>
                moveObjective(strand.id, objId, dir)
              }
            />
          ))}

          {canEdit && <AddStrandCard onAdd={addStrand} />}

          {strands.length === 0 && !canEdit && (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center">
              <BookOpen size={26} className="text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-[#172033]">
                No objectives defined for this scope
              </p>
              <p className="mt-1 text-xs text-slate-500">
                You do not have permission to add objectives for this class and subject.
              </p>
            </div>
          )}

          {strands.length > 0 && !canEdit && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <Save size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <p>
                You can view these objectives but not edit them. Editing is
                reserved for teaching staff assigned to this class &amp;
                subject this year.
              </p>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: number | string;
  onChange: (v: string) => void;
  options: { value: number | string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
      >
        {options.length === 0 && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function CopyMenu({
  terms,
  onPick,
}: {
  terms: { id: number; name: string }[];
  onPick: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Copy size={15} /> Copy from...
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {terms.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setOpen(false);
                onPick(t.id);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              From {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StrandCard({
  strand,
  editable,
  onRename,
  onDelete,
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective,
  onMoveObjective,
}: {
  strand: StrandRow;
  editable: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddObjective: (name: string) => void;
  onUpdateObjective: (id: number, name: string) => void;
  onDeleteObjective: (id: number, resultsCount: number) => void;
  onMoveObjective: (objId: number, dir: -1 | 1) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(strand.name);
  const [newObjective, setNewObjective] = useState("");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BookOpen size={16} className="shrink-0 text-[#252B68]" />
          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                setRenaming(false);
                if (nameDraft.trim() && nameDraft !== strand.name) {
                  onRename(nameDraft.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setRenaming(false);
                  if (nameDraft.trim() && nameDraft !== strand.name) {
                    onRename(nameDraft.trim());
                  }
                }
                if (e.key === "Escape") {
                  setRenaming(false);
                  setNameDraft(strand.name);
                }
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm font-bold outline-none focus:border-[#252B68]"
            />
          ) : (
            <h3 className="truncate text-sm font-bold text-[#172033]">
              {strand.name}
            </h3>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {strand.objectives.length}
          </span>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <IconBtn onClick={() => setRenaming(true)} title="Rename strand">
              <Edit3 size={14} />
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete strand" tone="danger">
              <Trash2 size={14} />
            </IconBtn>
          </div>
        )}
      </div>

      {strand.objectives.length === 0 ? (
        <div className="px-5 py-5 text-sm text-slate-500">
          No objectives yet{editable ? " — add one below." : "."}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {strand.objectives.map((obj, idx) => (
            <ObjectiveRow
              key={obj.id}
              objective={obj}
              editable={editable}
              isFirst={idx === 0}
              isLast={idx === strand.objectives.length - 1}
              onUpdate={(name) => onUpdateObjective(obj.id, name)}
              onDelete={() => onDeleteObjective(obj.id, obj.results_count)}
              onMoveUp={() => onMoveObjective(obj.id, -1)}
              onMoveDown={() => onMoveObjective(obj.id, 1)}
            />
          ))}
        </div>
      )}

      {editable && (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <input
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            placeholder="Add objective (e.g. Fractions)..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newObjective.trim()) {
                onAddObjective(newObjective.trim());
                setNewObjective("");
              }
            }}
            className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68]"
          />
          <button
            onClick={() => {
              if (newObjective.trim()) {
                onAddObjective(newObjective.trim());
                setNewObjective("");
              }
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#252B68] px-3 text-xs font-semibold text-white hover:bg-[#1d2255]"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

function ObjectiveRow({
  objective,
  editable,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  objective: ObjectiveRow;
  editable: boolean;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (name: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(objective.name);

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex flex-col">
        <button
          onClick={onMoveUp}
          disabled={!editable || isFirst}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
          title="Move up"
        >
          <ArrowUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!editable || isLast}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
          title="Move down"
        >
          <ArrowDown size={13} />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft.trim() && draft !== objective.name) onUpdate(draft.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                if (draft.trim() && draft !== objective.name) {
                  onUpdate(draft.trim());
                }
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(objective.name);
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-[#252B68]"
          />
        ) : (
          <p className="truncate text-sm font-medium text-[#172033]">
            {objective.name}
          </p>
        )}
      </div>

      {objective.results_count > 0 && (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          {objective.results_count} result
          {objective.results_count === 1 ? "" : "s"}
        </span>
      )}

      {editable && (
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setEditing(true)} title="Edit objective">
            <Edit3 size={13} />
          </IconBtn>
          <IconBtn onClick={onDelete} title="Delete objective" tone="danger">
            <Trash2 size={13} />
          </IconBtn>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
        tone === "danger"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function AddStrandCard({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Add a new strand
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Number, Geometry & Statistics"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onAdd(name.trim());
              setName("");
            }
          }}
          className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim());
              setName("");
            }
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255]"
        >
          <Plus size={15} /> Add Strand
        </button>
      </div>
    </div>
  );
}

function ToastBox({
  type,
  message,
  onClose,
}: Toast & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-full max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        )}
        <p className="flex-1 text-sm">{message}</p>
        <button onClick={onClose} className="text-current/60 hover:text-current">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}