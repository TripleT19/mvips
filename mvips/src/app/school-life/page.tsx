import ImageWithFallback from "../components/ImageWithFallback";

const experiences = [
  {
    title: "Sports & Fitness",
    text: "Children develop teamwork, discipline, coordination and confidence through active participation in sports and physical activities.",
    image: "/images/sports.jpg",
    icon: "🏃",
    accent: "yellow",
  },
  {
    title: "Swimming",
    text: "Swimming provides opportunities for learners to develop confidence, water safety awareness and physical skills.",
    image: "/images/gallery/school-3.jpg",
    icon: "🏊",
    accent: "orange",
  },
  {
    title: "ICT & Digital Learning",
    text: "Learners explore technology, computing and digital creativity while developing responsible digital skills for the future.",
    image: "/images/ict.jpg",
    icon: "💻",
    accent: "navy",
  },
  {
    title: "STEAM & Innovation",
    text: "Children investigate ideas, solve problems, design solutions and explore the exciting connections between science, technology and creativity.",
    image: "/images/steam.jpg",
    icon: "🚀",
    accent: "yellow",
  },
  {
    title: "Creative Arts",
    text: "Art gives learners space to express their imagination, develop creativity and discover new ways of communicating ideas.",
    image: "/images/creative-arts.jpg",
    icon: "🎨",
    accent: "orange",
  },
  {
    title: "Music, Dance & Drama",
    text: "Through performance and creative expression, learners develop confidence, communication, teamwork and self-expression.",
    image: "/images/gallery/school-4.jpg",
    icon: "🎭",
    accent: "navy",
  },
];

const schoolLifeCards = [
  {
    icon: "🤝",
    title: "Friendships",
    text: "Children build positive friendships, learn to cooperate and develop a sense of belonging within the school community.",
  },
  {
    icon: "🏆",
    title: "Competitions",
    text: "Learners have opportunities to challenge themselves, demonstrate their talents and celebrate achievement.",
  },
  {
    icon: "🌟",
    title: "Leadership",
    text: "Children are encouraged to take responsibility, contribute ideas and develop leadership qualities.",
  },
  {
    icon: "🎯",
    title: "Clubs & Activities",
    text: "A variety of activities give learners opportunities to discover interests beyond the traditional classroom.",
  },
  {
    icon: "💡",
    title: "Creativity",
    text: "Learners are encouraged to imagine, create, experiment and find their own ways to express ideas.",
  },
  {
    icon: "❤️",
    title: "Community",
    text: "We promote respect, kindness, empathy and positive relationships across our school community.",
  },
];

const learnerJourney = [
  {
    number: "01",
    title: "Discover",
    text: "Children explore new ideas, activities and interests.",
  },
  {
    number: "02",
    title: "Participate",
    text: "Learners are encouraged to get involved and try new experiences.",
  },
  {
    number: "03",
    title: "Develop",
    text: "Children build knowledge, skills, confidence and independence.",
  },
  {
    number: "04",
    title: "Thrive",
    text: "Learners celebrate their progress and discover their potential.",
  },
];

