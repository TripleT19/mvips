import Link from "next/link";
import ImageWithFallback from "../components/ImageWithFallback";

const categories = [
  "All Stories",
  "School Events",
  "Learning",
  "Sports",
  "Creativity",
  "Community",
];

const stories = [
  {
    title: "Mount View Inter-House Quiz Brings Learners Together",
    author: "Mount View School",
    className: "Whole School",
    eventDate: "25 September 2026",
    publishedDate: "26 September 2026",
    category: "School Events",
    image: "/images/news/quiz-2026.jpg",
    excerpt:
      "Learners from Reception to Year 6 came together for an exciting inter-house quiz celebrating knowledge, teamwork, confidence and school spirit.",
    featured: true,
  },
  {
    title: "Learning Through STEAM",
    author: "Mount View School",
    className: "Year 5 East",
    eventDate: "18 September 2026",
    publishedDate: "19 September 2026",
    category: "Learning",
    image: "/images/news/steam-learning.jpg",
    excerpt:
      "Learners explored creative ways to apply science, technology, engineering, arts and mathematics through practical and collaborative learning.",
    featured: false,
  },
  {
    title: "A Day of Creativity at Mount View",
    author: "Mount View School",
    className: "Year 4 West",
    eventDate: "12 September 2026",
    publishedDate: "13 September 2026",
    category: "Creativity",
    image: "/images/news/school-life.jpg",
    excerpt:
      "Learners took part in creative activities designed to encourage self-expression, collaboration, confidence and imagination.",
    featured: false,
  },
  {
    title: "Exploring Digital Learning",
    author: "Mount View School",
    className: "Year 6",
    eventDate: "09 September 2026",
    publishedDate: "10 September 2026",
    category: "Learning",
    image: "/images/ict.jpg",
    excerpt:
      "Learners developed their digital skills through practical ICT activities and explored how technology can support learning and creativity.",
    featured: false,
  },
  {
    title: "Creative Arts in Action",
    author: "Mount View School",
    className: "Year 3",
    eventDate: "04 September 2026",
    publishedDate: "05 September 2026",
    category: "Creativity",
    image: "/images/creative-arts.jpg",
    excerpt:
      "Through art and creative activities, learners had opportunities to express ideas, develop skills and celebrate their individuality.",
    featured: false,
  },
  {
    title: "Growing Through Sport and Teamwork",
    author: "Mount View School",
    className: "Year 4",
    eventDate: "28 August 2026",
    publishedDate: "29 August 2026",
    category: "Sports",
    image: "/images/sports.jpg",
    excerpt:
      "Learners enjoyed physical activities that encouraged teamwork, participation, perseverance and a positive approach to staying active.",
    featured: false,
  },
];

const quickUpdates = [
  {
    date: "25 SEP",
    title: "Mount View Inter-House Quiz",
    category: "School Event",
  },
  {
    date: "18 SEP",
    title: "Year 5 STEAM Learning",
    category: "Learning",
  },
  {
    date: "12 SEP",
    title: "Creative Learning Activities",
    category: "Creativity",
  },
  {
    date: "09 SEP",
    title: "Digital Learning Activities",
    category: "ICT",
  },
];

const yearHighlights = [
  {
    number: "01",
    title: "Learning",
    text: "Stories from classrooms, projects and learning experiences.",
  },
  {
    number: "02",
    title: "Achievement",
    text: "Moments that celebrate learner participation and progress.",
  },
  {
    number: "03",
    title: "Creativity",
    text: "Creative expression through arts, music, drama and innovation.",
  },
  {
    number: "04",
    title: "Community",
    text: "Events and experiences that bring our school community together.",
  },
];

