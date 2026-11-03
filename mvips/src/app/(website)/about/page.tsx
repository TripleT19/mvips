import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/**
 * Revalidate every hour so years-of-service stay fresh.
 */
export const revalidate = 3600;

/* =========================================================
   HELPERS — dynamic years of service
========================================================= */

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

function formatSinceDate(sinceDate: string): string {
  return new Date(sinceDate).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   IN-PAGE NAVIGATION (Matches Header Dropdown)
========================================================= */

const aboutNav = [
  { label: "School Overview", href: "#overview" },
  { label: "Mission & Vision", href: "#mission-vision" },
  { label: "Founder", href: "#founder" },
  { label: "Governance & Board", href: "#board" },
  { label: "School Leadership", href: "#principal" },
  { label: "Academic Team", href: "#lead-teachers" },
  { label: "Celebrating Our People", href: "#celebrating" },
];

/* =========================================================
   CORE CONTENT
========================================================= */

const quickFacts = [
  { label: "Established", value: "1975", emoji: "🏛️" },
  { label: "Learners", value: "600+", emoji: "🎓" },
  { label: "Stages", value: "4", emoji: "🚀" },
  { label: "Curriculum", value: "Cambridge", emoji: "🌍" },
];

const overviewCards = [
  {
    icon: "🎓",
    title: "Cambridge Curriculum",
    text: "Following the Cambridge International Curriculum for Primary and Cambridge Early Years for Early Years.",
    tone: "navy" as const,
  },
  {
    icon: "🌍",
    title: "Global Community",
    text: "A vibrant mosaic of cultures, languages, and traditions. We cherish and celebrate our diversity.",
    tone: "yellow" as const,
  },
  {
    icon: "🤝",
    title: "Inclusive Education",
    text: "Learning support is included in school fees, ensuring every child succeeds at their own pace.",
    tone: "orange" as const,
  },
  {
    icon: "🚀",
    title: "21st Century Skills",
    text: "Fostering critical thinking, creativity, communication, and collaboration for an interconnected world.",
    tone: "white" as const,
  },
];

const missionVision = {
  mission: {
    title: "Meaningful learning experiences that prepare them for life.",
    text: "Our mission is to provide accessible, world-class education in a safe and nurturing environment. We empower students to become lifelong learners and compassionate global citizens, guided by integrity and intellect, and committed to making the world a better place.",
  },
  vision: {
    title: "Preparing our community for an ever-changing world.",
    text: "Mount View International Primary School aspires to prepare our community for an ever-changing world by promoting empathy, cultivating character and instilling innovation, within an inclusive and caring environment.",
  },
};

const founder = {
  name: "Mrs. Sakker Sacranie",
  role: "Founder",
  tenure: "1975",
  photo: "/images/team/founder.jpeg",
  initials: "SS",
  quote:
    "Learning is more than just an academic pursuit—it is a lifelong adventure filled with discovery, creativity, and joy.",
  bio: [
    "Mount View Primary School was founded by the remarkable Mrs. Sakker Sacranie, whose vision was to create an international school that offered quality education at affordable prices.",
    "Mrs. Sacranie was determined to bring this vision to life and successfully persuaded the then Head of State, Dr. Kamuzu Banda, and other influential community members of its necessity.",
    "Initially, classes were held in various large houses, but in 1968, the school moved to its current location with established infrastructure. From the outset, the school was registered with the University of Cambridge Examinations.",
  ],
};

const chairman = {
  name: "Mr Irfan K. Bheda",
  role: "Chairman of the Board",
  focus: "Governance & Strategy",
  photo: "/images/team/irfan.jpeg",
  initials: "IB",
  bio: "Provides strategic direction for the school and ensures that every governance decision keeps learners at the centre. A Mount View parent and education specialist with over twenty years of leadership experience.",
};

const boardMembers = [
  {
    name: "Mr Faruq I. Nathanie",
    role: "Board Director",
    focus: "Finance & Infrastructure",
    photo: "/images/team/faruq.jpeg",
    initials: "FN",
    bio: "Oversees financial stewardship and the long-term development of the school's learning facilities.",
  },
  {
    name: "Mr Sabir A. Nathanie",
    role: "Board Director",
    focus: "Academic Standards",
    photo: "/images/team/sabir.jpeg",
    initials: "SN",
    bio: "Supports the school in maintaining high academic standards and reviewing teaching and learning outcomes.",
  },
  {
    name: "Mr Salim G. Karim",
    role: "Board Director",
    focus: "Legal & Compliance",
    photo: "/images/team/salim.jpeg",
    initials: "SK",
    bio: "Ensures the school operates in line with regulatory requirements and best-practice safeguarding policy.",
  },
];

const headteacher = {
  name: "Ms. Dimpal Rawat",
  role: "Headteacher",
  photo: "/images/team/dimpal.jpg",
  initials: "D",
  tenure: "Leading Mount View",
  message: [
    "It is with great pleasure that I extend a heartfelt welcome to you from Mount View International Primary School and Early Years Centre. We are honored to have your children as part of our school community, where their happiness, growth, and success are at the heart of everything we do.",
    "At Mount View, we see learning as more than just an academic pursuit—it is a lifelong adventure filled with discovery, creativity, and joy. We are dedicated to nurturing not only the minds but also the hearts of our students, instilling in them the confidence, curiosity, and passion to pursue their dreams, wherever they may lead.",
    "Each child who joins us is wonderfully unique, and we believe that their education should reflect that individuality. Our teaching approach is personalised to ensure that every student's learning journey is as special as they are.",
    "Our school is a vibrant mosaic of cultures, languages, and traditions. Here at Mount View, we believe that understanding and appreciating our differences is what makes us stronger and more united.",
  ],
  signature: "Ms. Dimpal Rawat · Headteacher",
};

const administrator = {
  name: "Mr. Rohit Singh Raghav",
  role: "School Administrator",
  photo: "/images/team/rohit.jpeg",
  initials: "R",
  bio: "The first point of contact for almost every family who walks through our doors. Mr Rohit oversees the front office, admissions paperwork, learner records and the daily rhythm of school life — with warmth, patience and an unmatched memory for names.",
  highlights: [
    "Front office & family liaison",
    "Admissions & learner records",
    "Daily school logistics",
  ],
};

const curriculumLeads = [
  {
    name: "Ms. Samantha Crozier",
    role: "Curriculum Lead · English",
    focus: "Literacy & Language",
    photo: "/images/team/samantha.JPG",
    initials: "S",
    bio: "Leads English across the school while also teaching Year 6. Champions reading fluency, confident writing and a genuine love of stories.",
  },
  {
    name: "Ms. Shalon Matiza",
    role: "Curriculum Lead · Mathematics",
    focus: "Primary Mathematics",
    photo: "/images/team/shalon.jpeg",
    initials: "S",
    bio: "Shapes mathematics teaching across the years, runs the problem-solving club and mentors new teachers joining the school.",
  },
  {
    name: "Mr Tinashe Dankayi",
    role: "Curriculum Lead · Science",
    focus: "Science & Inquiry",
    photo: "/images/team/tinashe.JPG",
    initials: "T",
    bio: "Leads hands-on science and inquiry-based learning, connecting classroom discovery to the real world around us.",
  },
];

const earlyYearsCoordinator = {
  name: "Ms Monica Mutinta Mwamba",
  role: "Early Years Coordinator",
  focus: "Nursery & Reception",
  photo: "/images/team/monica.JPG",
  initials: "M",
  bio: "Orchestrates a warm, play-rich start to school life for our youngest learners. Leads the early years team across Nursery and Reception — shaping curriculum, mentoring teachers and ensuring every child's first steps into school feel safe, joyful and full of wonder.",
};

const earlyYearsTeachers = [
  {
    name: "Ms Maria Chembe",
    initials: "MC",
    className: "Pre-Nursery & Nursery",
    role: "Lead Teacher",
    photo: "/images/team/maria.JPG",
    bio: "Creates the gentle, song-filled mornings our littlest learners look forward to. Builds early language, number sense and social confidence through stories, rhymes and purposeful play — and is often the very first friendly face a Mount View child meets.",
  },
  {
    name: "Ms. Chikondi Mvula",
    initials: "M",
    className: "Reception",
    role: "Lead Teacher",
    photo: "/images/team/mvula.JPG",
    bio: "Guides Reception children as they grow in independence, curiosity and early reading. Blends structured phonics with imaginative play so that every learner leaves Reception ready — and excited — for Year 1.",
  },
];

const primaryTeachers = [
  {
    name: "Ms Karen Songolo",
    initials: "S",
    className: "Year 1",
    role: "Lead Teacher",
    subject: "English",
    photo: "/images/team/songolo.jpeg",
    bio: "Ms Songolo brings 23 years of teaching experience at Mount View International School. She is passionate about working with young learners and creating a nurturing, engaging, and supportive learning environment. She believes in building strong foundations in literacy, numeracy, and essential life skills. She values teamwork and collaboration with colleagues and parents to support every child’s development, inspire confidence, and create meaningful learning experiences that help each child reach their full potential.",
  },
  {
    name: "Ms. Muneerah Bhana",
    initials: "B",
    className: "Year 2",
    role: "Lead Teacher",
    subject: "Science",
    photo: "/images/team/bhana.JPG",
    bio: "Sparks curiosity in Year 2 with a specialist focus on Science. Encourages young learners to observe, question and experiment — turning everyday wonder into the first building blocks of scientific thinking.",
  },
  {
    name: "Mr. Clytone Bishi",
    initials: "C",
    className: "Year 3",
    role: "Lead Teacher",
    subject: "Mathematics",
    photo: "/images/team/clyton.jpeg",
    bio: "Builds mathematical confidence and problem-solving fluency in Year 3. Makes number work joyful and logical — through puzzles, patterns and hands-on challenges that stretch every learner.",
  },
  {
    name: "Ms. Wakisa Mwanyongo",
    initials: "W",
    className: "Year 4",
    role: "Lead Teacher",
    subject: "English",
    photo: "/images/team/wakisa.JPG",
    bio: "Ms. Wakisa is a dedicated education professional with nine years of teaching experience and a passion for helping every learner succeed. As a Lead Teacher at Mount View International School, she supports curriculum delivery, mentor colleagues, and promotes effective teaching practices. She believes every child is unique and thrives through differentiated, hands-on learning. Ms. Wakisa values strong partnerships with parents and teamwork with colleagues to create an inclusive, engaging, and supportive environment where all learners can grow in confidence, develop their strengths, and achieve success.",
  },
  {
    name: "Ms. Vanessa Adam",
    initials: "V",
    className: "Year 5",
    role: "Lead Teacher",
    subject: "Mathematics",
    photo: "/images/team/vanesa.JPG",
    bio: "With 20 years of experience at Mount View, Miss Adam is a dedicated educator passionate about nurturing young minds and inspiring a love for learning. As the Year 5 Lead Teacher, she is committed to supporting academic excellence, building pupils’ confidence and creating a positive learning environment. She values teamwork, continuous growth and helping every child to be the best version of themselves, both academically and personally.",
  },
  {
    name: "Ms. Samantha Crozier",
    initials: "S",
    className: "Year 6",
    role: "Lead Teacher",
    subject: "English",
    photo: "/images/team/samantha.JPG",
    bio: "Prepares Year 6 learners for the transition to secondary school with a specialist focus on English. Builds exam readiness, essay craft and confident self-expression — alongside her wider role as Curriculum Lead for English across the school.",
  },
];

const longService = [
  {
    name: "Ms Kalen Songolo",
    initials: "S",
    role: "Lead Teacher · Year 1",
    sinceDate: "2003-06-15",
    photo: "/images/team/songolo.jpeg",
    note: "Ms Songolo brings 23 years of teaching experience at Mount View International School. She is passionate about working with young learners and creating a nurturing, engaging, and supportive learning environment. She believes in building strong foundations in literacy, numeracy, and essential life skills. She values teamwork and collaboration with colleagues and parents to support every child’s development, inspire confidence, and create meaningful learning experiences that help each child reach their full potential.",
  },
  {
    name: "Ms Vanesa Adam",
    initials: "VA",
    role: "Lead Teacher · Year 5",
    sinceDate: "2006-06-15",
    photo: "/images/team/vanesa.jpeg",
    note: "With 20 years of experience at Mount View, Miss Adam is a dedicated educator passionate about nurturing young minds and inspiring a love for learning. As the Year 5 Lead Teacher, she is committed to supporting academic excellence, building pupils’ confidence and creating a positive learning environment. She values teamwork, continuous growth and helping every child to be the best version of themselves, both academically and personally.",
  },
  {
    name: "Ms. Wakisa Mwanyongo",
    initials: "WM",
    role: "Lead Teacher · Year 4",
    sinceDate: "2017-06-15",
    photo: "/images/team/wakisa.JPG",
    note: "Ms. Wakisa is a dedicated education professional with nine years of teaching experience and a passion for helping every learner succeed. As a Lead Teacher at Mount View International School, she supports curriculum delivery, mentor colleagues, and promotes effective teaching practices. She believes every child is unique and thrives through differentiated, hands-on learning. Ms. Wakisa values strong partnerships with parents and teamwork with colleagues to create an inclusive, engaging, and supportive environment where all learners can grow in confidence, develop their strengths, and achieve success.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* ---------- shared animation styles ---------- */}
      <style>{`
        @keyframes mv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes mv-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes mv-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes mv-pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }

        .mv-float{animation:mv-float 6s ease-in-out infinite}
        .mv-float-alt{animation:mv-float-alt 7s ease-in-out infinite}
        .mv-blob{animation:mv-blob 16s ease-in-out infinite}
        .mv-pop{animation:mv-pop 3.5s ease-in-out infinite}

        @media (prefers-reduced-motion: reduce){
          .mv-float,.mv-float-alt,.mv-blob,.mv-pop{animation:none}
        }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-32 -top-32 z-0 h-80 w-80 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#4a55b8]/40 blur-3xl" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[4%] top-[16%] z-0 text-4xl opacity-70 sm:text-5xl">🎓</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] top-[10%] z-0 text-4xl opacity-70 sm:text-5xl">🌍</span>
        <span className="mv-float pointer-events-none absolute left-[8%] bottom-[14%] z-0 text-3xl opacity-60 sm:text-4xl">📚</span>
        <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-[12%] z-0 text-3xl opacity-60 sm:text-4xl">🏫</span>
        <span className="mv-pop pointer-events-none absolute left-1/2 top-[6%] hidden text-2xl opacity-50 lg:block">✨</span>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <div className="order-2 md:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              About Mount View · Since 1975
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              More than a school.
              <span className="relative block text-[#FFE900]">
                A lifelong adventure.
                <svg
                  className="absolute -bottom-2 left-0 w-full text-[#F58220]"
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

            <p className="mt-7 max-w-xl text-lg leading-8 text-blue-100">
              Established in 1975, Mount View was founded with a vision to
              create an international school that offered quality education at
              affordable prices. Today, we are a vibrant mosaic of cultures,
              dedicated to nurturing minds and hearts.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-7 py-4 font-black text-white shadow-lg shadow-[#F58220]/30 transition duration-300 hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
              >
                Apply for Admission
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-4 font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Book a Visit
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {quickFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur transition hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10"
                >
                  <p className="text-lg leading-none">{fact.emoji}</p>
                  <p className="mt-2 text-xl font-black text-[#FFE900]">
                    {fact.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-blue-100">
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
                    src="/images/school-1.JPG"
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
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFE900]">
                        Our promise
                      </p>
                      <p className="mt-1.5 text-base font-black leading-snug text-white sm:text-lg">
                        Nurturing minds, hearts and futures — every single day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mv-float absolute -right-3 top-1/3 z-20 hidden -translate-y-1/2 rotate-[6deg] rounded-xl bg-[#F58220] px-4 py-3 shadow-2xl lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/85">
                  Since
                </p>
                <p className="text-sm font-black text-white">1975</p>
              </div>

              <div className="mv-float-alt absolute -bottom-5 -right-3 z-20 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl lg:flex">
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
        className="sticky top-20 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md"
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
        className="relative scroll-mt-40 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <span className="mv-float pointer-events-none absolute left-[3%] top-12 text-5xl opacity-15">💡</span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">🌱</span>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>School Overview</Eyebrow>

              <h2 className="mt-4 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl lg:text-[2.75rem]">
                Offering affordable education to all children, regardless of
                background.
              </h2>

              <div className="mt-7 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  Mount View International Primary School was established in
                  1975 by the late Mrs. Sakker Sacranie with a purpose to offer
                  affordable education to all children despite their background.
                </p>
                <p>
                  At Mount View, we see learning as more than just an academic
                  pursuit—it is a lifelong adventure filled with discovery,
                  creativity, and joy. We are dedicated to nurturing not only
                  the minds but also the hearts of our students.
                </p>
                <p>
                  Our learning environment brings together strong academic
                  foundations, the Cambridge International Curriculum,
                  technology, creativity, sport and meaningful relationships.
                  Children are encouraged to ask questions, solve problems,
                  express ideas and learn from their experiences.
                </p>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/admissions"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-lg"
                >
                  Apply for Admission
                  <span className="transition group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/academics"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3 font-black text-[#252B68] transition hover:-translate-y-1 hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                >
                  Explore Academics
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {overviewCards.map((card) => (
                <div
                  key={card.title}
                  className={`group relative overflow-hidden rounded-3xl p-7 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    card.tone === "navy"
                      ? "bg-[#252B68] text-white"
                      : card.tone === "yellow"
                      ? "bg-[#FFE900] text-[#252B68]"
                      : card.tone === "orange"
                      ? "bg-[#F58220] text-white"
                      : "border border-slate-200 bg-white text-[#252B68]"
                  }`}
                >
                  <div className="text-4xl transition duration-500 group-hover:scale-110">
                    {card.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold">{card.title}</h3>
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
        className="relative scroll-mt-40 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-8s]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="What Guides Us"
            title="Our Vision & Mission"
            description="Two statements that shape every decision, every lesson and every conversation at Mount View."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
            <div className="group relative isolate overflow-hidden rounded-[2rem] bg-[#252B68] p-8 text-white shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-10">
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-32 w-32 rounded-full bg-[#FFE900]/20 blur-2xl" />
              <span className="mv-float-alt pointer-events-none absolute right-4 top-4 text-5xl opacity-25">🌍</span>
              <div className="relative z-10">
                <span className="inline-flex rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#252B68]">
                  Our Vision
                </span>
                <h3 className="mt-6 text-2xl font-black">
                  {missionVision.vision.title}
                </h3>
                <p className="mt-5 leading-8 text-blue-100">
                  {missionVision.vision.text}
                </p>
              </div>
            </div>

            <div className="group relative isolate overflow-hidden rounded-[2rem] bg-[#F58220] p-8 text-white shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-10">
              <div className="pointer-events-none absolute -bottom-10 -right-10 z-0 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
              <span className="mv-float pointer-events-none absolute right-4 top-4 text-5xl opacity-30">🎯</span>
              <div className="relative z-10">
                <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-[#F58220]">
                  Our Mission
                </span>
                <h3 className="mt-6 text-2xl font-black">
                  {missionVision.mission.title}
                </h3>
                <p className="mt-5 leading-8 text-orange-50">
                  {missionVision.mission.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOUNDER
      ====================================================== */}
      <section
        id="founder"
        className="relative scroll-mt-40 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <span className="mv-float pointer-events-none absolute left-[5%] top-16 text-5xl opacity-15">🌟</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-16 text-5xl opacity-15">💫</span>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="Founder"
            title="The person who started it all."
            description="A visionary educator whose determination turned a bold idea into a thriving school."
          />

          <div className="mt-14 mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-100 lg:grid lg:grid-cols-[480px_1fr]">
            <div className="relative isolate flex flex-col items-center justify-center bg-gradient-to-br from-[#252B68] to-[#3B4490] p-10 text-center text-white sm:p-14">
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-[#FFE900]/25 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-10 z-0 h-40 w-40 rounded-full bg-[#F58220]/25 blur-2xl" />
              <span className="mv-float-alt pointer-events-none absolute right-6 top-6 text-4xl opacity-40">✨</span>
              <div className="relative z-10 flex flex-col items-center">
                <div className="group relative h-72 w-72 shrink-0 overflow-hidden rounded-full bg-[#252B68] shadow-[0_0_40px_rgba(255,233,0,0.3)] ring-[8px] ring-[#FFE900]/50 transition-all duration-500 hover:scale-105 hover:ring-[#FFE900]/80 sm:h-80 sm:w-80">
                  <ImageWithFallback
                    src={founder.photo}
                    alt={founder.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="mt-8 text-3xl font-black">{founder.name}</h3>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  {founder.role}
                </p>
                <p className="mt-4 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                  {founder.tenure}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="mb-8 border-l-4 border-[#FFE900] pl-5 text-xl font-bold italic leading-9 text-[#252B68]">
                &ldquo;{founder.quote}&rdquo;
              </p>
              <div className="space-y-5 leading-8 text-slate-600">
                {founder.bio.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          GOVERNANCE & BOARD
      ====================================================== */}
      <section
        id="board"
        className="relative scroll-mt-40 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/25 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/20 blur-3xl [animation-delay:-6s]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="Governance & Board"
            title="Governance that keeps learners at the centre."
            description="Experienced stewards guiding strategy, finance, standards and safeguarding across the school."
          />

          <div className="mt-14 mx-auto mb-16 max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 lg:grid lg:grid-cols-[360px_1fr]">
            <div className="relative isolate flex flex-col items-center justify-center bg-[#FFE900] p-8 text-center text-[#252B68] sm:p-10">
              <div className="pointer-events-none absolute -left-10 -top-10 z-0 h-40 w-40 rounded-full bg-[#F58220]/25 blur-2xl" />
              <span className="mv-float pointer-events-none absolute right-6 top-6 text-4xl opacity-40">🏛️</span>
              <div className="relative z-10 flex flex-col items-center">
                <PersonAvatar
                  photo={chairman.photo}
                  name={chairman.name}
                  initials={chairman.initials}
                  size="h-52 w-52"
                  ring="ring-[#252B68]/20"
                />
                <h3 className="mt-6 text-2xl font-black">{chairman.name}</h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]/80">
                  {chairman.role}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
              <p className="text-lg font-bold leading-8 text-[#252B68]">
                {chairman.bio}
              </p>
              <p className="mt-6 inline-flex w-fit rounded-full bg-[#252B68]/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#252B68]">
                Focus · {chairman.focus}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              <h3 className="text-xl font-black text-[#252B68]">
                The Board of Governors
              </h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {boardMembers.map((member) => (
                <PersonCard
                  key={member.focus}
                  person={member}
                  size="h-32 w-32"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SCHOOL LEADERSHIP
      ====================================================== */}
      <section
        id="principal"
        className="relative scroll-mt-40 overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <span className="mv-float pointer-events-none absolute right-[4%] top-16 text-5xl opacity-15">🌱</span>
        <span className="mv-float-alt pointer-events-none absolute left-[4%] bottom-16 text-5xl opacity-15">💡</span>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="School Leadership"
            title="Guiding our school community."
            description="The people who set the tone, hold the vision and welcome every family through our doors."
          />

          {/* Headteacher */}
          <div className="mt-14 mb-20 grid items-start gap-12 lg:grid-cols-[440px_1fr] lg:gap-14">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#252B68] p-8 text-center text-white shadow-xl sm:p-10">
              <div className="pointer-events-none absolute -left-12 -top-12 z-0 h-40 w-40 rounded-full bg-[#F58220]/30 blur-2xl" />
              <span className="mv-float-alt pointer-events-none absolute right-6 top-6 text-4xl opacity-30">👋</span>
              <div className="relative z-10">
                <div className="mx-auto">
                  <PersonAvatar
                    photo={headteacher.photo}
                    name={headteacher.name}
                    initials={headteacher.initials}
                    size="h-48 w-48"
                    ring="ring-[#FFE900]/50"
                  />
                </div>
                <h3 className="mt-6 text-2xl font-black">
                  {headteacher.name}
                </h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  {headteacher.role}
                </p>
                <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                  {headteacher.tenure}
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
                    Apply for Admission
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <Eyebrow>From the Headteacher&apos;s Desk</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-[#252B68] sm:text-3xl">
                A warm welcome to our community.
              </h2>
              <div className="mt-6 space-y-4 leading-8 text-slate-600">
                {headteacher.message.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <p className="mt-6 border-l-4 border-[#F58220] pl-4 text-base font-black text-[#252B68]">
                {headteacher.signature}
              </p>
            </div>
          </div>

          {/* Administrator */}
          <div className="grid items-center gap-12 border-t border-slate-100 pt-16 lg:grid-cols-[320px_1fr] lg:gap-14">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#F58220] to-[#d96e12] p-8 text-center text-white shadow-xl">
              <div className="pointer-events-none absolute -bottom-10 -right-10 z-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <span className="mv-float pointer-events-none absolute left-6 top-6 text-4xl opacity-40">🤝</span>
              <div className="relative z-10">
                <div className="mx-auto">
                  <PersonAvatar
                    photo={administrator.photo}
                    name={administrator.name}
                    initials={administrator.initials}
                    size="h-40 w-40"
                    ring="ring-white/40"
                  />
                </div>
                <h3 className="mt-6 text-xl font-black">
                  {administrator.name}
                </h3>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                  {administrator.role}
                </p>
              </div>
            </div>

            <div>
              <Eyebrow>School Administrator</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-[#252B68] sm:text-3xl">
                The first warm welcome most families receive.
              </h2>
              <p className="mt-4 leading-8 text-slate-600">
                {administrator.bio}
              </p>
              <div className="mt-6 space-y-3">
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
          ACADEMIC TEAM
      ====================================================== */}
      <section
        id="lead-teachers"
        className="relative scroll-mt-40 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-5s]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="Academic Team"
            title="The specialists shaping what and how we teach."
            description="Coordinators, curriculum leads and classroom teachers working as one team for every learner."
          />

          {/* 1. Early Years Coordinator */}
          <div className="mt-14 mb-20">
            <SectionSubheading accent="navy">Early Years Coordinator</SectionSubheading>
            <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 lg:grid lg:grid-cols-[320px_1fr]">
              <div className="relative isolate flex flex-col items-center justify-center bg-[#FFE900] p-8 text-center text-[#252B68] sm:p-10">
                <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-32 w-32 rounded-full bg-[#F58220]/30 blur-2xl" />
                <span className="mv-float-alt pointer-events-none absolute left-6 top-6 text-4xl opacity-40">🐣</span>
                <div className="relative z-10 flex flex-col items-center">
                  <PersonAvatar
                    photo={earlyYearsCoordinator.photo}
                    name={earlyYearsCoordinator.name}
                    initials={earlyYearsCoordinator.initials}
                    size="h-36 w-36"
                    ring="ring-[#252B68]/20"
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

          {/* 2. Lead Teachers */}
          <div className="mb-20">
            <SectionSubheading accent="orange">Lead Teachers</SectionSubheading>

            <div className="mt-8 mb-10">
              <h4 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Early Years Centre
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {earlyYearsTeachers.map((t) => (
                  <TeacherCard key={`${t.className}-${t.name}`} teacher={t} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Primary School
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {primaryTeachers.map((t) => (
                  <TeacherCard key={`${t.className}-${t.name}`} teacher={t} />
                ))}
              </div>
            </div>
          </div>

          {/* 3. Curriculum Leads */}
          <div>
            <SectionSubheading accent="orange">Curriculum Leads</SectionSubheading>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {curriculumLeads.map((lead) => (
                <PersonCard
                  key={`${lead.name}-${lead.role}`}
                  person={lead}
                  tone="yellow"
                  size="h-36 w-36"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CELEBRATING OUR PEOPLE
      ====================================================== */}
      <section
        id="celebrating"
        className="relative scroll-mt-40 overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-32 top-0 z-0 h-80 w-80 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-7s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-25">🎉</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-25">🏆</span>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="Celebrating Our People"
            title="Ten years or more, giving their best to Mount View."
            description="Long-serving educators whose dedication shapes the character of our school."
            tone="dark"
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {longService.map((person) => {
              const years = getYearsOfService(person.sinceDate);

              return (
                <div
                  key={person.name}
                  className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <PersonAvatar
                      photo={person.photo}
                      name={person.name}
                      initials={person.initials}
                      size="h-28 w-28"
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

                  <h4 className="mt-5 text-lg font-black text-white">
                    {person.name}
                  </h4>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#FFE900]/80">
                    {person.role}
                  </p>

                  <p className="mt-3 flex-1 text-sm leading-7 text-blue-100">
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
          FINAL CTA  — Alumni focus
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-[#252B68] p-10 text-center shadow-2xl sm:p-14 lg:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-24 top-0 z-0 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
            <div className="mv-blob absolute -bottom-32 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          </div>
          <span className="mv-float pointer-events-none absolute left-[10%] top-6 text-4xl opacity-40">🎈</span>
          <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-6 text-4xl opacity-40">🎓</span>

          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              A place where every child can grow, learn and shine.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              Whether you spent one year or ten with us, you are part of the Mount View story. Join
              our alumni community, reconnect with classmates, and inspire the next generation.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/alumni"
                className="group rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Alumni
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
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
    </main>
  );
}

/* =========================================================
   SMALL REUSABLE PIECES
========================================================= */

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  if (tone === "dark") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        {children}
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      {children}
    </p>
  );
}

function CenteredHeading({
  eyebrow,
  title,
  description,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 text-3xl font-black sm:text-4xl ${
          tone === "dark" ? "text-white" : "text-[#252B68]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mx-auto mt-5 max-w-2xl leading-8 ${
            tone === "dark" ? "text-blue-100" : "text-slate-600"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function SectionSubheading({
  children,
  accent = "navy",
}: {
  children: React.ReactNode;
  accent?: "navy" | "orange";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2 w-2 rounded-full ${
          accent === "orange" ? "bg-[#F58220]" : "bg-[#252B68]"
        }`}
      />
      <h3 className="text-xl font-black text-[#252B68]">{children}</h3>
    </div>
  );
}

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
      className={`group relative ${size} shrink-0 overflow-hidden rounded-full bg-[#252B68] ring-4 ${ring} shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      {photo ? (
        <ImageWithFallback
          src={photo}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
  size = "h-20 w-20",
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
  size?: string;
}) {
  const ring = tone === "yellow" ? "ring-[#F58220]/40" : "ring-[#FFE900]/50";

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl">
      <div className="flex flex-col items-center text-center">
        <PersonAvatar
          photo={person.photo}
          name={person.name}
          initials={person.initials}
          size={size}
          ring={ring}
        />
        <div className="mt-5 min-w-0">
          <p className="text-lg font-black text-[#252B68]">{person.name}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-[#F58220]">
            {person.role}
          </p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-center text-sm leading-7 text-slate-600">
        {person.bio}
      </p>

      {person.focus && (
        <div className="mt-4 flex justify-center">
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
    <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <PersonAvatar
          photo={teacher.photo}
          name={teacher.name}
          initials={teacher.initials}
          size="h-24 w-24"
          ring="ring-[#FFE900]/50"
        />
        <span className="rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#252B68]">
          {teacher.className}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h4 className="text-lg font-black text-[#252B68]">{teacher.name}</h4>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#F58220]">
          {teacher.role}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">{teacher.bio}</p>
      </div>
    </div>
  );
}