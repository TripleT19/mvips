import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const stages = [
  {
    title: "Early Years",
    years: "Pre-Nursery, Nursery, Reception",
    framework: "Cambridge Early Years",
    desc: "The curriculum is based around 4 main themes: A unique child, Positive relationships, Enabling environments, and Learning and development.",
    details:
      "7 areas of learning: 3 prime areas (Personal, Social and Emotional Development; Communication and Language; Physical Development) and 4 specific areas (Literacy, Maths, Understanding the World, Expressive Arts and Design). Specialist subjects like ICT, Swimming, PE, Art, and Music are also included.",
    image: "/images/school-life.jpg",
    emoji: "🌱",
  },
  {
    title: "Key Stage 1",
    years: "Year 1 & Year 2",
    framework: "Cambridge Primary",
    desc: "Focus on providing engaging and meaningful learning experiences to prepare students academically and socially.",
    details:
      "Special emphasis on foundational skills in English (including Phonics) and Maths. Other subjects like Global Perspectives, ICT, Art, Music, and PE are integrated into topic-themed lessons.",
    image: "/images/creative-arts.jpg",
    emoji: "🚀",
  },
  {
    title: "Lower Key Stage 2",
    years: "Year 3 & Year 4",
    framework: "Cambridge Primary",
    desc: "Continuing to emphasise core subjects like English and Mathematics while broadening the learning experience.",
    details:
      "Students explore Science, Global Perspectives, Art, and Music. PE lessons remain a regular part of the curriculum. The curriculum is carefully planned to link subject areas and provide real-world contexts.",
    image: "/images/ict.JPG",
    emoji: "🧭",
  },
  {
    title: "Upper Key Stage 2",
    years: "Year 5 & Year 6",
    framework: "Cambridge Primary",
    desc: "Students begin to take greater responsibility for their own learning and progress, becoming more independent learners.",
    details:
      "Supported in developing critical thinking skills, questioning, and exploring various topics. The curriculum is meticulously aligned with learning objectives to prepare students for the Cambridge Checkpoint exams at the end of Year 6.",
    image: "/images/science.jpg",
    emoji: "🎓",
  },
];

const curriculumAreas = [
  {
    icon: "📖",
    title: "English, Mathematics & Science",
    desc: "Academic rigour blended with flexibility and creativity — the beating heart of our Cambridge Primary programme.",
    image: "/images/steam-learning.jpg",
  },
  {
    icon: "🌍",
    title: "Global Perspectives",
    desc: "Students explore sustainability, equality, technology and cultural diversity — then act on what they learn.",
    image: "/images/early-years-global.jpg",
  },
  {
    icon: "💻",
    title: "Digital Literacy & Computing",
    desc: "Purposeful, creative and confident use of technology to communicate, design and solve problems.",
    image: "/images/ict.JPG",
  },
  {
    icon: "🎨",
    title: "Art, Music, Dance & PE",
    desc: "Expression, movement and performance — because a broad curriculum builds a whole child.",
    image: "/images/creative-arts.jpg",
  },
];

const whyCambridge = [
  {
    title: "Global perspectives and cultural awareness",
    icon: "🌍",
    img: "/images/early-years-global.jpg",
  },
  {
    title: "Child-centred learning tailored to individual needs",
    icon: "🧩",
    img: "/images/early-years-child.jpg",
  },
  {
    title:
      "Developmentally appropriate practices that spark creativity and critical thinking",
    icon: "💡",
    img: "/images/early-years-creative.jpg",
  },
];

