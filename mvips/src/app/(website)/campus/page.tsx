import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";
import VideoPlayer, { VideoSource } from "../../components/VideoPlayer";
import CampusGallery, { GalleryPhoto } from "../../components/CampusGallery";

/* =========================================================
   STATIC CAMPUS CONTENT
========================================================= */

type Facility = {
  key: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  features: string[];
  accent: "yellow" | "orange" | "navy";
};

const facilities: Facility[] = [
  {
    key: "pools",
    title: "Swimming Pools",
    description:
      "Two on-campus pools built for learning and competition. Every Year 1 – 6 student takes part in swim lessons between September and March, guided by qualified instructors.",
    icon: "🏊",
    image: "/images/swimming.jpg",
    features: [
      "Two heated on-campus pools",
      "Three qualified lifeguards on duty",
      "Curriculum swim lessons for Year 1 – 6",
      "Swimming Gala & House competitions",
    ],
    accent: "orange",
  },
  {
    key: "sports",
    title: "Sports Fields & Courts",
    description:
      "Open green space and courts that host Sports Day, the Fun Run, football, basketball, and House competitions. Sport is a core part of the Mount View experience.",
    icon: "🏃",
    image: "/images/sports.JPG",
    features: [
      "Full-size sports field",
      "Basketball & netball courts",
      "Fun Run track",
      "Sports Day & House events",
    ],
    accent: "yellow",
  },
  {
    key: "ict",
    title: "ICT & Digital Learning Lab",
    description:
      "Purposeful technology to support creativity, communication, research and digital confidence — from coding to digital design, our ICT lab is busy every day.",
    icon: "💻",
    image: "/images/ict.JPG",
    features: [
      "Dedicated ICT laboratory",
      "Class set of laptops & tablets",
      "Coding, digital art, research",
      "Afternoon ICT Club",
    ],
    accent: "navy",
  },
  {
    key: "library",
    title: "Library & Reading Room",
    description:
      "A calm, welcoming space where every student visits weekly to choose a book at their reading level. Reading for pleasure is a cornerstone of life at Mount View.",
    icon: "📚",
    image: "/images/library.jpg",
    features: [
      "Weekly library visits for all classes",
      "Levelled reading collection",
      "Quiet reading & research space",
      "Book clubs & reading challenges",
    ],
    accent: "orange",
  },
  {
    key: "creative",
    title: "Creative & Performing Arts",
    description:
      "Art studio, music room, and performance spaces give learners the chance to express their imagination, discover new talents, and build confidence on and off stage.",
    icon: "🎭",
    image: "/images/creative-arts1.jpg",
    features: [
      "Dedicated art studio",
      "Music & drama rooms",
      "Performance & assembly hall",
      "Afternoon Arts, Music, Drama & Dance Clubs",
    ],
    accent: "yellow",
  },
  {
    key: "earlyyears",
    title: "Early Years Centre",
    description:
      "A warm, secure environment purpose-built for our youngest learners — with its own play areas, outdoor learning spaces and age-appropriate classrooms.",
    icon: "🧸",
    image: "/images/early-years.jpg",
    features: [
      "Dedicated Early Years building",
      "Outdoor play & discovery garden",
      "Age-appropriate learning resources",
      "Caring, qualified EY staff",
    ],
    accent: "navy",
  },
  {
    key: "clinic",
    title: "School Clinic",
    description:
      "Our school nurse provides first aid and looks after any child who feels unwell or is injured. Parents are informed promptly by telephone whenever a child visits.",
    icon: "🏥",
    image: "/images/school-clinic.jpg",
    features: [
      "Full-time qualified nurse",
      "First aid & ongoing care",
      "Rest beds & medication storage",
      "Direct parent communication",
    ],
    accent: "orange",
  },
  {
    key: "dining",
    title: "Dining & Healthy Eating",
    description:
      "A clean, supervised space where learners eat and learn healthy habits — aligned with Article 24 of the UN Convention on the Rights of the Child.",
    icon: "🍎",
    image: "/images/healthy-eating.jpg",
    features: [
      "Supervised dining area",
      "Healthy lunch policy",
      "Nut-free environment",
      "Water & hydration encouraged",
    ],
    accent: "yellow",
  },
];

