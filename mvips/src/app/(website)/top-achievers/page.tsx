import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/* =========================================================
   API
========================================================= */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const MAX_SUBJECT = 50;
const MAX_TOTAL = MAX_SUBJECT * 3;

type SubjectKey = "english" | "maths" | "science";

const SUBJECTS: {
  key: SubjectKey;
  label: string;
  short: string;
  icon: string;
  accent: string;
  gradient: string;
}[] = [
  {
    key: "english",
    label: "English",
    short: "ENG",
    icon: "📖",
    accent: "#252B68",
    gradient: "from-[#252B68] to-[#3a4090]",
  },
  {
    key: "maths",
    label: "Mathematics",
    short: "MAT",
    icon: "∑",
    accent: "#F58220",
    gradient: "from-[#F58220] to-[#d96e12]",
  },
  {
    key: "science",
    label: "Science",
    short: "SCI",
    icon: "⚗️",
    accent: "#16A34A",
    gradient: "from-[#16A34A] to-[#0e7a35]",
  },
];

type TopAchiever = {
  id: number;
  academic_year_id: number;
  academic_year_name: string | null;
  student_name: string;
  student_photo_url: string | null;
  position: number;
  subject: SubjectKey | null;
  english_score: number;
  maths_score: number;
  science_score: number;
  total_score: number;
  average_score: number;
  note: string | null;
  is_published: boolean;
};

type YearOption = {
  id: number;
  name: string;
  is_current: boolean;
};

type Summary = {
  class_total: number;
  subject_totals: Record<SubjectKey, number>;
  best_english: number;
  best_maths: number;
  best_science: number;
  best_total: number;
  best_average: number;
};

type Payload = {
  data: {
    class_level: TopAchiever[];
    subject_level: Record<SubjectKey, TopAchiever[]>;
  };
  years: YearOption[];
  academic_year_id: number | null;
  academic_year_name: string | null;
  summary: Summary;
};

async function getTopAchievers(yearId?: string | null): Promise<Payload> {
  const empty: Payload = {
    data: {
      class_level: [],
      subject_level: { english: [], maths: [], science: [] },
    },
    years: [],
    academic_year_id: null,
    academic_year_name: null,
    summary: {
      class_total: 0,
      subject_totals: { english: 0, maths: 0, science: 0 },
      best_english: 0,
      best_maths: 0,
      best_science: 0,
      best_total: 0,
      best_average: 0,
    },
  };

  if (!API_URL) return empty;

  try {
    const url = yearId
      ? `${API_URL}/api/top-achievers?academic_year_id=${yearId}`
      : `${API_URL}/api/top-achievers`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) return empty;

    const text = await res.text();
    if (!text.trimStart().startsWith("{")) return empty;

    const json = JSON.parse(text);

    return {
      data: {
        class_level: Array.isArray(json?.data?.class_level)
          ? json.data.class_level
          : [],
        subject_level: {
          english: Array.isArray(json?.data?.subject_level?.english)
            ? json.data.subject_level.english
            : [],
          maths: Array.isArray(json?.data?.subject_level?.maths)
            ? json.data.subject_level.maths
            : [],
          science: Array.isArray(json?.data?.subject_level?.science)
            ? json.data.subject_level.science
            : [],
        },
      },
      years: Array.isArray(json?.years) ? json.years : [],
      academic_year_id: json?.academic_year_id ?? null,
      academic_year_name: json?.academic_year_name ?? null,
      summary: json?.summary ?? empty.summary,
    };
  } catch {
    return empty;
  }
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

function percentOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 1000) / 10;
}

/* =========================================================
   PAGE
========================================================= */

