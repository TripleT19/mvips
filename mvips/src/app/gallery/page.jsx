import ImageWithFallback from "../components/ImageWithFallback";

const newsStories = [
  {
    title: "Mount View Learners Take Part in Inter-House Quiz",
    category: "School Events",
    date: "25 September 2026",
    image: "/images/news/quiz-2026.jpg",
    excerpt:
      "Learners from Reception to Year 6 came together for an exciting inter-house quiz, combining learning, teamwork and healthy competition.",
  },
  {
    title: "Learning Through Creativity and Innovation",
    category: "Learning",
    date: "School News",
    image: "/images/news/steam-learning.jpg",
    excerpt:
      "Our learners continue to explore ideas, solve problems and develop creativity through practical STEAM and technology activities.",
  },
  {
    title: "Making Every School Day Meaningful",
    category: "School Life",
    date: "School Community",
    image: "/images/news/school-life.jpg",
    excerpt:
      "From classroom learning to sports, creative activities and friendships, every day provides opportunities for our learners to grow.",
  },
];

const highlights = [
  {
    icon: "🎓",
    title: "Learning",
    text: "Discover stories about learning experiences, projects and activities taking place across the school.",
  },
  {
    icon: "🏆",
    title: "Achievements",
    text: "Celebrate the effort, progress and achievements of our learners and school community.",
  },
  {
    icon: "🎨",
    title: "Creativity",
    text: "Explore creative activities, performances, projects and opportunities for learners to express themselves.",
  },
  {
    icon: "🤝",
    title: "Community",
    text: "Stay connected with events and experiences that bring our learners, teachers and families together.",
  },
];

export default function NewsPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="relative bg-[#252B68]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
              Mount View News
            </div>

            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Discover what&apos;s
              <span className="block text-[#FFE900]">
                happening at Mount View.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Stay connected with the latest activities, learning experiences,
              events and stories from Mount View International Primary School
              & Early Years Centre.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white">
                School Events
              </span>

              <span className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white">
                Learning
              </span>

              <span className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white">
                Community
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#FFE900]/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white/20 shadow-2xl">
              <ImageWithFallback
                src="/images/news/quiz-2026.jpg"
                alt="Mount View learners participating in a school quiz"
                className="h-[380px] w-full sm:h-[460px]"
              />
            </div>

            <div className="absolute -bottom-6 -left-4 rounded-2xl bg-[#FFE900] px-6 py-4 text-[#252B68] shadow-xl sm:-left-8">
              <p className="text-xs font-bold uppercase tracking-widest">
                Latest Stories
              </p>

              <p className="mt-1 font-extrabold">
                Learn. Participate. Celebrate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
            School Stories
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
            There is always something happening at Mount View.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl leading-8 text-slate-600">
            Our school community is full of learning, creativity, activities
            and memorable moments. This is where we share some of the stories
            and experiences that make life at Mount View special.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#FFE900] hover:shadow-xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl">
                {highlight.icon}
              </div>

              <h3 className="mt-5 font-black text-[#252B68]">
                {highlight.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {highlight.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED STORY */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
                Featured Story
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
                Highlights from our school community.
              </h2>
            </div>

            <a
              href="/gallery"
              className="font-bold text-[#F58220] transition hover:text-[#252B68]"
            >
              Explore the Gallery →
            </a>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
            <div className="grid lg:grid-cols-2">
              <div className="min-h-[360px]">
                <ImageWithFallback
                  src="/images/news/quiz-2026.jpg"
                  alt="Mount View Inter-House Quiz"
                  className="h-full min-h-[360px] w-full"
                />
              </div>

              <div className="flex items-center p-8 sm:p-12">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#252B68]">
                      School Events
                    </span>

                    <span className="text-sm font-medium text-slate-500">
                      25 September 2026
                    </span>
                  </div>

                  <h3 className="mt-5 text-3xl font-black leading-tight text-[#252B68]">
                    Mount View Learners Take Part in Inter-House Quiz
                  </h3>

                  <p className="mt-5 leading-8 text-slate-600">
                    Learners from Reception to Year 6 came together for an
                    exciting inter-house quiz that combined knowledge,
                    teamwork, confidence and healthy competition.
                  </p>

                  <p className="mt-4 leading-8 text-slate-600">
                    The event provided learners with an opportunity to
                    demonstrate what they know while supporting their houses
                    and enjoying the excitement of learning together.
                  </p>

                  <a
                    href="/gallery"
                    className="mt-7 inline-flex rounded-full bg-[#F58220] px-6 py-3 font-bold text-white transition hover:bg-[#d96e12]"
                  >
                    View School Moments
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORIES GRID */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-[#F58220]">
              Latest Stories
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Inside life at Mount View.
            </h2>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {newsStories.map((story) => (
              <article
                key={story.title}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="overflow-hidden">
                  <ImageWithFallback
                    src={story.image}
                    alt={story.title}
                    className="h-64 w-full transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#252B68] px-3 py-1.5 text-xs font-bold text-white">
                      {story.category}
                    </span>

                    <span className="text-xs font-medium text-slate-500">
                      {story.date}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black leading-tight text-[#252B68]">
                    {story.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {story.excerpt}
                  </p>

                  <a
                    href="/contact"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#F58220] transition group-hover:gap-3"
                  >
                    Learn more
                    <span>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS CTA */}
      <section className="relative overflow-hidden bg-[#F58220] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#252B68]/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-orange-100">
            Stay Connected
          </p>

          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Follow the Mount View journey.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-orange-50">
            Discover the experiences, achievements and everyday moments that
            make our school community special.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/gallery"
              className="rounded-full bg-[#252B68] px-8 py-4 font-bold text-white shadow-xl transition hover:bg-[#171B4A]"
            >
              Explore Gallery
            </a>

            <a
              href="/admissions"
              className="rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#F58220]"
            >
              Explore Admissions
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