const earlyYearsStages = [
  {
    title: "Foundation Stage",
    age: "18 months – 3 years",
    focus: "Exploration, Sensory Play & Social Development",
    desc: "Children begin their learning journey through sensory-rich experiences and gentle social interactions. Our nurturing environment encourages trust, curiosity, and joyful discovery.",
    emoji: "🐣",
    ring: "ring-[#FFE900]",
    chip: "bg-[#FFE900] text-[#252B68]",
    areas: [
      { name: "Communication & Language", detail: "Listening, simple instructions, expressive vocabulary", icon: "🗣️" },
      { name: "Physical Development", detail: "Gross/fine motor skills, toilet training", icon: "🤸" },
      { name: "Personal, Social & Emotional", detail: "Cooperative play, emotional expression", icon: "💛" },
      { name: "Mathematics", detail: "Shapes, counting, size exploration", icon: "🔢" },
      { name: "Literacy", detail: "Story time, name recognition, early mark-making", icon: "✏️" },
      { name: "Understanding the World", detail: "Nature, family, weather changes", icon: "🌦️" },
      { name: "Creative Arts & Expression", detail: "Paint, music, textures, movement", icon: "🎨" },
    ],
  },
  {
    title: "Nursery",
    age: "3+ – 4 years",
    focus: "Language Expansion, Independence & Early Concepts",
    desc: "As children grow, they begin to express themselves more confidently and explore early academic concepts through play and guided inquiry.",
    emoji: "🦋",
    ring: "ring-[#F58220]",
    chip: "bg-[#F58220] text-white",
    areas: [
      { name: "Communication & Language", detail: "Vocabulary growth, questioning, multi-step instructions", icon: "🗣️" },
      { name: "Physical Development", detail: "Cutting, drawing, balance", icon: "✂️" },
      { name: "Personal, Social & Emotional", detail: "Empathy, routine-following, independent choices", icon: "🤝" },
      { name: "Mathematics", detail: "Counting, sorting, patterns, quantifying", icon: "🔢" },
      { name: "Literacy", detail: "Letter recognition, phonemic awareness, CVC words, storytelling", icon: "📚" },
      { name: "Understanding the World", detail: "Community roles, seasons, animals", icon: "🏘️" },
      { name: "Creative Arts & Expression", detail: "Role play, media exploration, music response", icon: "🎭" },
    ],
  },
  {
    title: "Reception",
    age: "4+ – 5+ years",
    focus: "School Readiness, Critical Thinking & Confidence",
    desc: "In the final year, children are prepared for formal schooling with a focus on independence, resilience, and foundational academic skills.",
    emoji: "🌟",
    ring: "ring-[#252B68]",
    chip: "bg-[#252B68] text-white",
    areas: [
      { name: "Communication & Language", detail: "Speaking in complete sentences, storytelling, event description", icon: "💬" },
      { name: "Physical Development", detail: "Writing, team games, hygiene management", icon: "⚽" },
      { name: "Personal, Social & Emotional", detail: "Conflict resolution, task responsibility", icon: "🕊️" },
      { name: "Mathematics", detail: "Counting, addition & subtraction, patterns, shapes, time & measurement", icon: "➗" },
      { name: "Literacy", detail: "Reading simple words & sentences, sentence writing, story structure", icon: "📝" },
      { name: "Understanding the World", detail: "Experiments, maps, cultures", icon: "🗺️" },
      { name: "Creative Arts & Expression", detail: "Art planning, group performance, rhythm", icon: "🎵" },
    ],
  },
];

const coreSubjects = [
  {
    title: "English & Phonics",
    desc: "Developing strong communication. In Early Years and Reception, we use Jolly Phonics. In Key Stage 1, we use 'Letters and Sounds' (phases 2 to 6) to turn pupils into fluent readers and accurate spellers.",
    icon: "Aa",
    image: "/images/creative-arts.jpg",
  },
  {
    title: "Mathematics",
    desc: "Building confidence with numbers, patterns, problem-solving, and mathematical thinking through meaningful, hands-on learning experiences.",
    icon: "∑",
    image: "/images/steam-learning.jpg",
  },
  {
    title: "Science",
    desc: "Encouraging curiosity through observation, investigation, experimentation, and understanding the world around us.",
    icon: "⚗",
    image: "/images/science.jpg",
  },
];

