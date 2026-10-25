"use client";

import {
  AlertCircle, AlertTriangle, Building2, CheckCircle2, ChevronDown,
  FileText, Landmark, Loader2, Pencil, Plus, Receipt, Search, Trash2,
  TrendingUp, Wallet, X, XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface Year { id: number; name: string }
interface Term { id: number; name: string }
interface SchoolClass { id: number; name: string }

interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  branch: string | null;
  currency: string;
  is_default: boolean;
  is_active: boolean;
}

interface FeeItem { name: string; amount: number; sort_order?: number }

interface FeeStructure {
  id: number;
  name: string;
  amount_per_term: string | number;
  term_amounts: Record<string, number> | null;
  version: number;
  is_active: boolean;
  effective_from: string | null;
  allows_installments: boolean;
  max_installments: number | null;
  academic_year_id: number;
  school_class_id: number;
  academicYear?: { id: number; name: string } | null;
  schoolClass?: { id: number; name: string } | null;
  items: FeeItem[];
}

interface StudentLite {
  id: number;
  first_name: string;
  middle_name?: string | null;
  surname: string;
  student_number: string;
}

interface FeeInvoice {
  id: number;
  total_amount: string;
  amount_paid: string;
  status: "pending" | "partial" | "paid";
  due_date: string | null;
  student?: StudentLite;
  feeStructure?: { id: number; name: string; school_class_id?: number } | null;
  term?: { id: number; name: string } | null;
  payments?: FeePayment[];
}

interface FeePayment {
  id: number;
  amount: string;
  payment_method: string;
  reference: string | null;
  installment_number: number;
  paid_on: string;
  notes: string | null;
  student?: StudentLite;
  bankAccount?: { id: number; name: string; bank_name: string };
  receivedBy?: { id: number; name: string };
}

interface Dashboard {
  billed: number;
  collected: number;
  outstanding: number;
  collection_rate: number;
  invoices: { total: number; paid: number; partial: number; pending: number };
  recent_payments: FeePayment[];
  top_outstanding: {
    invoice_id: number;
    student_name: string;
    student_number: string;
    structure?: string | null;
    total: number;
    paid: number;
    balance: number;
    status: string;
  }[];
}

type Tab = "dashboard" | "structures" | "invoices" | "payments" | "banks";
type Toast = { type: "success" | "error"; msg: string };

interface ConfirmOptions {
  title: string;
  message: string;
  tone?: "danger" | "default";
  confirmLabel?: string;
}

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

/** Formats an ISO date/time string into "23 Oct 2026". */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats an ISO date/time string into "23 Oct 2026, 14:32". */
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fullName(
  s?: { first_name: string; middle_name?: string | null; surname: string } | null
): string {
  if (!s) return "—";
  return [s.first_name, s.middle_name, s.surname].filter(Boolean).join(" ");
}

