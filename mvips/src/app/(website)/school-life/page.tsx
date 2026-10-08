import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/* =========================================================
   API / BACKEND HELPERS
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getLatestGalleries(limit = 6): Promise<GalleryItem[]> {
  const res = await fetchJson<{ data: { data: GalleryItem[] } }>(
    `/api/gallery?per_page=${limit}`
  );
  return res?.data?.data ?? [];
}

async function getUpcomingEvents(limit = 6): Promise<EventItem[]> {
  const res = await fetchJson<{ data: { data: EventItem[] } }>(
    `/api/events?per_page=${limit}`
  );
  return res?.data?.data ?? [];
}

async function getLatestStories(limit = 6): Promise<Story[]> {
  const res = await fetchJson<{ data: { data: Story[] } }>(
    `/api/stories?per_page=${limit}`
  );
  return res?.data?.data ?? [];
}

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const trimmed = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${trimmed}`;
}

/* =========================================================
   IMAGE POOL & MATCHING
   ---------------------------------------------------------
   Build a pool of every image the backend currently has
   (galleries, events, stories) tagged with its title,
   description and class name. Slots on this page then pick
   the best match by keyword; if nothing matches, they fall
   back to the static brand image below.
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

    for (const img of g.images) {
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
    title: "Sports & Fitness",
    text: "Children develop teamwork, discipline, coordination and confidence through active participation in sports and physical activities.",
    icon: "🏃",
    accent: "yellow",
    keywords: [
      "sport",
      "athletic",
      "football",
      "soccer",
      "ball",
      "run",
      "gym",
      "fitness",
      "netball",
    ],
    fallbackImage: "/images/sports.jpg",
  },
  {
    key: "swimming",
    title: "Swimming",
    text: "Swimming provides opportunities for learners to develop confidence, water safety awareness and physical skills.",
    icon: "🏊",
    accent: "orange",
    keywords: ["swim", "pool", "water", "aquatic"],
    fallbackImage: "/images/gallery/school-3.jpg",
  },
  {
    key: "ict",
    title: "ICT & Digital Learning",
    text: "Learners explore technology, computing and digital creativity while developing responsible digital skills for the future.",
    icon: "💻",
    accent: "navy",
    keywords: [
      "ict",
      "computer",
      "digital",
      "technolog",
      "laptop",
      "coding",
      "code",
      "programming",
    ],
    fallbackImage: "/images/ict.jpg",
  },
  {
    key: "steam",
    title: "STEAM & Innovation",
    text: "Children investigate ideas, solve problems, design solutions and explore the exciting connections between science, technology and creativity.",
    icon: "🚀",
    accent: "yellow",
    keywords: [
      "steam",
      "stem",
      "science",
      "robot",
      "experiment",
      "laboratory",
      "lab",
      "innovation",
    ],
    fallbackImage: "/images/steam.jpg",
  },
  {
    key: "arts",
    title: "Creative Arts",
    text: "Art gives learners space to express their imagination, develop creativity and discover new ways of communicating ideas.",
    icon: "🎨",
    accent: "orange",
    keywords: ["art", "paint", "draw", "craft", "creativ", "design"],
    fallbackImage: "/images/creative-arts.jpg",
  },
  {
    key: "performing",
    title: "Music, Dance & Drama",
    text: "Through performance and creative expression, learners develop confidence, communication, teamwork and self-expression.",
    icon: "🎭",
    accent: "navy",
    keywords: [
      "music",
      "dance",
      "drama",
      "sing",
      "perform",
      "theatre",
      "concert",
      "choir",
    ],
    fallbackImage: "/images/gallery/school-4.jpg",
  },
];

const schoolLifeCards = [
  {
    icon: "🤝",
    title: "Friendships",
    text: "Children build positive friendships, learn to cooperate and develop a sense of belonging within the school community.",
  },
  {
    icon: "🏆",
    title: "Competitions",
    text: "Learners have opportunities to challenge themselves, demonstrate their talents and celebrate achievement.",
  },
  {
    icon: "🌟",
    title: "Leadership",
    text: "Children are encouraged to take responsibility, contribute ideas and develop leadership qualities.",
  },
  {
    icon: "🎯",
    title: "Clubs & Activities",
    text: "A variety of activities give learners opportunities to discover interests beyond the traditional classroom.",
  },
  {
    icon: "💡",
    title: "Creativity",
    text: "Learners are encouraged to imagine, create, experiment and find their own ways to express ideas.",
  },
  {
    icon: "❤️",
    title: "Community",
    text: "We promote respect, kindness, empathy and positive relationships across our school community.",
  },
];

const learnerJourney = [
  {
    number: "01",
    title: "Discover",
    text: "Children explore new ideas, activities and interests.",
  },
  {
    number: "02",
    title: "Participate",
    text: "Learners are encouraged to get involved and try new experiences.",
  },
  {
    number: "03",
    title: "Develop",
    text: "Children build knowledge, skills, confidence and independence.",
  },
  {
    number: "04",
    title: "Thrive",
    text: "Learners celebrate their progress and discover their potential.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default async function SchoolLifePage() {
  const [galleries, events, stories] = await Promise.all([
    getLatestGalleries(6),
    getUpcomingEvents(6),
    getLatestStories(6),
  ]);

  const pool = buildImagePool(galleries, events, stories);

  const featuredGallery = galleries[0] ?? null;
  const secondGallery = galleries[1] ?? null;

  /* ---- Slot resolution ---- */

  const heroImage =
    resolveImageUrl(featuredGallery?.cover_image) ||
    resolveImageUrl(pool[0]?.url) ||
    "/images/gallery/school-1.jpg";

  const introImage =
    resolveImageUrl(secondGallery?.cover_image) ||
    resolveImageUrl(
      featuredGallery?.images?.[1]?.image_url ?? featuredGallery?.cover_image
    ) ||
    "/images/gallery/school-2.jpg";

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

  const featureStripImage = findImage(
    pool,
    ["steam", "stem", "science", "robot", "ict", "technolog", "innovation"],
    "/images/steam.jpg"
  );

  const teamSpiritImage = findImage(
    pool,
    [
      "competition",
      "sport",
      "tournament",
      "match",
      "team",
      "house",
      "athletic",
    ],
    "/images/competitions.jpg"
  );

  /* Gallery preview grid — actual images from the latest gallery,
     padded with the next gallery's cover if we don't have enough. */
  const galleryPreviewImages: string[] = [];
  if (featuredGallery) {
    if (featuredGallery.cover_image) {
      galleryPreviewImages.push(resolveImageUrl(featuredGallery.cover_image));
    }
    for (const img of featuredGallery.images) {
      if (img.image_url) {
        galleryPreviewImages.push(resolveImageUrl(img.image_url));
      }
    }
  }
  if (galleryPreviewImages.length < 4 && secondGallery?.cover_image) {
    galleryPreviewImages.push(resolveImageUrl(secondGallery.cover_image));
  }
  if (galleryPreviewImages.length < 4) {
    for (const item of pool) {
      if (galleryPreviewImages.length >= 4) break;
      if (!galleryPreviewImages.includes(item.url)) {
        galleryPreviewImages.push(item.url);
      }
    }
  }
  while (galleryPreviewImages.length < 4) {
    galleryPreviewImages.push("/images/gallery/school-1.jpg");
  }

  return (
    <main className="overflow-hidden bg-white">
      {/* =====================================================
          HERO — ADVERTISING
      ====================================================== */}
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#252B68]">
        {/* Base image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Learners enjoying school life at Mount View International Primary School"
            className="h-full w-full"
          />
        </div>

        {/* Overlays — pointer-events-none, sit above image but below text */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[#252B68]/80" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#252B68] via-[#252B68]/85 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#252B68] via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-20 mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Life at Mount View · Since 1975
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Where learning
              <span className="block text-[#FFE900]">comes alive.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              School life at Mount View is about more than lessons. It is
              about discovering talents, building friendships, creating
              memories and growing into a confident young person.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-lg">
                Learn
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Create
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Explore
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Belong
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/admissions"
                className="rounded-full bg-[#F58220] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12]"
              >
                Discover Mount View
              </Link>

              <Link
                href="/gallery"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur-sm transition hover:bg-white hover:text-[#252B68]"
              >
                View Our Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* =====================================================
          INTRO
      ====================================================== */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              The Mount View Experience
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
              Every day is an opportunity to discover something new.
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              <p>
                At Mount View International Primary School & Early Years
                Centre, we believe that some of the most important learning
                happens when children are actively involved in the life of the
                school.
              </p>

              <p>
                From the classroom to the sports field, swimming activities,
                ICT laboratory, creative spaces and school events, learners
                have opportunities to develop skills, confidence and positive
                relationships.
              </p>

              <p>
                We want children to look forward to coming to school, knowing
                that they will be encouraged to participate, explore their
                interests and be part of something bigger than themselves.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-1 w-16 rounded-full bg-[#F58220]" />
              <p className="font-black text-[#252B68]">
                Fostering growth, excellence and empathy.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:bg-[#d96e12]"
              >
                Start Your Application
                <span>→</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3 font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
              >
                Book a Visit
              </Link>
            </div>
          </div>

          {/* Image with explicit stacking */}
          <div className="relative isolate">
            <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2rem] bg-[#FFE900]/30 blur-2xl" />

            <div className="relative z-10 overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src={introImage}
                alt="Learners enjoying activities at Mount View"
                className="aspect-[4/5] w-full sm:aspect-[4/3]"
              />
            </div>

            <div className="absolute -bottom-7 -left-5 z-20 rounded-2xl bg-[#FFE900] px-6 py-5 text-[#252B68] shadow-2xl sm:-left-8">
              <p className="text-3xl font-black">Every Child</p>
              <p className="mt-1 font-black">Has a place to shine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE GRID
      ====================================================== */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              Explore School Life
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Learning beyond the classroom.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Our learners experience a broad range of activities designed to
              develop the whole child.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {experienceSlots.map((slot) => {
              const resolved = experienceImages[slot.key];

              return (
                <article
                  key={slot.title}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {/* Image wrapper — isolate + explicit z for overlays */}
                  <div className="relative isolate overflow-hidden">
                    <ImageWithFallback
                      src={resolved.url}
                      alt={slot.title}
                      className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105"
                    />

                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <div className="absolute left-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg">
                      {slot.icon}
                    </div>

                    {resolved.fromBackend && (
                      <div className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                        Live
                      </div>
                    )}
                  </div>

                  <div className="p-7">
                    <div
                      className={`mb-4 h-1 w-12 rounded-full ${
                        slot.accent === "yellow"
                          ? "bg-[#FFE900]"
                          : slot.accent === "orange"
                            ? "bg-[#F58220]"
                            : "bg-[#252B68]"
                      }`}
                    />

                    <h3 className="text-xl font-black text-[#252B68]">
                      {slot.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {slot.text}
                    </p>

                    <Link
                      href="/gallery"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#F58220] transition group-hover:gap-3"
                    >
                      See more
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12]"
            >
              Enrol Your Child
              <span>→</span>
            </Link>

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68] px-7 py-3.5 font-black text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
            >
              Explore Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURE STRIP — TECHNOLOGY & INNOVATION
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-[#FFE900]">
              Technology & Innovation
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Preparing children for a changing world.
            </h2>

            <p className="mt-6 leading-8 text-blue-100">
              Technology is part of the learning experience at Mount View.
              Learners develop practical ICT skills while exploring creativity,
              problem-solving, digital communication and responsible technology
              use.
            </p>

            <p className="mt-4 leading-8 text-blue-100">
              Through ICT and STEAM activities, children are encouraged to
              become creators, problem-solvers and confident digital learners.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                "ICT Skills",
                "Digital Creativity",
                "Problem Solving",
                "STEAM Learning",
                "Innovation",
                "Responsible Technology",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm"
                >
                  <span className="mr-2 text-[#FFE900]">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/academics"
                className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:bg-[#d96e12]"
              >
                Explore Academics
                <span>→</span>
              </Link>

              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3 font-black text-white transition hover:bg-white hover:text-[#252B68]"
              >
                Apply Now
              </Link>
            </div>
          </div>

          <div className="relative isolate">
            <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2rem] bg-[#FFE900]/10 blur-2xl" />

            <div className="relative z-10 overflow-hidden rounded-[2rem] border-4 border-white/10 shadow-2xl">
              <ImageWithFallback
                src={featureStripImage.url}
                alt="STEAM learning at Mount View"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -right-4 z-20 rounded-2xl bg-[#F58220] px-6 py-5 text-white shadow-2xl sm:-right-8">
              <p className="text-xs font-black uppercase tracking-widest text-orange-100">
                Future Ready
              </p>
              <p className="mt-1 text-lg font-black">
                Imagine. Create. Solve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMMUNITY
      ====================================================== */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
                Our Community
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                Growing together.
              </h2>
            </div>

            <p className="leading-8 text-slate-600 md:text-right">
              School life is also about relationships, responsibility,
              participation and the experiences that help children become
              confident members of their community.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schoolLifeCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#FFE900] hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl transition group-hover:bg-[#FFE900]">
                  {card.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-[#252B68]">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          TEAM SPIRIT
      ====================================================== */}
      <section className="bg-[#FFE900] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-[#252B68]">
              Team Spirit
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Learning the value of teamwork.
            </h2>

            <p className="mt-6 leading-8 text-[#252B68]/80">
              School activities provide learners with opportunities to work
              together, support one another and celebrate the achievements of
              their peers.
            </p>

            <p className="mt-4 leading-8 text-[#252B68]/80">
              Through competitions, sports, performances, challenges and school
              events, children learn that success is not only about individual
              achievement — it is also about collaboration, encouragement and
              being part of a team.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#252B68] px-5 py-2.5 text-sm font-bold text-white">
                Teamwork
              </span>
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white">
                Leadership
              </span>
              <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68]">
                Respect
              </span>
              <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68]">
                Confidence
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full bg-[#252B68] px-6 py-3 font-black text-white transition hover:bg-[#171B4A]"
              >
                Enrol Your Child
                <span>→</span>
              </Link>

              <Link
                href="/news"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/30 px-6 py-3 font-black text-[#252B68] transition hover:bg-white"
              >
                School News
              </Link>
            </div>
          </div>

          <div className="relative isolate">
            <div className="relative z-10 overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl">
              <ImageWithFallback
                src={teamSpiritImage.url}
                alt="Learners participating in school competitions"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -right-4 z-20 rounded-2xl bg-[#252B68] px-6 py-5 text-white shadow-2xl sm:-right-8">
              <p className="text-2xl font-black">Together</p>
              <p className="text-sm font-medium text-blue-100">
                We learn. We grow. We achieve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LEARNER JOURNEY
      ====================================================== */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              The Learner Journey
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              From curiosity to confidence.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              We want every child to leave each experience with something new:
              a skill, an idea, a friendship, a challenge overcome or a reason
              to be proud.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {learnerJourney.map((item, index) => (
              <div
                key={item.number}
                className="relative rounded-[2rem] bg-white p-8 shadow-lg"
              >
                <span
                  className={`text-6xl font-black ${
                    index % 3 === 0
                      ? "text-[#252B68]/10"
                      : index % 3 === 1
                        ? "text-[#F58220]/20"
                        : "text-[#FFE900]"
                  }`}
                >
                  {item.number}
                </span>

                <h3 className="mt-5 text-xl font-black text-[#252B68]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          GALLERY PROMOTION — images pulled from the latest gallery
      ====================================================== */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {galleryPreviewImages.slice(0, 4).map((src, index) => (
              <div
                key={`${src}-${index}`}
                className={`overflow-hidden rounded-3xl shadow-lg ${
                  index === 1 ? "mt-8" : ""
                } ${index === 2 ? "-mt-4" : ""}`}
              >
                <ImageWithFallback
                  src={src}
                  alt={`Mount View school life ${index + 1}`}
                  className="aspect-square w-full"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              See Mount View in Action
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              The best way to experience school life is to see it.
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              Explore our gallery and discover some of the experiences,
              activities and moments that make life at Mount View special.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/gallery"
                className="rounded-full bg-[#252B68] px-7 py-3.5 text-center font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#171B4A]"
              >
                Explore Our Gallery
              </Link>

              <Link
                href="/news"
                className="rounded-full border-2 border-[#252B68] px-7 py-3.5 text-center font-black text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
              >
                School News
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PARENT PROMOTION
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="font-black uppercase tracking-[0.2em] text-[#FFE900]">
            For Families
          </p>

          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Give your child a school experience they can grow into.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            At Mount View, we want children to experience school as a place
            where they can learn, make friends, discover their talents, take on
            challenges and become increasingly confident in who they are.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/admissions"
              className="rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12]"
            >
              Explore Admissions
            </Link>

            <Link
              href="/contact"
              className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
            >
              Contact the School
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND STATEMENT
      ====================================================== */}
      <section className="border-t border-slate-100 bg-white px-4 py-14 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-2xl font-black text-[#252B68] sm:text-3xl">
            Fostering <span className="text-[#F58220]">growth</span>,{" "}
            <span className="text-[#252B68]">excellence</span> and{" "}
            <span className="text-[#F58220]">empathy</span>.
          </p>

          <p className="mt-3 text-sm font-medium text-slate-500">
            Mount View International Primary School & Early Years Centre
          </p>
        </div>
      </section>
    </main>
  );
}