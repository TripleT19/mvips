"use client";

import NewsletterSubscribeForm from "./NewsletterSubscribeForm";
import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  { name: "About Us", href: "/about" },
  { name: "Academics", href: "/academics" },
  { name: "Admissions", href: "/admissions" },
  { name: "School Life", href: "/school-life" },
  { name: "News & Stories", href: "/news" },
  { name: "Newsletters", href: "/newsletters" },
  { name: "Gallery", href: "/gallery" },
];

const learningLinks = [
  { name: "Early Years", href: "/academics" },
  { name: "Primary Learning", href: "/academics" },
  { name: "ICT & Digital Learning", href: "/academics" },
  { name: "Learning Support", href: "/academics" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#171B4A] text-white">
      {/* ---------- shared animation styles ---------- */}
      <style>{`
        @keyframes ft-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes ft-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes ft-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes ft-pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes ft-logo-shine {
          from { transform: translateX(-120%) }
          to   { transform: translateX(220%)  }
        }

        .ft-float      { animation: ft-float 6s ease-in-out infinite }
        .ft-float-alt  { animation: ft-float-alt 7s ease-in-out infinite }
        .ft-blob       { animation: ft-blob 16s ease-in-out infinite }
        .ft-pop        { animation: ft-pop 3.5s ease-in-out infinite }

        .ft-logo-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          transform: translateX(-120%);
          pointer-events: none;
        }
        .group:hover .ft-logo-shine::after {
          animation: ft-logo-shine 1.1s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce){
          .ft-float,.ft-float-alt,.ft-blob,.ft-pop { animation: none }
          .group:hover .ft-logo-shine::after { animation: none }
        }
      `}</style>

      {/* =========================================================
          SUBSCRIBE BAND
      ========================================================== */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#252B68]">
        <div className="pointer-events-none absolute inset-0">
          <div className="ft-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="ft-blob absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#F58220]/20 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="ft-float pointer-events-none absolute left-[8%] top-10 text-4xl opacity-25">
          📨
        </span>
        <span className="ft-float-alt pointer-events-none absolute right-[8%] bottom-10 text-4xl opacity-25">
          📰
        </span>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900] backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Newsletter Subscription
              </p>

              <h3 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
                Get every newsletter in your inbox.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Subscribe once and receive each new edition the moment
                it&apos;s published. No spam — just school news, events and
                achievements.
              </p>
            </div>

            <div>
              <NewsletterSubscribeForm variant="dark" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN FOOTER
      ========================================================== */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          {/* SCHOOL BRAND */}
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-4 transition hover:opacity-95"
            >
              <div className="relative shrink-0 overflow-hidden rounded-2xl ft-logo-shine">
                <Image
                  src="/logo12.png"
                  alt="Mount View International Primary School logo"
                  width={75}
                  height={75}
                  className="h-16 w-16 object-contain transition duration-300 group-hover:scale-105"
                />
              </div>

              <div>
                <h2 className="font-extrabold leading-tight">
                  Mount View International
                  <br />
                  Primary School
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#FFE900]">
                  &amp; Early Years Centre
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md leading-7 text-blue-100">
              A learning community where children are encouraged to grow,
              discover, create and develop the confidence to take their next
              steps.
            </p>

            <div className="mt-7 border-l-4 border-[#F58220] pl-4">
              <p className="font-bold text-[#FFE900]">
                Fostering growth, excellence and empathy.
              </p>
            </div>

            <Link
              href="/newsletters"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#FFE900] transition hover:text-white"
            >
              Browse the newsletter archive
              <span className="inline-block transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              Explore
            </h3>

            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-blue-100 transition hover:text-white"
                  >
                    <span className="text-[#F58220] transition group-hover:translate-x-1">
                      →
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* LEARNING */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              Learning
            </h3>

            <ul className="mt-5 space-y-3">
              {learningLinks.map((link, index) => (
                <li key={`${link.name}-${index}`}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-blue-100 transition hover:text-white"
                  >
                    <span className="text-[#F58220] transition group-hover:translate-x-1">
                      →
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#FFE900]">
              <span className="h-2 w-2 rounded-full bg-[#F58220]" />
              Contact Us
            </h3>

            <div className="mt-5 space-y-4 text-sm">
              <a
                href="https://www.google.com/maps/place/Mount+View+International+Primary+School+and+Early+Years+Centre/@-15.7960625,35.0714375,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 text-blue-100 transition hover:text-white"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  📍
                </span>
                <span>
                  Mount View International Primary School &amp; Early Years
                  Centre
                  <br />
                  Blantyre, Malawi
                </span>
              </a>

              <a
                href="tel:+265997355319"
                className="group flex items-center gap-3 text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  📞
                </span>
                <span>0997 355 319</span>
              </a>

              <a
                href="mailto:info@mountviewmw.com"
                className="group flex items-start gap-3 break-all text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  ✉️
                </span>
                <span>info@mountviewmw.com</span>
              </a>
            </div>

            <Link
              href="/contact"
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F58220]/20 transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-lg"
            >
              Get in Touch
              <span className="inline-block transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================
          PARENT PORTAL CTA
      ========================================================== */}
      <div className="relative overflow-hidden border-t border-white/10 bg-[#1f2458]">
        <div className="pointer-events-none absolute inset-0">
          <div className="ft-blob absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#FFE900]/10 blur-3xl" />
          <div className="ft-blob absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-5s]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-[#FFE900]">
                Already a Mount View parent?
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-blue-200">
                Sign in to the Parent Portal to view your child&apos;s term
                results, attendance and observations.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/parent/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F58220]/20 transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-lg"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Parent Login
              </Link>

              <Link
                href="/parent/forgot-password"
                className="inline-flex items-center rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Forgot Password
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          YELLOW BRAND STRIP
      ========================================================== */}
      <div className="relative overflow-hidden bg-[#FFE900]">
        <span className="ft-float pointer-events-none absolute left-[10%] top-1/2 -translate-y-1/2 text-2xl opacity-30">
          ✨
        </span>
        <span className="ft-float-alt pointer-events-none absolute right-[10%] top-1/2 -translate-y-1/2 text-2xl opacity-30">
          💛
        </span>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="text-sm font-bold text-[#252B68]">
            Fostering growth, excellence and empathy.
          </p>

          <Link
            href="/admissions"
            className="group text-sm font-bold text-[#252B68] underline decoration-2 underline-offset-4 transition hover:text-[#F58220]"
          >
            Begin your Mount View journey
            <span className="ml-1 inline-block transition group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* =========================================================
          COPYRIGHT
      ========================================================== */}
      <div className="border-t border-white/10 bg-[#171B4A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-blue-200 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Mount View International Primary
            School &amp; Early Years Centre. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/about"
              className="transition hover:text-white"
            >
              About
            </Link>

            <Link
              href="/admissions"
              className="transition hover:text-white"
            >
              Admissions
            </Link>

            <Link
              href="/newsletters"
              className="transition hover:text-white"
            >
              Newsletters
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </Link>

            <Link
              href="/parent/login"
              className="font-semibold text-[#FFE900] transition hover:text-white"
            >
              Parent Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}