const stats = [
  { value: "2", label: "Swimming Pools" },
  { value: "8+", label: "Facilities & Learning Spaces" },
  { value: "3", label: "Lifeguards On Duty" },
  { value: "100%", label: "Students Swim Weekly" },
];

/* =========================================================
   CAMPUS VIDEO TOUR
   — Replace the YouTube IDs with your own unlisted videos.
========================================================= */

type CampusVideo = {
  title: string;
  description: string;
  video: VideoSource;
};

const campusVideos: CampusVideo[] = [
  {
    title: "Full Campus Tour",
    description:
      "A guided walk around Mount View International Primary School & Early Years Centre — from the entrance to the sports fields, swimming pools and classrooms.",
    // Replace with your own unlisted YouTube ID
    video: { type: "youtube", id: "dQw4w9WgXcQ" },
  },
  {
    title: "Sports & Swimming Facilities",
    description:
      "See our sports fields, basketball courts, and two on-campus swimming pools — where the Fun Run, Sports Day, and Swimming Gala come to life.",
    video: { type: "youtube", id: "dQw4w9WgXcQ" },
  },
  {
    title: "Learning Spaces",
    description:
      "Inside our classrooms, library, ICT lab, and creative arts studios — the spaces where the Mount View learning journey happens every day.",
    video: { type: "youtube", id: "dQw4w9WgXcQ" },
  },
];

/* =========================================================
   CAMPUS GALLERY
========================================================= */

const galleryCategories = [
  { key: "all", label: "All Photos", icon: "✨" },
  { key: "learning", label: "Learning", icon: "📚" },
  { key: "sports", label: "Sports", icon: "🏃" },
  { key: "creative", label: "Creative Arts", icon: "🎨" },
  { key: "wellbeing", label: "Wellbeing", icon: "💛" },
  { key: "outdoor", label: "Outdoor", icon: "🌿" },
];

const galleryPhotos: GalleryPhoto[] = [
  { src: "/images/council.jpg", alt: "School council on campus", category: "learning", caption: "Student Council" },
  { src: "/images/sports.JPG", alt: "Sports Day on the field", category: "sports", caption: "Sports Day" },
  { src: "/images/creative-arts1.jpg", alt: "Creative arts studio", category: "creative", caption: "Creative Arts Studio" },
  { src: "/images/gardening.jpg", alt: "Gardening club outdoors", category: "outdoor", caption: "Gardening Club" },
  { src: "/images/ict.JPG", alt: "ICT lab", category: "learning", caption: "ICT Lab" },
  { src: "/images/competition.jpg", alt: "House competition", category: "sports", caption: "House Competition" },
  { src: "/images/swimming.jpg", alt: "Swimming pool", category: "sports", caption: "Swimming Pool" },
  { src: "/images/trips.jpg", alt: "Field trip", category: "outdoor", caption: "Field Trip" },
  { src: "/images/library.jpg", alt: "Library", category: "learning", caption: "Library" },
  { src: "/images/school-clinic.jpg", alt: "School clinic", category: "wellbeing", caption: "School Clinic" },
  { src: "/images/healthy-eating.jpg", alt: "Healthy eating area", category: "wellbeing", caption: "Dining & Healthy Eating" },
  { src: "/images/school-schedule.jpg", alt: "Classroom schedule", category: "learning", caption: "Classroom" },
  { src: "/images/early-years.jpg", alt: "Early Years play area", category: "outdoor", caption: "Early Years Play Area" },
  { src: "/images/creative-arts2.jpg", alt: "Music room", category: "creative", caption: "Music Room" },
  { src: "/images/campus-grounds.jpg", alt: "Campus grounds", category: "outdoor", caption: "Campus Grounds" },
  { src: "/images/drama.jpg", alt: "Drama performance", category: "creative", caption: "Drama Performance" },
];

/* =========================================================
   SAFETY / SECURITY
========================================================= */

