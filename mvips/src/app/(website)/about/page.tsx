import type { Metadata } from "next";
import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

/**
 * Revalidate every hour.
 */
export const revalidate = 3600;

/* =========================================================
   SEO — page-level metadata
========================================================= */

export const metadata: Metadata = {
  title: "About Us — History, Founder & Cambridge Team in Blantyre",
  description:
    "Learn about Mount View International Primary School — founded in 1975 by Mrs. Sakker Sacranie. Meet our leadership, board, Headteacher Ms. Dimpal Rawat Juneja, and our experienced Cambridge academic team in Blantyre, Malawi.",
  keywords: [
    "about Mount View International Primary School",
    "Mount View Primary School history",
    "Mount View founder Sakker Sacranie",
    "headteacher Dimpal Rawat Juneja",
    "Cambridge school Blantyre",
    "international primary school Blantyre",
    "best international schools in Blantyre",
    "Cambridge curriculum Malawi",
    "Mount View leadership team",
    "school board Blantyre Malawi",
    "primary school teachers Blantyre",
    "early years team Blantyre",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: "/about",
    siteName: "Mount View International Primary School",
    title:
      "About Mount View International Primary School — Blantyre, Malawi",
    description:
      "Founded in 1975 in Blantyre, Malawi. Meet our founder, board, Headteacher Ms. Dimpal Rawat Juneja, and our experienced Cambridge academic team.",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Mount View International Primary School",
    description:
      "Founded in 1975 in Blantyre, Malawi. Meet our leadership and Cambridge academic team.",
  },
};

/* =========================================================
   IN-PAGE NAVIGATION (matches Header Dropdown)
========================================================= */

