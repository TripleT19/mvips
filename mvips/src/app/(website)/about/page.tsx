import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/**
 * Revalidate every hour so years-of-service stay fresh.
 * Anniversary rollovers appear within ~1 hour of the anniversary date.
 * If you need exact-to-the-minute accuracy, swap this for:
 *   export const dynamic = "force-dynamic";
 */
export const revalidate = 3600;

/* =========================================================
   HELPERS — dynamic years of service
========================================================= */

/**
 * Returns whole years between `sinceDate` and today.
 * Anniversary-aware: if the anniversary month/day hasn't been
 * reached yet this year, the count is one less.
 *
 * Example: since 2011-06-15
 *   Oct 2026 → 15   (anniversary already passed)
 *   May 2027 → 15   (anniversary not yet reached)
 *   Jul 2027 → 16   (anniversary passed this year)
 */
function getYearsOfService(sinceDate: string): number {
  const start = new Date(sinceDate);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  const dayDiff = now.getDate() - start.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Formats `sinceDate` as e.g. "June 2011".
 */
function formatSinceDate(sinceDate: string): string {
  return new Date(sinceDate).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   IN-PAGE NAVIGATION
========================================================= */

const aboutNav = [
  { label: "School Overview", href: "#overview" },
  { label: "Mission & Vision", href: "#mission-vision" },
  { label: "Founder", href: "#founder" },
  { label: "Board & Chairman", href: "#board" },
  { label: "Administrator", href: "#administrator" },
  { label: "Principal", href: "#principal" },
  { label: "Curriculum & Early Years", href: "#curriculum" },
  { label: "Lead Teachers", href: "#lead-teachers" },
  { label: "Celebrating Our People", href: "#celebrating" },
];

/* =========================================================
   CORE CONTENT
========================================================= */

const quickFacts = [
  { label: "Established", value: "1975" },
  { label: "Learners", value: "600+" },
  { label: "Stages", value: "2" },
  { label: "Values", value: "4" },
];

const overviewCards = [
  {
    icon: "🎓",
    title: "Learner-Centred",
    text: "We place each learner at the centre of meaningful learning experiences.",
    tone: "navy" as const,
  },
  {
    icon: "🌍",
    title: "Future Ready",
    text: "We build skills, confidence and curiosity for an ever-changing world.",
    tone: "yellow" as const,
  },
  {
    icon: "🤝",
    title: "Caring Community",
    text: "We value positive relationships between learners, teachers and families.",
    tone: "orange" as const,
  },
  {
    icon: "🚀",
    title: "Big Potential",
    text: "Every learner is supported to discover strengths and pursue their goals.",
    tone: "white" as const,
  },
];

const missionVision = {
  mission: {
    title: "Creating meaningful opportunities to learn and grow.",
    text: "We provide a safe, supportive and stimulating learning environment where every child is encouraged to achieve academic excellence, develop positive character and discover their unique potential.",
  },
  vision: {
    title: "Inspiring children to make a positive difference.",
    text: "We aspire to develop confident and compassionate young people equipped with the knowledge, skills and character to contribute positively to their communities and the wider world.",
  },
};

const coreValues = [
  { icon: "🌱", title: "Growth" },
  { icon: "⭐", title: "Excellence" },
  { icon: "❤️", title: "Empathy" },
  { icon: "💡", title: "Innovation" },
];

/* =========================================================
   PEOPLE
========================================================= */

const founder = {
  name: "Mr. Jameson K. Banda",
  role: "Founder",
  tenure: "1975 — 2008",
  photo: "/images/team/founder.png",
  initials: "JB",
  quote:
    "A school should be a place where a child feels seen, safe and curious — everything else grows from there.",
  bio: [
    "Mount View began in 1975 as a small community learning centre with a simple conviction: that children learn best when they are known, encouraged and given room to explore.",
    "What started with a handful of learners and a dedicated group of teachers has grown into a thriving primary school and early years centre. The founding vision has never changed — a caring school where strong academics and strong character grow side by side.",
  ],
};

const chairman = {
  name: "Mr Irfan",
  role: "Chairman of the Board",
  focus: "Governance & Strategy",
  photo: "/images/team/chairman.png",
  initials: "GM",
  bio: "Provides strategic direction for the school and ensures that every governance decision keeps learners at the centre. A Mount View parent and education specialist with over twenty years of leadership experience.",
};

const boardMembers = [
  {
    name: "Mr. Vice Board Chair",
    role: "Vice Chairman",
    focus: "Finance & Infrastructure",
    photo: "/images/team/board-1.png",
    initials: "PN",
    bio: "Oversees financial stewardship and the long-term development of the school's learning facilities.",
  },
  {
    name: "Ms Boad Member",
    role: "Board Member",
    focus: "Academic Standards",
    photo: "/images/team/board-2.png",
    initials: "EK",
    bio: "Supports the school in maintaining high academic standards and reviewing teaching and learning outcomes.",
  },
  {
    name: "Ms Board Member",
    role: "Board Member",
    focus: "Legal & Compliance",
    photo: "/images/team/board-3.png",
    initials: "DM",
    bio: "Ensures the school operates in line with regulatory requirements and best-practice safeguarding policy.",
  },
  // {
  //   name: "Mrs. Ruth Chikondi",
  //   role: "Board Member",
  //   focus: "Community & Parents",
  //   photo: "/images/team/board-4.jpg",
  //   initials: "RC",
  //   bio: "Represents the voice of parents and strengthens the partnership between school, home and community.",
  // },
  // {
  //   name: "Mr. Alfred Kaunda",
  //   role: "Board Secretary",
  //   focus: "Policy & Records",
  //   photo: "/images/team/board-5.jpg",
  //   initials: "AK",
  //   bio: "Coordinates board meetings, policy documentation and the records that keep governance transparent.",
  // },
];

const administrator = {
  name: "Mr Rohit",
  role: "School Administrator",
  photo: "/images/team/rohit.png",
  initials: "R",
  bio: "The first point of contact for almost every family who walks through our doors. Mr Rohit oversees the front office, admissions paperwork, learner records and the daily rhythm of school life — with warmth, patience and an unmatched memory for names.",
  highlights: [
    "Front office & family liaison",
    "Admissions & learner records",
    "Daily school logistics",
  ],
};

const principal = {
  name: "Ms Dimpal",
  role: "Principal",
  photo: "/images/team/dimpal.jpg",
  initials: "D",
  tenure: "Leading Mount View",
  message: [
    "Welcome to Mount View. Whether you are a parent exploring the school for the first time or a family already part of our community, I am glad you are here.",
    "At Mount View we believe that children learn best when they feel safe, valued and genuinely known. Our teachers work hard to build classrooms where questions are welcome, effort is celebrated and every learner is encouraged to take the next step — whatever that step looks like for them.",
    "Academic foundations matter deeply to us, but so do kindness, resilience and curiosity. We want our learners to leave Mount View not only prepared for the next stage of their education, but confident in who they are and ready to contribute to the world around them.",
    "Our door is always open. I warmly invite you to visit us, meet our team and see the learning for yourself.",
  ],
  signature: "Ms Dimpal · Principal",
};

const curriculumLeads = [
  {
    name: "Ms Samantha",
    role: "Curriculum Lead · English",
    focus: "Literacy & Language",
    photo: "/images/team/samantha.jpg",
    initials: "S",
    bio: "Leads English across the school while also teaching Year 6. Champions reading fluency, confident writing and a genuine love of stories.",
  },
  {
    name: "Ms Shalon",
    role: "Curriculum Lead · Mathematics",
    focus: "Primary Mathematics",
    photo: "/images/team/shalon.jpg",
    initials: "S",
    bio: "Shapes mathematics teaching across the years, runs the problem-solving club and mentors new teachers joining the school.",
  },
  {
    name: "Mr Tinashe",
    role: "Curriculum Lead · Science",
    focus: "Science & Inquiry",
    photo: "/images/team/tinashe.jpg",
    initials: "T",
    bio: "Leads hands-on science and inquiry-based learning, connecting classroom discovery to the real world around us.",
  },
];

const earlyYearsCoordinator = {
  name: "Demelza",
  role: "Early Years Coordinator",
  focus: "Nursery & Reception",
  photo: "/images/team/demelza.jpg",
  initials: "D",
  bio: "Shapes a play-rich, nurturing start to school life for our youngest learners. Coordinates the early years team, curriculum and the gentle transition from home into school.",
};

const earlyYearsTeachers = [
  {
    name: "Ms Mvula",
    initials: "M",
    className: "Reception",
    role: "Lead Teacher · Reception",
    photo: "/images/team/mvula.jpg",
    bio: "Builds early literacy and number confidence through stories, songs and structured play — the friendly face that greets Reception each morning.",
  },
];

const primaryTeachers = [
  {
    name: "Ms Songolo",
    initials: "S",
    className: "Year 1",
    role: "Lead Teacher · Year 1",
    photo: "/images/team/songolo.jpg",
    bio: "Guides the move into formal learning with a strong focus on reading fluency, phonics and growing independence.",
  },
  {
    name: "Ms Wakisa",
    initials: "W",
    className: "Year 2",
    role: "Lead Teacher · Year 2",
    photo: "/images/team/wakisa.jpg",
    bio: "Encourages curiosity and confidence through guided reading, number talks and discovery tasks.",
  },
  {
    name: "Mr Clytone",
    initials: "C",
    className: "Year 3",
    role: "Lead Teacher · Year 3",
    photo: "/images/team/clytone.jpg",
    bio: "Develops independent writing and problem-solving while keeping creativity central to the classroom.",
  },
  {
    name: "Ms Bhana",
    initials: "B",
    className: "Year 4",
    role: "Lead Teacher · Year 4",
    photo: "/images/team/bhana.jpg",
    bio: "Focuses on research skills, collaborative projects and the responsible use of technology.",
  },
  {
    name: "Ms Vanesa",
    initials: "V",
    className: "Year 5",
    role: "Lead Teacher · Year 5",
    photo: "/images/team/vanesa.jpg",
    bio: "Builds analytical thinking and confident presentation skills across the curriculum.",
  },
  {
    name: "Ms Samantha",
    initials: "S",
    className: "Year 6",
    role: "Lead Teacher · Year 6",
    photo: "/images/team/samantha.jpg",
    bio: "Prepares learners for secondary school with strong study habits, leadership roles and exam readiness. Also leads English across the school.",
  },
];

/**
 * Long-service staff — `sinceDate` is the exact start date.
 * Years are computed at render time and roll over in the
 * anniversary month automatically.
 */
const longService = [
  {
    name: "Mr. Joseph Kamoto",
    initials: "JK",
    role: "Head of Sport & Wellbeing",
    sinceDate: "2006-06-15",
    photo: "/images/team/long-2.jpg",
    note: "Built our sport and wellbeing programme from a single football and a borrowed field into something the whole school looks forward to.",
  },
  {
    name: "Mrs Mary",
    initials: "M",
    role: "School Librarian",
    sinceDate: "2011-06-15",
    photo: "/images/team/mary.jpg",
    note: "The heart of our library and a champion of reading across the whole school. Mrs Mary has helped generations of learners discover the joy of books.",
  },
  {
    name: "Mr. Steven Chirwa",
    initials: "SC",
    role: "Facilities & Campus Manager",
    sinceDate: "2011-06-15",
    photo: "/images/team/long-4.jpg",
    note: "Keeps the campus safe, welcoming and running smoothly. If it works, chances are Mr. Chirwa quietly fixed it first.",
  },
  {
    name: "Mrs. Agnes Banda",
    initials: "AB",
    role: "Early Years Teaching Assistant",
    sinceDate: "2011-06-15",
    photo: "/images/team/long-3.jpg",
    note: "The first friendly face many of our youngest learners ever meet at the school gate — and the reason so many settle in so quickly.",
  },
  {
    name: "Ms Songolo",
    initials: "S",
    role: "Lead Teacher · Year 1",
    sinceDate: "2016-06-15",
    photo: "/images/team/songolo.jpg",
    note: "A steady, warm presence in Year 1 — the person who helps our youngest primary learners find their feet and their confidence.",
  },
  {
    name: "Ms Mvula",
    initials: "M",
    role: "Lead Teacher · Reception",
    sinceDate: "2016-06-15",
    photo: "/images/team/mvula.jpg",
    note: "Greets Reception each morning with a smile. Her classroom is where curiosity and belonging take root.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-80 w-80 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-28">
          <div className="order-2 md:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              About Mount View · Since 1975
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              More than a school.
              <span className="block text-[#FFE900]">A place to belong.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Mount View International Primary School & Early Years Centre
              provides a caring and stimulating environment where children are
              encouraged to learn, explore, create and grow with confidence.
            </p>

            <p className="mt-4 font-semibold text-white">
              Fostering growth, excellence and empathy.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-7 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Explore Admissions
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-4 font-bold text-white transition duration-300 hover:bg-white hover:text-[#252B68]"
              >
                Book a Visit
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {quickFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-2xl font-black text-[#FFE900]">
                    {fact.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-blue-100">
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative isolate">
              <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2.5rem] bg-[#FFE900]/20 blur-2xl" />

              <div className="relative z-10 overflow-hidden rounded-[2rem] border-[10px] border-white/20 bg-[#171B4A] shadow-2xl ring-1 ring-white/10">
                <div className="relative">
                  <ImageWithFallback
                    src="/images/gallery/school-1.jpg"
                    alt="Learners at Mount View International Primary School"
                    className="aspect-[4/5] w-full sm:aspect-[4/3]"
                  />

                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E] via-[#0B0F2E]/45 to-transparent" />

                  <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#F58220]" />
                    Welcome to Mount View
                  </div>

                  <div className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/35 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    1975 → Today
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFE900]">
                        Our Promise
                      </p>
                      <p className="mt-1.5 text-lg font-black leading-snug text-white sm:text-xl">
                        Every child matters.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/85">
                        A caring, vibrant community where learners grow,
                        discover and thrive — supported by teachers and
                        families who believe in them.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          href="/admissions"
                          className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-4 py-2 text-xs font-black text-white transition hover:bg-[#d96e12]"
                        >
                          Apply Now
                          <span>→</span>
                        </Link>
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-[#252B68]"
                        >
                          Book a Visit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 top-1/3 z-20 hidden -translate-y-1/2 rotate-[6deg] rounded-xl bg-[#F58220] px-4 py-3 shadow-2xl lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/85">
                  Established
                </p>
                <p className="text-sm font-black text-white">1975 · Malawi</p>
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

      {/* =====================================================
          IN-PAGE NAV
      ====================================================== */}
      <nav
        aria-label="About page sections"
        className="sticky top-20 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {aboutNav.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* =====================================================
          SCHOOL OVERVIEW
      ====================================================== */}
      <section
        id="overview"
        className="scroll-mt-40 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
                School Overview
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
                Helping children become confident learners and caring people.
              </h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  At Mount View International Primary School & Early Years
                  Centre, we believe that education is about more than academic
                  achievement. It is about helping every child discover who
                  they are, what they can do and how they can contribute to the
                  world around them.
                </p>
                <p>
                  Our learning environment brings together strong academic
                  foundations, technology, creativity, sport and meaningful
                  relationships. Children are encouraged to ask questions,
                  solve problems, express ideas and learn from their
                  experiences.
                </p>
                <p>
                  We work closely with families to create a supportive
                  community in which children feel valued, respected and
                  inspired to achieve their potential.
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
                  href="/academics"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3 font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                >
                  Explore Academics
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {overviewCards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-3xl p-7 shadow-lg ${
                    card.tone === "navy"
                      ? "bg-[#252B68] text-white"
                      : card.tone === "yellow"
                      ? "bg-[#FFE900] text-[#252B68]"
                      : card.tone === "orange"
                      ? "bg-[#F58220] text-white"
                      : "border border-slate-200 bg-white text-[#252B68]"
                  }`}
                >
                  <div className="text-4xl">{card.icon}</div>
                  <h3 className="mt-5 text-xl font-extrabold">
                    {card.title}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-7 ${
                      card.tone === "navy"
                        ? "text-blue-100"
                        : card.tone === "yellow"
                        ? "text-[#252B68]/80"
                        : card.tone === "orange"
                        ? "text-orange-50"
                        : "text-slate-600"
                    }`}
                  >
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION & VISION
      ====================================================== */}
      <section
        id="mission-vision"
        className="scroll-mt-40 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              What Guides Us
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Our mission and vision
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Our school community is guided by a clear commitment to helping
              children become capable, compassionate and confident learners.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#252B68] p-8 text-white shadow-xl sm:p-10">
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-32 w-32 rounded-full bg-[#FFE900]/20" />
              <div className="relative z-10">
                <span className="inline-flex rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#252B68]">
                  Our Mission
                </span>
                <h3 className="mt-6 text-2xl font-black">
                  {missionVision.mission.title}
                </h3>
                <p className="mt-5 leading-8 text-blue-100">
                  {missionVision.mission.text}
                </p>
              </div>
            </div>

            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#F58220] p-8 text-white shadow-xl sm:p-10">
              <div className="pointer-events-none absolute -bottom-10 -right-10 z-0 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative z-10">
                <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-[#F58220]">
                  Our Vision
                </span>
                <h3 className="mt-6 text-2xl font-black">
                  {missionVision.vision.title}
                </h3>
                <p className="mt-5 leading-8 text-orange-50">
                  {missionVision.vision.text}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {coreValues.map((value) => (
              <div
                key={value.title}
                className="inline-flex items-center gap-2 rounded-full border border-[#252B68]/15 bg-white px-5 py-3 shadow-sm"
              >
                <span className="text-xl">{value.icon}</span>
                <span className="text-sm font-black text-[#252B68]">
                  {value.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FOUNDER
      ====================================================== */}
      <section
        id="founder"
        className="scroll-mt-40 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              Founder
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              The person who started it all.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              In 1975, one teacher with a strong conviction turned a small
              learning centre into what Mount View is today.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl lg:grid lg:grid-cols-[340px_1fr]">
            <div className="relative isolate flex flex-col items-center justify-center bg-gradient-to-br from-[#252B68] to-[#3B4490] p-8 text-center text-white sm:p-10">
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-[#FFE900]/20 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <PersonAvatar
                  photo={founder.photo}
                  name={founder.name}
                  initials={founder.initials}
                  size="h-32 w-32"
                  ring="ring-[#FFE900]/50"
                />
                <h3 className="mt-6 text-2xl font-black">{founder.name}</h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  {founder.role}
                </p>
                <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                  {founder.tenure}
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <p className="text-lg font-bold italic leading-8 text-[#252B68]">
                &ldquo;{founder.quote}&rdquo;
              </p>

              <div className="mt-6 space-y-4 leading-8 text-slate-600">
                {founder.bio.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOARD & CHAIRMAN
      ====================================================== */}
      <section
        id="board"
        className="scroll-mt-40 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              Board & Chairman
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Governance that keeps learners at the centre.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              The board gives its time and expertise to make sure Mount View
              stays true to its founding purpose — from strategy and finance to
              safeguarding and academic standards.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl lg:grid lg:grid-cols-[320px_1fr]">
            <div className="relative isolate flex flex-col items-center justify-center bg-[#FFE900] p-8 text-center text-[#252B68] sm:p-10">
              <div className="pointer-events-none absolute -left-10 -top-10 z-0 h-40 w-40 rounded-full bg-[#F58220]/25 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <PersonAvatar
                  photo={chairman.photo}
                  name={chairman.name}
                  initials={chairman.initials}
                  size="h-32 w-32"
                  ring="ring-[#252B68]/25"
                />
                <h3 className="mt-6 text-2xl font-black">
                  {chairman.name}
                </h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]/80">
                  {chairman.role}
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <p className="text-lg font-bold leading-8 text-[#252B68]">
                {chairman.bio}
              </p>
              <p className="mt-6 inline-flex rounded-full bg-[#252B68]/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#252B68]">
                Focus · {chairman.focus}
              </p>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              <h3 className="text-xl font-black text-[#252B68]">
                The Board of Governors
              </h3>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {boardMembers.map((member) => (
                <PersonCard key={member.name} person={member} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ADMINISTRATOR
      ====================================================== */}
      <section
        id="administrator"
        className="scroll-mt-40 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[320px_1fr]">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#F58220] to-[#d96e12] p-8 text-center text-white shadow-xl">
              <div className="pointer-events-none absolute -right-10 -bottom-10 z-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10">
                <div className="mx-auto">
                  <PersonAvatar
                    photo={administrator.photo}
                    name={administrator.name}
                    initials={administrator.initials}
                    size="h-32 w-32"
                    ring="ring-white/40"
                  />
                </div>
                <h3 className="mt-6 text-2xl font-black">
                  {administrator.name}
                </h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-white/90">
                  {administrator.role}
                </p>
              </div>
            </div>

            <div>
              <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
                School Administrator
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                The first warm welcome most families receive.
              </h2>

              <p className="mt-6 leading-8 text-slate-600">
                {administrator.bio}
              </p>

              <div className="mt-7 space-y-3">
                {administrator.highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-sm font-black text-[#252B68]">
                      ✓
                    </span>
                    <p className="font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRINCIPAL
      ====================================================== */}
      <section
        id="principal"
        className="scroll-mt-40 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[360px_1fr]">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#252B68] p-8 text-center text-white shadow-xl">
            <div className="pointer-events-none absolute -left-12 -top-12 z-0 h-40 w-40 rounded-full bg-[#F58220]/30 blur-2xl" />

            <div className="relative z-10">
              <div className="mx-auto">
                <PersonAvatar
                  photo={principal.photo}
                  name={principal.name}
                  initials={principal.initials}
                  size="h-32 w-32"
                  ring="ring-[#FFE900]/50"
                />
              </div>
              <h3 className="mt-6 text-2xl font-black">{principal.name}</h3>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                {principal.role}
              </p>
              <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                {principal.tenure}
              </p>

              <div className="mt-6 space-y-2">
                <Link
                  href="/contact"
                  className="block rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#252B68]"
                >
                  Book a Meeting
                </Link>
                <Link
                  href="/admissions"
                  className="block rounded-full border border-white/30 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#252B68]"
                >
                  Explore Admissions
                </Link>
              </div>
            </div>
          </div>

          <div>
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              From the Principal&apos;s Desk
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              A word of welcome from our Principal.
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              {principal.message.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>

            <p className="mt-7 border-l-4 border-[#F58220] pl-4 text-base font-black text-[#252B68]">
              {principal.signature}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CURRICULUM LEADS & EARLY YEARS COORDINATOR
      ====================================================== */}
      <section
        id="curriculum"
        className="scroll-mt-40 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              Curriculum & Early Years
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              The specialists shaping what and how we teach.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Our curriculum leads design and refine the learning programme
              across subjects, while our Early Years Coordinator ensures our
              youngest learners get the strongest possible start.
            </p>
          </div>

          <div className="mt-14">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              <h3 className="text-xl font-black text-[#252B68]">
                Curriculum Leads
              </h3>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {curriculumLeads.map((lead) => (
                <PersonCard key={lead.name} person={lead} tone="yellow" />
              ))}
            </div>
          </div>

          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#252B68]" />
              <h3 className="text-xl font-black text-[#252B68]">
                Early Years Coordinator
              </h3>
            </div>

            <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-xl lg:grid lg:grid-cols-[300px_1fr]">
              <div className="relative isolate flex flex-col items-center justify-center bg-[#FFE900] p-8 text-center text-[#252B68] sm:p-10">
                <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-32 w-32 rounded-full bg-[#F58220]/25 blur-2xl" />

                <div className="relative z-10 flex flex-col items-center">
                  <PersonAvatar
                    photo={earlyYearsCoordinator.photo}
                    name={earlyYearsCoordinator.name}
                    initials={earlyYearsCoordinator.initials}
                    size="h-28 w-28"
                    ring="ring-[#252B68]/25"
                  />
                  <h4 className="mt-5 text-lg font-black">
                    {earlyYearsCoordinator.name}
                  </h4>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#252B68]/80">
                    {earlyYearsCoordinator.role}
                  </p>
                </div>
              </div>

              <div className="p-8 sm:p-10">
                <p className="leading-8 text-slate-600">
                  {earlyYearsCoordinator.bio}
                </p>
                <p className="mt-5 inline-flex rounded-full bg-[#252B68]/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#252B68]">
                  Focus · {earlyYearsCoordinator.focus}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LEAD TEACHERS
      ====================================================== */}
      <section
        id="lead-teachers"
        className="scroll-mt-40 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#F58220]">
              Lead Teachers
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              The teachers who lead our classes.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Each class is led by an experienced lead teacher supported by a
              teaching assistant. Get to know the person your child will spend
              their days with.
            </p>
          </div>

          <div className="mt-14">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              <h3 className="text-xl font-black text-[#252B68]">
                Early Years Centre
              </h3>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {earlyYearsTeachers.map((t) => (
                <TeacherCard key={`${t.className}-${t.name}`} teacher={t} />
              ))}
            </div>
          </div>

          <div className="mt-14">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#252B68]" />
              <h3 className="text-xl font-black text-[#252B68]">
                Primary School
              </h3>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {primaryTeachers.map((t) => (
                <TeacherCard key={`${t.className}-${t.name}`} teacher={t} />
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-[#252B68] p-8 text-center text-white sm:p-10">
            <h3 className="text-2xl font-black">
              Want to meet the team in person?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl leading-8 text-blue-100">
              Book a visit and we will arrange a tour with the class teacher
              your child would join.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:bg-[#d96e12]"
              >
                Book a Visit
              </Link>
              <Link
                href="/admissions"
                className="rounded-full border-2 border-white/30 px-6 py-3 font-black text-white transition hover:bg-white hover:text-[#252B68]"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CELEBRATING OUR PEOPLE
      ====================================================== */}
      <section
        id="celebrating"
        className="relative scroll-mt-40 overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="pointer-events-none absolute -left-32 top-0 z-0 h-80 w-80 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.2em] text-[#FFE900]">
              Celebrating Our People
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Ten years or more, giving their best to Mount View.
            </h2>
            <p className="mt-5 leading-8 text-blue-100">
              Schools are built by people, not buildings. We take time to
              recognise the colleagues who have given a decade or more of
              service to our learners — the quiet anchors of our community.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {longService.map((person) => {
              const years = getYearsOfService(person.sinceDate);

              return (
                <div
                  key={person.name}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <PersonAvatar
                      photo={person.photo}
                      name={person.name}
                      initials={person.initials}
                      size="h-16 w-16"
                      ring="ring-[#FFE900]/50"
                    />

                    <div className="text-right">
                      <p className="text-3xl font-black leading-none text-[#FFE900]">
                        {years}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-blue-100">
                        {years === 1 ? "Year" : "Years"}
                      </p>
                    </div>
                  </div>

                  <h4 className="mt-4 text-lg font-black text-white">
                    {person.name}
                  </h4>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#FFE900]/80">
                    {person.role}
                  </p>

                  <p className="mt-3 text-sm leading-7 text-blue-100">
                    {person.note}
                  </p>

                  <div className="mt-4">
                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                      At Mount View since {formatSinceDate(person.sinceDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-4xl rounded-[2rem] bg-[#252B68] p-10 text-center shadow-2xl sm:p-14">
          <div className="pointer-events-none absolute -left-24 top-0 z-0 h-72 w-72 rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />

          <div className="relative z-10">
            <p className="font-black uppercase tracking-[0.2em] text-[#FFE900]">
              Discover Mount View
            </p>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              A place where every child can grow, learn and shine.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              We invite families to discover a learning community built around
              growth, excellence, empathy and the potential of every child.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/admissions"
                className="rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12]"
              >
                Explore Admissions
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 font-black text-white transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Contact Our School
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND STATEMENT
      ====================================================== */}
      <section className="border-t border-slate-100 bg-white px-4 py-12 text-center sm:px-6 lg:px-8">
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

/* =========================================================
   SMALL REUSABLE PIECES
========================================================= */

function PersonAvatar({
  photo,
  name,
  initials,
  size = "h-20 w-20",
  ring = "ring-[#FFE900]/50",
}: {
  photo?: string;
  name: string;
  initials: string;
  size?: string;
  ring?: string;
}) {
  return (
    <div
      className={`relative ${size} shrink-0 overflow-hidden rounded-full bg-[#252B68] ring-4 ${ring} shadow-lg`}
    >
      {photo ? (
        <ImageWithFallback
          src={photo}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#FFE900]">
          {initials}
        </div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  tone = "default",
}: {
  person: {
    name: string;
    role: string;
    focus?: string;
    photo?: string;
    initials: string;
    bio: string;
  };
  tone?: "default" | "navy" | "yellow";
}) {
  const ring =
    tone === "yellow" ? "ring-[#F58220]/40" : "ring-[#FFE900]/50";

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <PersonAvatar
          photo={person.photo}
          name={person.name}
          initials={person.initials}
          size="h-16 w-16"
          ring={ring}
        />
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[#252B68]">
            {person.name}
          </p>
          <p className="text-[11px] font-black uppercase tracking-wider text-[#F58220]">
            {person.role}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{person.bio}</p>

      {person.focus && (
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
            {person.focus}
          </span>
        </div>
      )}
    </div>
  );
}

function TeacherCard({
  teacher,
}: {
  teacher: {
    name: string;
    initials: string;
    className: string;
    role: string;
    photo?: string;
    bio: string;
  };
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <PersonAvatar
          photo={teacher.photo}
          name={teacher.name}
          initials={teacher.initials}
          size="h-16 w-16"
          ring="ring-[#FFE900]/50"
        />
        <span className="rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#252B68]">
          {teacher.className}
        </span>
      </div>

      <h4 className="mt-4 text-lg font-black text-[#252B68]">
        {teacher.name}
      </h4>
      <p className="text-[11px] font-black uppercase tracking-wider text-[#F58220]">
        {teacher.role}
      </p>

      <p className="mt-3 text-sm leading-7 text-slate-600">{teacher.bio}</p>
    </div>
  );
}