/** "Cash", "Bank Transfer", "Mobile Money", "Cheque" */
function prettyMethod(m: string): string {
  return m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ============================================================
 * CONFIRM HOOK + DIALOG
 * ============================================================ */

function useConfirm() {
  const [state, setState] = useState<
    | (ConfirmOptions & { resolve: (ok: boolean) => void })
    | null
  >(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      title={state.title}
      message={state.message}
      tone={state.tone ?? "default"}
      confirmLabel={state.confirmLabel ?? "Confirm"}
      onCancel={() => { state.resolve(false); setState(null); }}
      onConfirm={() => { state.resolve(true); setState(null); }}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialog({
  title,
  message,
  tone,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  tone: "danger" | "default";
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              tone === "danger" ? "bg-red-50" : "bg-amber-50"
            }`}
          >
            <AlertTriangle
              size={22}
              className={tone === "danger" ? "text-red-600" : "text-amber-600"}
            />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onCancel}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#252B68] hover:bg-[#1d2255]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function FeesPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [years, setYears] = useState<Year[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupsErr, setLookupsErr] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    (async () => {
      setLookupsLoading(true);
      try {
        const [yRes, cRes, tRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/academic-years`, { headers: authHeaders(), cache: "no-store" }),
          fetch(`${API_URL}/api/admin/school-classes`, { headers: authHeaders(), cache: "no-store" }),
          fetch(`${API_URL}/api/admin/academic-terms`, { headers: authHeaders(), cache: "no-store" }),
        ]);

        const [yJson, cJson, tJson] = await Promise.all([yRes.json(), cRes.json(), tRes.json()]);

        if (!yRes.ok) throw new Error(yJson?.message || "Could not load academic years.");
        if (!cRes.ok) throw new Error(cJson?.message || "Could not load classes.");
        if (!tRes.ok) throw new Error(tJson?.message || "Could not load terms.");

        setYears(Array.isArray(yJson.data) ? yJson.data : []);
        setClasses(Array.isArray(cJson.data) ? cJson.data.map((c: any) => ({ id: c.id, name: c.name })) : []);
        setTerms(Array.isArray(tJson.data) ? tJson.data : []);
      } catch (e: any) {
        setLookupsErr(e?.message || "Could not load academic data.");
      } finally {
        setLookupsLoading(false);
      }
    })();
  }, []);

  if (lookupsErr) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-600">
        <AlertCircle size={20} className="mr-2" /> {lookupsErr}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">School Fees</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set fees once per class per year. Invoices are generated term-by-term.
          Changing fees creates a new version — past invoices stay untouched.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "dashboard"}  onClick={() => setTab("dashboard")}  icon={<TrendingUp size={16} />}>Dashboard</TabButton>
        <TabButton active={tab === "structures"} onClick={() => setTab("structures")} icon={<FileText size={16} />}>Fee Structures</TabButton>
        <TabButton active={tab === "invoices"}   onClick={() => setTab("invoices")}   icon={<Receipt size={16} />}>Invoices</TabButton>
        <TabButton active={tab === "payments"}   onClick={() => setTab("payments")}   icon={<Wallet size={16} />}>Payments</TabButton>
        <TabButton active={tab === "banks"}      onClick={() => setTab("banks")}      icon={<Landmark size={16} />}>Bank Accounts</TabButton>
      </div>

      {tab === "dashboard" && <DashboardTab onToast={setToast} />}
      {tab === "structures" && (
        <StructuresTab years={years} terms={terms} classes={classes} loading={lookupsLoading} onToast={setToast} />
      )}
      {tab === "invoices" && (
        <InvoicesTab years={years} terms={terms} classes={classes} loading={lookupsLoading} onToast={setToast} />
      )}
      {tab === "payments" && <PaymentsTab onToast={setToast} />}
      {tab === "banks" && <BanksTab onToast={setToast} />}

      {toast && <ToastBox {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ============================================================
 * TAB 1 — DASHBOARD
 * ============================================================ */

function DashboardTab({ onToast }: { onToast: (t: Toast) => void }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/fees/dashboard`, { headers: authHeaders(), cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed");
        setData(json.data);
      } catch (e: any) {
        onToast({ type: "error", msg: e?.message || "Failed." });
      } finally { setLoading(false); }
    })();
  }, [onToast]);

  if (loading) return <Loading />;
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Billed" value={`MWK ${money(data.billed)}`} accent="text-[#252B68]" bg="bg-[#252B68]/10" icon={<FileText size={18} />} />
        <KpiCard label="Collected" value={`MWK ${money(data.collected)}`} accent="text-emerald-600" bg="bg-emerald-50" icon={<CheckCircle2 size={18} />} />
        <KpiCard label="Outstanding" value={`MWK ${money(data.outstanding)}`} accent="text-red-600" bg="bg-red-50" icon={<XCircle size={18} />} />
        <KpiCard label="Collection Rate" value={`${data.collection_rate}%`} accent="text-[#F58220]" bg="bg-[#F58220]/10" icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MiniStat label="Total Invoices" value={data.invoices.total} />
        <MiniStat label="Paid" value={data.invoices.paid} tone="text-emerald-700" />
        <MiniStat label="Partial" value={data.invoices.partial} tone="text-amber-700" />
        <MiniStat label="Pending" value={data.invoices.pending} tone="text-red-700" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-[#172033]">Recent Payments</h3>
          </div>
          {data.recent_payments.length === 0 ? (
            <Empty text="No payments yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#172033]">{fullName(p.student)}</p>
                    <p className="text-[11px] text-slate-500">
                      {fmtDate(p.paid_on)} · {prettyMethod(p.payment_method)} · #{p.installment_number}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-700">MWK {money(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-[#172033]">Top Outstanding</h3>
          </div>
          {data.top_outstanding.length === 0 ? (
            <Empty text="No outstanding balances." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.top_outstanding.map((o) => (
                <div key={o.invoice_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#172033]">{o.student_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {o.student_number}
                      {o.structure ? ` · ${o.structure}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">MWK {money(o.balance)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * TAB 2 — FEE STRUCTURES
 * ============================================================ */

function StructuresTab({
  years, terms, classes, loading: externalLoading, onToast,
}: {
  years: Year[]; terms: Term[]; classes: SchoolClass[];
  loading: boolean;
  onToast: (t: Toast) => void;
}) {
  const [rows, setRows] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees/structures`, {
        headers: authHeaders(), cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setRows(json.data ?? []);
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setLoading(false); }
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  const activeRows = useMemo(() => rows.filter((r) => r.is_active), [rows]);

  async function deactivate(id: number) {
    const ok = await confirm({
      title: "Deactivate this fee structure?",
      message:
        "Students in this class will not be invoiced until you set fees again. Past invoices remain unchanged.",
      tone: "danger",
      confirmLabel: "Deactivate",
    });
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/fees/structures/${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({ type: "success", msg: "Fee structure deactivated." });
      load();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    }
  }

  if (externalLoading || loading) return <Loading />;

  if (years.length === 0 || classes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        Please add at least one academic year and one class before setting fees.
      </div>
    );
  }

  return (
    <>
      {dialog}

      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255]"
        >
          <Plus size={15} /> Set Fees for a Class
        </button>
      </div>

      {activeRows.length === 0 ? (
        <Empty text="No active fee structures yet. Set the first one." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeRows.map((s) => {
            const className =
              s.schoolClass?.name ??
              classes.find((c) => c.id === s.school_class_id)?.name ??
              `Class #${s.school_class_id}`;
            const yearName =
              s.academicYear?.name ??
              years.find((y) => y.id === s.academic_year_id)?.name ??
              `Year #${s.academic_year_id}`;

            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#172033]">{className}</p>
                    <p className="text-[11px] text-slate-500">{yearName} · v{s.version}</p>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Active
                  </span>
                </div>

                <p className="mt-3 text-2xl font-black text-[#252B68]">
                  MWK {money(s.amount_per_term)}
                  <span className="text-xs font-semibold text-slate-400"> / term</span>
                </p>

                <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
                  {(s.items ?? []).map((it, i) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>{it.name}</span>
                      <span className="font-semibold">{money(it.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setEditing(s)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={12} /> Change fee
                  </button>
                  <button
                    onClick={() => deactivate(s.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Deactivate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <FeeStructureModal
          years={years}
          terms={terms}
          classes={classes}
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
          onToast={onToast}
        />
      )}
    </>
  );
}

function FeeStructureModal({
  years, terms, classes, existing, onClose, onSaved, onToast,
}: {
  years: Year[]; terms: Term[]; classes: SchoolClass[];
  existing: FeeStructure | null;
  onClose: () => void; onSaved: () => void;
  onToast: (t: Toast) => void;
}) {
  const isEdit = !!existing;
  const [yearId, setYearId] = useState<number | "">(existing?.academic_year_id ?? years[0]?.id ?? "");
  const [classId, setClassId] = useState<number | "">(existing?.school_class_id ?? classes[0]?.id ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount_per_term) : "");
  const [termOverrides, setTermOverrides] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    if (existing?.term_amounts) {
      Object.entries(existing.term_amounts).forEach(([k, v]) => { m[Number(k)] = String(v); });
    }
    return m;
  });
  const [installmentsAllowed, setInstallmentsAllowed] = useState(existing?.allows_installments ?? true);
  const [maxInstallments, setMaxInstallments] = useState<number | "">(existing?.max_installments ?? "");
  const [items, setItems] = useState<{ name: string; amount: string }[]>(
    existing && existing.items.length > 0
      ? existing.items.map((i) => ({ name: i.name, amount: String(i.amount) }))
      : [{ name: "Tuition", amount: "" }]
  );
  const [saving, setSaving] = useState(false);

  const itemsTotal = items.reduce((n, i) => n + (parseFloat(i.amount) || 0), 0);

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        academic_year_id: yearId,
        school_class_id: classId,
        name: name || "Fees",
        amount_per_term: parseFloat(amount) || itemsTotal,
        term_amounts: Object.fromEntries(
          Object.entries(termOverrides)
            .filter(([, v]) => v !== "")
            .map(([k, v]) => [k, parseFloat(v)])
        ),
        allows_installments: installmentsAllowed,
        max_installments: maxInstallments === "" ? null : Number(maxInstallments),
        items: items
          .filter((i) => i.name.trim() && i.amount !== "")
          .map((i, idx) => ({ name: i.name.trim(), amount: parseFloat(i.amount), sort_order: idx })),
      };

      const url = isEdit
        ? `${API_URL}/api/admin/fees/structures/${existing.id}`
        : `${API_URL}/api/admin/fees/structures`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({
        type: "success",
        msg: isEdit
          ? "Fee updated. A new version was created — past invoices unchanged."
          : "Fee structure created.",
      });
      onSaved();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? "Change Fee" : "Set Fees for a Class"}>
      <div className="space-y-3">
        {isEdit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Saving will retire the current version and create a new one. Past invoices
            keep their original amount.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Academic Year">
            <select value={yearId} onChange={(e) => setYearId(Number(e.target.value))} disabled={isEdit}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68] disabled:bg-slate-100">
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </Field>
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(Number(e.target.value))} disabled={isEdit}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68] disabled:bg-slate-100">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Display Name (optional)">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 5 Annual Fees"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Fee Items</p>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item.name}
                  onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                  placeholder="Item (e.g. Tuition)"
                  className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
                <input type="number" value={item.amount}
                  onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, amount: e.target.value } : it))}
                  placeholder="Amount"
                  className="h-10 w-32 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm outline-none focus:border-[#252B68]" />
                <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => setItems([...items, { name: "", amount: "" }])}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <Plus size={13} /> Add Item
            </button>
          </div>
        </div>

        <Field label="Amount per Term">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={itemsTotal ? `Items total: ${money(itemsTotal)}` : "e.g. 50000"}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>

        {terms.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              Per-term override (optional — blank uses default above)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {terms.map((t) => (
                <div key={t.id}>
                  <label className="mb-1 block text-[10px] font-semibold text-slate-500">{t.name}</label>
                  <input type="number" value={termOverrides[t.id] ?? ""}
                    onChange={(e) => setTermOverrides({ ...termOverrides, [t.id]: e.target.value })}
                    placeholder="—"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={installmentsAllowed}
              onChange={(e) => setInstallmentsAllowed(e.target.checked)} />
            Allow installments
          </label>
          {installmentsAllowed && (
            <Field label="Max installments (blank = unlimited)">
              <input type="number" min={1} max={12} value={maxInstallments}
                onChange={(e) => setMaxInstallments(e.target.value === "" ? "" : Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
            </Field>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Items Total</span>
          <span className="text-base font-black text-[#252B68]">MWK {money(itemsTotal)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Saving..." : isEdit ? "Save New Version" : "Create"}
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================
 * TAB 3 — INVOICES
 * ============================================================ */

function InvoicesTab({
  years, terms, classes, loading: externalLoading, onToast,
}: {
  years: Year[]; terms: Term[]; classes: SchoolClass[];
  loading: boolean;
  onToast: (t: Toast) => void;
}) {
  const [yearId, setYearId] = useState<number | "">(years[0]?.id ?? "");
  const [termId, setTermId] = useState<number | "">(terms[0]?.id ?? "");
  const [classFilter, setClassFilter] = useState<number | "">("");

  const [rows, setRows] = useState<FeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    if (years.length && yearId === "") setYearId(years[0].id);
    if (terms.length && termId === "") setTermId(terms[0].id);
  }, [years, terms, yearId, termId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearId !== "") params.set("academic_year_id", String(yearId));
      if (termId !== "") params.set("term_id", String(termId));
      if (classFilter !== "") params.set("school_class_id", String(classFilter));
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`${API_URL}/api/admin/fees/invoices?${params.toString()}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setRows(json.data ?? []);
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setLoading(false); }
  }, [yearId, termId, classFilter, status, search, onToast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  if (externalLoading) return <Loading />;

  if (years.length === 0 || terms.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        Please add at least one academic year and one term before generating invoices.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Field label="Academic Year">
          <select value={yearId} onChange={(e) => setYearId(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </Field>

        <Field label="Term">
          <select value={termId} onChange={(e) => setTermId(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>

        <Field label="Class (optional)">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <div className="relative min-w-[160px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#252B68]" />
        </div>

        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </Field>

        <button onClick={() => setGenerating(true)}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255]">
          <Plus size={15} /> Generate Invoices
        </button>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? (
        <Empty text="No invoices found for this filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Structure / Term</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((inv) => {
                const balance = Number(inv.total_amount) - Number(inv.amount_paid);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#172033]">{fullName(inv.student)}</p>
                      <p className="text-[11px] text-slate-500">
                        {inv.student?.student_number ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <p>{inv.feeStructure?.name ?? "Fee"}</p>
                      <p className="text-[11px] text-slate-400">{inv.term?.name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#172033]">{money(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-700">{money(inv.amount_paid)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-600">{money(balance)}</td>
                    <td className="px-4 py-3 text-center"><StatusPill status={inv.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setViewing(inv.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {generating && (
        <GenerateInvoicesModal
          years={years} terms={terms} classes={classes}
          defaultYearId={yearId} defaultTermId={termId}
          onClose={() => setGenerating(false)}
          onSaved={() => { setGenerating(false); load(); }}
          onToast={onToast}
        />
      )}

      {viewing !== null && (
        <InvoiceDetailModal
          invoiceId={viewing}
          onClose={() => setViewing(null)}
          onUpdated={load}
          onToast={onToast}
        />
      )}
    </>
  );
}

function GenerateInvoicesModal({
  years, terms, classes, defaultYearId, defaultTermId, onClose, onSaved, onToast,
}: {
  years: Year[]; terms: Term[]; classes: SchoolClass[];
  defaultYearId: number | ""; defaultTermId: number | "";
  onClose: () => void; onSaved: () => void;
  onToast: (t: Toast) => void;
}) {
  const [yearId, setYearId] = useState<number | "">(defaultYearId || years[0]?.id || "");
  const [termId, setTermId] = useState<number | "">(defaultTermId || terms[0]?.id || "");
  const [classId, setClassId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (yearId === "" || termId === "") return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees/invoices/generate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          academic_year_id: yearId,
          term_id: termId,
          school_class_id: classId === "" ? null : classId,
          due_date: dueDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({ type: "success", msg: json.message });
      onSaved();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} title="Generate Term Invoices">
      <p className="text-sm text-slate-600">
        Generates one invoice per active student per class, using each class&apos;s
        current active fee structure. Students who already have an invoice for this
        term are skipped.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Academic Year">
          <select value={yearId} onChange={(e) => setYearId(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </Field>
        <Field label="Term">
          <select value={termId} onChange={(e) => setTermId(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Class (blank = all classes)">
          <select value={classId} onChange={(e) => setClassId(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Due Date (optional)">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Generating..." : "Generate"}
        </button>
      </div>
    </Modal>
  );
}

function InvoiceDetailModal({
  invoiceId, onClose, onUpdated, onToast,
}: {
  invoiceId: number; onClose: () => void;
  onUpdated: () => void; onToast: (t: Toast) => void;
}) {
  const [invoice, setInvoice] = useState<FeeInvoice | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const [invRes, bankRes] = await Promise.all([
      fetch(`${API_URL}/api/admin/fees/invoices/${invoiceId}`, { headers: authHeaders(), cache: "no-store" }),
      fetch(`${API_URL}/api/admin/fees/bank-accounts`, { headers: authHeaders(), cache: "no-store" }),
    ]);
    const invJson = await invRes.json();
    const bankJson = await bankRes.json();
    if (invRes.ok) setInvoice(invJson.data);
    if (bankRes.ok) setBanks((bankJson.data ?? []).filter((b: BankAccount) => b.is_active));
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);

  if (!invoice) return <Modal onClose={onClose} title="Invoice"><Loading /></Modal>;

  const balance = Number(invoice.total_amount) - Number(invoice.amount_paid);

  return (
    <Modal onClose={onClose} title={`Invoice · ${fullName(invoice.student)}`}>
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Total" value={money(invoice.total_amount)} />
        <MiniStat label="Paid" value={money(invoice.amount_paid)} tone="text-emerald-700" />
        <MiniStat label="Balance" value={money(balance)} tone="text-red-600" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <StatusPill status={invoice.status} />
        {invoice.due_date && (
          <span className="text-xs text-slate-500">Due {fmtDate(invoice.due_date)}</span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payments</h4>
          {balance > 0 && invoice.status !== "paid" && (
            <button onClick={() => setPaying(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#252B68] px-3 text-xs font-semibold text-white hover:bg-[#1d2255]">
              <Plus size={12} /> Record Payment
            </button>
          )}
        </div>

        {!invoice.payments || invoice.payments.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">No payments yet.</p>
        ) : (
          <div className="space-y-1.5">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#172033]">
                    Installment #{p.installment_number} · {prettyMethod(p.payment_method)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fmtDate(p.paid_on)}
                    {p.reference ? ` · Ref ${p.reference}` : ""}
                    {p.bankAccount ? ` · ${p.bankAccount.name}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-700">MWK {money(p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {paying && (
        <PaymentForm
          invoiceId={invoice.id}
          balance={balance}
          banks={banks}
          onClose={() => setPaying(false)}
          onSaved={() => { setPaying(false); load(); onUpdated(); }}
          onToast={onToast}
        />
      )}
    </Modal>
  );
}

/* ============================================================
 * TAB 4 — PAYMENTS
 * ============================================================ */

function PaymentsTab({ onToast }: { onToast: (t: Toast) => void }) {
  const [rows, setRows] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`${API_URL}/api/admin/fees/payments?${params.toString()}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setRows(json.data ?? []);
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setLoading(false); }
  }, [from, to, onToast]);

  useEffect(() => { load(); }, [load]);

  async function reversePayment(payment: FeePayment) {
    const ok = await confirm({
      title: "Reverse this payment?",
      message:
        `MWK ${money(payment.amount)} will be removed from this invoice. The invoice balance will be recalculated automatically.`,
      tone: "danger",
      confirmLabel: "Reverse",
    });
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/fees/payments/${payment.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({ type: "success", msg: "Payment reversed." });
      load();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    }
  }

  return (
    <>
      {dialog}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Field label="From">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
        <Field label="To">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
        <div className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
          <Wallet size={14} /> {rows.length} payment{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? (
        <Empty text="No payments recorded." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-center">Installment</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(p.paid_on)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#172033]">{fullName(p.student)}</p>
                    <p className="text-[11px] text-slate-500">
                      {p.student?.student_number ?? "—"}
                      {p.reference ? ` · Ref ${p.reference}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{prettyMethod(p.payment_method)}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">#{p.installment_number}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">MWK {money(p.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => reversePayment(p)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      <Trash2 size={12} /> Reverse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ============================================================
 * TAB 5 — BANK ACCOUNTS
 * ============================================================ */

function BanksTab({ onToast }: { onToast: (t: Toast) => void }) {
  const [rows, setRows] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees/bank-accounts`, { headers: authHeaders(), cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setRows(json.data ?? []);
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setLoading(false); }
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  async function deactivate(account: BankAccount) {
    const ok = await confirm({
      title: "Deactivate this account?",
      message: `${account.name} (${account.bank_name}) will no longer appear in payment forms. You can re-add it later.`,
      tone: "danger",
      confirmLabel: "Deactivate",
    });
    if (!ok) return;

    const res = await fetch(`${API_URL}/api/admin/fees/bank-accounts/${account.id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    if (res.ok) {
      onToast({ type: "success", msg: "Account deactivated." });
      load();
    }
  }

  return (
    <>
      {dialog}

      <div className="flex justify-end">
        <button onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255]">
          <Plus size={15} /> New Bank Account
        </button>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? <Empty text="No bank accounts set up yet." /> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b) => (
            <div key={b.id} className={`rounded-2xl border p-4 shadow-sm ${b.is_default ? "border-[#252B68] bg-[#252B68]/5" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252B68]/10 text-[#252B68]">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#172033]">{b.name}</p>
                    <p className="text-[11px] text-slate-500">{b.bank_name}</p>
                  </div>
                </div>
                {b.is_default && (
                  <span className="rounded-md bg-[#252B68] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Default</span>
                )}
              </div>
              <div className="mt-3 space-y-0.5 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-500">Account:</span> {b.account_number}</p>
                {b.branch && <p><span className="font-semibold text-slate-500">Branch:</span> {b.branch}</p>}
                <p><span className="font-semibold text-slate-500">Currency:</span> {b.currency}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {!b.is_default && (
                  <button
                    onClick={async () => {
                      const res = await fetch(`${API_URL}/api/admin/fees/bank-accounts/${b.id}/default`, {
                        method: "POST", headers: authHeaders(),
                      });
                      if (res.ok) { onToast({ type: "success", msg: "Default updated." }); load(); }
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >Set Default</button>
                )}
                <button onClick={() => deactivate(b)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50">
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateBankModal onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }} onToast={onToast} />
      )}
    </>
  );
}

function CreateBankModal({
  onClose, onSaved, onToast,
}: {
  onClose: () => void; onSaved: () => void; onToast: (t: Toast) => void;
}) {
  const [form, setForm] = useState({
    name: "", bank_name: "", account_number: "", branch: "",
    swift_code: "", currency: "MWK", is_default: false,
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees/bank-accounts`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({ type: "success", msg: "Account added." });
      onSaved();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} title="New Bank Account">
      <div className="space-y-2.5">
        <Field label="Account Name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Fees Account"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Bank Name">
            <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
          </Field>
          <Field label="Account Number">
            <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Branch">
            <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
          </Field>
          <Field label="Currency">
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={8}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
          Set as default account
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================
 * PAYMENT FORM
 * ============================================================ */

function PaymentForm({
  invoiceId, balance, banks, onClose, onSaved, onToast,
}: {
  invoiceId: number; balance: number; banks: BankAccount[];
  onClose: () => void; onSaved: () => void;
  onToast: (t: Toast) => void;
}) {
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [bankId, setBankId] = useState<number | "">(
    banks.find((b) => b.is_default)?.id ?? banks[0]?.id ?? ""
  );
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/fees/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: method,
          reference: reference || null,
          school_bank_account_id: bankId === "" ? null : bankId,
          paid_on: paidOn,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      onToast({ type: "success", msg: "Payment recorded." });
      onSaved();
    } catch (e: any) {
      onToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} title="Record Payment">
      <div className="space-y-2.5">
        <Field label="Amount">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={balance}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
        <p className="-mt-2 text-[11px] text-slate-500">Balance: MWK {money(balance)}</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Method">
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </Field>
          <Field label="Paid On">
            <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
          </Field>
        </div>
        {method !== "cash" && banks.length > 0 && (
          <Field label="Bank Account">
            <select value={bankId} onChange={(e) => setBankId(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]">
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.bank_name})</option>)}
            </select>
          </Field>
        )}
        <Field label="Reference (receipt/transaction)">
          <input value={reference} onChange={(e) => setReference(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]" />
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#252B68]" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-4 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Recording..." : "Record"}
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================
 * SHARED
 * ============================================================ */

function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-[#252B68] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
      }`}>
      {icon} {children}
    </button>
  );
}

function KpiCard({ label, value, accent, bg, icon }: {
  label: string; value: string; accent: string; bg: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className={`mt-2 text-xl font-black ${accent}`}>{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "text-[#172033]" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-base font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid" ? "bg-emerald-100 text-emerald-700"
    : status === "partial" ? "bg-amber-100 text-amber-700"
    : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <Loader2 size={20} className="animate-spin text-[#F58220]" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center">
      <AlertCircle size={26} className="text-slate-300" />
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[180] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-bold text-[#172033]">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ToastBox({ type, msg, onClose }: Toast & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-full max-w-sm">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
      }`}>
        {type === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
        <p className="flex-1 text-sm">{msg}</p>
        <button onClick={onClose}><X size={16} /></button>
      </div>
    </div>
  );
}