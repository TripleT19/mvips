"use client";

import { useMemo, useState } from "react";

/* =========================================================
   Config
========================================================= */

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

/* =========================================================
   Types
========================================================= */

type Alumnus = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  year_left: number;
  location: string;
  current_role: string;
  organization: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  message_to_students: string | null;
  created_at: string;
};

/* =========================================================
   Helpers
========================================================= */

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;

  try {
    const parsed = new URL(url);
    const isPhotoLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isPhotoLocal) return url;

    try {
      const api = new URL(API_URL);
      const apiIsLocal =
        api.hostname === "localhost" || api.hostname === "127.0.0.1";
      if (!apiIsLocal) {
        parsed.protocol = api.protocol;
        parsed.host = api.host;
        return parsed.toString();
      }
    } catch {
      /* fall through */
    }

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const match = host.match(/^(.+)-\d+\.app\.github\.dev$/);
      if (match) {
        const backendPort = parsed.port || "8000";
        return `https://${match[1]}-${backendPort}.app.github.dev${parsed.pathname}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function accentFor(id: number) {
  const accents = [
    {
      glow: "from-[#F58220]/25 via-[#F58220]/5 to-transparent",
      chip: "bg-[#F58220] text-white",
      bar: "bg-[#F58220]",
    },
    {
      glow: "from-[#FFE900]/30 via-[#FFE900]/5 to-transparent",
      chip: "bg-[#FFE900] text-[#252B68]",
      bar: "bg-[#FFE900]",
    },
    {
      glow: "from-[#252B68]/25 via-[#252B68]/5 to-transparent",
      chip: "bg-[#252B68] text-white",
      bar: "bg-[#252B68]",
    },
    {
      glow: "from-emerald-400/25 via-emerald-400/5 to-transparent",
      chip: "bg-emerald-600 text-white",
      bar: "bg-emerald-600",
    },
  ];
  return accents[id % accents.length];
}

/* =========================================================
   Photo
========================================================= */

function AlumnusPhoto({
  photoUrl,
  name,
  className = "",
}: {
  photoUrl: string | null;
  name: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = getImageUrl(photoUrl);

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#252B68] via-[#3B4490] to-[#252B68] text-[#FFE900] ${className}`}
      >
        <span className="text-2xl font-black tracking-tight sm:text-3xl">
          {initialsOf(name)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

/* =========================================================
   Directory
========================================================= */

export default function AlumniDirectory({ alumni }: { alumni: Alumnus[] }) {
  const [search, setSearch] = useState("");
  const [decade, setDecade] = useState<"all" | number>("all");

  const decades = useMemo(() => {
    const set = new Set<number>();
    for (const a of alumni) {
      if (a.year_left) set.add(Math.floor(a.year_left / 10) * 10);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [alumni]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alumni
      .filter((a) => {
        if (
          decade !== "all" &&
          Math.floor(a.year_left / 10) * 10 !== decade
        ) {
          return false;
        }
        if (!q) return true;
        const haystack = [
          a.full_name,
          a.location,
          a.current_role,
          a.organization ?? "",
          a.bio ?? "",
          String(a.year_left),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.year_left - a.year_left);
  }, [alumni, search, decade]);

  /* ---------- Empty state ---------- */
  if (alumni.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE900] text-3xl">
          🌱
        </div>
        <h3 className="mt-6 text-2xl font-black text-[#252B68]">
          The directory is just getting started.
        </h3>
        <p className="mt-3 leading-7 text-slate-600">
          Be the first to join — submit your details above. Once approved by the
          school, your story will appear right here.
        </p>
        <a
          href="#submit"
          className="mt-7 inline-flex rounded-full bg-[#F58220] px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
        >
          Submit your details →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* ---------- Toolbar ---------- */}
      <div className="mb-8 rounded-2xl border border-slate-200/70 bg-white/70 p-3.5 shadow-sm backdrop-blur-md sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, place, role…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <DecadePill
              active={decade === "all"}
              onClick={() => setDecade("all")}
            >
              All years
            </DecadePill>
            {decades.map((d) => (
              <DecadePill
                key={d}
                active={decade === d}
                onClick={() => setDecade(d)}
              >
                {d}s
              </DecadePill>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-5 text-sm font-semibold text-slate-500">
        Showing <span className="text-[#252B68]">{filtered.length}</span> of{" "}
        {alumni.length} {alumni.length === 1 ? "alumnus" : "alumni"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No alumni match your filters. Try clearing the search or selecting a
          different decade.
        </div>
      ) : (
        /* 2 → 3 → 4 → 5 → 6 columns as space grows */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((person) => (
            <AlumniCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Decade pill
========================================================= */

function DecadePill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
        active
          ? "bg-[#252B68] text-white shadow-md"
          : "border border-slate-200 bg-white text-[#252B68] hover:-translate-y-0.5 hover:border-[#252B68]/40 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   Alumni card
========================================================= */

function AlumniCard({ person }: { person: Alumnus }) {
  const accent = accentFor(person.id);
  const hasContact = Boolean(
    person.email || person.phone || person.linkedin_url
  );

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_-10px_rgba(15,23,42,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_18px_36px_-16px_rgba(37,43,104,0.30)]">
      {/* ---------- Photo ---------- */}
      <div className="relative isolate">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accent.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        />

        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#252B68] via-[#3B4490] to-[#252B68]">
          <AlumnusPhoto
            photoUrl={person.photo_url}
            name={person.full_name}
            className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          {/* Bottom gradient — keeps name legible on any photo */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0B0F2E] via-[#0B0F2E]/55 to-transparent" />

          {/* Class badge */}
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] shadow-md ${accent.chip}`}
          >
            {person.year_left}
          </span>

          {/* Name + role overlay — NO truncate, wraps freely */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="break-words text-sm font-black leading-tight text-white drop-shadow-sm line-clamp-2 sm:text-[15px]">
              {person.full_name}
            </h3>
            <p className="mt-0.5 break-words text-[10px] font-black uppercase tracking-[0.10em] leading-tight text-[#FFE900] line-clamp-2">
              {person.current_role}
              {person.organization ? ` · ${person.organization}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 flex-col p-3">
        {/* Location */}
        <p className="flex items-start gap-1 text-[11px] font-semibold leading-snug text-slate-500">
          <span aria-hidden className="mt-px shrink-0">
            📍
          </span>
          <span className="break-words line-clamp-2">{person.location}</span>
        </p>

        {/* Bio */}
        {person.bio && (
          <p className="mt-2 break-words text-[11px] leading-relaxed text-slate-600 line-clamp-3">
            {person.bio}
          </p>
        )}

        {/* Message to students */}
        {person.message_to_students && (
          <figure className="relative mt-2 overflow-hidden rounded-lg bg-slate-50 px-2.5 py-2">
            <span
              aria-hidden
              className="absolute -left-0.5 -top-1.5 select-none text-2xl font-black leading-none text-[#FFE900] opacity-70"
            >
              &ldquo;
            </span>
            <blockquote className="break-words pl-3 text-[10px] italic leading-relaxed text-slate-700 line-clamp-3">
              {person.message_to_students}
            </blockquote>
          </figure>
        )}

        {/* Contact chips */}
        {hasContact && (
          <div className="mt-auto pt-3">
            <div className="flex flex-wrap gap-1.5">
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  aria-label="Email"
                  title={person.email}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 transition hover:border-[#252B68]/30 hover:bg-[#252B68] hover:text-white"
                >
                  <span aria-hidden>✉</span>
                  <span className="hidden sm:inline">Email</span>
                </a>
              )}
              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  aria-label="Call"
                  title={person.phone}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 transition hover:border-[#252B68]/30 hover:bg-[#252B68] hover:text-white"
                >
                  <span aria-hidden>☎</span>
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              {person.linkedin_url && (
                <a
                  href={person.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 transition hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
                >
                  <span aria-hidden>in</span>
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}