import Link from "next/link";
import AlumniForm from "./AlumniForm";
import AlumniDirectory from "./AlumniDirectory";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

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

function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(p.data)) return p.data as T[];
  for (const key of ["alumni", "alumnus", "items", "results"]) {
    const v = p[key];
    if (Array.isArray(v)) return v as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

async function getAlumni(): Promise<Alumnus[]> {
  try {
    const res = await fetch(`${API_URL}/api/alumni`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[alumni] GET /api/alumni → ${res.status}`);
      return [];
    }
    return extractArray<Alumnus>(await res.json());
  } catch (err) {
    console.error(`[alumni] GET /api/alumni failed:`, err);
    return [];
  }
}

export const revalidate = 60;

export default async function AlumniPage() {
  const alumni = await getAlumni();
  const total = alumni.length;
  const years = alumni.map((a) => Number(a.year_left)).filter(Boolean);
  const oldestYear = years.length ? Math.min(...years) : null;
  const newestYear = years.length ? Math.max(...years) : null;
  const currentYear = new Date().getFullYear();

  const stats = [
    { label: "Alumni Listed", value: total > 0 ? total.toString() : "—", emoji: "🎓" },
    { label: "Oldest Class", value: oldestYear ? String(oldestYear) : "—", emoji: "🏛️" },
    { label: "Newest Class", value: newestYear ? String(newestYear) : "—", emoji: "✨" },
    {
      label: "Years of Story",
      value: oldestYear ? `${currentYear - oldestYear}+` : "Since 1975",
      emoji: "🌍",
    },
  ];

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      <style>{`
        @keyframes mv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes mv-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes mv-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        .mv-float{animation:mv-float 6s ease-in-out infinite}
        .mv-float-alt{animation:mv-float-alt 7s ease-in-out infinite}
        .mv-blob{animation:mv-blob 16s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){ .mv-float,.mv-float-alt,.mv-blob{animation:none} }
      `}</style>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-32 -top-32 z-0 h-80 w-80 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#4a55b8]/40 blur-3xl" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[6%] top-[18%] z-0 text-4xl opacity-70 sm:text-5xl">🎓</span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] top-[12%] z-0 text-4xl opacity-70 sm:text-5xl">🌍</span>
        <span className="mv-float pointer-events-none absolute left-[10%] bottom-[14%] z-0 text-3xl opacity-60 sm:text-4xl">💼</span>
        <span className="mv-float-alt pointer-events-none absolute right-[12%] bottom-[12%] z-0 text-3xl opacity-60 sm:text-4xl">🤝</span>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Mount View Alumni Network · Since 1975
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Once a Mount View learner,
              <span className="relative mt-2 block pb-4 text-[#FFE900]">
                always part of the story.
                <svg
                  className="pointer-events-none absolute -bottom-1 left-0 h-5 w-full text-[#F58220]"
                  viewBox="0 0 400 20"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 11 C 90 3, 200 3, 398 9" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M60 17 C 150 12, 250 12, 340 15" stroke="#FFE900" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                  <circle cx="398" cy="9" r="4.5" fill="currentColor" />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-blue-100">
              Wherever life has taken you, your Mount View story continues. Add yourself to our
              alumni directory, reconnect with classmates, and inspire the next generation of learners.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="#submit"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-7 py-4 font-black text-white shadow-lg shadow-[#F58220]/30 transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
              >
                Submit Your Details
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="#directory"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/5 px-7 py-4 font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Browse Alumni
              </Link>
            </div>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur transition hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10"
                >
                  <p className="text-lg leading-none">{stat.emoji}</p>
                  <p className="mt-2 text-xl font-black text-[#FFE900]">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section
        id="submit"
        className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <span className="mv-float pointer-events-none absolute left-[4%] top-12 text-5xl opacity-15">✍️</span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">📬</span>

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Join the Directory
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              Add yourself to the alumni directory.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Fill in as much or as little as you like. Your contact details stay private unless you
              choose to display them. Submissions are reviewed before appearing on this page.
            </p>
          </div>

          <AlumniForm />
        </div>
      </section>

      {/* DIRECTORY */}
      <section
        id="directory"
        className="relative scroll-mt-24 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Our Alumni Community
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              Where our alumni are today.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Click any name to read their full story — where they are now, what they do,
              and a message for today&apos;s Mount View learners.
            </p>
          </div>

          <AlumniDirectory alumni={alumni} />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-[#252B68] p-10 text-center shadow-2xl sm:p-14 lg:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-24 top-0 z-0 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
            <div className="mv-blob absolute -bottom-32 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          </div>
          <span className="mv-float pointer-events-none absolute left-[10%] top-6 text-4xl opacity-40">🎈</span>
          <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-6 text-4xl opacity-40">💛</span>

          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Know someone from your Mount View days?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              Help us grow the network. Share this page with classmates, colleagues and friends who
              once walked these corridors — every story makes the community richer.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="#submit"
                className="group rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Add Your Details
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 font-black text-white transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Contact the School
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}