import ImageWithFallback from "../components/ImageWithFallback";

const values = [
  {
    icon: "🌱",
    title: "Growth",
    text: "Every learner is encouraged to discover their strengths, build confidence and develop a lifelong love for learning.",
  },
  {
    icon: "⭐",
    title: "Excellence",
    text: "We encourage learners to aim high, take pride in their work and continually develop their knowledge and skills.",
  },
  {
    icon: "❤️",
    title: "Empathy",
    text: "We nurture kindness, respect and understanding so that learners learn to care for themselves and others.",
  },
  {
    icon: "💡",
    title: "Innovation",
    text: "We encourage curiosity, creativity, problem-solving and the responsible use of technology.",
  },
];

const experiences = [
  {
    number: "01",
    title: "Strong Academics",
    text: "A purposeful learning environment that develops knowledge, understanding, confidence and independent thinking.",
  },
  {
    number: "02",
    title: "Digital Learning",
    text: "Technology and ICT are integrated into learning to help learners become confident and responsible digital citizens.",
  },
  {
    number: "03",
    title: "STEAM & Creativity",
    text: "Learners explore science, technology, engineering, arts and mathematics through practical and creative experiences.",
  },
  {
    number: "04",
    title: "Sport & Wellbeing",
    text: "Physical activity, teamwork and positive wellbeing are important parts of developing the whole child.",
  },
  {
    number: "05",
    title: "Creative Expression",
    text: "Music, art, drama and other creative activities give learners opportunities to express themselves and discover new talents.",
  },
  {
    number: "06",
    title: "Community",
    text: "We build a caring school community where learners, teachers and families work together to support children's development.",
  },
];

