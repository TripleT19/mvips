"use client";

import {
  AlertCircle,
  Award,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";
const MAX_IMAGE_MB = 5;

/* =========================================================
   TYPES
========================================================= */

interface House {
  id: number;
  name: string;
  code: string | null;
  colour: string;
  image_url: string | null;
  featured_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  points: number;
}

interface YearOption {
  id: number;
  name: string;
  is_current: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

function authHeaders(json = true): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const h: Record<string, string> = { Accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = (hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.substr(0, 2), 16),
    g: parseInt(clean.substr(2, 2), 16),
    b: parseInt(clean.substr(4, 2), 16),
  };
}

function contrastText(hex: string, light = "#FFFFFF", dark = "#252B68"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return light;
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? dark : light;
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminHousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  const [localPoints, setLocalPoints] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);

  const [deleting, setDeleting] = useState<House | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [result, setResult] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  /* ------------------------------------------------------------------
     Load
  ------------------------------------------------------------------ */

  const load = async (yearId?: number | null, opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const url = yearId
        ? `${API_URL}/api/admin/houses?academic_year_id=${yearId}`
        : `${API_URL}/api/admin/houses`;

      const res = await fetch(url, {
        headers: authHeaders(false),
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to load houses.");

      const loadedHouses: House[] = Array.isArray(json?.data) ? json.data : [];
      const loadedYears: YearOption[] = Array.isArray(json?.years) ? json.years : [];
      const activeYearId: number | null = json?.academic_year_id ?? null;

      setHouses(loadedHouses);
      setYears(loadedYears);

      if (selectedYearId == null && activeYearId != null) {
        setSelectedYearId(activeYearId);
      }

      const nextPoints: Record<number, number> = {};
      loadedHouses.forEach((h) => {
        nextPoints[h.id] = h.points;
      });
      setLocalPoints(nextPoints);
    } catch (e: any) {
      setError(e?.message || "Unable to load houses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(null, { silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedYearId == null) return;
    load(selectedYearId, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId]);

  /* ------------------------------------------------------------------
     Live positions
  ------------------------------------------------------------------ */

  const positions = useMemo<Record<number, number>>(() => {
    const sorted = houses
      .map((h) => ({
        id: h.id,
        pts: localPoints[h.id] ?? h.points,
        sort_order: h.sort_order,
      }))
      .sort((a, b) => b.pts - a.pts || a.sort_order - b.sort_order);

    const map: Record<number, number> = {};
    let prev: number | null = null;
    let prevPos = 0;

    sorted.forEach((h, i) => {
      if (prev !== null && h.pts === prev) {
        map[h.id] = prevPos;
      } else {
        map[h.id] = i + 1;
        prevPos = i + 1;
        prev = h.pts;
      }
    });

    return map;
  }, [houses, localPoints]);

  const dirtyChanges = useMemo(
    () => houses.filter((h) => (localPoints[h.id] ?? h.points) !== h.points),
    [houses, localPoints]
  );

  /* ------------------------------------------------------------------
     Points edit
  ------------------------------------------------------------------ */

  function setHousePoints(id: number, value: number) {
    const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    setLocalPoints((prev) => ({ ...prev, [id]: safe }));
  }

  function adjustHousePoints(id: number, delta: number) {
    const current = localPoints[id] ?? houses.find((h) => h.id === id)?.points ?? 0;
    setHousePoints(id, current + delta);
  }

  async function saveAllPoints() {
    if (dirtyChanges.length === 0 || selectedYearId == null) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/admin/houses/bulk-points`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          academic_year_id: selectedYearId,
          points: dirtyChanges.map((h) => ({
            house_id: h.id,
            points: localPoints[h.id] ?? h.points,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to save points.");

      setResult({
        type: "success",
        title: "House points saved",
        message: `${dirtyChanges.length} house${dirtyChanges.length === 1 ? "" : "s"} updated.`,
      });

      await load(selectedYearId, { silent: true });
    } catch (e: any) {
      setError(e?.message || "Unable to save points.");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    const fresh: Record<number, number> = {};
    houses.forEach((h) => (fresh[h.id] = h.points));
    setLocalPoints(fresh);
  }

  /* ------------------------------------------------------------------
     Delete
  ------------------------------------------------------------------ */

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/houses/${deleting.id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to delete.");

      setResult({
        type: "success",
        title: "House deleted",
        message: `"${deleting.name}" was removed.`,
      });
      setDeleting(null);
      await load(selectedYearId, { silent: true });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Delete failed",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Mount View Admin
              </p>
              <h1 className="text-base font-black text-[#252B68]">
                House Points
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {years.length > 0 && (
              <select
                value={selectedYearId ?? ""}
                onChange={(e) => setSelectedYearId(Number(e.target.value))}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.is_current ? "(current)" : ""}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => load(selectedYearId, { silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-4 py-2 text-sm font-bold text-white hover:bg-[#1c2156]"
            >
              <Plus size={16} />
              New House
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {result && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold">{result.title}</p>
              <p className="mt-0.5 text-sm">{result.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-lg p-1 hover:bg-white/50"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading houses…
          </div>
        ) : houses.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Award size={22} />
            </div>
            <p className="mt-4 font-bold text-[#172033]">No houses yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first house to begin awarding points.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#df7014]"
            >
              <Plus size={17} />
              New House
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {houses.map((house) => {
              const points = localPoints[house.id] ?? house.points;
              const position = positions[house.id] ?? 0;
              const isDirty = points !== house.points;
              const isLeader =
                position === 1 &&
                houses.some((h) => (localPoints[h.id] ?? h.points) > 0);
              const textOnColour = contrastText(house.colour);

              return (
                <article
                  key={house.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition hover:shadow-lg ${
                    isLeader
                      ? "border-[#FFE900] shadow-lg ring-2 ring-[#FFE900]/30"
                      : isDirty
                      ? "border-[#F58220]"
                      : "border-slate-100"
                  }`}
                >
                  {/* Position badge */}
                  <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-md backdrop-blur">
                    {isLeader && <Trophy size={12} className="text-[#F58220]" />}
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#252B68]">
                      {ordinal(position)}
                    </span>
                  </div>

                  {/* Champion banner */}
                  {isLeader && (
                    <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-[#FFE900] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#252B68] shadow">
                      <Sparkles size={10} />
                      Champion
                    </div>
                  )}

                  {/* Logo image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {house.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={house.image_url}
                        alt={house.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ backgroundColor: house.colour + "22" }}
                      >
                        <span
                          className="text-4xl font-black"
                          style={{ color: house.colour }}
                        >
                          {(house.code || house.name).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {!house.is_active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Inactive
                        </span>
                      </div>
                    )}

                    {/* Featured-image indicator */}
                    {house.featured_image_url && (
                      <div
                        className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-1 rounded-full bg-[#252B68]/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FFE900] backdrop-blur"
                        title="Champion featured image uploaded"
                      >
                        <ImageIcon size={9} />
                        Featured
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(house);
                        setShowForm(true);
                      }}
                      className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-[#252B68] opacity-0 shadow-lg backdrop-blur transition hover:bg-white group-hover:opacity-100"
                      title="Edit house"
                    >
                      <Pencil size={14} />
                    </button>

                    {house.code && (
                      <span
                        className="absolute right-3 top-12 z-10 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow"
                        style={{
                          backgroundColor: house.colour,
                          color: textOnColour,
                        }}
                      >
                        {house.code}
                      </span>
                    )}
                  </div>

                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: house.colour }}
                  />

                  <div className="p-4">
                    <h3 className="truncate text-base font-black text-[#252B68]">
                      {house.name}
                    </h3>

                    <div className="mt-4">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Points
                      </label>

                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustHousePoints(house.id, -10)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                          aria-label="Decrease by 10"
                        >
                          <Minus size={14} />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={points}
                          onChange={(e) =>
                            setHousePoints(house.id, parseInt(e.target.value || "0", 10))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-base font-black text-[#252B68] outline-none focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20"
                        />

                        <button
                          type="button"
                          onClick={() => adjustHousePoints(house.id, 10)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#F58220] hover:bg-[#F58220] hover:text-white"
                          aria-label="Increase by 10"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {isDirty && (
                        <p className="mt-1.5 text-[10px] font-bold text-[#F58220]">
                          Was {house.points.toLocaleString()} · unsaved
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleting(house)}
                      className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-red-600"
                    >
                      <Trash2 size={11} />
                      Delete house
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {dirtyChanges.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-2xl lg:left-[260px]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F58220]/10 text-[#F58220]">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#172033]">
                  {dirtyChanges.length} house
                  {dirtyChanges.length === 1 ? "" : "s"} changed
                </p>
                <p className="text-[11px] text-slate-500">
                  Save to publish the new standings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discardChanges}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={saveAllPoints}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-5 py-2 text-sm font-bold text-white hover:bg-[#1c2156] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save points
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <HouseFormModal
          house={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (msg) => {
            setShowForm(false);
            setEditing(null);
            setResult({ type: "success", title: "Saved", message: msg });
            await load(selectedYearId, { silent: true });
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                Delete house?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Deleting{" "}
                <span className="font-semibold text-slate-700">
                  &ldquo;{deleting.name}&rdquo;
                </span>{" "}
                will remove it and all its points history. This cannot be
                undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   House Form Modal
========================================================= */

function HouseFormModal({
  house,
  onClose,
  onSaved,
}: {
  house: House | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const isEdit = Boolean(house);

  const [name, setName] = useState(house?.name ?? "");
  const [code, setCode] = useState(house?.code ?? "");
  const [colour, setColour] = useState(house?.colour ?? "#252B68");
  const [sortOrder, setSortOrder] = useState(house?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(house?.is_active ?? true);

  // Logo / badge
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(house?.image_url ?? "");
  const [removeImage, setRemoveImage] = useState(false);

  // Champion featured image
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string>(
    house?.featured_image_url ?? ""
  );
  const [removeFeatured, setRemoveFeatured] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const featuredInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    setRemoveImage(false);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!featuredFile) return;
    const url = URL.createObjectURL(featuredFile);
    setFeaturedPreview(url);
    setRemoveFeatured(false);
    return () => URL.revokeObjectURL(url);
  }, [featuredFile]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Logo must be a JPG, PNG or WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Logo must be smaller than ${MAX_IMAGE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setError("");
    setImageFile(file);
  }

  function handleFeaturedChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Featured image must be a JPG, PNG or WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Featured image must be smaller than ${MAX_IMAGE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setError("");
    setFeaturedFile(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function clearFeatured() {
    setFeaturedFile(null);
    setFeaturedPreview("");
    setRemoveFeatured(true);
    if (featuredInputRef.current) featuredInputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(colour)) {
      setError("Colour must be a valid hex value like #DC2626.");
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("code", code.trim());
      fd.append("colour", colour);
      fd.append("sort_order", String(sortOrder));
      fd.append("is_active", isActive ? "1" : "0");

      if (imageFile) fd.append("image", imageFile);
      if (removeImage && !imageFile) fd.append("remove_image", "1");

      if (featuredFile) fd.append("featured_image", featuredFile);
      if (removeFeatured && !featuredFile) fd.append("remove_featured_image", "1");

      const url = isEdit
        ? `${API_URL}/api/admin/houses/${house!.id}`
        : `${API_URL}/api/admin/houses`;

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to save.");

      await onSaved(isEdit ? "House updated." : "House created.");
    } catch (err: any) {
      setError(err?.message || "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              {isEdit ? "Edit house" : "New house"}
            </p>
            <h2 className="mt-1 text-lg font-black">
              {isEdit ? house?.name : "Add a house"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                House name *
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunbird House"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Code
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUN"
                maxLength={20}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sort order
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Colour
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
                <input
                  type="text"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                />
              </div>
            </label>
          </div>

          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
            />
            Active (visible on the public site)
          </label>

          {/* ---- Logo/badge ---- */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              House logo / badge
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">
              Shown as the small circular badge in the leaderboard and fallback for the champion showcase.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon size={26} />
                  </div>
                )}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                    aria-label="Remove logo"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#252B68] hover:bg-white">
                  <Upload size={18} />
                  {imageFile || (isEdit && house?.image_url)
                    ? "Replace logo"
                    : "Choose logo"}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG or WebP · max {MAX_IMAGE_MB} MB.
                </p>
              </div>
            </div>
          </section>

          {/* ---- Champion featured image ---- */}
          <section className="rounded-2xl border border-[#FFE900]/40 bg-[#FFE900]/10 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Trophy size={14} className="text-[#F58220]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#252B68]">
                Champion showcase image
              </h3>
            </div>
            <p className="mb-3 text-[11px] text-slate-600">
              The large image shown on the School Life page when this house is the <strong>current champion</strong>. If none is uploaded, the house logo is used instead.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:w-56">
                {featuredPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredPreview}
                    alt="Featured preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                    <Sparkles size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      No featured image
                    </span>
                  </div>
                )}
                {featuredPreview && (
                  <button
                    type="button"
                    onClick={clearFeatured}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                    aria-label="Remove featured image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#F58220]/40 bg-white px-5 py-4 text-sm font-semibold text-[#F58220] transition hover:border-[#F58220] hover:bg-[#F58220]/5">
                  <Upload size={18} />
                  {featuredFile || (isEdit && house?.featured_image_url)
                    ? "Replace featured image"
                    : "Choose featured image"}
                  <input
                    ref={featuredInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFeaturedChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Wide image · JPG, PNG or WebP · max {MAX_IMAGE_MB} MB.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isEdit ? "Save changes" : "Create house"}
          </button>
        </div>
      </form>
    </div>
  );
}