export default function NewsPage() {
  const featuredStory = stories.find((story) => story.featured);
  const latestStories = stories.filter((story) => !story.featured);

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#252B68] text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#F58220]/15" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#FFE900] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#252B68]">
              Mount View News
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Stories from our
              <span className="text-[#FFE900]"> school community.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              Discover what is happening at Mount View International Primary
              School & Early Years Centre through stories from our classrooms,
              events, activities and learner experiences.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED STORY */}
      {featuredStory && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="font-bold uppercase tracking-[0.18em] text-[#F58220]">
                Featured Story
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#252B68] sm:text-4xl">
                From around Mount View
              </h2>
            </div>

            <span className="hidden rounded-full bg-[#FFE900]/30 px-4 py-2 text-sm font-bold text-[#252B68] sm:inline-flex">
              Latest school story
            </span>
          </div>

          <article className="overflow-hidden rounded-[2rem] bg-slate-50 shadow-xl ring-1 ring-slate-200">
            <div className="grid lg:grid-cols-2">
              <div className="min-h-[320px] lg:min-h-[500px]">
                <ImageWithFallback
                  src={featuredStory.image}
                  alt={featuredStory.title}
                  className="h-full min-h-[320px] lg:min-h-[500px]"
                />
              </div>

              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                <span className="w-fit rounded-full bg-[#252B68] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                  {featuredStory.category}
                </span>

                <h2 className="mt-5 text-3xl font-extrabold leading-tight text-[#252B68] sm:text-4xl">
                  {featuredStory.title}
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  {featuredStory.excerpt}
                </p>

                {/* STORY INFORMATION */}
                <div className="mt-7 grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Author
                    </p>
                    <p className="mt-1 font-semibold text-[#252B68]">
                      {featuredStory.author}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Class
                    </p>
                    <p className="mt-1 font-semibold text-[#252B68]">
                      {featuredStory.className}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Event Date
                    </p>
                    <p className="mt-1 font-semibold text-[#252B68]">
                      {featuredStory.eventDate}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Published
                    </p>
                    <p className="mt-1 font-semibold text-[#252B68]">
                      {featuredStory.publishedDate}
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    className="rounded-full bg-[#F58220] px-6 py-3 font-bold text-white transition hover:bg-[#d96e12]"
                  >
                    Read Full Story →
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* NEWS TICKER */}
      <section className="border-y border-slate-200 bg-[#FFE900]">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
          <span className="shrink-0 rounded-full bg-[#252B68] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
            Latest
          </span>

          <p className="truncate text-sm font-bold text-[#252B68] sm:text-base">
            Mount View Inter-House Quiz • Learning through STEAM • Creative
            learning • Digital learning • Sports and teamwork
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                index === 0
                  ? "bg-[#252B68] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#252B68] hover:text-[#252B68]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* MAIN NEWSROOM */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          {/* STORIES */}
          <div>
            <div className="mb-8">
              <p className="font-bold uppercase tracking-[0.18em] text-[#F58220]">
                School Stories
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-[#252B68]">
                Latest from Mount View
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Explore stories and moments from our learners, teachers,
                classrooms and wider school community.
              </p>
            </div>

            <div className="grid gap-7 md:grid-cols-2">
              {latestStories.map((story) => (
                <article
                  key={story.title}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-60 overflow-hidden">
                    <ImageWithFallback
                      src={story.image}
                      alt={story.title}
                      className="h-full w-full transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-6">
                    <span className="inline-flex rounded-full bg-[#FFE900]/70 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#252B68]">
                      {story.category}
                    </span>

                    <h3 className="mt-4 text-xl font-extrabold leading-tight text-[#252B68]">
                      {story.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {story.excerpt}
                    </p>

                    {/* AUTHOR / CLASS */}
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Author
                        </span>

                        <span className="text-right text-sm font-semibold text-slate-700">
                          {story.author}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Class
                        </span>

                        <span className="text-right text-sm font-semibold text-slate-700">
                          {story.className}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Event Date
                        </span>

                        <span className="text-right text-sm font-semibold text-slate-700">
                          {story.eventDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Published
                        </span>

                        <span className="text-right text-sm font-semibold text-slate-700">
                          {story.publishedDate}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-6 font-bold text-[#F58220] transition hover:text-[#252B68]"
                    >
                      Read Story →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-7">
            {/* QUICK UPDATES */}
            <div className="rounded-3xl bg-[#252B68] p-7 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FFE900]">
                Quick Updates
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                What's happening
              </h2>

              <div className="mt-6 divide-y divide-white/10">
                {quickUpdates.map((update) => (
                  <div
                    key={update.title}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#FFE900] text-center text-[#252B68]">
                      <span className="text-[10px] font-extrabold">
                        {update.date.split(" ")[1]}
                      </span>
                      <span className="text-xs font-extrabold">
                        {update.date.split(" ")[0]}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                        {update.category}
                      </p>

                      <h3 className="mt-1 text-sm font-bold leading-5">
                        {update.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONNECT */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F58220] text-xl text-white">
                +
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-[#252B68]">
                Have a school story?
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Learners, teachers and school teams can share meaningful
                learning experiences, activities and events with the wider
                Mount View community.
              </p>

              <Link
                href="/contact"
                className="mt-6 inline-flex rounded-full bg-[#252B68] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1c2055]"
              >
                Contact the School
              </Link>
            </div>

            {/* BRAND CARD */}
            <div className="rounded-3xl bg-[#FFE900] p-7">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#252B68]">
                Our Story
              </p>

              <p className="mt-4 text-xl font-extrabold leading-8 text-[#252B68]">
                “Fostering growth, excellence and empathy.”
              </p>

              <p className="mt-4 text-sm leading-7 text-[#252B68]/80">
                Every story is part of the journey our learners, teachers and
                families share at Mount View.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* WHAT WE SHARE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="font-bold uppercase tracking-[0.18em] text-[#F58220]">
              More Than News
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-[#252B68] sm:text-4xl">
              The moments that make up school life.
            </h2>

            <p className="mt-4 leading-8 text-slate-600">
              Our stories capture the experiences that happen beyond the
              timetable — from classroom discoveries to competitions, creative
              activities and community events.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {yearHighlights.map((item) => (
              <div
                key={item.number}
                className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100"
              >
                <span className="text-sm font-extrabold text-[#F58220]">
                  {item.number}
                </span>

                <h3 className="mt-4 text-xl font-extrabold text-[#252B68]">
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

      {/* YEAR IN STORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[2rem] bg-[#252B68] p-8 text-white sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[#F58220] px-4 py-2 text-xs font-extrabold uppercase tracking-wide">
                Our Year
              </span>

              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
                A year filled with learning, discovery and participation.
              </h2>

              <p className="mt-5 leading-8 text-blue-100">
                From everyday classroom experiences to special school events,
                every term creates opportunities for learners to discover,
                participate, create and grow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold text-[#FFE900]">
                  Learning
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Exploring ideas and developing new skills.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold text-[#FFE900]">
                  Creating
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Turning ideas into projects, performances and experiences.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold text-[#FFE900]">
                  Connecting
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Building friendships, teamwork and community.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold text-[#FFE900]">
                  Growing
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Developing confidence, character and independence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#F58220] px-7 py-12 text-white sm:px-10 lg:px-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="font-bold uppercase tracking-[0.18em] text-[#FFE900]">
                See the Moments
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Explore the Mount View Gallery.
              </h2>

              <p className="mt-4 leading-8 text-orange-50">
                See more moments from learning, creativity, sport and school
                life.
              </p>
            </div>

            <Link
              href="/gallery"
              className="inline-flex w-fit rounded-full bg-white px-7 py-3.5 font-extrabold text-[#252B68] transition hover:bg-[#FFE900]"
            >
              Visit the Gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* ADMISSIONS CTA */}
      <section className="bg-[#FFE900]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-[0.18em] text-[#F58220]">
                Discover Mount View
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-[#252B68] sm:text-4xl">
                Become part of our story.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-[#252B68]/80">
                Explore our learning environment and discover opportunities
                for your child at Mount View International Primary School &
                Early Years Centre.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admissions"
                className="rounded-full bg-[#252B68] px-6 py-3 font-bold text-white transition hover:bg-[#1c2055]"
              >
                Explore Admissions
              </Link>

              <Link
                href="/contact"
                className="rounded-full border-2 border-[#252B68] px-6 py-3 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL BRAND STATEMENT */}
      <section className="bg-[#171B4A] px-4 py-12 text-center text-white sm:px-6 lg:px-8">
        <p className="text-lg font-bold text-[#FFE900]">
          Mount View International Primary School & Early Years Centre
        </p>

        <p className="mt-2 text-sm text-blue-200">
          Fostering growth, excellence and empathy.
        </p>
      </section>
    </main>
  );
}