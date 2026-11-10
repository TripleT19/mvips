import Image from "next/image";
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

function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;

  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }

  if (Array.isArray(p.data)) return p.data as T[];

  for (const key of [
    "events",
    "stories",
    "galleries",
    "gallery",
    "items",
    "results",
  ]) {
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

    const contentType = res.headers.get("content-type") || "";

    let text: string;
    try {
      text = await res.text();
    } catch (readErr) {
      console.error(`[home] GET ${url} — failed to read body:`, readErr);
      return null;
    }

    const trimmed = text.trimStart();

    if (trimmed.startsWith("<")) {
      console.error(
        `[home] GET ${url} returned HTML instead of JSON ` +
          `(content-type: "${contentType}"). Check that NEXT_PUBLIC_API_URL ` +
          `points to your backend and that the endpoint returns JSON. ` +
          `First 120 chars: ${text.slice(0, 120)}`
      );
      return null;
    }

    if (!trimmed) {
      console.error(`[home] GET ${url} returned an empty body`);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error(
        `[home] GET ${url} returned invalid JSON (content-type: "${contentType}"). ` +
          `First 120 chars: ${text.slice(0, 120)}`,
        parseErr
      );
      return null;
    }
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
   SHARED BRAND VALUES
========================================================= */

const BRAND_VALUES = [
  "Integrity",
  "Inclusion",
  "Responsibility",
  "Respect",
  "Collaboration",
  "Well-being",
  "Confidence",
  "Empathy",
];

/* =========================================================
   STATIC BRAND CONTENT
========================================================= */

/* Two grouped Cambridge stages — hrefs deep-link to /academics anchors */
const stageHighlights = [
  {
    number: "01",
    title: "Cambridge Early Years",
    years: "Pre-Nursery · Nursery · Reception · 18 months – 5 years",
    description:
      "A joyful first step. We follow the Cambridge Early Years framework, blending play-based learning with specialist subjects such as ICT, Swimming, PE, Art and Music — building curiosity, confidence and a love of learning from the very start.",
    image: "/images/ey.jpg",
    href: "/academics#early-years",
  },
  {
    number: "02",
    title: "Cambridge Primary",
    years: "Year 1 · Year 2 · Year 3 · Year 4 · Year 5 · Year 6",
    description:
      "A strong foundation for lifelong learning. Students build deep knowledge in English (including Phonics) and Mathematics, enriched with Science, Global Perspective, ICT, Art, Music and PE. Year 6 students sit the Cambridge Checkpoint examinations, prepared with confidence for secondary school.",
    image: "/images/ks1.jpg",
    href: "/academics#primary",
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
      "A multi-sensory synthetic phonics method used in Early Years and Key Stage 1 to get children reading and writing from an early age.",
    icon: "🔤",
  },
  {
    title: "Clubs & Field Trips",
    description:
      "From ICT, Art and Music to Dance and Drama — plus fun and educational trips that enrich learning beyond the classroom.",
    icon: "◈",
  },
  {
    title: "Swimming & Sports",
    description:
      "Two on-campus pools. All Reception to Year 6 students participate in swim lessons between September and March, led by a swimming coach and lifeguard, supported by Teaching Assistants.",
    icon: "⚽",
  },
  {
    title: "The House System",
    description:
      "Fostering camaraderie through four Houses: Sunbird House, Baobab House, Eagle House, and Lake House.",
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
    accent: "bg-[#F58220]",
  },
  {
    step: "02",
    title: "Develop",
    description:
      "Learners build knowledge, skills, confidence, and positive learning habits.",
    accent: "bg-[#FFE900]",
  },
  {
    step: "03",
    title: "Create",
    description:
      "Learners use their knowledge and imagination to solve problems, communicate ideas, and create.",
    accent: "bg-[#F58220]",
  },
  {
    step: "04",
    title: "Thrive",
    description:
      "Learners grow in independence and confidence as they prepare for the opportunities ahead.",
    accent: "bg-[#FFE900]",
  },
];

const SUBJECTS_RIBBON = [
  "English",
  "Mathematics",
  "Science",
  "Jolly Phonics",
  "Global Perspective",
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
   HERO SLIDESHOW — CSS-only, server-safe
========================================================= */

const FALLBACK_HERO_IMAGES = [
  "/images/school1.jpg",
  "/images/council.jpg",
  "/images/gardening.jpg",
  "/images/ks1.jpg",
  "/images/ey.jpg",
];

const HERO_BUTTONS = [
  { href: "/admissions", label: "Apply for Admissions" },
  { href: "/school-life", label: "School Life" },
  { href: "/about", label: "About Us" },
];

const QUICK_NAV_CARDS = [
  {
    href: "/about",
    index: "01",
    title: "About Us",
    desc: "Discover our school, values and story since 1968.",
    cardClass: "bg-[#252B68] hover:bg-[#1a1d4d]",
    indexClass: "text-[#FFE900]",
    titleClass: "text-white",
    descClass: "text-blue-100",
    accentClass: "text-[#FFE900]",
  },
  {
    href: "/academics",
    index: "02",
    title: "Academics",
    desc: "Explore learning, curriculum and classrooms.",
    cardClass: "bg-[#F58220] hover:bg-[#d96e12]",
    indexClass: "text-white",
    titleClass: "text-white",
    descClass: "text-white/95",
    accentClass: "text-white",
  },
  {
    href: "/school-life",
    index: "03",
    title: "School Life",
    desc: "See how learners experience every school day.",
    cardClass: "bg-[#FFE900] hover:bg-[#e6d200]",
    indexClass: "text-[#252B68]",
    titleClass: "text-[#252B68]",
    descClass: "text-[#252B68]/80",
    accentClass: "text-[#252B68]",
  },
  {
    href: "/gallery",
    index: "04",
    title: "Gallery",
    desc: "Browse moments captured across Mount View.",
    cardClass: "bg-[#171B4A] hover:bg-[#0f1235]",
    indexClass: "text-[#FFE900]",
    titleClass: "text-white",
    descClass: "text-blue-100",
    accentClass: "text-[#FFE900]",
  },
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
  const featuredEvent = events[0] ?? null;
  const featuredGallery = galleries[0] ?? null;

  const heroSlides: string[] = (() => {
    const fromApi = galleries
      .flatMap((g) => [
        resolveImageUrl(g.cover_image),
        ...(g.images ?? [])
          .slice(0, 2)
          .map((img) => resolveImageUrl(img.image_url)),
      ])
      .filter(Boolean);

    return Array.from(
      new Set([...fromApi, ...FALLBACK_HERO_IMAGES].filter(Boolean))
    ).slice(0, 5);
  })();

  const galleryPreviewImages = (featuredGallery?.images ?? [])
    .slice(0, 5)
    .map((img) => ({
      id: img.id,
      url: resolveImageUrl(img.image_url),
    }))
    .filter((img) => img.url);

  const schoolLifeImage =
    resolveImageUrl(featuredGallery?.cover_image) || "/images/team-spirit.JPG";

  const hasNews =
    Boolean(featuredStory) || Boolean(featuredEvent) || Boolean(featuredGallery);

  const heroCycle = "30s";

  return (
    <main className="bg-white text-[#172033]">
      {/* =========================================================
          SHARED ANIMATION STYLES
      ========================================================== */}
      <style>{`
        @keyframes mv-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .mv-marquee { animation: mv-marquee 40s linear infinite; }
        .mv-marquee:hover { animation-play-state: paused; }

        @keyframes mv-hero-slide {
          0%   { opacity: 0; transform: scale(1); }
          4%   { opacity: 1; }
          20%  { opacity: 1; transform: scale(1.06); }
          24%  { opacity: 0; transform: scale(1.06); }
          100% { opacity: 0; transform: scale(1); }
        }
        .mv-hero-slide {
          animation-name: mv-hero-slide;
          animation-duration: ${heroCycle};
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          opacity: 0;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .mv-marquee { animation: none; }
          .mv-hero-slide { animation: none !important; opacity: 0; }
          .mv-hero-slide:first-child { opacity: 1; }
        }
      `}</style>

      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative isolate flex min-h-[88svh] flex-col items-center justify-center overflow-hidden bg-[#0B0F2E]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroSlides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="mv-hero-slide absolute inset-0"
              style={{ animationDelay: `${i * 6}s` }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
                style={{ filter: "brightness(1.08) saturate(1.05)" }}
              />
            </div>
          ))}

          <div className="absolute inset-0 bg-[#0B0F2E]/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F2E]/55 via-[#0B0F2E]/15 to-[#0B0F2E]/80" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white sm:text-[11px]">
              Learn · Grow · Excel · Care
            </span>
          </div>

          <h1 className="mt-8 text-4xl font-black leading-[1.04] tracking-tight text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.65),0_1px_3px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block text-white/90">Welcome to</span>
            <span className="mt-1 block">Mount View International</span>
            <span className="mt-1 block text-[#FFE900] [text-shadow:0_2px_30px_rgba(0,0,0,0.75),0_1px_3px_rgba(0,0,0,0.7)]">
              Primary School
            </span>
          </h1>

          <p className="mt-5 text-2xl font-black tracking-wide text-[#FFE900] [text-shadow:0_2px_30px_rgba(0,0,0,0.75),0_1px_3px_rgba(0,0,0,0.7)] sm:text-3xl lg:text-4xl">
            &amp; Early Years Centre
          </p>

          <div className="mx-auto my-8 h-px w-24 bg-white/30" />

          <p className="mx-auto max-w-2xl text-lg leading-8 text-blue-50 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)] sm:text-xl">
            For nearly five decades, Mount View has delivered a distinctive
            British–Cambridge education — nurturing curious minds, shaping
            character, and preparing children for a lifetime of learning.
          </p>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            Growing minds. Inspiring futures. Blantyre, Malawi.
          </p>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            {HERO_BUTTONS.map((btn, index) => {
              const isPrimary = index === 0;

              return (
                <Link
                  key={btn.href}
                  href={btn.href}
                  className={
                    isPrimary
                      ? "inline-flex items-center justify-center rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
                      : "inline-flex items-center justify-center rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
                  }
                >
                  {btn.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 h-1.5 bg-[#FFE900]" />
      </section>

      {/* =========================================================
          SUBJECTS RIBBON
      ========================================================== */}
      <section
        aria-label="Subjects taught at Mount View"
        className="overflow-hidden border-y border-slate-200 bg-white py-4"
      >
        <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
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
          INTRODUCTION
      ========================================================== */}
      <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1250px] gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
              Our School
            </p>

            <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
              A place where
              <br />
              <span className="text-[#F58220]">every child matters.</span>
            </h2>
          </div>

          <div>
            <p className="text-base leading-8 text-slate-600">
              We believe that every child has unique talents, abilities and
              potential. At Mount View, we provide an engaging, supportive and
              stimulating environment where learners develop academically,
              socially and emotionally.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#252B68] hover:text-[#F58220]"
            >
              More About Mount View
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          SCHOOL AT A GLANCE
      ========================================================== */}
      <section className="bg-slate-50 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-[1250px]">
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
                Supporting children through Early Years, Key Stage 1, Lower
                Key Stage 2 and Upper Key Stage 2.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OUR STAGES — 2 grouped cards, deep-linked to /academics anchors
      ========================================================== */}
      <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1250px]">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
                Our Stages
              </p>

              <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
                Two Cambridge stages. One continuous journey.
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-7 text-slate-500">
              Every learner moves through Cambridge Early Years into Cambridge
              Primary — building confidence, knowledge and independence along
              the way.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {stageHighlights.map((item, index) => {
              const isOrange = index % 2 === 1;

              return (
                <article
                  key={item.number}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative isolate">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="aspect-[16/9] w-full"
                    />
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span
                      className={
                        isOrange
                          ? "absolute left-5 top-5 z-20 inline-flex items-center rounded-full bg-[#F58220] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-md"
                          : "absolute left-5 top-5 z-20 inline-flex items-center rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-md"
                      }
                    >
                      {item.number}
                    </span>
                  </div>

                  <div className="p-7 sm:p-8">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#F58220]">
                      {item.years}
                    </p>

                    <h3 className="text-2xl font-black text-[#252B68] sm:text-3xl">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                      {item.description}
                    </p>

                    <Link
                      href={item.href}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#252B68] transition hover:text-[#F58220]"
                    >
                      Discover this stage
                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY MOUNT VIEW
      ========================================================== */}
      <section className="bg-slate-50 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1250px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative isolate">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/creative-arts.jpg"
                alt="Learners participating in creative learning activities"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -right-3 z-20 max-w-[280px] rounded-2xl bg-[#FFE900] px-5 py-4 shadow-2xl sm:-right-7">
              <p className="text-xs font-black uppercase tracking-wider text-[#252B68]">
                Our values
              </p>
              <p className="mt-1.5 text-sm font-bold leading-snug text-[#252B68]">
                Integrity · Inclusion · Responsibility · Respect ·
                Collaboration · Well-being · Confidence · Empathy
              </p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
              Why Mount View
            </p>

            <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
              Helping every learner discover their potential.
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600">
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
      <section className="bg-[#252B68] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1250px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[3px] text-[#FFE900]">
              Learning at Mount View
            </p>

            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Learning that goes beyond the textbook.
            </h2>

            <p className="mt-5 text-lg leading-8 text-blue-100">
              Learners experience a broad range of academic, digital, creative,
              and physical opportunities designed to support their development.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {learningAreas.map((area, index) => {
              const isOrange = index % 2 === 1;

              return (
                <div
                  key={area.title}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-7 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  <div
                    className={
                      isOrange
                        ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F58220] text-xl font-black text-white transition group-hover:bg-white group-hover:text-[#252B68]"
                        : "flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-xl font-black text-[#252B68] transition group-hover:bg-white group-hover:text-[#252B68]"
                    }
                  >
                    {area.icon}
                  </div>

                  <h3 className="mt-6 text-xl font-black text-white">
                    {area.title}
                  </h3>

                  <p className="mt-3 leading-7 text-blue-100">
                    {area.description}
                  </p>
                </div>
              );
            })}
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
      <section className="bg-slate-50 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1250px]">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
              The Learner Journey
            </p>

            <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
              From discovery to confidence.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              We want learners to leave each stage of their journey with
              stronger knowledge, growing independence, and the confidence to
              embrace new opportunities.
            </p>
          </div>

          <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((item, index) => (
              <div
                key={item.step}
                className="relative overflow-hidden rounded-3xl bg-white pt-1 shadow-sm ring-1 ring-slate-100"
              >
                <div className={`h-1.5 w-full ${item.accent}`} />

                <div className="p-7">
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
                </div>

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
      <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1250px]">
          <div className="grid overflow-hidden rounded-[2rem] bg-[#FFE900] lg:grid-cols-2">
            <div className="relative min-h-[320px]">
              <ImageWithFallback
                src={schoolLifeImage}
                alt="Learners taking part in school activities"
                className="h-full min-h-[320px] w-full"
              />
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <p className="text-xs font-black uppercase tracking-[3px] text-[#252B68]">
                Extra Curricular Activities
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#252B68] sm:text-4xl">
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
                  "Fun & Educational Trips",
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
        <section className="bg-slate-50 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1250px]">
            <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
                  Gallery
                </p>

                <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
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

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
        <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1250px]">
            <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[3px] text-[#F58220]">
                  Life at Mount View
                </p>

                <h2 className="text-4xl font-black leading-tight text-[#252B68] sm:text-5xl">
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

            <div className="grid gap-6 md:grid-cols-3">
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
          </div>
        </section>
      )}

      {/* =========================================================
          QUICK NAVIGATION
      ========================================================== */}
      <section className="bg-slate-50 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1250px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_NAV_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-2xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${card.cardClass}`}
              >
                <p className={`text-sm font-black ${card.indexClass}`}>
                  {card.index}
                </p>

                <h3 className={`mt-2 text-xl font-black ${card.titleClass}`}>
                  {card.title}
                </h3>

                <p className={`mt-2 text-sm leading-6 ${card.descClass}`}>
                  {card.desc}
                </p>

                <span
                  className={`mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider ${card.accentClass}`}
                >
                  Explore
                  <span className="transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          MERGED FINAL CTA
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68] px-6 py-24 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#F58220]/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#FFE900]/10" />

        <div className="relative mx-auto max-w-[1250px]">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[3px] text-[#FFE900]">
                Join the Mount View Family
              </p>

              <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                Give your child a{" "}
                <span className="text-[#FFE900]">bright beginning.</span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Take the first step towards an inspiring educational journey.
                Start your child&apos;s application for admission to Mount View
                International Primary School &amp; Early Years Centre — our
                admissions team will guide you from first enquiry to your
                child&apos;s first day.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admissions"
                  className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
                >
                  Apply for Admission
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#252B68]"
                >
                  Contact Mount View
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm sm:p-9">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl text-[#252B68]">
                ♡
              </div>

              <h3 className="mt-6 text-2xl font-black leading-tight text-white">
                Guided by our core values.
              </h3>

              <p className="mt-4 leading-8 text-blue-100">
                These values sit at the heart of the Mount View experience and
                guide how we support learners as they grow in knowledge,
                confidence and independence.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {BRAND_VALUES.map((value) => (
                  <span
                    key={value}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black text-[#FFE900]"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BRAND STATEMENT
      ========================================================== */}
      <section className="bg-[#171B4A] px-4 py-10 text-center">
        <p className="text-lg font-black text-[#FFE900] sm:text-xl">
          Integrity · Inclusion · Responsibility · Respect · Collaboration ·
          Well-being · Confidence
        </p>

        <p className="mt-2 text-sm text-blue-200">
          Established in 1975 • Mount View International Primary School &amp;
          Early Years Centre
        </p>
      </section>
    </main>
  );
}