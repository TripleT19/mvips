import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/* =========================================================
   CORE SUBJECTS — featured more prominently
========================================================= */
const coreSubjects = [
  {
    number: "01",
    title: "Mathematics",
    tagline: "Thinking with numbers",
    description:
      "Building confidence with numbers, patterns, problem-solving and mathematical thinking through meaningful, hands-on learning experiences.",
    highlights: [
      "Number fluency & mental maths",
      "Problem-solving strategies",
      "Reasoning & investigation",
      "Real-life mathematical thinking",
    ],
    icon: "∑",
    image: "/images/steam-learning.jpg",
    href: "/admissions",
  },
  {
    number: "02",
    title: "English",
    tagline: "Communicating with confidence",
    description:
      "Developing strong communication through reading, writing, speaking, listening and creative expression at every stage of the school.",
    highlights: [
      "Reading for pleasure & purpose",
      "Creative & structured writing",
      "Speaking, listening & performance",
      "Grammar, spelling & phonics",
    ],
    icon: "Aa",
    image: "/images/school-life.jpg",
    href: "/admissions",
  },
  {
    number: "03",
    title: "Science",
    tagline: "Curiosity in action",
    description:
      "Encouraging curiosity through observation, investigation, experimentation and understanding the world around us.",
    highlights: [
      "Practical investigation",
      "Scientific thinking",
      "Understanding the natural world",
      "Recording & explaining findings",
    ],
    icon: "⚗",
    image: "/images/creative-arts.jpg",
    href: "/admissions",
  },
];

/* =========================================================
   ALL OTHER SUBJECTS — balanced across the curriculum
========================================================= */
const otherSubjects = [
  {
    number: "04",
    title: "Sports",
    description:
      "Teamwork, resilience, coordination and a healthy attitude to physical activity.",
    icon: "⚽",
  },
  {
    number: "05",
    title: "Swimming",
    description:
      "Water confidence, coordination, safety and an important life skill for every learner.",
    icon: "≈",
  },
  {
    number: "06",
    title: "ICT",
    description:
      "Practical digital confidence through creative, purposeful and responsible use of technology.",
    icon: "⌘",
  },
  {
    number: "07",
    title: "Research",
    description:
      "A Year 6 programme that helps learners investigate questions across all subject areas.",
    icon: "⌕",
  },
  {
    number: "08",
    title: "Arts",
    description:
      "Imagination, visual expression and creative techniques through hands-on art activities.",
    icon: "✦",
  },
  {
    number: "09",
    title: "Phonics",
    description:
      "Structured early reading and spelling through sound awareness and phonics knowledge.",
    icon: "ABC",
  },
  {
    number: "10",
    title: "Dance & Drama",
    description:
      "Building confidence, expression, collaboration and creativity through movement and performance.",
    icon: "✧",
  },
  {
    number: "11",
    title: "Music",
    description:
      "Exploring rhythm, melody, performance and musical creativity while encouraging enjoyment.",
    icon: "♫",
  },
  {
    number: "12",
    title: "Learning Support",
    description:
      "Encouragement and appropriate support so every learner can make progress and participate fully.",
    icon: "♡",
  },
];

/* =========================================================
   LEARNING STAGES
========================================================= */
const learningStages = [
  {
    number: "01",
    title: "Explore",
    description:
      "Learners begin with curiosity. They ask questions, observe, discuss, investigate and connect new ideas with what they already know.",
  },
  {
    number: "02",
    title: "Understand",
    description:
      "Learners develop knowledge and understanding through explanation, practice, discussion, collaboration and purposeful activities.",
  },
  {
    number: "03",
    title: "Apply",
    description:
      "Learners use what they know to solve problems, create, investigate, communicate and respond to meaningful situations.",
  },
  {
    number: "04",
    title: "Grow",
    description:
      "Learners reflect on their progress, develop independence and build the confidence to take on new challenges.",
  },
];

const futureReadySkills = [
  "Critical thinking",
  "Problem solving",
  "Communication",
  "Collaboration",
  "Creativity",
  "Digital confidence",
  "Research skills",
  "Independent learning",
];

