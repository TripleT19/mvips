"use client";

import NewsletterSubscribeForm from "./NewsletterSubscribeForm";
import Image from "next/image";
import Link from "next/link";

/* ───────────────────────── Navigation data ───────────────────────── */

const exploreLinks = [
  { name: "About Us", href: "/about#overview" },
  { name: "Academics", href: "/academics#our-curriculum" },
  { name: "Admissions", href: "/admissions" },
  { name: "School Life", href: "/school-life" },
  { name: "Top Achievers", href: "/top-achievers" },
  { name: "News & Stories", href: "/news" },
  { name: "Newsletters", href: "/newsletters" },
  { name: "Policies", href: "/policies" },
  { name: "Gallery", href: "/gallery" },
];

const learningLinks = [
  { name: "Early Years", href: "/academics#early-years" },
  { name: "Primary Learning", href: "/academics#primary" },
  { name: "ICT & Digital Learning", href: "/academics#other-subjects" },
  { name: "Learning Support", href: "/academics#learning-support" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/mountviewprimary/",
    label: "Follow us on Facebook",
    bg: "#1877F2",
    hoverBg: "#0f5cc0",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.25 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.77l-.44 2.91h-2.33V22C18.34 21.25 22 17.08 22 12.06z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/mountviewprimary/",
    label: "Follow us on Instagram",
    bg: "#E4405F",
    hoverBg: "#b8334d",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38a5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zM19.85 5.6a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/MountViewInt",
    label: "Follow us on X",
    bg: "#000000",
    hoverBg: "#1a1a1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://mw.linkedin.com/company/mountviewprimary",
    label: "Follow us on LinkedIn",
    bg: "#0A66C2",
    hoverBg: "#084d93",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@mountviewinternational3707",
    label: "Subscribe on YouTube",
    bg: "#FF0000",
    hoverBg: "#cc0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@mountviewinternational",
    label: "Follow us on TikTok",
    bg: "#000000",
    hoverBg: "#1a1a1a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.7a8.16 8.16 0 0 0 4.77 1.52V6.77a4.85 4.85 0 0 1-1.84-.08z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/265997355319",
    label: "Chat with us on WhatsApp",
    bg: "#25D366",
    hoverBg: "#128c4a",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.57-.89-2.15-.23-.56-.47-.48-.65-.49-.17-.01-.37-.01-.56-.01-.2 0-.51.07-.78.37-.27.3-1.03 1.01-1.03 2.46 0 1.45 1.06 2.85 1.2 3.05.15.2 2.08 3.17 5.04 4.45.7.3 1.25.49 1.68.62.7.22 1.35.19 1.86.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.01 2c-5.51 0-9.99 4.48-9.99 9.99 0 1.76.46 3.42 1.27 4.86L2 22l5.31-1.39a9.94 9.94 0 0 0 4.7 1.19h.01c5.51 0 9.99-4.48 9.99-9.99S17.52 2 12.01 2zm0 18.13h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.21 8.21 0 0 1-1.26-4.39c0-4.55 3.71-8.25 8.26-8.25 2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.84c0 4.55-3.7 8.25-8.25 8.25z" />
      </svg>
    ),
  },
];

const BRAND_VALUES = [
  "Integrity",
  "Inclusion",
  "Responsibility",
  "Respect",
  "Collaboration",
  "Well-being",
  "Confidence",
  "Empathy",
];