const aboutNav = [
  { label: "School Overview", href: "#overview" },
  { label: "Mission & Vision", href: "#mission-vision" },
  { label: "Founder", href: "#founder" },
  { label: "Governance & Board", href: "#board" },
  { label: "School Leadership", href: "#principal" },
  { label: "Academic Team", href: "#lead-teachers" },
  { label: "Our Team", href: "#our-team" },
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
    "Learning is more than just an academic pursuit, it is a lifelong adventure filled with discovery, creativity, and joy.",
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
  name: "Ms. Dimpal Rawat Juneja",
  role: "Headteacher",
  photo: "/images/team/dimpal.jpg",
  initials: "D",
  tenure: "Leading Mount View",
  message: [
    "It is with great pleasure that I extend a heartfelt welcome to you from Mount View International Primary School and Early Years Centre. We are honoured to have your children as part of our school community, where their happiness, growth, and success are at the heart of everything we do.",
    "At Mount View, we believe that education is far more than the pursuit of academic achievement. It is a transformative journey that nurtures curiosity, creativity, confidence, and character. Every child who walks through our doors is unique, bringing their own talents, dreams, and perspectives. Our commitment is to provide a learning environment where each student feels valued, supported, and inspired to reach their full potential.",
    "As Principal, I am passionate about fostering a culture where academic rigour is balanced with rich opportunities in sports, cultural activities, leadership, and personal development. True excellence is not measured solely by grades, but by the empathy, resilience, integrity, and sense of purpose that our students carry with them, throughout their lives. We strive to develop not only capable learners but also compassionate and responsible global citizens who are prepared to contribute meaningfully to an ever-changing world.",
    "Our diverse and vibrant community is one of our greatest strengths. We celebrate the many cultures, languages, and traditions represented within our school, encouraging students to appreciate different perspectives and embrace inclusivity. Through innovative teaching, meaningful relationships, and the thoughtful integration of technology, we equip our learners with the critical thinking, collaboration, communication, and creativity skills essential for the future.",
    "I firmly believe the students' success is built on strong partnerships between the school and home community. Guided by transparency, ethical leadership, and a growth mindset, I look forward to working closely with our parents, staff, and students to create an environment where every child feels seen, heard, and empowered to thrive.",
    "Together, let us embark on a learning journey, filled with discovery, achievement, and joy.",
  ],
  signature: "Ms. Dimpal Rawat Juneja · Headteacher",
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

/* ---------------------------------------------------------
   ACADEMIC TEAM DATA
--------------------------------------------------------- */

const curriculumLeads = [
  {
    name: "Ms. Samantha Crozier",
    role: "Curriculum Lead · English",
    focus: "Literacy & Language",
    photo: "/images/team/samantha.JPG",
    initials: "S",
    bio: "She provides curriculum leadership and guidance across the Primary School, ensuring the effective delivery of the Cambridge Primary English framework. She works collaboratively with teachers to strengthen teaching and learning, monitor curriculum progression, support lesson planning and promote consistent standards across all year groups. Her goal is to nurture a strong culture of literacy and develop confident, capable and enthusiastic communicators who are well prepared for their Cambridge assessments and beyond.",
  },
  {
    name: "Ms. Shalon Matiza",
    role: "Curriculum Lead · Mathematics",
    focus: "Primary Mathematics",
    photo: "/images/team/shalon.jpeg",
    initials: "S",
    bio: "She is a passionate and dedicated educator with ten years of teaching experience and a strong commitment to Mathematics education. As a Mathematics Curriculum Leader, she champions effective teaching, curriculum development, assessment and teacher growth. She strives to create engaging learning experiences that foster curiosity, confidence, critical thinking and problem-solving skills, empowering learners to become independent thinkers who apply mathematical knowledge creatively and confidently in everyday life.",
  },
  {
    name: "Mr Tinashe Dankayi",
    role: "Curriculum Lead · Science",
    focus: "Science & Inquiry",
    photo: "/images/team/tinashe.JPG",
    initials: "T",
    bio: "He is an experienced Science Curriculum Lead with over 15 years of experience in Zimbabwe and South Africa, specialising in curriculum development and alignment from Year 1 to Year 6. Passionate about fostering an inquiry-based, child-centred approach to science through hands-on, practical learning experiences. Committed to making scientific concepts accessible, engaging and meaningful, encouraging curiosity, critical thinking and problem-solving while ensuring measurable learning outcomes and a strong foundation in scientific understanding.",
  },
];

const earlyYearsCoordinator = {
  name: "Ms Monica Mutinta Mwamba",
  role: "Early Years Coordinator",
  focus: "Nursery & Reception",
  photo: "/images/team/monica.JPG",
  initials: "M",
  bio: "She is a passionate and dedicated professional with experience in healthcare, education, and management. She is a qualified General Nurse, holds a Bachelor's Degree in Education, and is a trained Jolly Phonics Trainer. Having worked in different countries and held various management positions, she has developed strong leadership skills and the ability to adapt to diverse working environments. She is currently pursuing a Master's Degree in Special Needs Education, driven by her passion for inclusive education and continuous professional growth. Outside her professional life, she enjoys travelling, baking, and hiking. She values new experiences, lifelong learning, and making a positive difference in the lives of others."
};

const earlyYearsTeachers = [
  {
    name: "Ms Maria Chembe",
    initials: "MC",
    className: "Pre-Nursery & Nursery",
    role: "Lead Teacher",
    photo: "/images/team/maria.JPG",
    bio: "Ms. Mariah Chembe is a dedicated Early Years leader with nine years of experience at Mount View School, where she leads the Pre-Nursery and Nursery team with passion and purpose. Committed to excellence in teaching, learning, and care, she fosters a collaborative and nurturing environment for both staff and children. Passionate about early childhood development, she inspires young learners through play, storytelling, music, and meaningful experiences, helping each child build confidence, discover their unique strengths, and develop a strong foundation for lifelong learning and success.",
  },
  {
    name: "Ms. Chikondi Mvula",
    initials: "M",
    className: "Reception",
    role: "Lead Teacher",
    photo: "/images/team/mvula.JPG",
    bio: "With over 13 years of experience in Early Years and Primary education, Ms. Chikondi Mvula is a dedicated educator and leader committed to nurturing confident, curious, and independent learners. As Reception Lead Teacher, she creates inclusive and inspiring learning environments where every child feels valued and empowered to succeed. Through purposeful play, inquiry-based learning, and strong foundations in literacy and numeracy, she fosters a lifelong love of learning. She is also passionate about educational leadership, mentoring educators, and driving excellence in Early Years practice and curriculum development.",
  },
];

const primaryTeachers = [
  {
    name: "Ms Karen Songolo",
    initials: "KS",
    className: "Year 1",
    role: "Lead Teacher",
    subject: "English",
    photo: "/images/team/songolo.jpeg",
    bio: "Ms Songolo brings 23 years of teaching experience at Mount View International School. She is passionate about working with young learners and creating a nurturing, engaging, and supportive learning environment. She believes in building strong foundations in literacy, numeracy, and essential life skills. She values teamwork and collaboration with colleagues and parents to support every child’s development, inspire confidence, and create meaningful learning experiences that help each child reach their full potential.",
  },
  {
    name: "Ms. Muneerah Bhana",
    initials: "MB",
    className: "Year 2",
    role: "Lead Teacher",
    subject: "English",
    photo: "/images/team/bhana.JPG",
    bio: "With 18 years teaching experience, including experience as a Head of Department (HOD) , Ms Bhana is a dedicated and passionate educator committed to providing quality education and supporting every child's learning journey. Having spent 10 years at Mount View International Primary School she serves as a Year 2  Lead Teacher ,  where she provides guidance , support and leadership to her teaching team.",
  },
  {
    name: "Mr. Clytone Bishi",
    initials: "C",
    className: "Year 3",
    role: "Lead Teacher",
    subject: "Mathematics",
    photo: "/images/team/clyton.jpeg",
    bio: "Mr. Clytone is a highly accomplished educator and leader with over 21 years of international teaching experience across Zimbabwe, Mozambique, Rwanda, and Malawi. Holding a Bachelor of Education Honours Degree in Educational Sociology, he brings deep expertise in Cambridge curriculum implementation, instructional leadership, and teacher development. Passionate about inclusive, learner-centred education, he champions inquiry-based learning, critical thinking, and academic excellence. Committed to nurturing confident, responsible, and socially conscious learners, he values strong partnerships, collaboration, and continuous professional growth as foundations of a thriving school community.",
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
    bio: "Ms.Samantha is an accomplished educator and leader with 20 years of teaching experience, including six impactful years at Mount View Primary School. As Lead Teacher and English Subject Lead, she is dedicated to developing confident communicators and inspiring lifelong learners. Her commitment to excellence was reflected in her Year 6 Cambridge Checkpoint results, where every learner exceeded the Basic performance level. Passionate about unlocking each child’s potential, she combines high expectations with encouragement and support, empowering students to achieve success and embrace a love of learning.",
  },
];

/* ---------------------------------------------------------
   OUR TEAM — group photo + short description (no member list)
--------------------------------------------------------- */

type Team = {
  key: string;
  name: string;
  tagline: string;
  description: string;
  photo: string;
  accent: "navy" | "orange" | "yellow";
};

const teams: Team[] = [
  {
    key: "early-years",
    name: "Early Years Team",
    tagline: "Where joyful learning begins.",
    description:
      "A warm, play-rich team guiding our youngest learners from their very first steps through to confident, curious Reception children ready for Year 1.",
    photo: "/images/team/early-years-team.jpg",
    accent: "yellow",
  },
  {
    key: "Key Stage 1",
    name: "Key Stage 1 Team",
    tagline: "Strong foundations, confident starters.",
    description:
      "Dedicated teachers building early literacy, numeracy and independence, helping children settle into primary school life with courage and curiosity.",
    photo: "/images/team/year-1-team.jpg",
    accent: "navy",
  },
  {
    key: "Lower Key Stage 2",
    name: "Lower Key Stage 2 Team",
    tagline: "Curiosity, courage and character.",
    description:
      "A close-knit team growing young readers, writers and thinkers, celebrating every small victory as pupils gain confidence and take on bigger challenges.",
    photo: "/images/team/year-2-team.jpg",
    accent: "orange",
  },
  {
    key: "Upper Key Stage 2",
    name: "Upper Key Stage 2 Team",
    tagline: "Growing independence, deepening skills.",
    description:
      "Guiding pupils through the transition into Key Stage 2, widening their horizons while building study habits that last a lifetime.",
    photo: "/images/team/year-3-team.jpg",
    accent: "navy",
  },
  {
    key: "specialist",
    name: "Specialist Team",
    tagline: "Creative, active, hands-on learning.",
    description:
      "Cambridge specialist teachers of Art, Dance & Drama, Music, PE, ICT and Swimming — bringing creativity, movement and discovery to every learner across the school.",
    photo: "/images/team/specialist-team.jpg",
    accent: "yellow",
  },
  {
    key: "admin",
    name: "Admin Team",
    tagline: "The friendly face behind every day.",
    description:
      "The team that keeps Mount View running smoothly, welcoming families, coordinating admissions, and supporting staff across every corner of the school.",
    photo: "/images/team/Admin.png",
    accent: "navy",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* =========================================================
          SEO — Structured Data (AboutPage + School + Breadcrumb)
      ========================================================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "AboutPage",
                "@id": "https://mountviewmw.com/about#page",
                url: "https://mountviewmw.com/about",
                name: "About Mount View International Primary School",
                description:
                  "History, founder, mission, governance and academic team of Mount View International Primary School in Blantyre, Malawi.",
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
                      name: "About",
                      item: "https://mountviewmw.com/about",
                    },
                  ],
                },
              },
              {
                "@type": ["School", "EducationalOrganization"],
                "@id": "https://mountviewmw.com/#school",
                name: "Mount View International Primary School & Early Years Centre",
                url: "https://mountviewmw.com",
                logo: "https://mountviewmw.com/logo12.png",
                foundingDate: "1975",
                founder: {
                  "@type": "Person",
                  name: "Mrs. Sakker Sacranie",
                  jobTitle: "Founder",
                },
                employee: [
                  {
                    "@type": "Person",
                    name: "Ms. Dimpal Rawat Juneja",
                    jobTitle: "Headteacher",
                  },
                  {
                    "@type": "Person",
                    name: "Mr. Rohit Singh Raghav",
                    jobTitle: "School Administrator",
                  },
                  {
                    "@type": "Person",
                    name: "Mr Irfan K. Bheda",
                    jobTitle: "Chairman of the Board",
                  },
                ],
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Blantyre",
                  addressRegion: "Southern Region",
                  addressCountry: "MW",
                },
              },
            ],
          }),
        }}
      />

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
                    alt="Learners at Mount View International Primary School in Blantyre, Malawi"
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
                  pursuit, it is a lifelong adventure filled with discovery,
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
                    alt={`${founder.name} — founder of Mount View International Primary School`}
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
          SCHOOL LEADERSHIP — ADMINISTRATOR FIRST, HEADTEACHER SECOND
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

          {/* ADMINISTRATOR FIRST */}
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[320px_1fr] lg:gap-14">
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

          {/* HEADTEACHER SECOND */}
          <div className="mt-20 grid items-start gap-12 border-t border-slate-100 pt-16 lg:grid-cols-[440px_1fr] lg:gap-14">
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
          OUR TEAM — group photo, tagline, description
      ====================================================== */}
      <section
        id="our-team"
        className="relative scroll-mt-40 overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-32 top-0 z-0 h-80 w-80 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -bottom-40 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-7s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-25">👥</span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-25">🌟</span>

        <div className="relative mx-auto max-w-7xl">
          <CenteredHeading
            eyebrow="Our Team"
            title="Every team, working with your child."
            description="From Early Years through to Year 6 — and everyone who keeps the school running — here are the teams that make Mount View feel like home."
            tone="dark"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team.key} team={team} />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA — Alumni focus
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

/* =========================================================
   TEAM CARD — group photo + tagline + description
========================================================= */

function TeamCard({ team }: { team: Team }) {
  const accentBadge =
    team.accent === "yellow"
      ? "bg-[#FFE900] text-[#252B68]"
      : team.accent === "orange"
      ? "bg-[#F58220] text-white"
      : "bg-[#252B68] text-white";

  const accentBar =
    team.accent === "yellow"
      ? "bg-[#FFE900]"
      : team.accent === "orange"
      ? "bg-[#F58220]"
      : "bg-[#252B68]";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-white/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
      {/* Group photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <ImageWithFallback
          src={team.photo}
          alt={`${team.name} group photo — Mount View International Primary School in Blantyre`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Team name overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFE900]">
            Team
          </p>
          <p className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">
            {team.name}
          </p>
        </div>

        {/* Accent badge */}
        <div className="absolute right-4 top-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-md ${accentBadge}`}
          >
            Our Team
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className={`h-1 w-12 rounded-full ${accentBar}`} />

        <p className="mt-4 text-sm font-bold leading-6 text-[#252B68]">
          {team.tagline}
        </p>

        <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
          {team.description}
        </p>
      </div>
    </article>
  );
}