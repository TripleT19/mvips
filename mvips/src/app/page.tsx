import Link from "next/link";
import ImageWithFallback from "./components/ImageWithFallback";

const highlights = [
  {
    number: "01",
    title: "Early Years",
    description:
      "A warm and engaging start where children can develop confidence, curiosity and positive attitudes towards learning.",
    image: "/images/school-life.jpg",
    href: "/admissions",
  },
  {
    number: "02",
    title: "Primary Learning",
    description:
      "Building strong foundations while encouraging learners to think, communicate, investigate and apply what they know.",
    image: "/images/steam-learning.jpg",
    href: "/academics",
  },
  {
    number: "03",
    title: "Future Skills",
    description:
      "Developing creativity, digital confidence, research skills, collaboration and independent learning.",
    image: "/images/ict.jpg",
    href: "/academics",
  },
];

const learningAreas = [
  {
    title: "Academic Learning",
    description:
      "Strong foundations in core learning alongside opportunities to explore ideas, solve problems and develop understanding.",
    icon: "Aa",
  },
  {
    title: "ICT & Technology",
    description:
      "Purposeful use of technology to support creativity, communication, research, problem-solving and digital confidence.",
    icon: "⌘",
  },
  {
    title: "Research",
    description:
      "Year 6 learners develop structured research skills and apply them to assignments across different subject areas.",
    icon: "⌕",
  },
  {
    title: "STEAM",
    description:
      "Opportunities to connect science, technology, engineering, arts and mathematics through practical learning.",
    icon: "✦",
  },
  {
    title: "Sports & Swimming",
    description:
      "Physical activities that encourage teamwork, confidence, coordination, resilience and an active lifestyle.",
    icon: "⚽",
  },
  {
    title: "Creative Arts",
    description:
      "Music, dance, drama and creative activities that give learners opportunities to express themselves.",
    icon: "♫",
  },
];

const reasons = [
  {
    title: "A Caring Environment",
    description:
      "We value the individual child and aim to create an environment where learners feel encouraged to participate, explore and grow.",
  },
  {
    title: "A Vibrant Community",
    description:
      "Our school brings together children and families from both expatriate and Malawian communities.",
  },
  {
    title: "Learning Beyond the Classroom",
    description:
      "Learning is enriched through technology, creativity, physical activities, research, projects and practical experiences.",
  },
  {
    title: "Growth, Excellence & Empathy",
    description:
      "Our school identity is centred on fostering growth, excellence and empathy throughout the learner's journey.",
  },
];

const journey = [
  {
    step: "01",
    title: "Discover",
    description:
      "Children are encouraged to ask questions, explore their interests and discover the world around them.",
  },
  {
    step: "02",
    title: "Develop",
    description:
      "Learners build knowledge, skills, confidence and positive learning habits.",
  },
  {
    step: "03",
    title: "Create",
    description:
      "Learners use their knowledge and imagination to solve problems, communicate ideas and create.",
  },
  {
    step: "04",
    title: "Thrive",
    description:
      "Learners grow in independence and confidence as they prepare for the opportunities ahead.",
  },
];

