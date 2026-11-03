import Link from "next/link";
import ImageWithFallback from "../components/ImageWithFallback";

/* =========================================================
   API / BACKEND HELPERS
========================================================= */

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

type Story = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  category: { id: number; name: string; slug: string } | null;
  published_at: string | null;
  created_at: string | null;
};

type EventItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  class_name: string | null;
};

type GalleryImage = {
  id: number;
  image_url: string | null;
  sort_order: number;
};

type GalleryItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  image_count: number;
  event_date: string | null;
  images: GalleryImage[];
};

/* ---------------------------------------------------------
   Robust array extractor
--------------------------------------------------------- */
function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;

  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }

  if (Array.isArray(p.data)) return p.data as T[];

  for (const key of ["events", "stories", "galleries", "gallery", "items", "results"]) {
    const value = p[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (Array.isArray(payload)) return payload as T[];

  return [];
}

async function fetchJson(path: string): Promise<unknown> {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[home] GET ${url} → ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[home] GET ${url} failed:`, err);
    return null;
  }
}

async function getLatestStories(limit = 3): Promise<Story[]> {
  const json = await fetchJson(`/api/stories?status=published&per_page=${limit}`);
  return extractArray<Story>(json);
}

async function getUpcomingEvents(limit = 3): Promise<EventItem[]> {
  let json = await fetchJson(`/api/events?per_page=${limit}`);
  let events = extractArray<EventItem>(json);

  if (events.length === 0) {
    const publishedJson = await fetchJson(
      `/api/events?status=published&per_page=${limit}`
    );
    const published = extractArray<EventItem>(publishedJson);
    if (published.length > 0) {
      events = published;
    }
  }

  const now = Date.now();
  return [...events].sort((a, b) => {
    const aUpcoming = new Date(a.event_date).getTime() >= now ? 0 : 1;
    const bUpcoming = new Date(b.event_date).getTime() >= now ? 0 : 1;
    if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming;
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });
}

async function getLatestGalleries(limit = 2): Promise<GalleryItem[]> {
  const json = await fetchJson(`/api/gallery?per_page=${limit}`);
  return extractArray<GalleryItem>(json);
}

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const trimmed = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${trimmed}`;
}

function formatEventDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

/* =========================================================
   STATIC BRAND CONTENT
========================================================= */

const stageHighlights = [
  {
    number: "01",
    title: "Early Years",
    years: "Pre-Nursery · Nursery · Reception",
    description:
      "A joyful first step (20 months – 5 years). We follow the British EYFS framework, blending play-based learning with specialist subjects like ICT, Swimming, PE, Art, and Music.",
    image: "/images/ey.jpg",
    href: "/academics",
  },
  {
    number: "02",
    title: "Key Stage 1",
    years: "Year 1 & Year 2",
    description:
      "Building strong foundations in English (including Phonics) and Maths. Learning is enriched with Global Perspectives, ICT, Art, Music, and PE through topic-themed lessons.",
    image: "/images/ks1.jpg",
    href: "/academics",
  },
  {
    number: "03",
    title: "Lower Key Stage 2",
    years: "Year 3 & Year 4",
    description:
      "Broadening the learning experience with Science, Global Perspectives, Art, and Music, alongside core English and Mathematics. Curriculum links provide real-world contexts.",
    image: "/images/ict.JPG",
    href: "/academics",
  },
  {
    number: "04",
    title: "Upper Key Stage 2",
    years: "Year 5 & Year 6",
    description:
      "Preparing for secondary school. Students take greater responsibility for their learning, developing critical thinking skills meticulously aligned for Cambridge Checkpoint exams.",
    image: "/images/uks.JPG",
    href: "/academics",
  },
];

const learningAreas = [
  {
    title: "Cambridge Curriculum",
    description:
      "Fully registered with Cambridge Examinations. Year 6 students take the Cambridge Checkpoint Exams annually.",
    icon: "🎓",
  },
  {
    title: "Jolly Phonics",
    description:
      "A multi-sensory synthetic phonics method used in Reception to get children reading and writing from an early age.",
    icon: "🔤",
  },
  {
    title: "Clubs & Field Trips",
    description:
      "From ICT, Art, and Music to Dance and Drama. Plus trips to Game Haven for Year 6 team building and independence.",
    icon: "◈",
  },
  {
    title: "Swimming & Sports",
    description:
      "Two on-campus pools. All Year 1-6 students participate in swim lessons between September and March with 3 lifeguards.",
    icon: "⚽",
  },
  {
    title: "The House System",
    description:
      "Fostering camaraderie through four Houses: Red Chipembere, Green Njobvu, Yellow Swala, and Blue Mbidzi.",
    icon: "🛡️",
  },
  {
    title: "Learning Support",
    description:
      "Inclusive education included in school fees, providing extra guidance to ensure no child is left behind.",
    icon: "♡",
  },
];

const reasons = [
  {
    title: "Meaningful Learning Experiences",
    description:
      "We provide an engaging & ever-evolving curriculum that prepares children for life beyond the classroom.",
  },
  {
    title: "Beyond Academics",
    description:
      "Excellence is achieved by taking learning out of the classroom, into the community, and fostering 21st-century skills.",
  },
  {
    title: "Dedicated Educators",
    description:
      "Our teaching approach is personalised to ensure that every student's learning journey is as special as they are.",
  },
  {
    title: "Nurturing Hearts & Minds",
    description:
      "Instilling in our students the confidence, curiosity, and passion to pursue their dreams, wherever they may lead.",
  },
];

const journey = [
  {
    step: "01",
    title: "Discover",
    description:
      "Children are encouraged to ask questions, explore their interests, and discover the world around them.",
  },
  {
    step: "02",
    title: "Develop",
    description:
      "Learners build knowledge, skills, confidence, and positive learning habits.",
  },
  {
    step: "03",
    title: "Create",
    description:
      "Learners use their knowledge and imagination to solve problems, communicate ideas, and create.",
  },
  {
    step: "04",
    title: "Thrive",
    description:
      "Learners grow in independence and confidence as they prepare for the opportunities ahead.",
  },
];

/* ---------------------------------------------------------
   Subjects shown in the animated ribbon
   (duplicated 2× so the marquee loops seamlessly)
--------------------------------------------------------- */
const SUBJECTS_RIBBON = [
  "English",
  "Mathematics",
  "Science",
  "Jolly Phonics",
  "Global Perspectives",
  "ICT & Computing",
  "Art & Design",
  "Music",
  "Drama & Dance",
  "Physical Education",
  "Swimming",
  "Library & Reading",
  "Cambridge Curriculum",
  "Cambridge Checkpoint",
  "Learning Support",
  "House Competitions",
];

/* =========================================================
   PAGE
========================================================= */

export default async function Home() {
  const [stories, events, galleries] = await Promise.all([
    getLatestStories(3),
    getUpcomingEvents(3),
    getLatestGalleries(2),
  ]);

  const featuredStory = stories[0] ?? null;
  const secondaryStory = stories[1] ?? null;
  const featuredEvent = events[0] ?? null;

  const featuredGallery = galleries[0] ?? null;
  const heroGallery = galleries[1] ?? galleries[0] ?? null;

  const galleryPreviewImages = (featuredGallery?.images ?? [])
    .slice(0, 5)
    .map((img) => ({
      id: img.id,
      url: resolveImageUrl(img.image_url),
    }))
    .filter((img) => img.url);

  const heroImage =
    resolveImageUrl(heroGallery?.cover_image) || "/images/school1.jpg";

  const schoolLifeImage =
    resolveImageUrl(featuredGallery?.cover_image) || "/images/school-3.jpg";

  const hasNews =
    Boolean(featuredStory) ||
    Boolean(featuredEvent) ||
    Boolean(featuredGallery);

  return (
    <main className="bg-white text-[#172033]">
      {/* ---------- shared animation styles ---------- */}
      <style>{`
        @keyframes mv-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .mv-marquee { animation: mv-marquee 40s linear infinite; }
        .mv-marquee:hover { animation-play-state: paused; }

        @media (prefers-reduced-motion: reduce) {
          .mv-marquee { animation: none; }
        }
      `}</style>

      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#FFE900]/10" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          <div className="order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFE900]" />
              Established in 1975
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              A place where children{" "}
              <span className="text-[#FFE900]">learn, grow and thrive.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              At Mount View, we see learning as more than just an academic
              pursuit—it is a lifelong adventure filled with discovery,
              creativity, and joy.
            </p>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              As a vibrant mosaic of cultures, we are dedicated to nurturing not
              only the minds but also the hearts of our students, instilling in
              them the confidence, curiosity, and passion to pursue their
              dreams.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-7 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Apply for Admission
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-4 font-bold text-white transition duration-300 hover:bg-white hover:text-[#252B68]"
              >
                Discover Mount View
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">1975</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Established
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">600+</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Students
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">4</p>
                <p className="mt-1 text-[11px] font-semibold leading-tight text-blue-100">
                  Stages (Early Years → Year 6)
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative isolate">
              <div className="pointer-events-none absolute -inset-3 z-0 rounded-[2.5rem] bg-[#FFE900]/15 blur-2xl" />

              <div className="relative z-10 overflow-hidden rounded-[2rem] border-[10px] border-white/10 bg-[#171B4A] shadow-2xl ring-1 ring-white/10">
                <div className="relative">
                  <ImageWithFallback
                    src={heroImage}
                    alt="Learners enjoying school life at Mount View International Primary School"
                    className="aspect-[4/5] w-full sm:aspect-[4/3]"
                  />

                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E] via-[#0B0F2E]/55 to-transparent" />

                  <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#F58220]" />
                    Applications open
                  </div>

                  <div className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/35 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Cambridge Curriculum
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFE900]">
                        Mount View International
                      </p>

                      <p className="mt-1.5 text-lg font-black leading-snug text-white sm:text-xl">
                        Primary School & Early Years Centre
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/85">
                        A vibrant community of 600+ learners from Malawi and
                        around the world — growing, discovering and thriving
                        together.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          href="/admissions"
                          className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-4 py-2 text-xs font-black text-white transition hover:bg-[#d96e12]"
                        >
                          Apply for Admission
                          <span>→</span>
                        </Link>

                        <Link
                          href="/about"
                          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-[#252B68]"
                        >
                          Why Mount View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 top-1/3 z-20 hidden -translate-y-1/2 rotate-[6deg] rounded-xl bg-[#F58220] px-4 py-3 shadow-2xl lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/85">
                  Enrolling
                </p>
                <p className="text-sm font-black text-white">
                  Early Years → Year 6
                </p>
              </div>

              <div className="absolute -bottom-5 -right-3 z-20 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-lg text-[#FFE900]">
                  ♡
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Our values
                  </p>
                  <p className="text-xs font-black text-[#252B68]">
                    Growth · Excellence · Empathy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SUBJECTS RIBBON — animated marquee
      ========================================================== */}
      <section
        aria-label="Subjects taught at Mount View"
        className="overflow-hidden border-y border-slate-200 bg-white py-4"
      >
        <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
          {/* Render the list twice for a seamless loop */}
          {[...SUBJECTS_RIBBON, ...SUBJECTS_RIBBON].map((subject, i) => (
            <span
              key={`${subject}-${i}`}
              className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-[#252B68]/70"
            >
              <span className="text-[#F58220]">✦</span>
              {subject}
            </span>
          ))}
        </div>
      </section>

      {/* =========================================================
          SCHOOL INTRODUCTION
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F58220]">
            Welcome to Mount View
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl lg:text-5xl">
            A vibrant community built around children.
          </h2>

          <p className="mx-auto mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            We are honored to have your children as part of our school
            community, where their happiness, growth, and success are at the
            heart of everything we do. Our teaching approach is personalised to
            ensure that every student&apos;s learning journey is as special as
            they are.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/about"
              className="rounded-full bg-[#252B68] px-7 py-3.5 font-bold text-white transition hover:bg-[#171B4A]"
            >
              Learn More About Us
            </Link>

            <Link
              href="/contact"
              className="rounded-full border-2 border-[#252B68] px-7 py-3.5 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
            >
              Talk to Our School
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          SCHOOL AT A GLANCE
      ========================================================== */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-100">
              <p className="text-4xl font-black text-[#252B68]">1975</p>
              <p className="mt-2 font-bold text-[#F58220]">
                A Long-Standing School
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Founded by Mrs. Sakker Sacranie with a vision to offer quality
                education at affordable prices.
              </p>
            </div>

            <div className="rounded-3xl bg-[#252B68] p-7 text-center shadow-sm">
              <p className="text-4xl font-black text-[#FFE900]">Cambridge</p>
              <p className="mt-2 font-bold text-white">
                International Curriculum
              </p>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                Registered with the University of Cambridge Examinations,
                offering Checkpoint exams in Year 6.
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFE900] p-7 text-center shadow-sm">
              <p className="text-4xl font-black text-[#252B68]">4</p>
              <p className="mt-2 font-bold text-[#252B68]">
                Distinct Learning Stages
              </p>
              <p className="mt-3 text-sm leading-6 text-[#252B68]/70">
                Supporting children through Early Years, KS1, Lower KS2, and
                Upper KS2.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STAGES HIGHLIGHTS
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              Our Stages
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              A learning journey designed around the child.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              From the first steps in Early Years to confident learners in Year
              6, every stage of the Mount View journey is designed around what
              children need to flourish.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stageHighlights.map((item) => (
              <article
                key={item.number}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative isolate">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="aspect-[16/10] w-full"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-md">
                    {item.number}
                  </span>
                </div>

                <div className="p-6">
                  <p className="text-xs font-bold text-[#F58220] uppercase tracking-wider mb-2">
                    {item.years}
                  </p>
                  <h3 className="text-xl font-black text-[#252B68]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  <Link
                    href={item.href}
                    className="mt-5 inline-flex text-sm font-bold text-[#252B68] transition hover:text-[#F58220]"
                  >
                    Discover this stage
                    <span className="ml-2 transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY MOUNT VIEW
      ========================================================== */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="relative isolate">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/creative-arts.jpg"
                alt="Learners participating in creative learning activities"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -right-3 z-20 rounded-2xl bg-[#FFE900] px-5 py-4 shadow-2xl sm:-right-7">
              <p className="text-xs font-black uppercase tracking-wider text-[#252B68]">
                Our values
              </p>
              <p className="mt-1 font-black text-[#252B68]">
                Growth • Excellence • Empathy
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              Why Mount View
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              Helping every learner discover their potential.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              We want children to develop not only what they know, but also how
              they think, communicate, collaborate, and respond to new
              challenges.
            </p>

            <div className="mt-9 space-y-6">
              {reasons.map((reason, index) => (
                <div key={reason.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#252B68] text-sm font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#252B68]">
                      {reason.title}
                    </h3>

                    <p className="mt-1.5 leading-7 text-slate-600">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="mt-9 inline-flex items-center rounded-full bg-[#F58220] px-7 py-3.5 font-bold text-white transition hover:bg-[#d96e12]"
            >
              Discover Our School
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNING AREAS
      ========================================================== */}
      <section className="bg-[#252B68] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
              Learning at Mount View
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Learning that goes beyond the textbook.
            </h2>

            <p className="mt-5 text-lg leading-8 text-blue-100">
              Learners experience a broad range of academic, digital, creative,
              and physical opportunities designed to support their development.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {learningAreas.map((area) => (
              <div
                key={area.title}
                className="group rounded-3xl border border-white/10 bg-white/5 p-7 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-xl font-black text-[#252B68] transition group-hover:bg-[#F58220] group-hover:text-white">
                  {area.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-white">
                  {area.title}
                </h3>

                <p className="mt-3 leading-7 text-blue-100">
                  {area.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/academics"
              className="inline-flex rounded-full bg-white px-7 py-3.5 font-black text-[#252B68] transition hover:bg-[#FFE900]"
            >
              Explore Our Academics →
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNER JOURNEY
      ========================================================== */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              The Learner Journey
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              From discovery to confidence.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              We want learners to leave each stage of their journey with
              stronger knowledge, growing independence, and the confidence to
              embrace new opportunities.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((item, index) => (
              <div
                key={item.step}
                className="relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100"
              >
                <span className="text-sm font-black text-[#F58220]">
                  {item.step}
                </span>

                <h3 className="mt-4 text-2xl font-black text-[#252B68]">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {item.description}
                </p>

                <div className="mt-6 h-1 w-12 rounded-full bg-[#FFE900]" />

                {index < journey.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F58220] text-xs font-black text-white lg:flex">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SCHOOL LIFE
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[2rem] bg-[#FFE900] lg:grid-cols-2">
            <div className="relative min-h-[320px]">
              <ImageWithFallback
                src={schoolLifeImage}
                alt="Learners taking part in school activities"
                className="h-full min-h-[320px] w-full"
              />
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#252B68]">
                Extra Curricular Activities
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                Because learning happens everywhere.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#252B68]/80">
                School life gives learners opportunities to participate,
                collaborate, compete, create, and discover interests beyond
                their regular classroom learning.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Swimming",
                  "Sports",
                  "Art",
                  "Music",
                  "Drama & Dance",
                  "Life Skills Clubs",
                  "Field Trips",
                  "House Competitions",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[#252B68]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <Link
                href="/school-life"
                className="mt-9 inline-flex w-fit rounded-full bg-[#252B68] px-7 py-3.5 font-black text-white transition hover:bg-[#171B4A]"
              >
                Explore School Life →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          GALLERY PREVIEW
      ========================================================== */}
      {galleryPreviewImages.length > 0 && (
        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
                  Gallery
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  {featuredGallery?.title || "Moments from around the school."}
                </h2>

                {featuredGallery?.description && (
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    {featuredGallery.description}
                  </p>
                )}
              </div>

              <Link
                href="/gallery"
                className="font-black text-[#252B68] transition hover:text-[#F58220]"
              >
                View full gallery →
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Link
                href={
                  featuredGallery
                    ? `/gallery?album=${featuredGallery.slug}`
                    : "/gallery"
                }
                className="group relative isolate col-span-2 row-span-2 overflow-hidden rounded-3xl"
              >
                <ImageWithFallback
                  src={galleryPreviewImages[0].url}
                  alt={featuredGallery?.title || "Gallery image"}
                  className="aspect-square h-full w-full"
                />
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm font-black text-white">
                    {featuredGallery?.title || "Explore the gallery"}
                  </p>
                </div>
              </Link>

              {galleryPreviewImages.slice(1, 5).map((img, index) => (
                <Link
                  key={img.id}
                  href={
                    featuredGallery
                      ? `/gallery?album=${featuredGallery.slug}`
                      : "/gallery"
                  }
                  className="group relative isolate overflow-hidden rounded-3xl"
                >
                  <ImageWithFallback
                    src={img.url}
                    alt={`Gallery image ${index + 2}`}
                    className="aspect-square h-full w-full"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition group-hover:bg-black/30" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          NEWS / COMMUNITY
      ========================================================== */}
      {hasNews && (
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
                  Life at Mount View
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  See what is happening in our community.
                </h2>
              </div>

              <Link
                href="/news"
                className="font-black text-[#252B68] transition hover:text-[#F58220]"
              >
                View all news →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featuredStory && (
                <Link
                  href={`/news?story=${featuredStory.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <ImageWithFallback
                    src={
                      resolveImageUrl(featuredStory.image_url) ||
                      "/images/creative-arts.jpg"
                    }
                    alt={featuredStory.title}
                    className="aspect-[16/10] w-full"
                  />

                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                      {featuredStory.category?.name || "Latest News"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-xl font-black text-[#252B68]">
                      {featuredStory.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {featuredStory.excerpt ||
                        "Read the full story from our school community."}
                    </p>
                  </div>
                </Link>
              )}

              {featuredEvent && (
                <Link
                  href={`/news?event=${featuredEvent.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <ImageWithFallback
                    src={
                      resolveImageUrl(featuredEvent.image_url) ||
                      "/images/steam-learning.jpg"
                    }
                    alt={featuredEvent.title}
                    className="aspect-[16/10] w-full"
                  />

                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                      Upcoming Event
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-xl font-black text-[#252B68]">
                      {featuredEvent.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {formatEventDate(featuredEvent.event_date)}
                      {featuredEvent.start_time
                        ? ` · ${featuredEvent.start_time}`
                        : ""}
                      {featuredEvent.location
                        ? ` · ${featuredEvent.location}`
                        : ""}
                    </p>
                  </div>
                </Link>
              )}

              {featuredGallery && (
                <Link
                  href={`/gallery?album=${featuredGallery.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <ImageWithFallback
                    src={
                      resolveImageUrl(featuredGallery.cover_image) ||
                      "/images/school-life.jpg"
                    }
                    alt={featuredGallery.title}
                    className="aspect-[16/10] w-full"
                  />

                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                      Gallery
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-xl font-black text-[#252B68]">
                      {featuredGallery.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {featuredGallery.description ||
                        `Explore ${featuredGallery.image_count} photos from our school.`}
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {!featuredEvent && (featuredStory || featuredGallery) && (
              <p className="mt-6 text-center text-xs text-slate-400">
                No upcoming events were returned from the API. If you have
                events in the admin, check that
                <code className="mx-1 rounded bg-slate-100 px-1">
                  /api/events
                </code>
                is returning data — see the server console for details.
              </p>
            )}
          </div>
        </section>
      )}

      {/* =========================================================
          ADMISSIONS CTA
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#F58220]/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#FFE900]/10" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                Application for Admission
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to apply for a place at Mount View?
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Start your child&apos;s application for admission to Mount View
                International Primary School & Early Years Centre. Our
                admissions team will guide you through the process from first
                enquiry to your child&apos;s first day.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admissions"
                  className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-8 py-4 font-black text-white transition hover:bg-[#d96e12] hover:shadow-lg"
                >
                  Apply for Admission
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#252B68]"
                >
                  Make an Enquiry
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm sm:p-9">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl text-[#252B68]">
                ♡
              </div>

              <h3 className="mt-6 text-2xl font-black text-white">
                Fostering growth, excellence, and empathy.
              </h3>

              <p className="mt-4 leading-8 text-blue-100">
                These values are at the heart of the Mount View experience and
                guide our approach to supporting learners as they develop their
                knowledge, confidence, and independence.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/10 p-3 text-center">
                  <p className="text-sm font-black text-[#FFE900]">Growth</p>
                </div>

                <div className="rounded-xl bg-white/10 p-3 text-center">
                  <p className="text-sm font-black text-[#FFE900]">
                    Excellence
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-3 text-center">
                  <p className="text-sm font-black text-[#FFE900]">Empathy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          QUICK NAVIGATION
      ========================================================== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/about"
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:-translate-y-1 hover:bg-[#252B68] hover:shadow-lg"
            >
              <p className="text-sm font-black text-[#F58220] group-hover:text-[#FFE900]">
                01
              </p>

              <h3 className="mt-2 text-xl font-black text-[#252B68] group-hover:text-white">
                About Us
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 group-hover:text-blue-100">
                Discover our school and values.
              </p>
            </Link>

            <Link
              href="/academics"
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:-translate-y-1 hover:bg-[#252B68] hover:shadow-lg"
            >
              <p className="text-sm font-black text-[#F58220] group-hover:text-[#FFE900]">
                02
              </p>

              <h3 className="mt-2 text-xl font-black text-[#252B68] group-hover:text-white">
                Academics
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 group-hover:text-blue-100">
                Explore learning at Mount View.
              </p>
            </Link>

            <Link
              href="/school-life"
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:-translate-y-1 hover:bg-[#252B68] hover:shadow-lg"
            >
              <p className="text-sm font-black text-[#F58220] group-hover:text-[#FFE900]">
                03
              </p>

              <h3 className="mt-2 text-xl font-black text-[#252B68] group-hover:text-white">
                School Life
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 group-hover:text-blue-100">
                See how learners experience school.
              </p>
            </Link>

            <Link
              href="/gallery"
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:-translate-y-1 hover:bg-[#252B68] hover:shadow-lg"
            >
              <p className="text-sm font-black text-[#F58220] group-hover:text-[#FFE900]">
                04
              </p>

              <h3 className="mt-2 text-xl font-black text-[#252B68] group-hover:text-white">
                Gallery
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 group-hover:text-blue-100">
                See moments from Mount View.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#F58220]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#252B68]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white/80">
            Mount View International Primary School & Early Years Centre
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Give your child a place to discover, develop, create, and thrive.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
            Apply for admission to Mount View and take the next step in your
            child&apos;s learning journey with us.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="rounded-full bg-[#252B68] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#171B4A]"
            >
              Apply for Admission →
            </Link>

            <Link
              href="/contact"
              className="rounded-full bg-white px-8 py-4 font-black text-[#252B68] transition hover:-translate-y-1 hover:bg-[#FFE900]"
            >
              Contact Mount View
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          BRAND STATEMENT
      ========================================================== */}
      <section className="bg-[#171B4A] px-4 py-10 text-center">
        <p className="text-lg font-black text-[#FFE900] sm:text-xl">
          Fostering growth, excellence and empathy.
        </p>

        <p className="mt-2 text-sm text-blue-200">
          Established in 1975 • Mount View International Primary School & Early
          Years Centre
        </p>
      </section>
    </main>
  );
}