const safetyPoints = [
  {
    icon: "🛡️",
    title: "Secure, Gated Campus",
    text: "One monitored entrance with visitor sign-in, so only authorised people are on campus during the school day.",
  },
  {
    icon: "🩺",
    title: "Full-Time School Nurse",
    text: "A qualified nurse on site every day, with a dedicated clinic for first aid and rest, and immediate parent contact when needed.",
  },
  {
    icon: "🚸",
    title: "Supervised Drop-Off & Pick-Up",
    text: "Staff supervise morning drop-off and afternoon pick-up to keep children safe as they arrive and leave.",
  },
  {
    icon: "🌿",
    title: "Safe, Well-Kept Grounds",
    text: "Our outdoor areas are maintained and inspected regularly, so children can play and explore with confidence.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function CampusPage() {
  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      <style>{`
        @keyframes mv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes mv-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes mv-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes mv-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .mv-float{animation:mv-float 6s ease-in-out infinite}
        .mv-float-alt{animation:mv-float-alt 7s ease-in-out infinite}
        .mv-blob{animation:mv-blob 16s ease-in-out infinite}
        .mv-marquee{animation:mv-marquee 35s linear infinite}

        /* Fill the wrapper: VideoPlayer mounts a div / iframe / video here */
        .video-player,
        .video-player > div,
        .video-player iframe {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }

        @media (prefers-reduced-motion: reduce){
          .mv-float,.mv-float-alt,.mv-blob,.mv-marquee{animation:none}
        }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative isolate min-h-[640px] overflow-hidden bg-[#252B68]">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="/images/campus-grounds.jpg"
            alt="Mount View campus grounds"
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 bg-[#252B68]/75" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#252B68] via-[#252B68]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#252B68] via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="mv-blob absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="mv-float pointer-events-none absolute right-[8%] top-[18%] z-10 text-4xl opacity-80 sm:text-5xl">🏫</span>
        <span className="mv-float-alt pointer-events-none absolute right-[14%] bottom-[22%] z-10 text-3xl opacity-70 sm:text-4xl">🌿</span>

        <div className="relative z-20 mx-auto flex min-h-[640px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Our Campus · Mount View
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A space built for
              <span className="relative block text-[#FFE900]">
                growing minds.
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
              Explore our campus, classrooms, sports fields, swimming pools and
              creative spaces — the environments where Mount View learners grow,
              play and thrive every day.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#video-tour"
                className="group rounded-full bg-[#F58220] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
              >
                Watch the Campus Tour
                <span className="ml-2 inline-block transition group-hover:translate-x-1">↓</span>
              </Link>
              <Link
                href="/admissions"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* =====================================================
          STATS BAR
      ====================================================== */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-black text-[#252B68] sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <span className="mv-float pointer-events-none absolute left-[4%] top-12 text-5xl opacity-15">🏫</span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">🌳</span>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Welcome to Our Campus
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
              A place where every child feels at home.
            </h2>
            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              <p>
                Our campus is more than buildings — it is the environment where
                Mount View learners spend their most important years. Every
                space, from the classroom to the swimming pool, is designed
                with their safety, curiosity and growth in mind.
              </p>
              <p>
                Spread across a secure, well-maintained site, the campus
                includes dedicated learning spaces, sports fields, two swimming
                pools, a library, an ICT laboratory, creative studios, an Early
                Years Centre and a full-time school clinic.
              </p>
              <p>
                We invite you to explore — either through our video tour, our
                photo gallery, or an in-person visit.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="group inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-lg"
              >
                Apply for Admission
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3 font-black text-[#252B68] transition hover:-translate-y-1 hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
              >
                Book a Campus Visit
              </Link>
            </div>
          </div>

          <div className="relative isolate">
            <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2rem] bg-[#FFE900]/30 blur-2xl" />
            <div className="relative z-10 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-slate-100">
              <ImageWithFallback
                src="/images/council.jpg"
                alt="Mount View campus entrance"
                className="aspect-[4/3] w-full"
              />
            </div>
            <div className="absolute -bottom-7 -left-5 z-20 rounded-2xl bg-[#FFE900] px-6 py-5 text-[#252B68] shadow-2xl sm:-left-8">
              <p className="text-3xl font-black">Every Space</p>
              <p className="mt-1 font-black">Has a purpose.</p>
            </div>
            <span className="mv-float-alt pointer-events-none absolute -right-4 -top-4 z-20 text-4xl">✨</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FACILITIES GRID
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
              Facilities
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              Spaces designed for learning and life.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              A closer look at the facilities that make up life at Mount View.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <article
                key={f.key}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative isolate overflow-hidden">
                  <ImageWithFallback
                    src={f.image}
                    alt={f.title}
                    className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg transition group-hover:scale-110">
                    {f.icon}
                  </div>
                </div>

                <div className="p-7">
                  <div
                    className={`mb-4 h-1 w-12 rounded-full ${
                      f.accent === "yellow"
                        ? "bg-[#FFE900]"
                        : f.accent === "orange"
                        ? "bg-[#F58220]"
                        : "bg-[#252B68]"
                    }`}
                  />
                  <h3 className="text-xl font-black text-[#252B68]">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {f.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {f.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm font-medium text-slate-700"
                      >
                        <span className="mt-0.5 shrink-0 text-[#F58220]">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          VIDEO TOUR
      ====================================================== */}
      <section
        id="video-tour"
        className="relative isolate overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <span className="mv-float pointer-events-none absolute left-[6%] top-16 text-5xl opacity-25">🎬</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-16 text-5xl opacity-25">🎥</span>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Video Tour
            </p>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Take a walk around Mount View.
            </h2>
            <p className="mt-5 leading-8 text-blue-100">
              Watch our campus tours at your own pace. Only one video plays at
              a time — starting a new one pauses the others automatically.
            </p>
          </div>

          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            {campusVideos.map((v, index) => {
              const isFeatured = index === 0;
              return (
                <article
                  key={v.title}
                  className={`overflow-hidden rounded-[2rem] border border-white/10 bg-[#1c2260] shadow-2xl ${
                    isFeatured ? "lg:col-span-2" : ""
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <VideoPlayer video={v.video} title={v.title} />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-[#FFE900] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#252B68]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {isFeatured && (
                        <span className="rounded-full bg-[#F58220] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white sm:text-2xl">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-blue-100/80">
                      {v.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          GALLERY
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Photo Gallery
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              A look around our campus.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Browse photos by area, or view them all together.
            </p>
          </div>

          <div className="mt-12">
            <CampusGallery
              photos={galleryPhotos}
              categories={galleryCategories}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          SAFETY & SECURITY
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#FFE900] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <span className="mv-float pointer-events-none absolute left-[5%] top-8 text-5xl opacity-30">🛡️</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-8 text-5xl opacity-30">🩺</span>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Safety &amp; Security
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              A campus where parents can have peace of mind.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {safetyPoints.map((item) => (
              <article
                key={item.title}
                className="group rounded-3xl bg-white p-7 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl shadow-md transition group-hover:scale-110">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-xl font-black text-[#252B68]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          VISIT CTA
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />
        <span className="mv-float pointer-events-none absolute left-[8%] top-10 text-4xl opacity-30">🚶</span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] bottom-10 text-4xl opacity-30">🏫</span>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Visit Us
          </p>

          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            The best way to know a campus is to walk it.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Book a campus tour and meet our team in person. We will walk you
            through our classrooms, sports fields, swimming pools and Early
            Years Centre, and answer any questions you have about life at
            Mount View.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="group rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
            >
              Book a Campus Visit
              <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/admissions"
              className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
            >
              Apply for Admission
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND STATEMENT
      ====================================================== */}
      <section className="relative overflow-hidden border-t border-slate-100 bg-white px-4 py-14 text-center sm:px-6 lg:px-8">
        <span className="mv-float pointer-events-none absolute left-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">✨</span>
        <span className="mv-float-alt pointer-events-none absolute right-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">💛</span>
        <div className="relative mx-auto max-w-4xl">
          <p className="text-2xl font-black text-[#252B68] sm:text-3xl">
            Fostering <span className="text-[#F58220]">growth</span>,{" "}
            <span className="text-[#252B68]">excellence</span> and{" "}
            <span className="text-[#F58220]">empathy</span>.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Mount View International Primary School &amp; Early Years Centre
          </p>
        </div>
      </section>
    </main>
  );
}