const journey = [
  {
    step: "01",
    title: "Discover",
    text: "Young learners explore their world through curiosity, questions and meaningful experiences.",
  },
  {
    step: "02",
    title: "Develop",
    text: "Learners build academic, social, emotional, physical and digital skills.",
  },
  {
    step: "03",
    title: "Create",
    text: "Learners apply their knowledge through projects, technology, creativity and problem-solving.",
  },
  {
    step: "04",
    title: "Thrive",
    text: "Learners grow into confident, responsible and compassionate young people prepared for the future.",
  },
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative bg-[#252B68]">
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
              About Mount View
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              More than a school.
              <span className="block text-[#FFE900]">
                A place to belong.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Mount View International Primary School & Early Years Centre
              provides a caring and stimulating environment where children are
              encouraged to learn, explore, create and grow with confidence.
            </p>

            <p className="mt-4 font-semibold text-white">
              Fostering growth, excellence and empathy.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#FFE900]/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-2xl">
              <ImageWithFallback
                src="/images/gallery/school-1.jpg"
                alt="Learners at Mount View International Primary School"
                className="h-[380px] w-full sm:h-[460px]"
              />
            </div>

            <div className="absolute -bottom-6 -left-4 rounded-2xl bg-[#F58220] px-6 py-4 text-white shadow-xl sm:-left-8">
              <p className="text-xs font-bold uppercase tracking-widest">
                Our Promise
              </p>
              <p className="mt-1 font-extrabold">
                Every child matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK INTRO
      ====================================================== */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
                Welcome to Mount View
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
                Helping children become confident learners and caring people.
              </h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  At Mount View International Primary School & Early Years
                  Centre, we believe that education is about more than academic
                  achievement. It is about helping every child discover who
                  they are, what they can do and how they can contribute to
                  the world around them.
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
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#252B68] p-7 text-white shadow-lg">
                <div className="text-4xl">🎓</div>
                <h3 className="mt-5 text-xl font-extrabold">
                  Learner-Centred
                </h3>
                <p className="mt-3 text-sm leading-7 text-blue-100">
                  We place learners at the centre of meaningful learning
                  experiences.
                </p>
              </div>

              <div className="rounded-3xl bg-[#FFE900] p-7 text-[#252B68] shadow-lg">
                <div className="text-4xl">🌍</div>
                <h3 className="mt-5 text-xl font-extrabold">
                  Future Ready
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#252B68]/80">
                  We develop skills, confidence and curiosity for an
                  ever-changing world.
                </p>
              </div>

              <div className="rounded-3xl bg-[#F58220] p-7 text-white shadow-lg">
                <div className="text-4xl">🤝</div>
                <h3 className="mt-5 text-xl font-extrabold">
                  Caring Community
                </h3>
                <p className="mt-3 text-sm leading-7 text-orange-50">
                  We value positive relationships between learners, teachers
                  and families.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
                <div className="text-4xl">🚀</div>
                <h3 className="mt-5 text-xl font-extrabold text-[#252B68]">
                  Big Potential
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Every learner is supported to discover strengths and pursue
                  their goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OUR STORY
      ====================================================== */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/gallery/school-2.jpg"
                alt="Mount View school community"
                className="h-[420px] w-full"
              />
            </div>

            <div className="absolute -bottom-7 -right-5 hidden rounded-2xl bg-[#252B68] p-6 text-white shadow-xl sm:block">
              <p className="text-3xl font-black text-[#FFE900]">MV</p>
              <p className="mt-1 text-sm font-semibold">
                Learning • Growth • Community
              </p>
            </div>
          </div>

          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              Our Story
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Building a learning community where children can thrive.
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              <p>
                Mount View International Primary School & Early Years Centre
                is committed to creating an environment where children can
                develop academically while also growing socially, emotionally
                and creatively.
              </p>

              <p>
                We understand that every learner is different. Our approach
                therefore encourages curiosity, participation, collaboration
                and practical learning while giving children opportunities to
                discover their individual strengths.
              </p>

              <p>
                From the early years through primary education, we aim to
                provide experiences that help children become confident
                communicators, thoughtful problem-solvers and responsible
                members of their communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VISION & MISSION
      ====================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              What Guides Us
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Our vision and mission
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              Our school community is guided by a clear commitment to helping
              children become capable, compassionate and confident learners.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#252B68] p-8 text-white shadow-xl sm:p-10">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFE900]/20" />

              <div className="relative">
                <span className="inline-flex rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#252B68]">
                  Our Vision
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Inspiring children to make a positive difference.
                </h3>

                <p className="mt-5 leading-8 text-blue-100">
                  We aspire to develop confident and compassionate young
                  people who are equipped with the knowledge, skills and
                  character to contribute positively to their communities and
                  the wider world.
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-[#F58220] p-8 text-white shadow-xl sm:p-10">
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative">
                <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-[#F58220]">
                  Our Mission
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Creating meaningful opportunities to learn and grow.
                </h3>

                <p className="mt-5 leading-8 text-orange-50">
                  We provide a safe, supportive and stimulating learning
                  environment where every child is encouraged to achieve
                  academic excellence, develop positive character and discover
                  their unique potential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VALUES
      ====================================================== */}
      <section className="bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-bold uppercase tracking-[0.2em] text-[#FFE900]">
              Our Values
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              The values behind every learning experience.
            </h2>

            <p className="mt-5 leading-8 text-blue-100">
              Our values influence how we teach, how we learn and how we build
              relationships throughout the school community.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl bg-white p-7 shadow-xl transition duration-300 hover:-translate-y-2"
              >
                <div className="text-4xl">{value.icon}</div>

                <h3 className="mt-5 text-xl font-black text-[#252B68]">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          MOUNT VIEW EXPERIENCE
      ====================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
                The Mount View Experience
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                Learning that goes beyond the classroom.
              </h2>
            </div>

            <p className="leading-8 text-slate-600 md:text-right">
              We create opportunities for learners to discover their
              interests, apply knowledge and develop skills that will support
              them throughout their lives.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <div
                key={experience.number}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl font-black text-[#252B68]/10">
                    {experience.number}
                  </span>

                  <span className="h-3 w-3 rounded-full bg-[#F58220] transition group-hover:scale-150" />
                </div>

                <h3 className="mt-7 text-xl font-black text-[#252B68]">
                  {experience.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {experience.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          ICT / STEAM FEATURE
      ====================================================== */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-slate-100 lg:grid-cols-2">
          <div className="min-h-[380px]">
            <ImageWithFallback
              src="/images/ict.jpg"
              alt="ICT and technology learning at Mount View"
              className="h-full min-h-[380px] w-full"
            />
          </div>

          <div className="flex items-center bg-[#FFE900] p-8 sm:p-12">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[#252B68]">
                Future-Focused Learning
              </p>

              <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
                Preparing learners for a changing world.
              </h2>

              <p className="mt-5 leading-8 text-[#252B68]/80">
                Technology, ICT and STEAM learning provide opportunities for
                children to investigate ideas, solve problems, create
                projects and develop digital skills.
              </p>

              <p className="mt-4 leading-8 text-[#252B68]/80">
                We want learners to understand technology not simply as
                something they use, but as a tool they can use responsibly to
                create, communicate, collaborate and solve problems.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {["ICT", "STEAM", "Creativity", "Problem Solving"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#252B68] shadow-sm"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
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
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              The Learner Journey
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              From curiosity to confidence.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              We support learners through every stage of their development,
              helping them build the knowledge, skills and character they need
              for the next stage of their journey.
            </p>
          </div>

          <div className="relative mt-14">
            <div className="absolute left-1/2 top-10 hidden h-0.5 w-[75%] -translate-x-1/2 bg-[#252B68]/10 lg:block" />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 border-slate-50 bg-[#252B68] text-xl font-black text-[#FFE900] shadow-lg">
                    {item.step}
                  </div>

                  <h3 className="mt-6 text-xl font-black text-[#252B68]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PARENTS
      ====================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              Partnership with Families
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Parents are an important part of the journey.
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              A child's education is strongest when school and home work
              together. We value open communication and positive partnerships
              with parents and guardians.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Open communication between school and home",
                "A supportive and welcoming school community",
                "Opportunities to celebrate learner achievements",
                "Shared responsibility for learner development",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-sm font-black text-[#252B68]">
                    ✓
                  </span>

                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] shadow-2xl">
            <ImageWithFallback
              src="/images/gallery/school-3.jpg"
              alt="Mount View learners during school activities"
              className="h-[420px] w-full"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-[#FFE900]">
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
            <a
              href="/admissions"
              className="rounded-full bg-[#F58220] px-7 py-3.5 font-bold text-white shadow-lg transition hover:bg-[#d96e12]"
            >
              Explore Admissions
            </a>

            <a
              href="/contact"
              className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 font-bold text-white transition hover:bg-white hover:text-[#252B68]"
            >
              Contact Our School
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND STATEMENT
      ====================================================== */}
      <section className="border-t border-slate-100 bg-white px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-2xl font-black text-[#252B68] sm:text-3xl">
            Fostering{" "}
            <span className="text-[#F58220]">growth</span>,{" "}
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