const otherSubjects = [
  { icon: "🌍", title: "Global Perspectives", desc: "Understanding global concepts and basic ICT skills through interactive lessons.", image: "/images/early-years-global.jpg" },
  { icon: "💻", title: "ICT", desc: "Purposeful use of technology to support creativity, communication, and digital confidence.", image: "/images/ict.JPG" },
  { icon: "🎨", title: "Art", desc: "Imagination, visual expression, and creative techniques through hands-on activities.", image: "/images/creative-arts.jpg" },
  { icon: "🎵", title: "Music", desc: "Exploring rhythm, melody, performance, and musical creativity.", image: "/images/creative-arts.jpg" },
  { icon: "🏃", title: "PE", desc: "Enhancing sports skills, teamwork, and physical development.", image: "/images/sports.JPG" },
  { icon: "🏊", title: "Swimming", desc: "Water confidence, coordination, safety, and an important life skill.", image: "/images/sports.JPG" },
  { icon: "🤗", title: "Learning Support", desc: "Inclusive education helping every child succeed at their own pace.", image: "/images/early-years-child.jpg" },
];

const outdoorPoints = [
  { icon: "❓", title: "Big questions, real problems", desc: "Lessons are designed around big questions and real-world problems.", image: "/images/school-life.jpg" },
  { icon: "🧪", title: "Hands-on discovery", desc: "Students engage in hands-on activities, experiments, group discussions, and field research.", image: "/images/science.jpg" },
  { icon: "🧑‍🏫", title: "Teachers as facilitators", desc: "Teachers guide exploration and support individual growth rather than simply delivering content.", image: "/images/creative-arts.jpg" },
  { icon: "🚌", title: "Learning beyond walls", desc: "Regular field trips, nature walks, and cultural excursions connect classroom concepts with the real world.", image: "/images/school-life.jpg" },
  { icon: "🌿", title: "Garden & eco-lab", desc: "Our school garden or eco-lab where students learn sustainability hands-on.", image: "/images/early-years-creative.jpg" },
  { icon: "☀️", title: "Outdoor learning space", desc: "Dedicated outdoor learning spaces that encourage exploration and wellness.", image: "/images/school-life.jpg" },
];

const wellbeingPoints = [
  { icon: "🧘", text: "Mindfulness and Cambridge Wellbeing embedded in the curriculum" },
  { icon: "🤝", text: "Peer mentoring and conflict resolution programmes" },
  { icon: "💰", text: "Promoting financial literacy and entrepreneurship" },
];

const personalisedPoints = [
  { icon: "📁", text: "Student portfolios and individual learning pathways", image: "/images/creative-arts.jpg" },
  { icon: "📝", text: "Regular formative feedback instead of one-size-fits-all grading", image: "/images/steam-learning.jpg" },
  { icon: "🎯", text: "Goal-setting with teachers to foster agency and accountability", image: "/images/school-life.jpg" },
];

const leadershipPoints = [
  { icon: "🏛️", text: "Student council and ambassador roles", image: "/images/school-life.jpg" },
  { icon: "🌐", text: "Service learning projects tied to the UN Sustainable Development Goals", image: "/images/early-years-global.jpg" },
  { icon: "🎤", text: "Public speaking, debate clubs, and financial literacy", image: "/images/creative-arts.jpg" },
];

const whyChooseUs = [
  { icon: "🏫", text: "Safe, inclusive, and inspiring school environment" },
  { icon: "🔬", text: "Research-based curriculum with connection to real-world learning" },
  { icon: "👩‍🏫", text: "Experienced and qualified educators" },
  { icon: "🏸", text: "Facilities for all-round development" },
  { icon: "🤝", text: "Strong parent-school partnership" },
  { icon: "🏆", text: "Academic excellence with personal development" },
  { icon: "❤️", text: "A compassionate, caring community of learners" },
];

const marqueeItems = [
  "English", "Mathematics", "Science", "Global Perspectives", "Digital Literacy",
  "Computing", "Art", "Music", "Dance", "Physical Education", "Swimming",
  "Outdoor Learning", "Wellbeing", "Leadership", "Multilingual Literacy",
];

/* ------------------------------------------------------------------ */
/*  SMALL HELPERS                                                      */
/* ------------------------------------------------------------------ */

type SectionTitleProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
  center?: boolean;
};

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  dark = false,
  center = true,
}: SectionTitleProps) {
  return (
    <div className={`${center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>
      <p
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] ${
          dark ? "bg-white/10 text-[#FFE900]" : "bg-[#F58220]/10 text-[#F58220]"
        }`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] ${
          dark ? "text-white" : "text-[#252B68]"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base leading-8 sm:text-lg ${
            dark ? "text-blue-100" : "text-slate-600"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function AcademicsPage() {
  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* ---------- global animation styles ---------- */}
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
        .mv-marquee{animation:mv-marquee 30s linear infinite}

        @media (prefers-reduced-motion: reduce){
          .mv-float,.mv-float-alt,.mv-blob,.mv-pop,.mv-marquee{animation:none}
        }
      `}</style>

      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#F58220]/30 blur-3xl" />
          <div className="mv-blob absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#FFE900]/20 blur-3xl [animation-delay:-6s]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#4a55b8]/40 blur-3xl" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[6%] top-[18%] text-4xl opacity-80 sm:text-5xl">🌍</span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] top-[12%] text-4xl opacity-80 sm:text-5xl">🎨</span>
        <span className="mv-float pointer-events-none absolute left-[12%] bottom-[14%] text-3xl opacity-70 sm:text-4xl">🔬</span>
        <span className="mv-float-alt pointer-events-none absolute right-[14%] bottom-[18%] text-3xl opacity-70 sm:text-4xl">📚</span>
        <span className="mv-pop pointer-events-none absolute left-1/2 top-[8%] hidden text-2xl opacity-60 lg:block">✨</span>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              Cambridge International Education
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learning with purpose and{" "}
              <span className="relative inline-block text-[#FFE900]">
                possibility.
                <svg
                  className="absolute -bottom-2 left-0 w-full text-[#F58220]"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9c40-6 90-8 196-4"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              At Mount View International, we empower young learners to become
              curious thinkers, confident communicators, and compassionate global
              citizens.
            </p>
            <p className="mt-4 max-w-2xl leading-8 text-blue-200/90">
              Located in a vibrant natural setting with a beautiful view, our
              primary school provides a nurturing environment where children aged
              5 to 11 years thrive through world-class education and meaningful
              exploration.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-lg shadow-[#F58220]/30 transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-xl"
              >
                Apply for Admission
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#early-years"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Explore Early Years 🐣
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Ages 2+ – 5 · Early Years",
                "Ages 5 – 11 · Primary",
                "Cambridge Curriculum",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative isolate">
              <div className="pointer-events-none absolute -inset-3 z-0 rounded-[2.5rem] bg-[#FFE900]/20 blur-2xl" />
              <div className="relative z-10 overflow-hidden rounded-[2rem] border-[10px] border-white/10 bg-[#171B4A] shadow-2xl ring-1 ring-white/10">
                <ImageWithFallback
                  src="/images/steam-learning.jpg"
                  alt="Learning at Mount View International"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div className="mv-float absolute -left-4 top-8 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-8">
                <p className="text-2xl font-black leading-none text-[#252B68]">7</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Areas of learning
                </p>
              </div>
              <div className="mv-float-alt absolute -right-3 bottom-8 z-20 rounded-2xl bg-[#FFE900] px-4 py-3 shadow-xl sm:-right-6">
                <p className="text-2xl font-black leading-none text-[#252B68]">100%</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#252B68]/70">
                  Child-centred
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden border-y border-white/10 bg-[#171B4A]/70 py-4">
          <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white/60"
              >
                <span className="text-[#FFE900]">✦</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OUR CURRICULUM                                                   */}
      {/* ================================================================ */}
      <section className="relative bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Our Curriculum"
            title="Cambridge Primary — rigour, flexibility and creativity."
            subtitle="We follow the internationally recognised Cambridge Primary Curriculum, which blends academic rigour with flexibility and creativity."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {curriculumAreas.map((area, i) => (
              <div
                key={area.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl"
                style={{ transitionDelay: `${i * 20}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={area.image}
                    alt={area.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-lg backdrop-blur">
                    {area.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black leading-snug text-[#252B68]">
                    {area.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {area.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-3xl bg-[#252B68] shadow-xl">
            <div className="grid items-center gap-0 md:grid-cols-[1fr_1.4fr]">
              <div className="relative aspect-[16/10] md:aspect-auto md:h-full">
                <ImageWithFallback
                  src="/images/school-life.jpg"
                  alt="Experiential learning outdoors"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-[#252B68]/60 md:bg-gradient-to-r md:from-transparent md:to-[#252B68]" />
              </div>
              <div className="relative px-8 py-10 text-center md:text-left sm:px-12">
                <span className="mv-float pointer-events-none absolute right-6 top-4 text-3xl opacity-40">🔎</span>
                <span className="mv-float-alt pointer-events-none absolute left-6 bottom-4 text-3xl opacity-40">🌳</span>
                <p className="text-lg font-semibold leading-8 text-blue-100">
                  Our curriculum is enhanced by{" "}
                  <span className="text-[#FFE900]">experiential learning</span>,
                  where students are encouraged to go on field trips, observe, ask
                  questions, investigate, discover and learn to form informed
                  opinions. This approach fosters deeper understanding,
                  independence, and a lifelong love of learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OUR STAGES                                                       */}
      {/* ================================================================ */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Our Stages"
            title="A learning journey designed around the child."
            subtitle="From the very first steps in our Early Years Centre all the way to Cambridge Checkpoint in Year 6."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {stages.map((stage, index) => (
              <div
                key={stage.title}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <ImageWithFallback
                    src={stage.image}
                    alt={stage.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#252B68] shadow">
                    Stage {index + 1}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#252B68] backdrop-blur">
                    {stage.framework}
                  </span>
                  <span className="mv-float-alt pointer-events-none absolute bottom-3 right-4 text-4xl opacity-90 drop-shadow">
                    {stage.emoji}
                  </span>
                </div>
                <div className="p-7 sm:p-8">
                  <h3 className="text-2xl font-black text-[#252B68]">
                    {stage.emoji} {stage.title}
                  </h3>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-[#F58220]">
                    {stage.years}
                  </p>
                  <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                    {stage.desc}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {stage.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* EARLY YEARS                                                      */}
      {/* ================================================================ */}
      <section id="early-years" className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-20 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-8s]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Early Years · Ages 2+ to 5"
            title="A journey of discovery, growth and joy."
            subtitle="Our 3-year curriculum, inspired by the globally recognised Cambridge Early Years framework, is thoughtfully designed for children aged 2 plus to 5 years. Through a play-based, inquiry-driven approach, we nurture holistic development across key learning domains — ensuring every child grows with confidence, curiosity, and compassion."
          />

          <div className="mt-16">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl font-black text-[#252B68] sm:text-3xl">
                Why Cambridge Early Years?
              </h3>
              <p className="mt-3 text-slate-600">
                A glimpse into the moments that shape our youngest learners.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {whyCambridge.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-slate-200 transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={item.img}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#252B68] via-[#252B68]/25 to-transparent" />
                    <div className="mv-pop absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-lg backdrop-blur">
                      {item.icon}
                    </div>
                  </div>
                  <div className="relative bg-white p-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F58220]">
                      0{i + 1}
                    </p>
                    <h4 className="mt-2 text-base font-black leading-snug text-[#252B68]">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 space-y-8">
            {earlyYearsStages.map((stage) => (
              <div
                key={stage.title}
                className={`relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-lg ring-2 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-10 ${stage.ring}`}
              >
                <span className="mv-float pointer-events-none absolute -right-2 top-2 text-7xl opacity-10">
                  {stage.emoji}
                </span>

                <div className="grid gap-8 lg:grid-cols-[1fr_1.45fr]">
                  <div>
                    <span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest ${stage.chip}`}>
                      {stage.age}
                    </span>
                    <h3 className="mt-4 text-2xl font-black text-[#252B68] sm:text-3xl">
                      {stage.emoji} {stage.title}
                    </h3>
                    <p className="mt-2 text-sm font-black uppercase tracking-wide text-[#F58220]">
                      {stage.focus}
                    </p>
                    <p className="mt-4 leading-8 text-slate-600">{stage.desc}</p>
                  </div>

                  <div>
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Key Learning Areas & Objectives
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {stage.areas.map((area) => (
                        <div
                          key={area.name}
                          className="group/area rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-[#F58220]/40 hover:bg-white hover:shadow-md"
                        >
                          <p className="flex items-center gap-2 text-sm font-black text-[#252B68]">
                            <span className="text-base transition group-hover/area:scale-125">
                              {area.icon}
                            </span>
                            {area.name}
                          </p>
                          <p className="mt-1.5 text-xs leading-6 text-slate-600">
                            {area.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-16 overflow-hidden rounded-[2rem] bg-[#252B68] shadow-2xl">
            <div className="grid items-center gap-0 md:grid-cols-[1.2fr_1fr]">
              <div className="relative px-8 py-12 text-center md:text-left sm:px-12">
                <div className="pointer-events-none absolute inset-0">
                  <div className="mv-blob absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#FFE900]/20 blur-2xl" />
                </div>
                <span className="mv-float absolute left-8 top-6 text-3xl opacity-50">⭐</span>
                <span className="mv-float-alt absolute right-8 bottom-6 text-3xl opacity-50">🌈</span>
                <h3 className="relative text-2xl font-black text-white sm:text-3xl">
                  A Place Where Every Child Shines
                </h3>
                <p className="relative mt-4 leading-8 text-blue-100">
                  Our Early Years programme is more than a curriculum — it&apos;s a
                  celebration of childhood. With passionate educators, engaging
                  environments, and a globally aligned framework, we empower young
                  learners to thrive in every way.
                </p>
              </div>
              <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
                <ImageWithFallback
                  src="/images/early-years-child.jpg"
                  alt="A happy Early Years learner at Mount View"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#252B68]/70 md:bg-gradient-to-l md:from-transparent md:to-[#252B68]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CORE SUBJECTS                                                    */}
      {/* ================================================================ */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Core Subjects"
            title="Where strong foundations begin."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreSubjects.map((subject) => (
              <div
                key={subject.title}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={subject.image}
                    alt={subject.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-xl font-black text-[#252B68] shadow-lg backdrop-blur transition group-hover:bg-[#F58220] group-hover:text-white">
                    {subject.icon}
                  </div>
                </div>
                <div className="p-7">
                  <h3 className="text-xl font-black text-[#252B68]">
                    {subject.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{subject.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OTHER SUBJECTS                                                   */}
      {/* ================================================================ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="A Broad & Balanced Curriculum"
            title="More than the core."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {otherSubjects.map((subject) => (
              <div
                key={subject.title}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#FFE900] hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <ImageWithFallback
                    src={subject.image}
                    alt={subject.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-lg shadow-md backdrop-blur">
                    {subject.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black text-[#252B68]">
                    {subject.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-7 text-slate-600">
                    {subject.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* EXPERIENTIAL LEARNING & OUTDOOR EDUCATION                        */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-emerald-50 py-20 sm:py-24">
        <span className="mv-float pointer-events-none absolute left-[4%] top-10 text-5xl opacity-30">🌳</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-10 text-5xl opacity-30">🌻</span>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Experiential Learning & Outdoor Education"
            title="Learning at Mount View begins with curiosity."
            subtitle="We believe that nature is one of the most powerful teachers. Whether it's a science class held under a tree or a storytelling session by the school garden, we immerse our learners in real-world experiences that spark discovery."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outdoorPoints.map((point) => (
              <div
                key={point.title}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-emerald-100 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={point.image}
                    alt={point.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg text-white shadow-md">
                    {point.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black text-[#252B68]">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {point.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-4xl rounded-3xl bg-white/80 px-8 py-7 text-center text-base font-medium leading-8 text-slate-700 shadow-sm ring-1 ring-emerald-100">
            Our regular excursions to museums, farms, and cultural sites give
            students the chance to connect academic concepts to everyday life. By
            encouraging movement, observation, and hands-on exploration, we help
            learners develop independence, curiosity, and environmental awareness.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* GLOBAL PERSPECTIVES + MULTILINGUAL                               */}
      {/* ================================================================ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Global Perspectives */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#252B68] text-white shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <ImageWithFallback
                  src="/images/early-years-global.jpg"
                  alt="Global perspectives at Mount View"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#252B68] via-[#252B68]/40 to-transparent" />
                <span className="mv-float-alt pointer-events-none absolute right-4 top-4 text-6xl opacity-25">🌍</span>
              </div>
              <div className="relative p-9 sm:p-11">
                <p className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  Global Perspectives
                </p>
                <h3 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                  Future leaders in a global community.
                </h3>
                <p className="mt-4 leading-8 text-blue-100">
                  Our students are more than learners — they&apos;re future leaders
                  in a global community and need to be raised as independent
                  learners with strong values. During their formative years we
                  provide:
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Multicultural exposure through diverse staff, student body, and celebrations.",
                    "Intercultural competency fostered by language learning and global themes.",
                    "Community projects and partnerships that build empathy and environmental awareness.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-blue-100">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-[10px] font-black text-[#252B68]">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-2xl bg-white/10 p-5 text-sm leading-7 text-blue-50 backdrop-blur">
                  We integrate the{" "}
                  <strong className="text-[#FFE900]">
                    Cambridge Global Perspectives Programme
                  </strong>
                  , introducing students to global challenges like sustainability,
                  equality, technology and cultural diversity — and empowering them
                  to make a difference.
                </p>
              </div>
            </div>

            {/* Multilingual & Cultural Literacy */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#FFE900] text-[#252B68] shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <ImageWithFallback
                  src="/images/creative-arts.jpg"
                  alt="Multilingual and cultural literacy at Mount View"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FFE900] via-[#FFE900]/40 to-transparent" />
                <span className="mv-float pointer-events-none absolute right-4 top-4 text-6xl opacity-30">🗣️</span>
              </div>
              <div className="relative p-9 sm:p-11">
                <p className="inline-flex rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
                  Multilingual & Cultural Literacy
                </p>
                <h3 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                  Embracing a world of voices.
                </h3>
                <p className="mt-4 leading-8 text-[#252B68]/80">
                  Our international community celebrates the richness of global
                  cultures and languages. From early language exposure to
                  interactive cultural festivals, students become globally fluent
                  and deeply respectful of different traditions.
                </p>
                <p className="mt-4 leading-8 text-[#252B68]/80">
                  Through cross-cultural projects and exchanges, they gain
                  first-hand insights into diverse ways of living and thinking —
                  building bridges across borders and becoming thoughtful citizens
                  of the world.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {["🌏 Asia", "🌍 Africa", "🌎 Americas", "🌍 Europe", "🌏 Oceania"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#252B68] px-3.5 py-1.5 text-xs font-bold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOLISTIC WELLBEING                                               */}
      {/* ================================================================ */}
      <section className="bg-sky-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SectionTitle
                eyebrow="Holistic Wellbeing & Emotional Intelligence"
                title="Growing happy, healthy humans."
                center={false}
              />
              <p className="mt-6 leading-8 text-slate-600">
                Success isn&apos;t just measured by grades — it&apos;s also seen in
                kindness, resilience, and empathy. That&apos;s why our school
                integrates mindfulness, emotional check-ins, and conflict
                resolution into the school day. Students learn to manage their
                emotions, build strong relationships, and make thoughtful
                decisions.
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Our wellbeing programme creates a school culture where every child
                feels safe, supported, and empowered to thrive — not just
                academically, but personally. Safe spaces for reflection and
                emotional support are created to support students in times of need.
              </p>

              <div className="relative mt-8 overflow-hidden rounded-3xl shadow-lg">
                <ImageWithFallback
                  src="/images/early-years-child.jpg"
                  alt="Learners supported through Mount View's wellbeing programme"
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#252B68] shadow-md backdrop-blur">
                  Safe · Supported · Empowered 💙
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {wellbeingPoints.map((point, i) => (
                <div
                  key={point.text}
                  className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="mv-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl"
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    {point.icon}
                  </div>
                  <p className="text-sm font-bold leading-7 text-[#252B68]">
                    {point.text}
                  </p>
                </div>
              ))}
              <div className="rounded-3xl bg-[#252B68] p-6 text-center shadow-lg">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFE900]">
                  Every child
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Safe · Supported · Empowered 💙
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PERSONALISED LEARNING                                            */}
      {/* ================================================================ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Personalised Learning & Assessment"
            title="An individual learning path for every child."
            subtitle="We know that no two learners are alike. That's why we tailor learning experiences to suit individual interests, strengths, and goals. Through personalised portfolios, formative assessments, and one-on-one guidance, students take ownership of their learning journeys."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {personalisedPoints.map((point, i) => (
              <div
                key={point.text}
                className="group relative overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-2xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={point.image}
                    alt={point.text}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute right-4 top-4 text-4xl font-black text-white/80">
                    0{i + 1}
                  </span>
                  <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F58220] text-xl text-white shadow-lg">
                    {point.icon}
                  </div>
                </div>
                <p className="relative p-6 text-sm font-bold leading-7 text-[#252B68]">
                  {point.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center leading-8 text-slate-600">
            Goal setting and reflection are part of our classroom DNA — helping
            each child build confidence, autonomy, and a strong sense of purpose.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* LEADERSHIP & GLOBAL CITIZENSHIP                                  */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <span className="mv-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-20">🎤</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-20">🏛️</span>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            dark
            eyebrow="Leadership & Global Citizenship"
            title="Confident voices, caring hearts, real impact."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {leadershipPoints.map((point) => (
              <div
                key={point.text}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-[#FFE900]/40 hover:bg-white/10"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={point.image}
                    alt={point.text}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171B4A] via-[#171B4A]/40 to-transparent" />
                  <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE900] text-xl transition group-hover:scale-110">
                    {point.icon}
                  </div>
                </div>
                <p className="p-6 text-sm font-bold leading-7 text-blue-50">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* WHY CHOOSE US                                                    */}
      {/* ================================================================ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Why Choose Us?"
            title="We train the brain with the conscious heart."
          />

          <div className="mt-12 overflow-hidden rounded-[2rem] shadow-xl">
            <div className="relative aspect-[16/6] w-full">
              <ImageWithFallback
                src="/images/school-life.jpg"
                alt="Life at Mount View International"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#252B68] via-[#252B68]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFE900]">
                  Every child, every day
                </p>
                <p className="mt-2 text-xl font-black text-white sm:text-2xl">
                  A community where children learn, grow and thrive together.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((item) => (
              <div
                key={item.text}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F58220]/50 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFE900]/50 text-lg transition group-hover:scale-110 group-hover:bg-[#FFE900]">
                  {item.icon}
                </span>
                <p className="text-sm font-bold leading-6 text-[#252B68]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* LEARNING SUPPORT                                                 */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-[#FFE900] py-20 sm:py-24">
        <span className="mv-float pointer-events-none absolute left-[5%] top-8 text-5xl opacity-25">🤗</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-8 text-5xl opacity-25">💛</span>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/early-years-creative.jpg"
                alt="Learning support at Mount View"
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="mv-float absolute right-4 top-4 text-3xl">💛</span>
            </div>
            <div>
              <p className="font-black uppercase tracking-[0.2em] text-[#252B68]">
                Learning Support
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                Inclusive education for every child.
              </h2>
              <p className="mt-6 text-lg font-medium leading-8 text-[#252B68]/80">
                Learning Support is included in the school fees for children who
                find it harder to learn than the majority of children of the same
                age. Teachers and specialist teachers can help most children
                overcome the difficulties quickly and easily. This support can take
                place inside or outside the mainstream classroom, one-to-one, or in
                a small group — bespoke for each child.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA                                                              */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-[#F58220] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="mv-blob absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#252B68]/30 blur-3xl [animation-delay:-7s]" />
        </div>
        <span className="mv-float pointer-events-none absolute left-[10%] top-6 text-4xl opacity-40">🎈</span>
        <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-6 text-4xl opacity-40">🎓</span>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/80">
            Join Our Learning Community
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            Ready to give your child a head start on a global future?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/90">
            Discover the possibilities with Mount View International — a safe,
            inclusive and inspiring place where every child shines.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="group inline-flex items-center gap-2 rounded-full bg-[#252B68] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#171B4A] hover:shadow-xl"
            >
              Apply for Admission
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 px-8 py-4 font-black text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-[#F58220]"
            >
              Book a Visit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}