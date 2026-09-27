import Link from "next/link";
import ImageWithFallback from "../../components/ImageWithFallback";

const subjects = [
  {
    number: "01",
    title: "Mathematics",
    description:
      "Building confidence with numbers, patterns, problem-solving and mathematical thinking through meaningful learning experiences.",
    icon: "∑",
  },
  {
    number: "02",
    title: "Science",
    description:
      "Encouraging curiosity through observation, investigation, experimentation and understanding the world around us.",
    icon: "⚗",
  },
  {
    number: "03",
    title: "English",
    description:
      "Developing strong communication through reading, writing, speaking, listening and creative expression.",
    icon: "Aa",
  },
  {
    number: "04",
    title: "Sports",
    description:
      "Developing physical skills, teamwork, resilience, confidence and a positive attitude towards an active lifestyle.",
    icon: "⚽",
  },
  {
    number: "05",
    title: "Swimming",
    description:
      "Supporting physical development, water confidence, coordination and important life skills.",
    icon: "≈",
  },
  {
    number: "06",
    title: "ICT",
    description:
      "Developing digital confidence and responsible technology use through practical, creative and purposeful activities.",
    icon: "⌘",
  },
  {
    number: "07",
    title: "Arts",
    description:
      "Giving learners opportunities to explore creativity, imagination, visual expression and artistic techniques.",
    icon: "✦",
  },
  {
    number: "08",
    title: "Phonics",
    description:
      "Supporting early reading and spelling through structured development of sound awareness and phonics knowledge.",
    icon: "ABC",
  },
  {
    number: "09",
    title: "Dance & Drama",
    description:
      "Building confidence, expression, collaboration and creativity through movement, performance and storytelling.",
    icon: "✧",
  },
  {
    number: "10",
    title: "Music",
    description:
      "Exploring rhythm, melody, performance and musical creativity while encouraging confidence and enjoyment.",
    icon: "♫",
  },
  {
    number: "11",
    title: "Learning Support",
    description:
      "Providing appropriate support and encouragement so learners can make progress and participate meaningfully in school life.",
    icon: "♡",
  },
];

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
      "Learners use what they know to solve problems, create, investigate, communicate and respond to real or meaningful situations.",
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
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#FFE900]/10" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
              Learning at Mount View
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learning with purpose and{" "}
              <span className="text-[#FFE900]">possibility.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              We create learning experiences that help children build strong
              foundations, discover their interests, develop confidence and
              become increasingly independent learners.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#subjects"
                className="inline-flex items-center justify-center rounded-full bg-[#F58220] px-7 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-lg"
              >
                Explore Our Learning
              </Link>

              <Link
                href="/admissions"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 font-bold text-white transition hover:bg-white hover:text-[#252B68]"
              >
                Discover Admissions
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border-8 border-white/10 bg-white/10 shadow-2xl">
              <ImageWithFallback
                src="/images/ict.jpg"
                alt="Learners developing digital and technology skills"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div className="absolute -bottom-6 -left-5 rounded-2xl bg-[#FFE900] px-5 py-4 shadow-xl sm:-left-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#252B68]">
                Our approach
              </p>
              <p className="mt-1 text-lg font-black text-[#252B68]">
                Discover • Develop • Create
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
            Our Academic Philosophy
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
            Building strong foundations for a changing world.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            At Mount View, learning is about more than remembering information.
            We encourage learners to understand ideas, ask questions, solve
            problems, communicate clearly and apply their knowledge in
            meaningful ways.
          </p>

          <div className="mt-12 grid gap-5 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#252B68] text-xl text-white">
                01
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Strong Foundations
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Developing essential knowledge, understanding and skills from
                the earliest stages of learning.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F58220] text-xl font-black text-white">
                02
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Active Learning
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Giving learners opportunities to explore, practise, discuss,
                create, investigate and apply what they learn.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE900] text-xl font-black text-[#252B68]">
                03
              </div>

              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                Growing Independence
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Helping learners gradually take greater responsibility for
                their learning, thinking and personal development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LEARNING JOURNEY */}
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

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {learningStages.map((stage) => (
              <div
                key={stage.number}
                className="group rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              Our Curriculum
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              A broad and balanced learning experience.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Learners experience a range of academic, creative, physical and
              digital opportunities designed to support their development as
              confident and capable individuals.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={subject.number}
                className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/10 hover:shadow-xl"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-[#252B68]/5 transition group-hover:bg-[#FFE900]/30" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252B68] text-lg font-black text-white transition group-hover:bg-[#F58220]">
                    {subject.icon}
                  </div>

                  <span className="text-xs font-black tracking-widest text-slate-300">
                    {subject.number}
                  </span>
                </div>

                <h3 className="relative mt-6 text-xl font-black text-[#252B68]">
                  {subject.title}
                </h3>

                <p className="relative mt-3 leading-7 text-slate-600">
                  {subject.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* RESEARCH SECTION */}
      <section className="relative overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#FFE900]/10" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl">
              <ImageWithFallback
                src="/images/steam-learning.jpg"
                alt="Learners working together during a research and learning activity"
                className="aspect-[4/3] w-full"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFE900] px-4 py-2 text-sm font-black text-[#252B68]">
                <span>06</span>
                Year 6 Learning
              </div>

              <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Research & Independent Learning
              </h2>

              <p className="mt-6 text-lg leading-8 text-blue-100">
                As learners progress into Year 6, they are encouraged to take
                greater ownership of their learning through guided research and
                independent investigation.
              </p>

              <p className="mt-5 leading-8 text-blue-100">
                Learners are supported to ask meaningful questions, identify
                useful information, explore different sources, organise their
                findings and communicate what they have discovered. Through
                this process, they develop the confidence to investigate topics
                beyond simply receiving information from the teacher.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Asking meaningful questions",
                  "Finding relevant information",
                  "Using digital resources responsibly",
                  "Comparing information",
                  "Organising research findings",
                  "Presenting ideas clearly",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-xs font-black text-[#252B68]">
                      ✓
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border-l-4 border-[#F58220] bg-white/5 p-5">
                <p className="font-bold text-[#FFE900]">
                  The goal is not simply to find information.
                </p>

                <p className="mt-2 leading-7 text-blue-100">
                  Learners are developing the skills to question, investigate,
                  evaluate, organise and communicate information with growing
                  independence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICT */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
                Digital Learning
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                ICT that supports learning.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Technology is integrated into learning as a tool for
                exploration, creativity, communication, problem-solving and
                research. Learners develop practical digital skills while also
                learning to use technology thoughtfully and responsibly.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Digital literacy and confidence",
                  "Creative use of technology",
                  "Information and research skills",
                  "Responsible and safe technology use",
                  "Problem-solving through digital tools",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFE900] font-black text-[#252B68]">
                      ✓
                    </span>

                    <span className="font-semibold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/school-life"
                className="mt-9 inline-flex items-center font-bold text-[#252B68] transition hover:text-[#F58220]"
              >
                Explore school life
                <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl">
              <ImageWithFallback
                src="/images/ict.jpg"
                alt="Learners using technology as part of their learning"
                className="aspect-[4/3] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CREATIVE + PHYSICAL */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F58220]">
              Beyond the Classroom
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              Developing the whole learner.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Academic development works alongside creative expression,
              physical activity, collaboration and opportunities to discover
              individual interests.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <ImageWithFallback
                src="/images/sports.jpg"
                alt="Learners participating in sports"
                className="aspect-[16/10] w-full"
              />

              <div className="p-7">
                <h3 className="text-2xl font-black text-[#252B68]">
                  Physical Development
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Sports and swimming provide opportunities to develop
                  coordination, teamwork, confidence and resilience.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <ImageWithFallback
                src="/images/creative-arts.jpg"
                alt="Learners exploring creative arts"
                className="aspect-[16/10] w-full"
              />

              <div className="p-7">
                <h3 className="text-2xl font-black text-[#252B68]">
                  Creative Expression
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Arts, music, dance and drama give learners space to express
                  ideas, develop imagination and grow in confidence.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <ImageWithFallback
                src="/images/steam.jpg"
                alt="Learners taking part in STEAM learning"
                className="aspect-[16/10] w-full"
              />

              <div className="p-7">
                <h3 className="text-2xl font-black text-[#252B68]">
                  STEAM & Innovation
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Learners connect ideas across subjects and explore creative
                  approaches to problems, projects and challenges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUTURE READY */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-[#FFE900] p-8 sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#252B68]">
                  Future-Ready Learning
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  Skills that travel beyond the classroom.
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-[#252B68]/80">
                  We want learners to leave each stage of their education with
                  more than subject knowledge. They should also have the
                  confidence and skills to approach unfamiliar situations,
                  learn independently and work with others.
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

      {/* LEARNING SUPPORT */}
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
            </div>
          </div>
        </div>
      </section>

      {/* PARENTS */}
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

      {/* ADMISSIONS CTA */}
      <section className="relative overflow-hidden bg-[#F58220]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#252B68]/10" />

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

      {/* BRAND STATEMENT */}
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