/* ───────────────────────── Component ───────────────────────── */

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#171B4A] text-white">
      {/* ---------- shared animation styles ---------- */}
      <style>{`
        @keyframes ft-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes ft-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes ft-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes ft-logo-shine {
          from { transform: translateX(-120%) }
          to   { transform: translateX(220%) }
        }

        .ft-float      { animation: ft-float 6s ease-in-out infinite }
        .ft-float-alt  { animation: ft-float-alt 7s ease-in-out infinite }
        .ft-blob       { animation: ft-blob 16s ease-in-out infinite }

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
          .ft-float,.ft-float-alt,.ft-blob { animation: none }
          .group:hover .ft-logo-shine::after { animation: none }
        }
      `}</style>

      {/* ───────────────────────────────
          NEWSLETTER BAND
      ─────────────────────────────── */}
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

      {/* ───────────────────────────────
          MAIN FOOTER
      ─────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">

          {/* SCHOOL BRAND */}
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-4 transition hover:opacity-95"
            >
              <div className="relative shrink-0 overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-white/20 ft-logo-shine">
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

            {/* VALUES — chips */}
            <div className="mt-6 flex flex-wrap gap-1.5">
              {BRAND_VALUES.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[#FFE900] transition hover:-translate-y-0.5 hover:border-[#FFE900]/50 hover:bg-white/10"
                >
                  {value}
                </span>
              ))}
            </div>

            {/* SOCIAL + ARCHIVE — icons left, archive right */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-white/25"
                    style={{ backgroundColor: social.bg }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        social.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        social.bg;
                    }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              <Link
                href="/newsletters"
                className="group inline-flex items-center gap-1.5 rounded-full border border-[#FFE900]/25 bg-[#FFE900]/[0.06] px-3.5 py-1.5 text-[12px] font-bold text-[#FFE900] transition duration-300 hover:-translate-y-0.5 hover:border-[#FFE900]/50 hover:bg-[#FFE900]/[0.12] hover:text-white"
              >
                Browse the newsletter archive
                <span className="inline-block transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
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
              {/* Address */}
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

              {/* Phone */}
              <a
                href="tel:+265997355319"
                className="group flex items-center gap-3 text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  📞
                </span>
                <span>0997 355 319</span>
              </a>

              {/* General enquiries */}
              <a
                href="mailto:info@mountviewmw.com"
                className="group flex items-start gap-3 break-all text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  ✉️
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200/80">
                    General enquiries
                  </span>
                  info@mountviewmw.com
                </span>
              </a>

              {/* Headteacher */}
              <a
                href="mailto:headteacher@mountviewmw.com"
                className="group flex items-start gap-3 break-all text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  🎓
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200/80">
                    Headteacher
                  </span>
                  headteacher@mountviewmw.com
                </span>
              </a>

              {/* Admissions */}
              <a
                href="mailto:admissions@mountviewmw.com"
                className="group flex items-start gap-3 break-all text-blue-100 transition hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base transition group-hover:bg-white/10">
                  📝
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200/80">
                    Admissions
                  </span>
                  admissions@mountviewmw.com
                </span>
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

      {/* ───────────────────────────────
          CENTRAL HIGH SCHOOL
      ─────────────────────────────── */}
      <div className="relative overflow-hidden border-t border-white/10 bg-[#20265E]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
              The next step in education
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-white">
              Continue the journey at Central High School
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-100">
              After completing primary education at Mount View, discover
              the opportunities available at our secondary school.
            </p>
          </div>

          <a
            href="https://centralhighmw.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full border border-[#FFE900]/60 bg-[#FFE900] px-6 py-3 text-sm font-black text-[#252B68] shadow-lg transition hover:-translate-y-1 hover:bg-white"
          >
            Visit Central High
            <span className="inline-block transition group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>

      {/* ───────────────────────────────
          PARENT PORTAL CTA
      ─────────────────────────────── */}
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

      {/* ───────────────────────────────
          COPYRIGHT
      ─────────────────────────────── */}
      <div className="border-t border-white/10 bg-[#171B4A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-blue-200 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Mount View International Primary
            School &amp; Early Years Centre. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>

            <Link href="/admissions" className="transition hover:text-white">
              Admissions
            </Link>

            <Link href="/top-achievers" className="transition hover:text-white">
              Top Achievers
            </Link>

            <Link href="/newsletters" className="transition hover:text-white">
              Newsletters
            </Link>

            <Link href="/policies" className="transition hover:text-white">
              Policies
            </Link>

            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>

            <Link
              href="/parent/login"
              className="font-semibold text-[#FFE900] transition hover:text-white"
            >
              Parent Login
            </Link>

            <a
              href="https://centralhighmw.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#FFE900] transition hover:text-white"
            >
              Central High School
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}