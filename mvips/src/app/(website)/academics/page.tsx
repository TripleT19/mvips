import type { Metadata } from "next";
import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/* ------------------------------------------------------------------ */
/*  SEO                                                                */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title:
    "Academics — Cambridge Curriculum from Early Years to Year 6 | Mount View",
  description:
    "Explore Mount View's Cambridge curriculum in Blantyre, Malawi: Early Years (20 months – 5 years), Cambridge Primary (Years 1–6), core subjects, specialist teaching and the pathway to Central High School.",
  keywords: [
    "Cambridge Primary Blantyre",
    "Cambridge curriculum Malawi",
    "Cambridge Early Years Blantyre",
    "Cambridge Checkpoint Malawi",
    "international primary school Blantyre",
    "best international school Blantyre",
    "primary school curriculum Malawi",
    "Year 1 Cambridge Malawi",
    "Year 2 Cambridge Malawi",
    "Year 3 Year 4 Year 5 Year 6 Cambridge Malawi",
    "Jolly Phonics Malawi",
    "primary school subjects Blantyre",
    "English Mathematics Science Malawi school",
    "Global Perspectives ICT Art Music PE Swimming Malawi",
    "Cambridge Primary subjects",
    "Mount View academics",
    "Mount View International Primary School curriculum",
    "early years Blantyre",
    "pre-nursery nursery reception Malawi",
    "primary education Blantyre",
  ],
  alternates: { canonical: "/academics" },
  openGraph: {
    type: "website",
    url: "/academics",
    siteName: "Mount View International Primary School",
    title:
      "Academics — Cambridge Curriculum from Early Years to Year 6 | Mount View",
    description:
      "Cambridge Early Years and Cambridge Primary curriculum at Mount View International Primary School, Blantyre, Malawi.",
    locale: "en_MW",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academics — Cambridge Curriculum at Mount View",
    description:
      "Cambridge Early Years and Cambridge Primary curriculum in Blantyre, Malawi.",
  },
};

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const MAX_STORY_WORDS = 100;

type LeadershipActivity = {
  id: number;
  title: string;
  slug: string;
  story: string;
  category: string | null;
  participants: string | null;
  activity_date: string | null;
  image_url: string | null;
  featured: boolean;
};

