"use client";

import {
  AlertCircle, Camera, CheckCircle2, ChevronDown, ImageIcon, Loader2,
  Search, Trash2, Upload, User, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface SectionLite {
  id: number;
  name: string;
  school_class_name?: string;
  stream_name?: string;
  stream_colour?: string | null;
}

interface StudentRow {
  id: number;
  student_number: string;
  full_name: string;
  photo_url: string | null;
  has_photo: boolean;
}

type Toast = { type: "success" | "error"; msg: string };

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

function initialsOf(name: string): string {
  return (
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function StudentPhotosPage() {
  const [sections, setSections] = useState<SectionLite[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsErr, setSectionsErr] = useState("");

  const [sectionId, setSectionId] = useState<number | null>(null);

  const [roster, setRoster] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingStudentIdRef = useRef<number | null>(null);

  /* ---------- Load sections ---------- */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/student-photos/sections`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load sections");
        const list: SectionLite[] = data.data ?? [];
        setSections(list);
        if (list.length) setSectionId(list[0].id);
      } catch (e: any) {
        setSectionsErr(e?.message || "Could not load your sections.");
      } finally {
        setSectionsLoading(false);
      }
    })();
  }, []);

  /* ---------- Load roster ---------- */

  const loadRoster = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        class_stream_id: String(sectionId),
      });
      const res = await fetch(
        `${API_URL}/api/admin/student-photos/roster?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setRoster(data.data.students ?? []);
    } catch (e: any) {
      setErr(e?.message || "Could not load students.");
      setRoster([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  /* ---------- Upload ---------- */

  function pickFile(studentId: number) {
    pendingStudentIdRef.current = studentId;
    fileInputRef.current?.click();
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const studentId = pendingStudentIdRef.current;
    if (!file || !studentId || !sectionId) return;

    setUploadingId(studentId);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("class_stream_id", String(sectionId));

      const res = await fetch(
        `${API_URL}/api/admin/student-photos/${studentId}/photo`,
        {
          method: "POST",
          headers: authHeaders(), // no Content-Type — browser sets multipart boundary
          body: fd,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      // Append cache-busting so the browser shows the fresh file instantly
      const url = `${data.data.photo_url}?t=${Date.now()}`;
      setRoster((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, photo_url: url, has_photo: true } : s
        )
      );
      setToast({ type: "success", msg: "Photo updated." });
    } catch (err: any) {
      setToast({ type: "error", msg: err?.message || "Upload failed." });
    } finally {
      setUploadingId(null);
      pendingStudentIdRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ---------- Delete ---------- */

  async function removePhoto(studentId: number) {
    if (!sectionId) return;
    if (!confirm("Remove this photo? The student will show initials until you upload a new one.")) {
      return;
    }
    setDeletingId(studentId);
    try {
      const params = new URLSearchParams({
        class_stream_id: String(sectionId),
      });
      const res = await fetch(
        `${API_URL}/api/admin/student-photos/${studentId}/photo?${params.toString()}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setRoster((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, photo_url: null, has_photo: false } : s
        )
      );
      setToast({ type: "success", msg: "Photo removed." });
    } catch (err: any) {
      setToast({ type: "error", msg: err?.message || "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  }

  /* ---------- Derived ---------- */

  const currentSection = useMemo(
    () => sections.find((s) => s.id === sectionId) ?? null,
    [sections, sectionId]
  );

  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.trim().toLowerCase();
    return roster.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q)
    );
  }, [roster, search]);

  const withPhoto = roster.filter((s) => s.has_photo).length;

  /* ---------- Render guards ---------- */

  if (sectionsErr) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-red-600">
        <AlertCircle size={20} className="mr-2" /> {sectionsErr}
      </div>
    );
  }

  if (sectionsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        You are not assigned as a class teacher or teaching assistant to any
        section this academic year, so there are no photos you can manage.
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
          Student Photos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload or replace a student's photo. Photos are used across all
          terms and appear on report cards and assessment sheets.
        </p>
      </div>

      {/* Hidden shared file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChosen}
        className="hidden"
      />

      {/* Selector + summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              My Class Section
            </label>
            <div className="relative">
              <select
                value={sectionId ?? ""}
                onChange={(e) => setSectionId(Number(e.target.value))}
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
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#252B68]"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700">
              <Camera size={14} />
              {withPhoto} / {roster.length} photo
              {roster.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{err}</p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F58220]" />
            Loading students...
          </div>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center">
          <User size={32} className="text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-[#172033]">
            {roster.length === 0
              ? "No students in this section"
              : "No students match your search"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {roster.length === 0
              ? "Enrol students or move them into " +
                (currentSection?.name ?? "this section") +
                "."
              : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filteredRoster.map((s) => (
            <StudentPhotoCard
              key={s.id}
              student={s}
              uploading={uploadingId === s.id}
              deleting={deletingId === s.id}
              onPick={() => pickFile(s.id)}
              onRemove={() => removePhoto(s.id)}
            />
          ))}
        </div>
      )}

      {toast && <ToastBox {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */

function StudentPhotoCard({
  student,
  uploading,
  deleting,
  onPick,
  onRemove,
}: {
  student: StudentRow;
  uploading: boolean;
  deleting: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  const busy = uploading || deleting;

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <div className="relative aspect-square w-full bg-slate-100">
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={student.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-500">
              {initialsOf(student.full_name)}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              No photo
            </span>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}

        {/* Overlay actions */}
        {!busy && (
          <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={onPick}
              title={student.has_photo ? "Replace photo" : "Upload photo"}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white/90 text-[11px] font-bold text-slate-800 hover:bg-white"
            >
              <Upload size={13} />
              {student.has_photo ? "Replace" : "Upload"}
            </button>
            {student.has_photo && (
              <button
                onClick={onRemove}
                title="Remove photo"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white hover:bg-red-500"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-[#172033]">
          {student.full_name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {student.student_number}
        </p>
      </div>
    </div>
  );
}

function ToastBox({
  type,
  msg,
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
        <p className="flex-1 text-sm">{msg}</p>
        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}