export default function SchoolLifePage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="relative min-h-[680px] bg-[#252B68]">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/images/gallery/school-1.jpg"
            alt="Learners enjoying school life at Mount View International Primary School"
            className="h-full w-full"
          />

          <div className="absolute inset-0 bg-[#252B68]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#252B68] via-[#252B68]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#252B68] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#FFE900] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
              Life at Mount View
            </div>

            <h1 className="text-5xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Where learning
              <span className="block text-[#FFE900]">
                comes alive.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              School life at Mount View is about more than lessons. It is about
              discovering talents, building friendships, creating memories and
              growing into a confident young person.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white">
                Learn
              </span>
              <span className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Create
              </span>
              <span className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Explore
              </span>
              <span className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
                Belong
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/admissions"
                className="rounded-full bg-[#F58220] px-7 py-3.5 text-center font-bold text-white shadow-xl transition hover:bg-[#d96e12]"
              >
                Discover Mount View
              </a>

              <a
                href="/gallery"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 text-center font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#252B68]"
              >
                View Our Gallery
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* INTRO */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              The Mount View Experience
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
              Every day is an opportunity to discover something new.
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-600">
              <p>
                At Mount View International Primary School & Early Years
                Centre, we believe that some of the most important learning
                happens when children are actively involved in the life of the
                school.
              </p>

              <p>
                From the classroom to the sports field, swimming activities,
                ICT laboratory, creative spaces and school events, learners
                have opportunities to develop skills, confidence and positive
                relationships.
              </p>

              <p>
                We want children to look forward to coming to school, knowing
                that they will be encouraged to participate, explore their
                interests and be part of something bigger than themselves.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-1 w-16 rounded-full bg-[#F58220]" />
              <p className="font-bold text-[#252B68]">
                Fostering growth, excellence and empathy.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#FFE900]/30 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
              <ImageWithFallback
                src="/images/gallery/school-2.jpg"
                alt="Learners enjoying activities at Mount View"
                className="h-[430px] w-full sm:h-[520px]"
              />
            </div>

            <div className="absolute -bottom-7 -left-5 rounded-2xl bg-[#FFE900] px-6 py-5 text-[#252B68] shadow-xl sm:-left-8">
              <p className="text-3xl font-black">Every Child</p>
              <p className="mt-1 font-bold">Has a place to shine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE GRID */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              Explore School Life
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Learning beyond the classroom.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Our learners experience a broad range of activities designed to
              develop the whole child.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <div
                key={experience.title}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative overflow-hidden">
                  <ImageWithFallback
                    src={experience.image}
                    alt={experience.title}
                    className="h-64 w-full transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg">
                    {experience.icon}
                  </div>
                </div>

                <div className="p-7">
                  <div
                    className={`mb-4 h-1 w-12 rounded-full ${
                      experience.accent === "yellow"
                        ? "bg-[#FFE900]"
                        : experience.accent === "orange"
                          ? "bg-[#F58220]"
                          : "bg-[#252B68]"
                    }`}
                  />

                  <h3 className="text-xl font-black text-[#252B68]">
                    {experience.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {experience.text}
                  </p>

                  <a
                    href="/gallery"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#F58220] transition group-hover:gap-3"
                  >
                    See more
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="relative overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#FFE900]">
              Technology & Innovation
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Preparing children for a changing world.
            </h2>

            <p className="mt-6 leading-8 text-blue-100">
              Technology is part of the learning experience at Mount View.
              Learners develop practical ICT skills while exploring creativity,
              problem-solving, digital communication and responsible technology
              use.
            </p>

            <p className="mt-4 leading-8 text-blue-100">
              Through ICT and STEAM activities, children are encouraged to
              become creators, problem-solvers and confident digital learners.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                "ICT Skills",
                "Digital Creativity",
                "Problem Solving",
                "STEAM Learning",
                "Innovation",
                "Responsible Technology",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm"
                >
                  <span className="mr-2 text-[#FFE900]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#FFE900]/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white/10 shadow-2xl">
              <ImageWithFallback
                src="/images/steam.jpg"
                alt="STEAM learning at Mount View"
                className="h-[400px] w-full sm:h-[480px]"
              />
            </div>

            <div className="absolute -bottom-6 -right-4 rounded-2xl bg-[#F58220] px-6 py-5 text-white shadow-xl sm:-right-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-100">
                Future Ready
              </p>
              <p className="mt-1 text-lg font-black">
                Imagine. Create. Solve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
                Our Community
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                Growing together.
              </h2>
            </div>

            <p className="leading-8 text-slate-600 md:text-right">
              School life is also about relationships, responsibility,
              participation and the experiences that help children become
              confident members of their community.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schoolLifeCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#FFE900] hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl transition group-hover:bg-[#FFE900]">
                  {card.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-[#252B68]">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOUSE / TEAM SPIRIT */}
      <section className="bg-[#FFE900] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#252B68]">
              Team Spirit
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Learning the value of teamwork.
            </h2>

            <p className="mt-6 leading-8 text-[#252B68]/80">
              School activities provide learners with opportunities to work
              together, support one another and celebrate the achievements of
              their peers.
            </p>

            <p className="mt-4 leading-8 text-[#252B68]/80">
              Through competitions, sports, performances, challenges and school
              events, children learn that success is not only about individual
              achievement — it is also about collaboration, encouragement and
              being part of a team.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#252B68] px-5 py-2.5 text-sm font-bold text-white">
                Teamwork
              </span>
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white">
                Leadership
              </span>
              <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68]">
                Respect
              </span>
              <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68]">
                Confidence
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl">
              <ImageWithFallback
                src="/images/competitions.jpg"
                alt="Learners participating in school competitions"
                className="h-[400px] w-full sm:h-[480px]"
              />
            </div>

            <div className="absolute -bottom-6 -right-4 rounded-2xl bg-[#252B68] px-6 py-5 text-white shadow-xl sm:-right-8">
              <p className="text-2xl font-black">Together</p>
              <p className="text-sm font-medium text-blue-100">
                We learn. We grow. We achieve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LEARNER JOURNEY */}
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
              We want every child to leave each experience with something new:
              a skill, an idea, a friendship, a challenge overcome or a reason
              to be proud.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {learnerJourney.map((item, index) => (
              <div
                key={item.number}
                className="relative rounded-[2rem] bg-white p-8 shadow-lg"
              >
                <span
                  className={`text-6xl font-black ${
                    index % 3 === 0
                      ? "text-[#252B68]/10"
                      : index % 3 === 1
                        ? "text-[#F58220]/20"
                        : "text-[#FFE900]"
                  }`}
                >
                  {item.number}
                </span>

                <h3 className="mt-5 text-xl font-black text-[#252B68]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY PROMOTION */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <ImageWithFallback
              src="/images/gallery/school-1.jpg"
              alt="Mount View school life"
              className="h-52 rounded-3xl sm:h-64"
            />

            <ImageWithFallback
              src="/images/gallery/school-2.jpg"
              alt="Mount View learners"
              className="mt-8 h-52 rounded-3xl sm:h-64"
            />

            <ImageWithFallback
              src="/images/gallery/school-3.jpg"
              alt="Mount View school activities"
              className="-mt-4 h-52 rounded-3xl sm:h-64"
            />

            <ImageWithFallback
              src="/images/gallery/school-4.jpg"
              alt="Mount View learners participating in activities"
              className="h-52 rounded-3xl sm:h-64"
            />
          </div>

          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              See Mount View in Action
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              The best way to experience school life is to see it.
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              Explore our gallery and discover some of the experiences,
              activities and moments that make life at Mount View special.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/gallery"
                className="rounded-full bg-[#252B68] px-7 py-3.5 text-center font-bold text-white shadow-lg transition hover:bg-[#171B4A]"
              >
                Explore Our Gallery
              </a>

              <a
                href="/news"
                className="rounded-full border-2 border-[#252B68] px-7 py-3.5 text-center font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
              >
                School News
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PARENT PROMOTION */}
      <section className="relative overflow-hidden bg-[#252B68] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-[#FFE900]">
            For Families
          </p>

          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Give your child a school experience they can grow into.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            At Mount View, we want children to experience school as a place
            where they can learn, make friends, discover their talents, take on
            challenges and become increasingly confident in who they are.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/admissions"
              className="rounded-full bg-[#F58220] px-8 py-4 font-bold text-white shadow-xl transition hover:bg-[#d96e12]"
            >
              Explore Admissions
            </a>

            <a
              href="/contact"
              className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#252B68]"
            >
              Contact the School
            </a>
          </div>
        </div>
      </section>

      {/* BRAND STATEMENT */}
      <section className="border-t border-slate-100 bg-white px-4 py-14 text-center sm:px-6 lg:px-8">
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