export default function AcademicsPage() {
  return (
    <main className="bg-white text-[#172033]">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#FFE900]/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          {/* TEXT */}
          <div className="order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Now enrolling · Early Years → Year 6
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learning with purpose and{" "}
              <span className="text-[#FFE900]">possibility.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              A broad, balanced curriculum built around every child — strong
              foundations in the core subjects, plus sport, swimming, ICT,
              research, arts, music and more.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#curriculum"
                className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Explore Our Curriculum
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/admissions"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-3.5 font-bold text-white transition hover:bg-white hover:text-[#252B68]"
              >
                Apply Now
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">12+</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Subjects Taught
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">600+</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Learners
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-[#FFE900]">1975</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Established
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================
              ADVERTISING HERO IMAGE
              • Outer wrapper `relative isolate` creates a fresh stacking
                context so nothing competes with the overlays.
              • Every text/badge layer has an explicit z-10 / z-20.
              • Gradients have pointer-events-none.
              • Ribbons stay on the outer edges so nothing covers the
                text column next to the image.
          ============================================================ */}
          <div className="order-1 lg:order-2">
            <div className="relative isolate">
              <div className="pointer-events-none absolute -inset-3 z-0 rounded-[2.5rem] bg-[#FFE900]/15 blur-2xl" />

              <div className="relative z-10 overflow-hidden rounded-[2rem] border-[10px] border-white/10 bg-[#171B4A] shadow-2xl ring-1 ring-white/10">
                <div className="relative">
                  <ImageWithFallback
                    src="/images/steam-learning.jpg"
                    alt="Learners engaged in active learning at Mount View"
                    className="aspect-[4/5] w-full sm:aspect-[4/3]"
                  />

                  {/* Gradient overlay above image */}
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E] via-[#0B0F2E]/55 to-transparent" />

                  {/* Top badge */}
                  <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#F58220]" />
                    Curriculum 2024/25
                  </div>

                  {/* Top-right badge */}
                  <div className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/35 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    Core · Creative · Active
                  </div>

                  {/* Bottom promotional panel */}
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFE900]">
                        Learning at Mount View
                      </p>

                      <p className="mt-1.5 text-lg font-black leading-snug text-white sm:text-xl">
                        Strong foundations. Broad opportunities.
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/85">
                        English, Mathematics and Science at the core — plus
                        sport, swimming, ICT, research, arts, music, dance and
                        drama.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          href="#curriculum"
                          className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-4 py-2 text-xs font-black text-white transition hover:bg-[#d96e12]"
                        >
                          See Curriculum
                          <span>→</span>
                        </Link>

                        <Link
                          href="/admissions"
                          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-[#252B68]"
                        >
                          Enrol Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating ribbon — sits on the RIGHT edge of the image
                  and only on large screens, so it never overlaps the
                  text column on the left. */}
              <div className="absolute -right-3 top-1/3 z-20 hidden -translate-y-1/2 rotate-[6deg] rounded-xl bg-[#F58220] px-4 py-3 shadow-2xl lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/85">
                  Core focus
                </p>
                <p className="text-sm font-black text-white">
                  English · Maths · Science
                </p>
              </div>

              {/* Trust badge — bottom-right, well below the ribbon */}
              <div className="absolute -bottom-5 -right-3 z-20 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-lg text-[#FFE900]">
                  ★
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Since 1975
                  </p>
                  <p className="text-xs font-black text-[#252B68]">
                    Trusted by families
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRODUCTION / PHILOSOPHY
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
            Our Academic Philosophy
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl lg:text-5xl">
            Building strong foundations for a changing world.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            At Mount View, learning is about more than remembering
            information. We help learners understand ideas, ask questions,
            solve problems, communicate clearly and apply their knowledge in
            meaningful ways.
          </p>

          <div className="mt-12 grid gap-5 text-left sm:grid-cols-3">
            <div className="relative isolate overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#252B68] text-xl font-black text-white">
                01
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Strong Foundations
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Essential knowledge, understanding and skills from the
                earliest stages of learning.
              </p>
            </div>

            <div className="relative isolate overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F58220] text-xl font-black text-white">
                02
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Active Learning
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Opportunities to explore, practise, discuss, create,
                investigate and apply what they learn.
              </p>
            </div>

            <div className="relative isolate overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE900] text-xl font-black text-[#252B68]">
                03
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Growing Independence
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Helping learners gradually take greater responsibility for
                their learning, thinking and development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CORE SUBJECTS — ADVERTISING SPOTLIGHT
      ========================================================== */}
      <section
        id="curriculum"
        className="scroll-mt-24 bg-slate-50 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              Core Subjects
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl lg:text-5xl">
              Where strong foundations begin.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Every learner at Mount View builds their academic journey on
              three core subjects — English, Mathematics and Science. These
              are the foundations that unlock every other subject.
            </p>
          </div>

          <div className="mt-14 space-y-8">
            {coreSubjects.map((subject, index) => {
              const isEven = index % 2 === 0;

              return (
                <article
                  key={subject.number}
                  className="relative isolate overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 lg:grid lg:grid-cols-2"
                >
                  {/* IMAGE SIDE */}
                  <div
                    className={`relative isolate ${
                      isEven ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <div className="relative">
                      <ImageWithFallback
                        src={subject.image}
                        alt={`${subject.title} at Mount View International Primary School`}
                        className="aspect-[4/3] w-full lg:aspect-auto lg:h-full"
                      />

                      {/* Gradient overlay (in front of image) */}
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E]/80 via-[#0B0F2E]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0B0F2E]/40" />

                      {/* Number badge */}
                      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                        Core subject · {subject.number}
                      </div>

                      {/* Bottom caption */}
                      <div className="absolute bottom-4 left-4 z-20 hidden lg:block">
                        <div className="rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#FFE900]">
                            {subject.tagline}
                          </p>
                          <p className="text-sm font-black text-white">
                            {subject.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONTENT SIDE */}
                  <div
                    className={`relative p-8 sm:p-10 lg:p-12 ${
                      isEven ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252B68] text-lg font-black text-white">
                      {subject.icon}
                    </div>

                    <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                      {subject.tagline}
                    </p>

                    <h3 className="mt-3 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                      {subject.title}
                    </h3>

                    <p className="mt-4 leading-7 text-slate-600">
                      {subject.description}
                    </p>

                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                      {subject.highlights.map((highlight) => (
                        <div
                          key={highlight}
                          className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-[10px] font-black text-[#252B68]">
                            ✓
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href={subject.href}
                        className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#d96e12]"
                      >
                        Enrol your child
                        <span>→</span>
                      </Link>

                      <Link
                        href="#all-subjects"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-5 py-2.5 text-sm font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                      >
                        See all subjects
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ALL OTHER SUBJECTS — balanced grid
      ========================================================== */}
      <section
        id="all-subjects"
        className="scroll-mt-24 bg-white py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              A Broad & Balanced Curriculum
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              More than the core.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Alongside English, Mathematics and Science, learners experience
              a full range of creative, physical, digital and support subjects
              that shape confident, well-rounded individuals.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {otherSubjects.map((subject) => (
              <article
                key={subject.number}
                className="group relative isolate overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#F58220]/30 hover:shadow-xl"
              >
                {/* Decorative corner */}
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-[#252B68]/5 transition group-hover:bg-[#FFE900]/40" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252B68] text-lg font-black text-white transition group-hover:bg-[#F58220]">
                    {subject.icon}
                  </div>

                  <span className="text-xs font-black tracking-widest text-slate-300">
                    {subject.number}
                  </span>
                </div>

                <h3 className="relative mt-5 text-xl font-black text-[#252B68]">
                  {subject.title}
                </h3>

                <p className="relative mt-3 leading-7 text-slate-600">
                  {subject.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12]"
            >
              Start Your Application
              <span className="ml-2">→</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#252B68] px-7 py-3.5 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
            >
              Book a School Visit
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNING JOURNEY
      ========================================================== */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              The Mount View Learning Journey
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              From curiosity to confidence.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              As children progress through the school, learning experiences
              become increasingly purposeful and independent. Our aim is to
              help every learner develop the confidence to think, question,
              create and contribute.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {learningStages.map((stage, index) => (
              <div
                key={stage.number}
                className="relative isolate rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-sm font-black text-[#F58220]">
                  {stage.number}
                </span>

                <h3 className="mt-4 text-2xl font-black text-[#252B68]">
                  {stage.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {stage.description}
                </p>

                <div className="mt-6 h-1 w-12 rounded-full bg-[#FFE900] transition-all duration-300 group-hover:w-20" />

                {index < learningStages.length - 1 && (
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
          CURRICULUM AT A GLANCE — advertising-style stat band
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#252B68] p-8 sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFE900]/10" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#F58220]/10" />

            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  Curriculum at a glance
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  A complete learning experience, every week.
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
                  Learners at Mount View benefit from a curriculum that
                  balances core academics with creative, physical and digital
                  opportunities — every single week.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {[
                    "English",
                    "Maths",
                    "Science",
                    "ICT",
                    "Sports",
                    "Swimming",
                    "Arts",
                    "Music",
                    "Dance",
                    "Drama",
                    "Phonics",
                    "Research",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    href="/admissions"
                    className="inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:bg-[#d96e12]"
                  >
                    Apply Now
                    <span>→</span>
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3 font-black text-white transition hover:bg-white hover:text-[#252B68]"
                  >
                    Visit the School
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-[#FFE900]">12+</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">
                    Subjects every week
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-[#FFE900]">3</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">
                    Core foundations
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-[#FFE900]">2</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">
                    Learning stages
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-[#FFE900]">1</p>
                  <p className="mt-1 text-sm font-semibold text-blue-100">
                    Child-centred approach
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FUTURE READY
      ========================================================== */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#FFE900] p-8 sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#252B68]">
                  Future-Ready Learning
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  Skills that travel beyond the classroom.
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-[#252B68]/80">
                  We want learners to develop more than subject knowledge.
                  They also need the confidence and skills to approach
                  unfamiliar situations, investigate questions, learn
                  independently and work with others.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {futureReadySkills.map((skill, index) => (
                  <div
                    key={skill}
                    className="flex items-center gap-4 rounded-2xl bg-white/70 px-5 py-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#252B68] text-sm font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="font-bold text-[#252B68]">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNING SUPPORT
      ========================================================== */}
      <section className="bg-[#252B68] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                Every Learner Matters
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Supporting every child to make progress.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Children learn in different ways and at different rates. We
                aim to create supportive learning experiences that recognise
                individual needs, encourage participation and help learners
                build confidence.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-black text-[#FFE900]">
                    Encouragement
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    Creating an environment where learners can ask questions,
                    make progress and learn from challenges.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-black text-[#FFE900]">
                    Differentiation
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    Providing appropriate learning approaches and support to
                    help learners engage with their learning.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F58220] text-2xl">
                ♡
              </div>

              <h3 className="mt-6 text-2xl font-black">
                Learning with empathy.
              </h3>

              <p className="mt-4 leading-8 text-blue-100">
                Our approach reflects the values at the heart of Mount View:
                fostering growth, excellence and empathy while helping each
                learner discover their own potential.
              </p>

              <Link
                href="/admissions"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-5 py-2.5 text-sm font-black text-[#252B68] transition hover:bg-white"
              >
                Enrol Your Child
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PARENTS
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
            A Partnership with Parents
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
            Learning works best when school and home work together.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            We value the role parents and families play in supporting children
            as they grow. Communication, encouragement and a shared interest
            in learning can help children develop positive attitudes towards
            school and their own progress.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/about"
              className="rounded-full bg-[#252B68] px-7 py-3.5 font-bold text-white transition hover:bg-[#171B4A]"
            >
              Learn About Mount View
            </Link>

            <Link
              href="/contact"
              className="rounded-full border-2 border-[#252B68] px-7 py-3.5 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMISSIONS CTA
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#F58220]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#252B68]/10" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
              Start the Journey
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ready to discover Mount View?
            </h2>

            <p className="mt-4 text-lg leading-8 text-white/90">
              Learn more about our school, our approach to learning and how to
              begin your child&apos;s journey with us.
            </p>
          </div>

          <Link
            href="/admissions"
            className="shrink-0 rounded-full bg-[#252B68] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#171B4A]"
          >
            Explore Admissions →
          </Link>
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
          Mount View International Primary School & Early Years Centre
        </p>
      </section>
    </main>
  );
}