export default function Home() {
  return (
    <main className="bg-white text-[#172033]">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#FFE900]/10" />
        <div className="absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          {/* HERO TEXT */}
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
              Welcome to Mount View International Primary School & Early Years
              Centre — a nurturing and inclusive learning environment for
              children from both expatriate and Malawian families.
            </p>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              With a vibrant community of over 600 students, Mount View brings
              together learning, creativity, technology, physical development
              and opportunities for children to grow with confidence.
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
                <p className="text-2xl font-black text-[#FFE900]">1</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">
                  Vibrant Community
                </p>
              </div>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2.5rem] bg-[#FFE900]/10 blur-xl" />

              {/* Clean image — no overlays covering the photograph */}
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white/10 bg-white/10 shadow-2xl">
                <ImageWithFallback
                  src="/images/school-life.jpg"
                  alt="Learners enjoying school life at Mount View International Primary School"
                  className="aspect-[4/3] w-full"
                />
              </div>

              {/* Small caption below the image */}
              <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#FFE900]">
                    Mount View
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Learning, growing and belonging together.
                  </p>
                </div>

                <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#F58220] text-lg font-black text-white sm:flex">
                  →
                </span>
              </div>
            </div>
          </div>
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
            A school community built around children.
          </h2>

          <p className="mx-auto mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Established in 1975, Mount View International Primary School and
            Early Years Centre provides a nurturing and inclusive educational
            environment for children from both expatriate and Malawian
            families. With a vibrant community of over 600 students, the
            school provides a place where children can learn, develop
            friendships, discover their interests and grow in confidence.
          </p>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-500">
            Our aim is to create meaningful learning experiences while
            fostering the values of growth, excellence and empathy.
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
                An established school community with a history dating back to
                1975.
              </p>
            </div>

            <div className="rounded-3xl bg-[#252B68] p-7 text-center shadow-sm">
              <p className="text-4xl font-black text-[#FFE900]">600+</p>
              <p className="mt-2 font-bold text-white">
                Students & Growing Community
              </p>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                A vibrant community bringing learners and families together.
              </p>
            </div>

            <div className="rounded-3xl bg-[#FFE900] p-7 text-center shadow-sm">
              <p className="text-4xl font-black text-[#252B68]">2</p>
              <p className="mt-2 font-bold text-[#252B68]">
                Early Years & Primary
              </p>
              <p className="mt-3 text-sm leading-6 text-[#252B68]/70">
                Supporting children across their early learning and primary
                school journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          THREE HIGHLIGHTS
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              The Mount View Experience
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              A learning journey designed around the child.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              From Early Years through primary education, we aim to provide
              opportunities for children to learn, explore, create and develop
              confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.number}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="aspect-[16/10] w-full"
                />

                <div className="p-7">
                  <span className="text-sm font-black text-[#F58220]">
                    {item.number}
                  </span>

                  <h3 className="mt-3 text-2xl font-black text-[#252B68]">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {item.description}
                  </p>

                  <Link
                    href={item.href}
                    className="mt-5 inline-flex font-bold text-[#252B68] transition hover:text-[#F58220]"
                  >
                    Discover more
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
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/creative-arts.jpg"
                alt="Learners participating in creative learning activities"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -right-3 rounded-2xl bg-[#FFE900] px-5 py-4 shadow-xl sm:-right-7">
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
              We want children to develop not only what they know, but also
              how they think, communicate, collaborate and respond to new
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
              Learners experience a broad range of academic, digital, creative
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
          ICT / STEAM FEATURE
      ========================================================== */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
                Preparing Learners for Tomorrow
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                Technology, research and creativity in learning.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Learning at Mount View includes opportunities to use
                technology, investigate questions, work on projects and
                develop the skills needed to approach unfamiliar challenges.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Digital confidence",
                  "Research skills",
                  "Creative thinking",
                  "Problem solving",
                  "Collaboration",
                  "Independent learning",
                ].map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE900] text-sm font-black text-[#252B68]">
                      ✓
                    </span>

                    <span className="font-semibold text-slate-700">
                      {skill}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/academics#research"
                className="mt-9 inline-flex items-center font-black text-[#252B68] transition hover:text-[#F58220]"
              >
                Discover our learning approach
                <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-2xl">
                <ImageWithFallback
                  src="/images/steam.jpg"
                  alt="Learners participating in STEAM activities"
                  className="aspect-[4/3] w-full"
                />
              </div>

              <div className="absolute -bottom-6 -left-4 max-w-xs rounded-2xl bg-[#F58220] p-5 text-white shadow-xl sm:-left-8">
                <p className="text-xs font-black uppercase tracking-wider text-white/75">
                  Learning by doing
                </p>

                <p className="mt-1 text-lg font-black">
                  Think. Explore. Create.
                </p>
              </div>
            </div>
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
              stronger knowledge, growing independence and the confidence to
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
            <div className="min-h-[320px]">
              <ImageWithFallback
                src="/images/sports.jpg"
                alt="Learners taking part in school activities"
                className="h-full min-h-[320px] w-full"
              />
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#252B68]">
                School Life
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                Because learning happens everywhere.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#252B68]/80">
                School life gives learners opportunities to participate,
                collaborate, compete, create and discover interests beyond
                their regular classroom learning.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Sports",
                  "Swimming",
                  "ICT",
                  "STEAM",
                  "Arts",
                  "Music",
                  "Dance",
                  "Drama",
                  "Clubs",
                  "Competitions",
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
          NEWS / COMMUNITY
      ========================================================== */}
      <section className="bg-slate-50 py-20 sm:py-24">
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
            <Link
              href="/news"
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <ImageWithFallback
                src="/images/news/quiz-2026.jpg"
                alt="Mount View school event"
                className="aspect-[16/10] w-full"
              />

              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                  School Events
                </p>

                <h3 className="mt-2 text-xl font-black text-[#252B68]">
                  Celebrating learning, teamwork and school spirit.
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Discover stories and updates from our school community.
                </p>
              </div>
            </Link>

            <Link
              href="/news"
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <ImageWithFallback
                src="/images/news/steam-learning.jpg"
                alt="Learners taking part in STEAM learning"
                className="aspect-[16/10] w-full"
              />

              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                  Learning
                </p>

                <h3 className="mt-2 text-xl font-black text-[#252B68]">
                  Learning through exploration and creativity.
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  See how learning experiences extend beyond the classroom.
                </p>
              </div>
            </Link>

            <Link
              href="/gallery"
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <ImageWithFallback
                src="/images/news/school-life.jpg"
                alt="Life and learning at Mount View"
                className="aspect-[16/10] w-full"
              />

              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-wider text-[#F58220]">
                  School Life
                </p>

                <h3 className="mt-2 text-xl font-black text-[#252B68]">
                  Experience the Mount View community.
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Explore photographs and moments from school life.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMISSIONS CTA
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#F58220]/10" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#FFE900]/10" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                Your Child's Journey Starts Here
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Looking for a school where your child can grow?
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Discover Mount View International Primary School & Early Years
                Centre and learn more about our learning approach, school life
                and admissions journey.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admissions"
                  className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-8 py-4 font-black text-white transition hover:bg-[#d96e12] hover:shadow-lg"
                >
                  Explore Admissions
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
                Fostering growth, excellence and empathy.
              </h3>

              <p className="mt-4 leading-8 text-blue-100">
                These values are at the heart of the Mount View experience and
                guide our approach to supporting learners as they develop their
                knowledge, confidence and independence.
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
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#252B68]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white/80">
            Mount View International Primary School & Early Years Centre
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Give your child a place to discover, develop, create and thrive.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
            Explore our school, discover our approach to learning and take the
            next step towards your child's Mount View journey.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="rounded-full bg-[#252B68] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#171B4A]"
            >
              Start Your Enquiry →
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