async function getLeadershipActivities(limit = 6): Promise<LeadershipActivity[]> {
  if (!API_URL) return [];
  try {
    const res = await fetch(
      `${API_URL}/api/leadership-activities?per_page=${limit}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      }
    );
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trimStart().startsWith("{")) return [];
    const json = JSON.parse(text);
    const rows = json?.data?.data;
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function formatLongDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function limitWords(str: string | null | undefined, max = MAX_STORY_WORDS): string {
  if (!str) return "";
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return str;
  return words.slice(0, max).join(" ") + "…";
}

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const earlyYearsStages = [
  {
    title: "Foundation Stage",
    age: "20 months – 3 years",
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
      { name: "Communication & Language", detail: "Vocabulary growth, questioning, multi-step instructions. Role play to encourage sharing, collaboration and expression.", icon: "🗣️" },
      { name: "Physical Development", detail: "Cutting, drawing, balance. Swimming: water familiarity, safety and building water confidence.", icon: "✂️" },
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
      { name: "Communication & Language", detail: "Speaking in complete sentences, storytelling, event description. Role play to build and strengthen vocabulary and introduce new vocabulary.", icon: "💬" },
      { name: "Physical Development", detail: "Writing, team games, hygiene management", icon: "⚽" },
      { name: "Personal, Social & Emotional", detail: "Conflict resolution, task responsibility, leadership, expression and feelings", icon: "🕊️" },
      { name: "Mathematics", detail: "Counting, addition and subtraction, patterns, shapes, time and measurement", icon: "➗" },
      { name: "Literacy", detail: "Reading simple words and sentences, sentence writing, story structure. Story retelling in own words, reading decodable books, phonics programme.", icon: "📝" },
      { name: "Understanding the World", detail: "Experiments, maps, cultures. Relate or make links to their experiences and everyday lives. Encourage questions and fact finding to answer their questions.", icon: "🗺️" },
      { name: "Creative Arts & Expression", detail: "Art planning, group performance, rhythm", icon: "🎵" },
    ],
  },
];

const primaryStages = [
  {
    title: "Year 1",
    age: "Year 1 · Age 5–6",
    focus: "Foundation Skills, Phonics & Curiosity",
    desc: "A year of building strong foundations in literacy and numeracy while sparking curiosity across the wider curriculum.",
    details:
      "English and Mathematics form the core, supported by Science, Global Perspectives, ICT, Art, Music, PE and Swimming.",
    emoji: "🌱",
    ring: "ring-[#FFE900]",
    chip: "bg-[#FFE900] text-[#252B68]",
    areas: [
      { name: "English & Phonics", detail: "Letter sounds, blending, segmenting, reading, spelling, handwriting, sentence writing, comprehension and vocabulary.", icon: "📖" },
      { name: "Mathematics", detail: "Number recognition, counting, number bonds, addition, subtraction, patterns, 2D and 3D shapes, measurement and problem-solving.", icon: "🔢" },
      { name: "Science", detail: "Living and non-living things, human body, senses, plants, animals, materials, observation and investigation.", icon: "🔬" },
      { name: "Global Perspectives", detail: "Our country, different cultures, similarities and differences, other countries, communities and uses of water.", icon: "🌍" },
      { name: "ICT", detail: "Computer skills, technology, digital learning, keyboard skills and online safety.", icon: "💻" },
      { name: "Art & Music", detail: "Drawing, painting, colouring, creativity, craft, singing, rhythm, movement and performance.", icon: "🎨" },
      { name: "PE & Swimming", detail: "Physical fitness, coordination, balance, movement, teamwork, games, swimming skills and water safety.", icon: "🏊" },
    ],
  },
  {
    title: "Year 2",
    age: "Year 2 · Age 6–7",
    focus: "Confident Readers, Problem-Solvers & Communicators",
    desc: "Building on Year 1 foundations, children grow as confident readers, writers and problem-solvers, ready for Key Stage 2.",
    details:
      "Greater depth in English and Mathematics, plus Science, Global Perspectives, ICT, PE and Swimming, Music and Art.",
    emoji: "🚀",
    ring: "ring-[#F58220]",
    chip: "bg-[#F58220] text-white",
    areas: [
      { name: "English", detail: "Phonics, reading, comprehension, spelling, vocabulary, grammar, punctuation, handwriting and creative writing.", icon: "📖" },
      { name: "Mathematics", detail: "Number recognition, place value, counting, addition, subtraction, multiplication, division, shapes, measurement, time and problem-solving.", icon: "🔢" },
      { name: "Science", detail: "Plants, animals, humans, materials, seasons, habitats, weather, observation and investigations.", icon: "🔬" },
      { name: "Global Perspectives", detail: "Our community, family, transport, environment, cultures, communication, teamwork and global awareness.", icon: "🌍" },
      { name: "ICT", detail: "Computer skills, keyboard and mouse use, digital literacy, online safety and basic programming.", icon: "💻" },
      { name: "PE & Swimming", detail: "Fitness, coordination, balance, movement, teamwork, sports skills, water confidence and swimming techniques.", icon: "🏊" },
      { name: "Music", detail: "Singing, rhythm, beat, listening, musical instruments, patterns and creative expression.", icon: "🎵" },
      { name: "Art", detail: "Drawing, painting, colouring, printing, collage, patterns, creativity and exploring different materials.", icon: "🎨" },
    ],
  },
  {
    title: "Lower Key Stage 2",
    age: "Year 3 & Year 4",
    focus: "Wider Curriculum & Real-World Contexts",
    desc: "Continuing to emphasise core subjects like English and Mathematics while broadening the learning experience.",
    details:
      "Students explore Science, Global Perspectives, Art and Music. PE lessons remain a regular part of the curriculum. The curriculum is carefully planned to link subject areas and provide real-world contexts.",
    emoji: "🧭",
    ring: "ring-[#252B68]",
    chip: "bg-[#252B68] text-white",
    areas: [
      { name: "English", detail: "Reading comprehension, extended writing, vocabulary", icon: "📖" },
      { name: "Mathematics", detail: "Reasoning, problem-solving, and fluency in number", icon: "∑" },
      { name: "Science", detail: "Investigation, experimentation, scientific thinking", icon: "⚗️" },
      { name: "Global Perspectives", detail: "Real-world contexts, sustainability, community", icon: "🌍" },
      { name: "ICT & Computing", detail: "Digital design, coding basics, purposeful use", icon: "💻" },
      { name: "Art, Music & PE", detail: "Creative technique, performance, physical education", icon: "🎨" },
      { name: "Swimming & Sport", detail: "Regular PE lessons, water confidence, teamwork", icon: "🏊" },
    ],
  },
  {
    title: "Upper Key Stage 2",
    age: "Year 5 & Year 6",
    focus: "Critical Thinking & Cambridge Checkpoint",
    desc: "Students begin to take greater responsibility for their own learning and progress, becoming more independent learners.",
    details:
      "Supported in developing critical thinking skills, questioning, and exploring various topics. The curriculum is meticulously aligned with learning objectives to prepare students for the Cambridge Checkpoint exams at the end of Year 6.",
    emoji: "🎓",
    ring: "ring-[#FFE900]",
    chip: "bg-[#FFE900] text-[#252B68]",
    areas: [
      { name: "English", detail: "Extended writing, comprehension, critical reading", icon: "📝" },
      { name: "Mathematics", detail: "Advanced problem-solving and mathematical reasoning", icon: "∑" },
      { name: "Science", detail: "Scientific method, investigation, and evidence", icon: "⚗️" },
      { name: "Global Perspectives", detail: "Global challenges, action, and community impact", icon: "🌍" },
      { name: "ICT & Computing", detail: "Digital literacy, coding, and design thinking", icon: "💻" },
      { name: "Arts & Performance", detail: "Portfolio development, ensembles, stagecraft", icon: "🎨" },
      { name: "Cambridge Checkpoint", detail: "Targeted preparation for the Year 6 Checkpoint exams", icon: "🏆" },
    ],
  },
];

const stageGroups = [
  {
    id: "early-years",
    title: "Cambridge Early Years",
    ageLabel: "20 months – 5 years",
    framework: "Cambridge Early Years",
    intro:
      "Our 3-year curriculum, inspired by the globally recognised Cambridge Early Years framework, is thoughtfully designed for children aged 20 months to 5 years. Through a play-based, inquiry-driven approach, we nurture holistic development across key learning domains, ensuring every child grows with confidence, curiosity, and compassion.",
    image: "/images/reception.jpg",
    accent: "yellow",
    childStages: earlyYearsStages,
    why: [
      { title: "Global perspective and cultural awareness", icon: "🌍", img: "/images/aqua-life.jpeg" },
      { title: "Child-centred learning tailored to individual needs", icon: "🧩", img: "/images/ey-child.jpeg" },
      { title: "Developmentally appropriate practices that spark creativity and critical thinking", icon: "💡", img: "/images/ey-stages.jpeg" },
    ],
  },
  {
    id: "primary",
    title: "Cambridge Primary",
    ageLabel: "5 – 11 years · Year 1 to Year 6",
    framework: "Cambridge Primary",
    intro:
      "Cambridge Primary blends academic rigour with flexibility and creativity. Students build deep knowledge in English, Mathematics and Science, enriched with Global Perspective, Digital Literacy, Art, Music, Dance and Physical Education, and are prepared with confidence for the Cambridge Checkpoint exams at the end of Year 6.",
    image: "/images/ks1.jpg",
    accent: "navy",
    childStages: primaryStages,
    why: null,
  },
];

const curriculumAreas = [
  {
    icon: "📖",
    title: "English, Mathematics & Science",
    desc: "Academic rigour blended with flexibility and creativity, the beating heart of our Cambridge Primary programme.",
    image: "/images/class-image.jpg",
  },
  {
    icon: "🌍",
    title: "Global Perspectives",
    desc: "Students explore sustainability, equality, technology and cultural diversity, then act on what they learn.",
    image: "/images/gp2.JPG",
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
    desc: "Expression, movement and performance, because a broad curriculum builds a whole child.",
    image: "/images/creative-arts3.jpg",
  },
];

const coreSubjects = [
  {
    title: "English & Phonics",
    desc: "Developing strong communication. In Early Years and Reception, we use Jolly Phonics. In Key Stage 1, we use 'Letters and Sounds' (phases 2 to 6) to turn pupils into fluent readers and accurate spellers.",
    icon: "Aa",
    image: "/images/phonics.jpg",
  },
  {
    title: "Mathematics",
    desc: "Building confidence with numbers, patterns, problem-solving, and mathematical thinking through meaningful, hands-on learning experiences.",
    icon: "∑",
    image: "/images/maths.jpeg",
  },
  {
    title: "Science",
    desc: "Encouraging curiosity through observation, investigation, experimentation, and understanding the world around us.",
    icon: "⚗",
    image: "/images/uks.JPG",
  },
];

const otherSubjects = [
  { icon: "🌍", title: "Global Perspectives", desc: "Understanding global concepts and basic ICT skills through interactive lessons.", image: "/images/gp.JPG" },
  { icon: "💻", title: "ICT", desc: "Purposeful use of technology to support creativity, communication, and digital confidence.", image: "/images/ict.JPG" },
  { icon: "🎨", title: "Art", desc: "Imagination, visual expression, and creative techniques through hands-on activities.", image: "/images/painting.JPG" },
  { icon: "🎵", title: "Music", desc: "Exploring rhythm, melody, performance, and musical creativity.", image: "/images/music.jpg" },
  { icon: "🏃", title: "PE", desc: "Enhancing sports skills, teamwork, and physical development.", image: "/images/football.jpg" },
  { icon: "🏊", title: "Swimming", desc: "Water confidence, coordination, safety, and an important life skill.", image: "/images/swimming2.JPG" },
  { icon: "🤗", title: "Learning Support", desc: "Inclusive education helping every child succeed at their own pace.", image: "/images/learning-support.jpeg" },
];

const outdoorPoints = [
  { icon: "❓", title: "Big questions, real problems", desc: "Lessons are designed around big questions and real-world problems.", image: "/images/class-image.jpg" },
  { icon: "🧪", title: "Hands-on discovery", desc: "Students engage in hands-on activities, experiments, group discussions, and field research.", image: "/images/uks.JPG" },
  { icon: "🧑‍🏫", title: "Teachers as facilitators", desc: "Teachers guide exploration and support individual growth rather than simply delivering content.", image: "/images/creative-arts.jpg" },
  { icon: "🚌", title: "Learning beyond walls", desc: "Regular field trips, nature walks, and cultural excursions connect classroom concepts with the real world.", image: "/images/trips.jpg" },
  { icon: "🎯", title: "Skill Enhancement Clubs", desc: "Purposeful clubs that let learners explore new interests and build practical skills in a fun, supportive setting.", image: "/images/gardening1.jpg" },
];

const wellbeingPoints = [
  { icon: "🧘", text: "Mindfulness and Cambridge Wellbeing embedded in the curriculum" },
  { icon: "🤝", text: "Peer mentoring and conflict resolution programmes" },
];

const personalisedPoints = [
  { icon: "🎯", text: "Skill Enhancement tailored to individual interests and strengths", image: "/images/teacher-support2.jpeg" },
  { icon: "📝", text: "Regular formative feedback instead of one-size-fits-all grading", image: "/images/teacher-support3.jpg" },
  { icon: "📈", text: "Goal-setting with teachers to foster agency and accountability", image: "/images/mothers-day3.jpg" },
];

const fallbackLeadership = [
  { icon: "🏛️", title: "Student council and ambassador roles", image: "/images/school-life.jpg" },
  { icon: "🌐", title: "Service learning projects tied to the UN Sustainable Development Goals", image: "/images/early-years-global.jpg" },
  { icon: "🎤", title: "Public speaking and debate clubs", image: "/images/creative-arts.jpg" },
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
/*  HELPERS                                                            */
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

type ChildStage = {
  title: string;
  age: string;
  focus: string;
  desc: string;
  details?: string;
  emoji: string;
  ring: string;
  chip: string;
  areas: { name: string; detail: string; icon: string }[];
};

function ExpandedStageCard({ stage }: { stage: ChildStage }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-lg ring-2 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-10 ${stage.ring}`}
    >
      <span className="mv-float pointer-events-none absolute -right-2 top-2 text-7xl opacity-10">
        {stage.emoji}
      </span>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.45fr]">
        <div>
          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest ${stage.chip}`}
          >
            {stage.age}
          </span>
          <h3 className="mt-4 text-2xl font-black text-[#252B68] sm:text-3xl">
            {stage.emoji} {stage.title}
          </h3>
          <p className="mt-2 text-sm font-black uppercase tracking-wide text-[#F58220]">
            {stage.focus}
          </p>
          <p className="mt-4 leading-8 text-slate-600">{stage.desc}</p>
          {stage.details && (
            <p className="mt-3 leading-8 text-slate-500">{stage.details}</p>
          )}
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
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default async function AcademicsPage() {
  const leadershipActivities = await getLeadershipActivities(6);

  const leadershipCards =
    leadershipActivities.length > 0
      ? leadershipActivities.map((a) => ({
          key: `activity-${a.id}`,
          title: a.title,
          category: a.category,
          participants: a.participants,
          story: a.story,
          activityDate: a.activity_date,
          imageUrl: a.image_url,
          icon: "🏛️",
        }))
      : fallbackLeadership.map((f, i) => ({
          key: `fallback-${i}`,
          title: f.title,
          category: null as string | null,
          participants: null as string | null,
          story: null as string | null,
          activityDate: null as string | null,
          imageUrl: f.image,
          icon: f.icon,
        }));

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* =========================================================
          SEO — Structured Data
      ========================================================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://mountviewmw.com/academics#page",
                url: "https://mountviewmw.com/academics",
                name: "Academics at Mount View International Primary School",
                description:
                  "Cambridge Early Years and Cambridge Primary curriculum in Blantyre, Malawi.",
                isPartOf: { "@id": "https://mountviewmw.com/#website" },
                about: { "@id": "https://mountviewmw.com/#school" },
                breadcrumb: {
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: "Home",
                      item: "https://mountviewmw.com",
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: "Academics",
                      item: "https://mountviewmw.com/academics",
                    },
                  ],
                },
              },
              {
                "@type": "EducationalOccupationalProgram",
                "@id": "https://mountviewmw.com/academics#programme",
                name: "Cambridge Primary and Early Years Programme",
                provider: { "@id": "https://mountviewmw.com/#school" },
                educationalProgramMode: "full-time",
                programPrerequisites: "Children aged 20 months to 11 years",
                timeToComplete: "P10Y",
                occupationalCategory: "Primary Education",
              },
            ],
          }),
        }}
      />

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

      {/* HERO */}
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
              At Mount View International in Blantyre, Malawi, we empower young
              learners to become curious thinkers, confident communicators, and
              compassionate global citizens.
            </p>
            <p className="mt-4 max-w-2xl leading-8 text-blue-200/90">
              Located in a vibrant natural setting with a beautiful view, our
              school provides a nurturing environment where children aged 20
              months to 11 years thrive through world-class Cambridge education
              and meaningful exploration.
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
                "20 months – 5 · Early Years",
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
                  src="/images/students-activity.jpeg"
                  alt="Cambridge Primary learning at Mount View International Primary School in Blantyre, Malawi"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div className="mv-float absolute -left-4 -top-6 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-8">
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

      {/* OUR CURRICULUM */}
      <section
        id="our-curriculum"
        className="relative scroll-mt-24 bg-white py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Our Curriculum"
            title="Cambridge: rigour, flexibility and creativity."
            subtitle="We follow the internationally recognised Cambridge Curriculum, which blends academic rigour with flexibility and creativity."
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
                    alt={`${area.title} at Mount View International Primary School, Blantyre`}
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
                  src="/images/culture1.jpg"
                  alt="Experiential outdoor learning at Mount View in Blantyre"
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

      {/* OUR STAGES */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Our Stages"
            title="Two Cambridge stages. One continuous journey."
            subtitle="Every learner moves through Cambridge Early Years into Cambridge Primary, building confidence, knowledge and independence along the way."
          />

          <div className="mt-16 space-y-24">
            {stageGroups.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-24">
                <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
                  <div className="grid items-stretch gap-0 lg:grid-cols-[1.05fr_1fr]">
                    <div className="relative order-2 bg-[#252B68] p-8 sm:p-10 lg:order-1 lg:p-14">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="mv-blob absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#FFE900]/15 blur-3xl" />
                        <div className="mv-blob absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
                      </div>

                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#252B68]">
                            {group.framework}
                          </span>
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                            {group.ageLabel}
                          </span>
                        </div>

                        <h3 className="mt-6 text-3xl font-black leading-tight text-white sm:text-4xl">
                          {group.title}
                        </h3>

                        <p className="mt-5 max-w-xl leading-8 text-blue-100">
                          {group.intro}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-2">
                          {group.childStages.map((s) => (
                            <span
                              key={s.title}
                              className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur"
                            >
                              {s.emoji} {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative order-1 min-h-[280px] lg:order-2">
                      <ImageWithFallback
                        src={group.image}
                        alt={`${group.title} at Mount View International Primary School in Blantyre`}
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#252B68]/70 via-transparent to-transparent lg:bg-gradient-to-l lg:from-[#252B68]/70 lg:via-transparent lg:to-transparent" />
                    </div>
                  </div>
                </div>

                {group.why && (
                  <div className="mt-14">
                    <div className="mx-auto max-w-3xl text-center">
                      <h4 className="text-2xl font-black text-[#252B68] sm:text-3xl">
                        Why {group.title}?
                      </h4>
                      <p className="mt-3 text-slate-600">
                        A glimpse into the moments that shape our youngest learners.
                      </p>
                    </div>

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                      {group.why.map((item, i) => (
                        <div
                          key={item.title}
                          className="group relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-slate-200 transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <ImageWithFallback
                              src={item.img}
                              alt={`${item.title} at Mount View Early Years Centre in Blantyre`}
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
                            <h5 className="mt-2 text-base font-black leading-snug text-[#252B68]">
                              {item.title}
                            </h5>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-14 space-y-8">
                  {group.childStages.map((stage) => (
                    <ExpandedStageCard key={stage.title} stage={stage} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CENTRAL HIGH SCHOOL */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#171B4A] via-[#252B68] to-[#20265E] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="mv-blob absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#F58220]/20 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[5%] top-[12%] text-5xl opacity-20 sm:text-6xl">🎓</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] top-[20%] text-4xl opacity-20 sm:text-5xl">🏛️</span>
        <span className="mv-float pointer-events-none absolute left-[8%] bottom-[14%] text-4xl opacity-15 sm:text-5xl">📚</span>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFE900]/30 bg-[#FFE900]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900] backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFE900]" />
                After Year 6
              </div>

              <h2 className="mt-5 text-3xl font-black leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                The next chapter begins at{" "}
                <span className="relative inline-block text-[#FFE900]">
                  Central High.
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-[#F58220]"
                    viewBox="0 0 250 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9c50-6 120-8 246-4"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>

              <p className="mt-7 text-lg leading-8 text-blue-100">
                When our learners complete Year 6 and sit for their{" "}
                <strong className="font-black text-white">
                  Cambridge Primary Checkpoint
                </strong>{" "}
                examinations at Mount View, their educational journey
                doesn&rsquo;t end, it evolves. Our graduates progress naturally
                to{" "}
                <strong className="font-black text-[#FFE900]">
                  Central High School
                </strong>
                , our sister secondary school, where the same values, standards
                and Cambridge pathway continue without interruption.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: "🎯",
                    title: "Seamless Cambridge pathway",
                    desc: "From Primary Checkpoint straight into Lower Secondary.",
                  },
                  {
                    icon: "🤝",
                    title: "Familiar faces, shared values",
                    desc: "The same community, expectations and ethos.",
                  },
                  {
                    icon: "🚀",
                    title: "Broader opportunities",
                    desc: "More subjects, sports, clubs and leadership roles.",
                  },
                  {
                    icon: "🎓",
                    title: "One journey to graduation",
                    desc: "Early Years through to A-Level, one family.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#FFE900]/40 hover:bg-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE900]/15 text-lg">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-sm font-black text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-blue-100/80">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://centralhighmw.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#FFE900] px-7 py-3.5 font-black text-[#252B68] shadow-lg transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
                >
                  Visit Central High School
                  <span className="inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </a>
                <a
                  href="https://centralhighmw.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/5 px-7 py-3.5 font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Talk to Central High Admissions
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-[#FFE900]/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#F58220]/40 bg-gradient-to-br from-[#F58220]/15 to-transparent p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#F58220] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                        Current
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        🏫
                      </span>
                    </div>
                    <p className="mt-3 text-base font-black text-white">
                      Mount View International
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#F58220]">
                      Primary &amp; Early Years
                    </p>
                    <p className="mt-2 text-xs leading-5 text-blue-100/80">
                      Cambridge Early Years · Cambridge Primary · Checkpoint
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-6 w-0.5 bg-gradient-to-b from-[#F58220] to-[#FFE900]" />
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFE900] bg-[#252B68] text-xs font-black text-[#FFE900]">
                        ↓
                      </span>
                      <div className="h-6 w-0.5 bg-gradient-to-b from-[#FFE900] to-[#FFE900]/30" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#FFE900]/40 bg-gradient-to-br from-[#FFE900]/15 to-transparent p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#FFE900] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#252B68]">
                        Next
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        🎓
                      </span>
                    </div>
                    <p className="mt-3 text-base font-black text-white">
                      Central High School
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#FFE900]">
                      Secondary · Years 7 – 13
                    </p>
                    <p className="mt-2 text-xs leading-5 text-blue-100/80">
                      Cambridge Lower Secondary · IGCSE · AS &amp; A-Level
                    </p>
                  </div>
                </div>

                <p className="mt-6 rounded-xl bg-[#FFE900]/10 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
                  One continuous journey · 20 months to 18 years
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SUBJECTS */}
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
                    alt={`${subject.title} lessons at Mount View International Primary School`}
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

      {/* OTHER SUBJECTS */}
      <section
        id="other-subjects"
        className="scroll-mt-24 bg-white py-20 sm:py-24"
      >
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
                    alt={`${subject.title} at Mount View in Blantyre, Malawi`}
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

      {/* EXPERIENTIAL LEARNING */}
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
                    alt={`${point.title} at Mount View International Primary School`}
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

      {/* GLOBAL PERSPECTIVE + MULTILINGUAL */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#252B68] text-white shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <ImageWithFallback
                  src="/images/gp4.jpeg"
                  alt="Global Perspectives programme at Mount View in Blantyre"
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
                  Our students are more than learners, they&apos;re future leaders
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
                  , introducing students to global challenges like
                  sustainability, equality, technology and cultural diversity,
                  and empowering them to make a difference.
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-[#FFE900] text-[#252B68] shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden">
                <ImageWithFallback
                  src="/images/african-day.jpg"
                  alt="Multilingual and cultural literacy at Mount View, Blantyre"
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
                  first-hand insights into diverse ways of living and thinking,
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

      {/* HOLISTIC WELLBEING */}
      <section className="bg-sky-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SectionTitle
                eyebrow="Holistic Wellbeing & Emotional Intelligence"
                title="Growing as happy, healthy humans."
                center={false}
              />
              <p className="mt-6 leading-8 text-slate-600">
                Success isn&apos;t just measured by grades, it&apos;s also seen in
                kindness, resilience, and empathy. That&apos;s why our school
                integrates mindfulness, emotional check-ins, and conflict
                resolution into the school day. Students learn to manage their
                emotions, build strong relationships, and make thoughtful
                decisions.
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Our wellbeing programme creates a school culture where every child
                feels safe, supported, and empowered to thrive, not just
                academically, but personally. Safe spaces for reflection and
                emotional support are created to support students in times of need.
              </p>

              <div className="relative mt-8 overflow-hidden rounded-3xl shadow-lg">
                <ImageWithFallback
                  src="/images/learning-support.jpeg"
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

      {/* PERSONALISED LEARNING */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Personalised Learning & Assessment"
            title="An individual learning path for every child."
            subtitle="We know that no two learners are alike. That's why we tailor learning experiences to suit individual interests, strengths, and goals. Through personalised guidance, formative assessments, and goal-setting, students take ownership of their learning journeys."
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
            Goal setting and reflection are part of our classroom DNA, helping
            each child build confidence, autonomy, and a strong sense of purpose.
          </p>
        </div>
      </section>

      {/* LEADERSHIP & GLOBAL CITIZENSHIP */}
      <section className="relative overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <span className="mv-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-20">🎤</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-20">🏛️</span>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            dark
            eyebrow="Leadership & Global Citizenship"
            title="Confident voices, caring hearts, real impact."
            subtitle="Real activities led by our students and teachers, capturing the moments where leadership, service and global citizenship come alive."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leadershipCards.map((card) => (
              <article
                key={card.key}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-[#FFE900]/40 hover:bg-white/10"
              >
                {card.imageUrl && (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ImageWithFallback
                      src={card.imageUrl}
                      alt={`${card.title} at Mount View International Primary School`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171B4A] via-[#171B4A]/40 to-transparent" />

                    {card.category && (
                      <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-[#FFE900] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#252B68] shadow-md">
                        {card.category}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-black leading-snug text-white">
                    <span className="mr-2">{card.icon}</span>
                    {card.title}
                  </h3>

                  {card.story && (
                    <p className="mt-2 text-sm leading-7 text-blue-100">
                      {limitWords(card.story, MAX_STORY_WORDS)}
                    </p>
                  )}

                  {(card.participants || card.activityDate) && (
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[11px] font-bold text-blue-100/90">
                      {card.participants && (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                          👥 {card.participants}
                        </span>
                      )}
                      {card.activityDate && (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                          📅 {formatLongDate(card.activityDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
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
                alt="Life at Mount View International Primary School in Blantyre, Malawi"
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

      {/* LEARNING SUPPORT */}
      <section
        id="learning-support"
        className="relative scroll-mt-24 overflow-hidden bg-[#FFE900] py-20 sm:py-24"
      >
        <span className="mv-float pointer-events-none absolute left-[5%] top-8 text-5xl opacity-25">🤗</span>
        <span className="mv-float-alt pointer-events-none absolute right-[5%] bottom-8 text-5xl opacity-25">💛</span>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/support.jpg"
                alt="Learning support at Mount View, Blantyre"
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
                a small group, bespoke for each child.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
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
            Discover the possibilities with Mount View International in Blantyre,
            Malawi: a safe, inclusive and inspiring place where every child
            shines.
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