type PageProps = {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function TopAchieversPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const yearFilter = typeof params.year === "string" ? params.year : undefined;

  const payload = await getTopAchievers(yearFilter);

  const classLevel = payload.data.class_level;
  const subjectLevel = payload.data.subject_level;
  const yearName = payload.academic_year_name;
  const years = payload.years;
  const summary = payload.summary;

  const hasClass = classLevel.length > 0;
  const subjectSections = SUBJECTS.filter(
    (s) => subjectLevel[s.key].length > 0
  );
  const hasSubjects = subjectSections.length > 0;
  const hasAny = hasClass || hasSubjects;

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      <style>{`
        @keyframes ta-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(6deg)} }
        @keyframes ta-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(12px) rotate(-6deg)} }
        @keyframes ta-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-24px) scale(1.08)} 66%{transform:translate(-16px,14px) scale(.94)} }
        @keyframes ta-sparkle { 0%,100%{opacity:.4; transform:scale(1)} 50%{opacity:1; transform:scale(1.15)} }
        @keyframes ta-rise { from{opacity:0; transform:translateY(20px)} to{opacity:1; transform:translateY(0)} }

        .ta-float { animation: ta-float 6s ease-in-out infinite; }
        .ta-float-alt { animation: ta-float-alt 7s ease-in-out infinite; }
        .ta-blob { animation: ta-blob 16s ease-in-out infinite; }
        .ta-sparkle { animation: ta-sparkle 2.5s ease-in-out infinite; }
        .ta-rise { animation: ta-rise 0.6s ease-out both; }

        @media (prefers-reduced-motion: reduce) {
          .ta-float, .ta-float-alt, .ta-blob, .ta-sparkle, .ta-rise { animation: none; }
        }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] py-20 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="ta-blob absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#F58220]/25 blur-3xl" />
          <div className="ta-blob absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FFE900]/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#4a55b8]/40 blur-3xl" />
        </div>

        <span className="ta-float pointer-events-none absolute left-[6%] top-[16%] text-4xl opacity-70 sm:text-5xl">🎓</span>
        <span className="ta-float-alt pointer-events-none absolute right-[8%] top-[12%] text-4xl opacity-70 sm:text-5xl">🏆</span>
        <span className="ta-float pointer-events-none absolute left-[10%] bottom-[18%] text-3xl opacity-60 sm:text-4xl">⭐</span>
        <span className="ta-float-alt pointer-events-none absolute right-[12%] bottom-[16%] text-3xl opacity-60 sm:text-4xl">✨</span>
        <span className="ta-sparkle pointer-events-none absolute left-1/4 top-1/4 text-2xl opacity-60">✦</span>
        <span className="ta-sparkle pointer-events-none absolute right-1/4 bottom-1/4 text-2xl opacity-60 [animation-delay:-1.2s]">✦</span>

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="ta-rise inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE900] backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFE900]" />
            Cambridge Primary Checkpoint Results
          </div>

          <h1
            className="ta-rise mt-7 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="block text-white/85">Congratulations to our</span>
            <span className="mt-1 block">
              <span className="bg-gradient-to-r from-[#FFE900] via-[#FFE900] to-[#F58220] bg-clip-text text-transparent">
                Top Achievers
              </span>
            </span>
          </h1>

          {yearName && (
            <p
              className="ta-rise mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFE900]/15 px-5 py-2 text-sm font-black uppercase tracking-[0.15em] text-[#FFE900]"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
              Academic Year · {yearName}
            </p>
          )}

          <p
            className="ta-rise mx-auto mt-8 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl"
            style={{ animationDelay: "0.2s" }}
          >
            We celebrate the exceptional dedication, hard work, and brilliance
            of our students in the Cambridge Primary Checkpoint examinations.
            Each subject is scored out of {MAX_SUBJECT}, giving a maximum
            total of {MAX_TOTAL}.
          </p>

          {hasAny && (
            <div
              className="ta-rise mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
              style={{ animationDelay: "0.25s" }}
            >
              <StatTile label="Class Level" value={summary.class_total} />
              <StatTile label="Best Total" value={`${summary.best_total.toFixed(0)}/${MAX_TOTAL}`} />
              <StatTile label="Best English" value={`${summary.best_english.toFixed(0)}/${MAX_SUBJECT}`} />
              <StatTile label="Best Maths" value={`${summary.best_maths.toFixed(0)}/${MAX_SUBJECT}`} />
              <StatTile label="Best Science" value={`${summary.best_science.toFixed(0)}/${MAX_SUBJECT}`} />
              <StatTile label="Best Average" value={`${summary.best_average.toFixed(1)}/${MAX_SUBJECT}`} />
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          YEAR FILTER
      ====================================================== */}
      {years.length > 0 && (
        <section className="relative border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Filter by year
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {years.map((y) => {
                  const active = y.id === payload.academic_year_id;
                  return (
                    <Link
                      key={y.id}
                      href={`/top-achievers?year=${y.id}`}
                      scroll={false}
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-black transition ${
                        active
                          ? "border-[#252B68] bg-[#252B68] text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#252B68] hover:text-[#252B68] hover:shadow-sm"
                      }`}
                    >
                      {y.name}
                      {y.is_current && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            active
                              ? "bg-[#FFE900] text-[#252B68]"
                              : "bg-[#FFE900]/20 text-[#252B68]"
                          }`}
                        >
                          Current
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}
      {!hasAny && (
        <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-100 bg-slate-50 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFE900]/20 text-3xl">
              🏆
            </div>
            <h2 className="mt-6 text-2xl font-black text-[#252B68]">
              Results coming soon
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-8 text-slate-600">
              The Cambridge Checkpoint results for{" "}
              {yearName ? <strong>{yearName}</strong> : "this academic year"}{" "}
              have not been published yet. Check back soon — our
              students&apos; brilliant achievements will be celebrated here.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/academics"
                className="rounded-full bg-[#252B68] px-7 py-3.5 font-bold text-white transition hover:bg-[#171B4A]"
              >
                Explore Our Academics
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-[#252B68] px-7 py-3.5 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
              >
                Contact the School
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          CLASS LEVEL
      ====================================================== */}
      {hasClass && (
        <section className="relative overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="ta-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
            <div className="ta-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Class Level · All 3 Subjects
              </p>
              <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl lg:text-5xl">
                Our outstanding students
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Ranked by their combined performance across English, Mathematics,
                and Science — each subject scored out of {MAX_SUBJECT}.
              </p>
            </div>

            <div className="mt-14 flex flex-wrap justify-center gap-5 sm:gap-6">
              {classLevel.map((achiever, i) => (
                <AchieverCard
                  key={achiever.id}
                  achiever={achiever}
                  delay={i * 40}
                  mode="class"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          SUBJECT LEVEL — one section per subject
      ====================================================== */}
      {hasSubjects &&
        subjectSections.map((subject, sIdx) => {
          const rows = subjectLevel[subject.key];
          const bestScore = Math.max(...rows.map((r) => r.total_score));

          return (
            <section
              key={subject.key}
              className={`relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-24 ${
                sIdx % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="ta-blob absolute -left-24 top-40 h-72 w-72 rounded-full blur-3xl"
                  style={{ backgroundColor: `${subject.accent}26` }}
                />
                <div
                  className="ta-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full blur-3xl [animation-delay:-6s]"
                  style={{ backgroundColor: `${subject.accent}1A` }}
                />
              </div>

              <div className="relative mx-auto max-w-7xl">
                <div className="mx-auto max-w-3xl text-center">
                  <p
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]"
                    style={{
                      backgroundColor: `${subject.accent}1A`,
                      color: subject.accent,
                    }}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    Subject Level
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${subject.gradient} text-2xl text-white shadow-lg`}
                    >
                      {subject.icon}
                    </div>
                    <h2 className="text-3xl font-black text-[#252B68] sm:text-4xl lg:text-5xl">
                      {subject.label}
                    </h2>
                  </div>
                  <p className="mt-5 leading-8 text-slate-600">
                    Top achievers in <strong>{subject.label}</strong> — ranked
                    by their total in this subject, out of {MAX_SUBJECT}.
                  </p>
                  <p
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-widest shadow-sm ring-1 ring-slate-100"
                    style={{ color: subject.accent }}
                  >
                    <span>🏆</span>
                    Best · {bestScore.toFixed(0)}/{MAX_SUBJECT}
                  </p>
                </div>

                <div className="mt-14 flex flex-wrap justify-center gap-5 sm:gap-6">
                  {rows.map((achiever, i) => (
                    <AchieverCard
                      key={achiever.id}
                      achiever={achiever}
                      delay={i * 40}
                      mode="subject"
                      subject={subject}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

      {/* =====================================================
          CONGRATS MESSAGE
      ====================================================== */}
      {hasAny && (
        <section className="relative overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

          <span className="ta-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-20">🎉</span>
          <span className="ta-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-20">🏅</span>

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              A Message From Our School
            </p>

            <h2 className="mt-6 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              You make Mount View proud.
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              To each of our top achievers — congratulations on an outstanding
              achievement. Your dedication, discipline, and curiosity have
              earned you this recognition. We are immensely proud of you, and
              we know you will continue to inspire those around you.
            </p>

            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-blue-100/80">
              To our teachers, families, and every member of our community who
              supported these learners along the way — thank you. Achievement
              like this is never a solo journey.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Join Mount View
                <span className="ml-2">→</span>
              </Link>
              <Link
                href="/academics"
                className="rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur transition hover:bg-white hover:text-[#252B68]"
              >
                Explore Our Academics
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          BRAND STATEMENT
      ====================================================== */}
      <section className="bg-[#171B4A] px-4 py-10 text-center">
        <p className="text-lg font-black leading-relaxed text-[#FFE900] sm:text-xl">
          Integrity · Inclusion · Responsibility · Respect · Collaboration ·
          Well-being · Confidence · Empathy
        </p>
        <p className="mt-2 text-sm text-blue-200">
          Established in 1975 • Mount View International Primary School &amp;
          Early Years Centre
        </p>
      </section>
    </main>
  );
}

/* =========================================================
   SUB-COMPONENTS
========================================================= */

function StatTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
      <p className="text-xl font-black text-[#FFE900] sm:text-2xl">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-blue-100/90">
        {label}
      </p>
    </div>
  );
}

function AchieverCard({
  achiever,
  delay,
  mode = "class",
  subject,
}: {
  achiever: TopAchiever;
  delay: number;
  mode?: "class" | "subject";
  subject?: (typeof SUBJECTS)[number];
}) {
  const isFirst = achiever.position === 1;
  const isSecond = achiever.position === 2;
  const isThird = achiever.position === 3;
  const isPodium = isFirst || isSecond || isThird;

  const badgeBg = isFirst
    ? "bg-[#FFE900] text-[#252B68]"
    : isSecond
    ? "bg-slate-300 text-slate-800"
    : isThird
    ? "bg-orange-300 text-orange-900"
    : "bg-slate-100 text-slate-600";

  const medal = isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : null;

  const ringColour = subject ? subject.accent : "#FFE900";

  const cardRing = isFirst
    ? "ring-2"
    : isSecond
    ? "ring-2 ring-slate-300 shadow-lg"
    : isThird
    ? "ring-2 ring-orange-300 shadow-lg"
    : "ring-1 ring-slate-100 shadow-sm";

  const totalPercent =
    mode === "class"
      ? percentOf(achiever.total_score, MAX_TOTAL)
      : percentOf(achiever.total_score, MAX_SUBJECT);

  return (
    <article
      className={`ta-rise group relative flex w-full flex-col overflow-hidden rounded-3xl bg-white transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:w-[calc(50%-0.75rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] ${cardRing}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(isFirst
          ? {
              borderColor: ringColour,
              boxShadow: `0 20px 50px -20px ${ringColour}80`,
            }
          : {}),
      }}
    >
      {/* Top ribbon for podium finishers */}
      {isPodium && (
        <div
          className={`h-1.5 w-full ${
            isFirst
              ? ""
              : isSecond
              ? "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300"
              : "bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300"
          }`}
          style={
            isFirst
              ? {
                  background: `linear-gradient(to right, ${ringColour}, ${ringColour}80, ${ringColour})`,
                }
              : undefined
          }
        />
      )}

      {/* Medal floating (podium only) */}
      {medal && (
        <span className="pointer-events-none absolute right-3 top-3 z-10 text-3xl drop-shadow-md">
          {medal}
        </span>
      )}

      {/* Photo — bigger (128px) */}
      <div className="relative flex justify-center pt-6">
        <div
          className={`relative h-32 w-32 overflow-hidden rounded-full bg-slate-100 ${
            isFirst
              ? ""
              : isSecond
              ? "ring-4 ring-slate-300"
              : isThird
              ? "ring-4 ring-orange-300"
              : "ring-2 ring-slate-200"
          }`}
          style={
            isFirst ? { boxShadow: `0 0 0 4px ${ringColour}` } : undefined
          }
        >
          {achiever.student_photo_url ? (
            <ImageWithFallback
              src={achiever.student_photo_url}
              alt={achiever.student_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-black text-[#252B68]">
              {initials(achiever.student_name)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 text-center">
        {/* Position badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badgeBg}`}
          >
            {medal
              ? `${medal} ${ordinal(achiever.position)}`
              : ordinal(achiever.position)}
          </span>
        </div>

        {/* Name */}
        <h3 className="mt-3 line-clamp-2 text-base font-black leading-tight text-[#252B68] sm:text-lg">
          {achiever.student_name}
        </h3>

        {mode === "class" ? (
          <>
            {/* 3 subject score chips */}
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              <ScoreCell label="ENG" value={achiever.english_score} />
              <ScoreCell label="MAT" value={achiever.maths_score} />
              <ScoreCell label="SCI" value={achiever.science_score} />
            </div>

            {/* Total + Average */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#252B68]/5 px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Total
                </p>
                <p className="text-base font-black leading-tight text-[#252B68]">
                  {achiever.total_score.toFixed(0)}
                  <span className="text-[11px] font-bold text-slate-400">
                    /{MAX_TOTAL}
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-[#F58220]/10 px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#F58220]">
                  Avg
                </p>
                <p className="text-base font-black leading-tight text-[#F58220]">
                  {achiever.average_score.toFixed(1)}
                  <span className="text-[11px] font-bold text-[#F58220]/60">
                    /{MAX_SUBJECT}
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Subject mode — one big "Total" cell (subject name is in the section header) */
          <div
            className="mt-4 rounded-xl px-3 py-3"
            style={{ backgroundColor: `${ringColour}15` }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-widest opacity-70"
              style={{ color: ringColour }}
            >
              Total
            </p>
            <p
              className="mt-1 text-4xl font-black leading-none"
              style={{ color: ringColour }}
            >
              {achiever.total_score.toFixed(0)}
              <span className="text-base font-bold opacity-60">
                /{MAX_SUBJECT}
              </span>
            </p>
            <p
              className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-60"
              style={{ color: ringColour }}
            >
              {totalPercent}%
            </p>
          </div>
        )}

        {/* Overall bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>{mode === "class" ? "Overall" : "Performance"}</span>
            <span>{totalPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(totalPercent, 100)}%`,
                backgroundColor: isFirst ? ringColour : "#252B68",
                backgroundImage:
                  isFirst && mode === "class"
                    ? "linear-gradient(to right, #FFE900, #F58220)"
                    : undefined,
              }}
            />
          </div>
        </div>

        {/* Note */}
        {achiever.note && (
          <p className="mt-3 line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] font-semibold italic leading-5 text-slate-500">
            &ldquo;{achiever.note}&rdquo;
          </p>
        )}
      </div>
    </article>
  );
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  const pct = percentOf(value, MAX_SUBJECT);
  const tone =
    pct >= 90
      ? "text-emerald-700 bg-emerald-50"
      : pct >= 75
      ? "text-[#252B68] bg-slate-100"
      : pct >= 50
      ? "text-amber-700 bg-amber-50"
      : "text-slate-600 bg-slate-50";

  return (
    <div className={`rounded-lg px-1 py-2 ${tone}`}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
        {label}
      </p>
      <p className="text-sm font-black leading-tight">
        {value.toFixed(0)}
        <span className="text-[10px] font-bold opacity-60">/{MAX_SUBJECT}</span>
      </p>
    </div>
  );
}