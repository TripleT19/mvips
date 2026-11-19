import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

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
  image_url: string | null;
};

type EventItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  start_time: string | null;
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

type House = {
  id: number;
  name: string;
  code: string | null;
  colour: string;
  image_url: string | null;
  featured_image_url: string | null;
  sort_order: number;
  points: number;
  position: number;
};

type HousesResponse = {
  data: House[];
  academic_year_name: string | null;
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
    "galleries",
    "gallery",
    "events",
    "stories",
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
      console.error(`[school-life] GET ${url} → ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (!text.trimStart().startsWith("{")) {
      console.error(`[school-life] GET ${url} returned non-JSON`);
      return null;
    }
    return JSON.parse(text);
  } catch (err) {
    console.error(`[school-life] GET ${url} failed:`, err);
    return null;
  }
}

async function getLatestGalleries(limit = 6): Promise<GalleryItem[]> {
  const json = await fetchJson(`/api/gallery?per_page=${limit}`);
  return extractArray<GalleryItem>(json);
}

async function getUpcomingEvents(limit = 6): Promise<EventItem[]> {
  const json = await fetchJson(`/api/events?per_page=${limit}`);
  return extractArray<EventItem>(json);
}

async function getLatestStories(limit = 6): Promise<Story[]> {
  const json = await fetchJson(
    `/api/stories?status=published&per_page=${limit}`
  );
  return extractArray<Story>(json);
}

async function getHouses(): Promise<HousesResponse> {
  const json = (await fetchJson(`/api/houses`)) as
    | { data?: House[]; academic_year_name?: string | null }
    | null;

  if (!json || !Array.isArray(json.data)) {
    return { data: [], academic_year_name: null };
  }
  return {
    data: json.data,
    academic_year_name: json.academic_year_name ?? null,
  };
}

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const trimmed = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${trimmed}`;
}

/* =========================================================
   COLOUR HELPERS
========================================================= */

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
   IMAGE POOL & MATCHING
========================================================= */

type ImagePoolItem = {
  url: string;
  title: string;
  description: string;
  class_name: string;
  source: "gallery" | "event" | "story";
};

function buildImagePool(
  galleries: GalleryItem[],
  events: EventItem[],
  stories: Story[]
): ImagePoolItem[] {
  const pool: ImagePoolItem[] = [];

  for (const g of galleries) {
    if (g.cover_image) {
      pool.push({
        url: resolveImageUrl(g.cover_image),
        title: g.title,
        description: g.description ?? "",
        class_name: "",
        source: "gallery",
      });
    }
    for (const img of g.images ?? []) {
      if (img.image_url) {
        pool.push({
          url: resolveImageUrl(img.image_url),
          title: g.title,
          description: g.description ?? "",
          class_name: "",
          source: "gallery",
        });
      }
    }
  }

  for (const e of events) {
    if (e.image_url) {
      pool.push({
        url: resolveImageUrl(e.image_url),
        title: e.title,
        description: e.description ?? "",
        class_name: e.class_name ?? "",
        source: "event",
      });
    }
  }

  for (const s of stories) {
    if (s.image_url) {
      pool.push({
        url: resolveImageUrl(s.image_url),
        title: s.title,
        description: s.excerpt ?? "",
        class_name: "",
        source: "story",
      });
    }
  }

  return pool;
}

function findImage(
  pool: ImagePoolItem[],
  keywords: string[],
  fallback: string
): { url: string; fromBackend: boolean; title?: string } {
  for (const item of pool) {
    const haystack =
      `${item.title} ${item.description} ${item.class_name}`.toLowerCase();
    if (keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return { url: item.url, fromBackend: true, title: item.title };
    }
  }
  return { url: fallback, fromBackend: false };
}

/* =========================================================
   STATIC BRAND CONTENT
========================================================= */

const experienceSlots = [
  {
    key: "sports",
    title: "Sports & House Competitions",
    text: "Physical activities that encourage teamwork, confidence, coordination and resilience. Students compete in the Fun Run, Sports Day, and Swimming Gala earning points for their Houses.",
    icon: "🏃",
    accent: "yellow" as const,
    keywords: ["sport", "athletic", "football", "soccer", "ball", "run", "gym", "fitness"],
    fallbackImage: "/images/sports.JPG",
  },
  {
    key: "swimming",
    title: "Swimming Curriculum",
    text: "With two on-campus pools, all Year 1 – 6 students participate in swim lessons between September and March. Three lifeguards are always on duty to ensure safety.",
    icon: "🏊",
    accent: "orange" as const,
    keywords: ["swim", "pool", "water", "aquatic"],
    fallbackImage: "/images/swimming.jpg",
  },
  {
    key: "ict",
    title: "ICT & Digital Learning",
    text: "Purposeful use of technology to support creativity, communication, research, and digital confidence.",
    icon: "💻",
    accent: "navy" as const,
    keywords: ["ict", "computer", "digital", "technolog", "laptop", "coding"],
    fallbackImage: "/images/ict.JPG",
  },
  {
    key: "clubs",
    title: "Skill Enhancement Clubs",
    text: "Clubs are held on Wednesdays from 11:30 am to 12:20 pm. Options include Football Club, Art Club, Music Club, Sports Club, Swimming Club, Gardening Club, Basketball Club, Drama Club, and Dance Club.",
    icon: "🎯",
    accent: "yellow" as const,
    keywords: ["club", "activity", "chess", "debate", "reading", "cooking"],
    fallbackImage: "/images/gardening.jpg",
  },
  {
    key: "arts",
    title: "Creative & Performing Arts",
    text: "Art, Music, Drama, and Dance come together to give learners space to express their imagination, discover new talents, and build confidence.",
    icon: "🎭",
    accent: "orange" as const,
    keywords: ["art", "paint", "draw", "craft", "creativ", "design", "music", "dance", "drama", "sing", "perform"],
    fallbackImage: "/images/creative-arts1.jpg",
  },
  {
    key: "trips",
    title: "Field Trips & Outings",
    text: "From local farms and nurseries to The Reserve banks and Lacaverna. Year 6 enjoys a residential trip to Game Haven for team building and independence.",
    icon: "🚌",
    accent: "navy" as const,
    keywords: ["trip", "excursion", "visit", "tour", "outdoor", "field", "journey", "adventure"],
    fallbackImage: "/images/trips.jpg",
  },
];

/* Fallback houses — used only if the API returns none yet. */
const FALLBACK_HOUSES: House[] = [
  {
    id: 1,
    name: "Sunbird House",
    code: "SUN",
    colour: "#DC2626",
    image_url: "/images/houses/sunbird.jpeg",
    featured_image_url: null,
    sort_order: 1,
    points: 0,
    position: 1,
  },
  {
    id: 2,
    name: "Baobab House",
    code: "BAO",
    colour: "#16A34A",
    image_url: "/images/houses/baobab.jpeg",
    featured_image_url: null,
    sort_order: 2,
    points: 0,
    position: 2,
  },
  {
    id: 3,
    name: "Eagle House",
    code: "EAG",
    colour: "#FACC15",
    image_url: "/images/houses/eagle.jpeg",
    featured_image_url: null,
    sort_order: 3,
    points: 0,
    position: 3,
  },
  {
    id: 4,
    name: "Lake House",
    code: "LAK",
    colour: "#2563EB",
    image_url: "/images/houses/lake.jpeg",
    featured_image_url: null,
    sort_order: 4,
    points: 0,
    position: 4,
  },
];

const leadershipRoles = [
  "Head Boy & Deputy Head Boy",
  "Head Girl & Deputy Head Girl",
  "Class Captains",
  "Culture Captains",
  "Sports Captains",
  "House Captains",
];

/* =========================================================
   HEAD BOY & HEAD GIRL SPEECHES
   — Written-only. If a speech has no quote AND no transcript,
     its card is hidden. If neither has content, the whole
     "A word from our leaders" block is hidden.
========================================================= */

type LeadershipSpeech = {
  role: "Head Boy" | "Head Girl";
  name: string;
  grade: string;
  initials: string;
  image: string | null;
  quote: string;
  transcript: string[];
};

const leadershipSpeeches: LeadershipSpeech[] = [
  {
    role: "Head Boy",
    name: "Head Boy",
    grade: "Year 6",
    initials: "HB",
    image: null, // e.g. "/images/head-boy.jpg"
    quote:
      "Being Head Boy has taught me that true leadership is about listening first, then acting with purpose.",
    transcript: [
      "When I first joined Mount View, I was shy and unsure of myself. Through the encouragement of my teachers, and the chance to lead in class and on the sports field, I slowly found my voice — and I want every learner to have that same chance.",
      "This year, I want every student to feel that they belong — whether they are brand new to Mount View or have been here since Early Years. I want us to celebrate each other's wins, in the pool, on Sports Day, and in the classroom.",
      "Thank you for trusting me to serve. Let's make this a year to remember.",
    ],
  },
  {
    role: "Head Girl",
    name: "Head Girl",
    grade: "Year 6",
    initials: "HG",
    image: null, // e.g. "/images/head-girl.jpg"
    quote:
      "Leadership is not a title — it is the small choices we make every day to lift others up.",
    transcript: [
      "Mount View has given me countless opportunities to grow — from the swimming pool to the drama stage, from the library to the House competitions. Each one has shaped the leader I am today.",
      "As Head Girl, I want every student to know that their voice matters. Whether you are in Year 1 or Year 6, your ideas, your kindness and your courage make our school stronger.",
      "I am excited to work alongside the Head Boy, our deputies, and all the class captains to build a year full of friendship, learning, and joy.",
    ],
  },
];

/** A speech only counts as "present" if it has a quote or a transcript. */
function hasSpeechContent(s: LeadershipSpeech): boolean {
  return s.quote.trim().length > 0 || s.transcript.some((p) => p.trim().length > 0);
}

/* =========================================================
   DAILY LIFE — `image` and `lines` are both optional.
   - Cards with an image render a photo header.
   - Cards without one render as clean text cards.
   - `lines` (if present) renders a structured list instead of
     the plain paragraph — used for the school schedule.
========================================================= */

type DailyLifeItem = {
  title: string;
  icon: string;
  image?: string;
  desc: string;
  lines?: string[];
};

const dailyLifeInfo: DailyLifeItem[] = [
  {
    title: "School Clinic",
    icon: "🏥",
    image: "/images/clinic.JPG",
    desc: "Our school nurse provides first aid. If a child is ill or injured, they are admitted to the clinic and parents are promptly informed by telephone.",
  },
  {
    title: "Healthy Eating",
    icon: "🍎",
    image: "/images/healthy-eating.jpg",
    desc: "We promote healthy eating aligned with Article 24 of the UN Convention. Packed lunches must include fruit/veg and avoid sweets, fizzy drinks, and strictly no nuts.",
  },
  {
    title: "Library & Reading",
    icon: "📚",
    image: "/images/library.JPG",
    desc: "Students visit the library weekly to choose a book at their reading level. Reading at home should be a pleasurable experience, not a chore.",
  },
  {
    /* No image — rendered as a clean text-only card. */
    title: "School Schedule",
    icon: "⏰",
    desc: "Monday to Thursday: 7:00 am to 12:30 pm. Friday: 7:00 am to 11:30 am. Afternoon clubs are on Wednesdays from 11:30 am to 12:20 pm.",
    lines: [
      "Monday – Thursday · 7:00 am – 12:30 pm",
      "Friday · 7:00 am – 11:30 am",
      "Skill Enhacenment Clubs (Wednesdays) · 11:30 am – 12:20 pm",
    ],
  },
];

const FALLBACK_GALLERY_PREVIEWS = [
  "/images/council.jpg",
  "/images/sports.JPG",
  "/images/creative-arts1.jpg",
  "/images/gardening.jpg",
  "/images/ict.JPG",
  "/images/competition.jpg",
  "/images/swimming.jpg",
  "/images/trips.jpg",
];

/* =========================================================
   PAGE
========================================================= */

export default async function SchoolLifePage() {
  const [galleries, events, stories, housesResponse] = await Promise.all([
    getLatestGalleries(6),
    getUpcomingEvents(6),
    getLatestStories(6),
    getHouses(),
  ]);

  const pool = buildImagePool(galleries, events, stories);

  const featuredGallery = galleries[0] ?? null;
  const secondGallery = galleries[1] ?? null;

  /* ---- Houses ---- */
  const hasLiveHouses = housesResponse.data.length > 0;
  const displayHouses: House[] = hasLiveHouses
    ? housesResponse.data
    : FALLBACK_HOUSES;

  const anyPoints = displayHouses.some((h) => h.points > 0);
  const showRankings = hasLiveHouses && anyPoints;
  const academicYearName = housesResponse.academic_year_name ?? null;

  /* ---- Slot resolution ---- */
  const heroImage =
    resolveImageUrl(featuredGallery?.cover_image) ||
    resolveImageUrl(pool[0]?.url) ||
    "/images/council.jpg";

  const introImage =
    resolveImageUrl(secondGallery?.cover_image) ||
    resolveImageUrl(
      featuredGallery?.images?.[1]?.image_url ?? featuredGallery?.cover_image
    ) ||
    "/images/council.jpg";

  const experienceImages: Record<
    string,
    { url: string; fromBackend: boolean; title?: string }
  > = {};

  for (const slot of experienceSlots) {
    experienceImages[slot.key] = findImage(
      pool,
      slot.keywords,
      slot.fallbackImage
    );
  }

  /* Banner image under the Head Boy / Head Girl speeches — fixed. */
  const teamSpiritImage = "/images/council.jpg";

  /* ---- Speeches that actually have something to show ---- */
  const activeSpeeches = leadershipSpeeches.filter(hasSpeechContent);

  /* ---- Gallery preview — deduplicated ---- */
  const galleryPreviewImages: string[] = [];
  const addUnique = (url: string | null | undefined) => {
    if (!url) return;
    if (galleryPreviewImages.length >= 4) return;
    if (galleryPreviewImages.includes(url)) return;
    galleryPreviewImages.push(url);
  };

  if (featuredGallery) {
    if (featuredGallery.cover_image) {
      addUnique(resolveImageUrl(featuredGallery.cover_image));
    }
    for (const img of featuredGallery.images ?? []) {
      if (galleryPreviewImages.length >= 4) break;
      if (img.image_url) addUnique(resolveImageUrl(img.image_url));
    }
  }
  if (secondGallery?.cover_image) {
    addUnique(resolveImageUrl(secondGallery.cover_image));
  }
  for (const item of pool) {
    if (galleryPreviewImages.length >= 4) break;
    addUnique(item.url);
  }
  for (const fb of FALLBACK_GALLERY_PREVIEWS) {
    if (galleryPreviewImages.length >= 4) break;
    addUnique(fb);
  }

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      <style>{`
        @keyframes mv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes mv-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes mv-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes mv-pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes mv-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .mv-float{animation:mv-float 6s ease-in-out infinite}
        .mv-float-alt{animation:mv-float-alt 7s ease-in-out infinite}
        .mv-blob{animation:mv-blob 16s ease-in-out infinite}
        .mv-pop{animation:mv-pop 3.5s ease-in-out infinite}
        .mv-marquee{animation:mv-marquee 35s linear infinite}

        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .speech-toggle-icon { transform: rotate(180deg); }
        details[open] .speech-label-closed { display: none; }
        details[open] .speech-label-open { display: inline; }
        .speech-label-open { display: none; }

        @media (prefers-reduced-motion: reduce){
          .mv-float,.mv-float-alt,.mv-blob,.mv-pop,.mv-marquee{animation:none}
        }
      `}</style>

      {/* =====================================================
          HERO — navy
      ====================================================== */}
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#252B68]">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Learners enjoying school life at Mount View International Primary School"
            className="h-full w-full"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-[#252B68]/80" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#252B68] via-[#252B68]/85 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#252B68] via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="mv-blob absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[6%] top-[20%] z-10 text-4xl opacity-80 sm:text-5xl">🏃</span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] top-[14%] z-10 text-4xl opacity-80 sm:text-5xl">🎭</span>
        <span className="mv-float pointer-events-none absolute left-[10%] bottom-[16%] z-10 text-3xl opacity-70 sm:text-4xl">🏊</span>
        <span className="mv-float-alt pointer-events-none absolute right-[12%] bottom-[18%] z-10 text-3xl opacity-70 sm:text-4xl">💻</span>

        <div className="relative z-20 mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Life at Mount View · Beyond the Classroom
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Where learning
              <span className="relative block text-[#FFE900]">
                comes alive.
                <svg
                  className="absolute -bottom-2 left-0 w-full max-w-md text-[#F58220]"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9c60-6 140-8 296-4"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              School life at Mount View is about more than lessons. It is about
              discovering talents, building friendships, creating memories, and
              growing into a confident young person.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-lg">Fun Run</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">Sports Day</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">Swimming Gala</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">House Points</span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/admissions" className="group rounded-full bg-[#F58220] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl">
                Apply for Admission
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/gallery" className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]">
                View Our Gallery
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* =====================================================
          MARQUEE STRIP — white with borders
      ====================================================== */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
          {[
            "Sports Day", "Swimming Gala", "Fun Run", "Afternoon Clubs", "Field Trips",
            "House Competitions", "Creative Arts", "Student Leadership", "ICT & Digital Learning",
            "Library & Reading", "School Clinic", "Healthy Eating",
            "Sports Day", "Swimming Gala", "Fun Run", "Afternoon Clubs", "Field Trips",
            "House Competitions", "Creative Arts", "Student Leadership", "ICT & Digital Learning",
            "Library & Reading", "School Clinic", "Healthy Eating",
          ].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-[#252B68]/70"
            >
              <span className="text-[#F58220]">✦</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* =====================================================
          INTRO — warm cream
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#FDF9EE] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <span className="mv-float pointer-events-none absolute left-[4%] top-12 text-5xl opacity-15">🌟</span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">💡</span>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              The Mount View Experience
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
              Every day is an opportunity to discover something new.
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              <p>
                At Mount View International Primary School &amp; Early Years
                Centre, we believe that some of the most important learning
                happens when children are actively involved in the life of the
                school.
              </p>
              <p>
                From the classroom to the sports field, swimming pools, ICT
                laboratory, creative spaces, and school events, learners have
                opportunities to develop skills, confidence, and positive
                relationships.
              </p>
              <p>
                We want children to look forward to coming to school, knowing
                that they will be encouraged to participate, explore their
                interests, and be part of something bigger than themselves.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-1 w-16 rounded-full bg-[#F58220]" />
              <p className="font-black text-[#252B68]">Fostering growth, excellence and empathy.</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admissions" className="group inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-lg">
                Apply for Admission
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 bg-white px-6 py-3 font-black text-[#252B68] transition hover:-translate-y-1 hover:border-[#252B68] hover:bg-[#252B68] hover:text-white">
                Book a Visit
              </Link>
            </div>
          </div>

          <div className="relative isolate">
            <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2rem] bg-[#FFE900]/40 blur-2xl" />
            <div className="relative z-10 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-slate-100">
              <ImageWithFallback src={introImage} alt="Learners enjoying activities at Mount View" className="aspect-[4/5] w-full sm:aspect-[4/3]" />
            </div>
            <div className="absolute -bottom-7 -left-5 z-20 rounded-2xl bg-[#FFE900] px-6 py-5 text-[#252B68] shadow-2xl sm:-left-8">
              <p className="text-3xl font-black">Every Child</p>
              <p className="mt-1 font-black">Has a place to shine.</p>
            </div>
            <span className="mv-float-alt pointer-events-none absolute -right-4 -top-4 z-20 text-4xl">✨</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE GRID — slate-50
      ====================================================== */}
      <section className="relative overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Explore School Life
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">Learning beyond the classroom.</h2>
            <p className="mt-5 leading-8 text-slate-600">
              Our learners experience a broad range of activities designed to develop the whole child.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {experienceSlots.map((slot) => {
              const resolved = experienceImages[slot.key];
              return (
                <article key={slot.title} className="group overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative isolate overflow-hidden">
                    <ImageWithFallback src={resolved.url} alt={slot.title} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105" />
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg transition group-hover:scale-110">
                      {slot.icon}
                    </div>
                    {resolved.fromBackend && (
                      <div className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                        Live
                      </div>
                    )}
                  </div>
                  <div className="p-7">
                    <div className={`mb-4 h-1 w-12 rounded-full ${slot.accent === "yellow" ? "bg-[#FFE900]" : slot.accent === "orange" ? "bg-[#F58220]" : "bg-[#252B68]"}`} />
                    <h3 className="text-xl font-black text-[#252B68]">{slot.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{slot.text}</p>
                    <Link href="/gallery" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#F58220] transition group-hover:gap-3">
                      See more <span>→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          HOUSE SYSTEM — navy
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <span className="mv-float pointer-events-none absolute left-[6%] top-16 text-5xl opacity-25">🏆</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-16 text-5xl opacity-25">🎉</span>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              The House System
            </p>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Fostering camaraderie and belonging.
            </h2>
            <p className="mt-5 leading-8 text-blue-100">
              Every student and staff member is assigned to one of four Houses.
              Throughout the year, students compete in events such as the Fun
              Run, Sports Day, and Swimming Gala, earning points for their
              respective Houses.
            </p>
            {academicYearName && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FFE900]/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFE900]" />
                Standings · {academicYearName}
              </p>
            )}
          </div>

          {showRankings ? (
            <>
              <div className="mt-14 overflow-hidden rounded-[2rem] border-2 border-[#FFE900]/50 bg-[#1c2260] shadow-2xl">
                <div className="grid lg:grid-cols-[1fr_1.1fr]">
                  <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FFE900]/12 via-transparent to-[#F58220]/10" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#252B68] shadow-lg">
                        🏆 Current Champion
                      </div>

                      <p className="mt-6 text-6xl font-black leading-none text-[#FFE900] sm:text-7xl lg:text-8xl">
                        {displayHouses[0].points.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#FFE900]/70">
                        points
                      </p>

                      <div className="mt-8 h-px w-16 bg-white/20" />

                      <h3 className="mt-6 text-2xl font-black text-white sm:text-3xl">
                        {displayHouses[0].name}
                      </h3>
                      {displayHouses[0].code && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                          {displayHouses[0].code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative min-h-[280px] lg:min-h-full">
                    {displayHouses[0].featured_image_url ? (
                      <ImageWithFallback
                        src={displayHouses[0].featured_image_url}
                        alt={displayHouses[0].name}
                        className="h-full w-full object-cover"
                      />
                    ) : displayHouses[0].image_url ? (
                      <>
                        <ImageWithFallback
                          src={displayHouses[0].image_url}
                          alt={displayHouses[0].name}
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-[#1c2260]/25" />
                        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/80 backdrop-blur">
                          Using house logo
                        </span>
                      </>
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ backgroundColor: displayHouses[0].colour }}
                      >
                        <span
                          className="text-6xl font-black sm:text-7xl"
                          style={{ color: contrastText(displayHouses[0].colour) }}
                        >
                          {(displayHouses[0].code || displayHouses[0].name)
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#1c2260]/60 lg:to-[#1c2260]" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                {displayHouses.map((house) => {
                  const isFirst = house.position === 1;
                  const textOnColour = contrastText(house.colour);

                  return (
                    <div
                      key={house.id}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 backdrop-blur-sm transition hover:-translate-y-0.5 sm:gap-4 sm:p-4 ${
                        isFirst
                          ? "border-[#FFE900]/60 bg-gradient-to-r from-[#FFE900]/15 to-white/5"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex shrink-0 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black shadow-lg sm:h-12 sm:w-12 sm:text-sm ${
                            isFirst
                              ? "bg-[#FFE900] text-[#252B68]"
                              : "bg-white/10 text-white/90"
                          }`}
                        >
                          {isFirst ? "🏆" : ordinal(house.position)}
                        </div>

                        <div className="min-w-[64px] text-left">
                          <p
                            className="text-2xl font-black leading-none"
                            style={{
                              color: isFirst ? "#FFE900" : house.colour,
                            }}
                          >
                            {house.points.toLocaleString()}
                          </p>
                          <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-white/50">
                            pts
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-white sm:text-lg">
                          {house.name}
                        </p>
                        {house.code && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                            {house.code}
                          </p>
                        )}
                      </div>

                      <div
                        className="h-14 w-14 shrink-0 overflow-hidden rounded-full sm:h-16 sm:w-16"
                        style={{ boxShadow: `0 0 0 2px ${house.colour}` }}
                      >
                        {house.image_url ? (
                          <ImageWithFallback
                            src={house.image_url}
                            alt={house.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-sm font-black"
                            style={{
                              backgroundColor: house.colour,
                              color: textOnColour,
                            }}
                          >
                            {(house.code || house.name).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-14 space-y-8">
              <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayHouses.map((house) => {
                  const textOnColour = contrastText(house.colour);
                  return (
                    <div
                      key={house.id}
                      className="flex items-center gap-3 rounded-xl p-4 font-black shadow-md transition hover:scale-[1.03]"
                      style={{
                        backgroundColor: house.colour,
                        color: textOnColour,
                      }}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-white/60">
                        {house.image_url ? (
                          <ImageWithFallback
                            src={house.image_url}
                            alt={house.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-xs font-black"
                            style={{ color: house.colour }}
                          >
                            {(house.code || house.name).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="leading-tight">{house.name}</span>
                    </div>
                  );
                })}
              </div>

              <p className="mx-auto max-w-2xl text-center text-sm font-bold uppercase tracking-[0.2em] text-blue-100/70">
                Points will appear here as competitions get underway.
              </p>
            </div>
          )}

          <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/admissions"
              className="group inline-flex items-center gap-2 rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-lg"
            >
              Apply for Admission
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
            >
              View House Photos
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          STUDENT LEADERSHIP — white
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <span className="mv-float pointer-events-none absolute left-[3%] top-12 text-5xl opacity-15">🎤</span>
        <span className="mv-float-alt pointer-events-none absolute right-[3%] bottom-12 text-5xl opacity-15">🏛️</span>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Student Leadership
              </p>
              <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
                Developing vital skills for the future.
              </h2>
            </div>
            <p className="leading-8 text-slate-600 md:text-right">
              At MVIPS, we believe it is essential for students to have
              opportunities to exercise agency while cultivating leadership and
              teamwork abilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leadershipRoles.map((role, index) => (
              <div
                key={role}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#F58220]/50 hover:bg-white hover:shadow-lg"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252B68] text-sm font-black text-white transition group-hover:scale-110 group-hover:bg-[#F58220]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="font-bold text-[#252B68]">{role}</p>
              </div>
            ))}
          </div>

          {/* ---- Head Boy & Head Girl — written speeches only ---- */}
          {activeSpeeches.length > 0 && (
            <div className="mt-16">
              <div className="mx-auto max-w-3xl text-center">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  A word from our leaders
                </p>
                <h3 className="mt-4 text-2xl font-black text-[#252B68] sm:text-3xl">
                  Head Boy &amp; Head Girl Speeches
                </h3>
                <p className="mt-4 leading-8 text-slate-600">
                  Read the full speeches written by our Head Boy and Head Girl.
                </p>
              </div>

              <div
                className={`mt-10 grid gap-6 ${
                  activeSpeeches.length === 1
                    ? "mx-auto max-w-2xl"
                    : "lg:grid-cols-2"
                }`}
              >
                {activeSpeeches.map((speech) => {
                  const accent =
                    speech.role === "Head Boy" ? "#F58220" : "#252B68";

                  return (
                    <article
                      key={speech.role}
                      className="group relative overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div
                        className="h-2 w-full"
                        style={{ backgroundColor: accent }}
                      />

                      <div className="p-5 sm:p-7">
                        <span
                          className="block text-5xl font-black leading-none"
                          style={{ color: `${accent}33` }}
                          aria-hidden="true"
                        >
                          &ldquo;
                        </span>

                        {speech.quote.trim().length > 0 && (
                          <p className="text-lg font-bold italic leading-relaxed text-[#252B68] sm:text-xl">
                            {speech.quote}
                          </p>
                        )}

                        <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5">
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full font-black text-white shadow-lg"
                            style={{ backgroundColor: accent }}
                          >
                            {speech.image ? (
                              <ImageWithFallback
                                src={speech.image}
                                alt={speech.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm tracking-wider">
                                {speech.initials}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-black text-[#252B68]">
                              {speech.name}
                            </p>
                            <p
                              className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: accent }}
                            >
                              {speech.role} · {speech.grade}
                            </p>
                          </div>
                        </div>

                        {speech.transcript.length > 0 && (
                          <details className="mt-6 rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
                            <summary
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-[#252B68] transition hover:bg-slate-100"
                              aria-label={`Toggle ${speech.role} speech`}
                            >
                              <span className="flex items-center gap-2">
                                <span aria-hidden="true">📄</span>
                                <span className="speech-label-closed">
                                  Read the full speech
                                </span>
                                <span className="speech-label-open">
                                  Hide speech
                                </span>
                              </span>
                              <svg
                                className="speech-toggle-icon h-4 w-4 shrink-0 text-[#252B68] transition-transform duration-200"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </summary>

                            <div className="space-y-3 border-t border-slate-200/70 px-4 py-4">
                              {speech.transcript.map((para, i) => (
                                <p
                                  key={i}
                                  className="text-sm leading-7 text-slate-600"
                                >
                                  {para}
                                </p>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Council banner — always council.jpg ---- */}
          <div className="mt-12 overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-slate-100">
            <div className="relative aspect-[16/6] w-full">
              <ImageWithFallback
                src={teamSpiritImage}
                alt="Student leadership at Mount View"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#252B68] via-[#252B68]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFE900]">
                  Growing leaders
                </p>
                <p className="mt-2 max-w-2xl text-xl font-black text-white sm:text-2xl">
                  Real responsibility, real skills — the leadership system is
                  where confidence meets service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DAILY LIFE & WELLBEING — yellow
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#FFE900] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <span className="mv-float pointer-events-none absolute left-[5%] top-8 text-5xl opacity-30">🍎</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-8 text-5xl opacity-30">💛</span>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Daily Life &amp; Wellbeing
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              Keeping our students healthy and happy.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {dailyLifeInfo.map((info) => {
              const hasImage = Boolean(info.image);
              return (
                <article
                  key={info.title}
                  className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {hasImage && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <ImageWithFallback
                        src={info.image as string}
                        alt={info.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 text-2xl shadow-lg backdrop-blur transition group-hover:scale-110">
                        {info.icon}
                      </div>
                    </div>
                  )}

                  {/* No-image cards vertically centre their content so the
                      card still looks intentional next to photo cards. */}
                  <div
                    className={`p-6 sm:p-7 ${
                      hasImage ? "" : "flex flex-1 flex-col justify-center"
                    }`}
                  >
                    {hasImage ? (
                      <h3 className="text-xl font-black text-[#252B68]">
                        {info.title}
                      </h3>
                    ) : (
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE900] text-2xl shadow-sm">
                          {info.icon}
                        </div>
                        <h3 className="text-xl font-black text-[#252B68]">
                          {info.title}
                        </h3>
                      </div>
                    )}

                    {info.lines ? (
                      <ul className="mt-3 space-y-2.5">
                        {info.lines.map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2.5 text-slate-600"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F58220]" />
                            <span className="font-medium leading-7">
                              {line}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 leading-7 text-slate-600">
                        {info.desc}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          GALLERY PROMOTION — warm cream
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#FDF9EE] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {galleryPreviewImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className={`group overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  index === 1 ? "mt-8" : ""
                } ${index === 2 ? "-mt-4" : ""}`}
              >
                <ImageWithFallback
                  src={src}
                  alt={`Mount View school life ${index + 1}`}
                  className="aspect-square w-full transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              See Mount View in Action
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              The best way to experience school life is to see it.
            </h2>
            <p className="mt-6 leading-8 text-slate-600">
              Explore our gallery and discover some of the experiences,
              activities, and moments that make life at Mount View special.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/gallery" className="group rounded-full bg-[#252B68] px-7 py-3.5 text-center font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#171B4A] hover:shadow-xl">
                Explore Our Gallery
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/news" className="rounded-full border-2 border-[#252B68] bg-white px-7 py-3.5 text-center font-black text-[#252B68] transition hover:-translate-y-1 hover:bg-[#252B68] hover:text-white">
                School News
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOR FAMILIES — orange band
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#F58220] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#FFE900]/25 blur-3xl" />
        <span className="mv-float pointer-events-none absolute left-[8%] top-10 text-4xl opacity-30">👨‍👩‍👧</span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] bottom-10 text-4xl opacity-30">📖</span>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            For Families
          </p>

          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Give your child a school experience they can grow into.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/90">
            We value the role parents and families play in supporting children
            as they grow. Our homework is designed to nurture a love of reading
            and to strengthen literacy skills.
          </p>

          <p className="mx-auto mt-4 inline-block max-w-3xl rounded-full bg-white/15 px-5 py-2 text-base font-bold text-white ring-1 ring-white/30 backdrop-blur-sm">
            Homework is assigned every Tuesday and should be returned the
            following Monday.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/admissions" className="group rounded-full bg-white px-8 py-4 font-black text-[#F58220] shadow-xl transition hover:-translate-y-1 hover:bg-[#FFE900] hover:text-[#252B68] hover:shadow-2xl">
              Apply for Admission
              <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/contact" className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#F58220]">
              Contact the School
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}