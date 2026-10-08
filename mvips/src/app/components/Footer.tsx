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
    <footer className="bg-[#171B4A] text-white">
      {/* =========================================================
          SUBSCRIBE BAND
      ========================================================== */}
      <div className="border-b border-white/10 bg-[#252B68]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                Newsletter Subscription
              </p>

              <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
                Get every newsletter in your inbox.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Subscribe once and receive each new edition the moment it&apos;s
                published. No spam — just school news, events and achievements.
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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          {/* SCHOOL BRAND */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-4 transition hover:opacity-90"
            >
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School logo"
                width={75}
                height={75}
                className="h-16 w-16 object-contain"
              />

              <div>
                <h2 className="font-extrabold leading-tight">
                  Mount View International
                  <br />
                  Primary School
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#FFE900]">
                  & Early Years Centre
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md leading-7 text-blue-100">
              A learning community where children are encouraged to grow,
              discover, create and develop the confidence to take their next
              steps.
            </p>

            {/* BRAND TAGLINE */}
            <div className="mt-7 border-l-4 border-[#F58220] pl-4">
              <p className="font-bold text-[#FFE900]">
                Fostering growth, excellence and empathy.
              </p>
            </div>

            {/* QUICK SUBSCRIBE SHORTCUT */}
            <Link
              href="/newsletters"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#FFE900] transition hover:text-white"
            >
              Browse the newsletter archive
              <span>→</span>
            </Link>
          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="text-lg font-bold text-[#FFE900]">Explore</h3>

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
            <h3 className="text-lg font-bold text-[#FFE900]">Learning</h3>

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
            <h3 className="text-lg font-bold text-[#FFE900]">Contact Us</h3>

            <div className="mt-5 space-y-4 text-sm">
              {/* LOCATION */}
              <a
                href="https://www.google.com/maps/place/Mount+View+International+Primary+School+and+Early+Years+Centre/@-15.7960625,35.0714375,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-blue-100 transition hover:text-white"
              >
                <span className="mt-0.5 text-lg">📍</span>

                <span>
                  Mount View International Primary School & Early Years
                  Centre
                  <br />
                  Blantyre, Malawi
                </span>
              </a>

              {/* PHONE */}
              <a
                href="tel:+265881668001"
                className="flex items-center gap-3 text-blue-100 transition hover:text-white"
              >
                <span className="text-lg">📞</span>
                <span>0881 668 001</span>
              </a>

              {/* EMAIL */}
              <a
                href="mailto:info@mountviewmw.com"
                className="flex items-start gap-3 break-all text-blue-100 transition hover:text-white"
              >
                <span className="text-lg">✉️</span>
                <span>info@mountviewmw.com</span>
              </a>
            </div>

            <Link
              href="/contact"
              className="mt-7 inline-flex rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#d96e12] hover:shadow-lg"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================
          YELLOW BRAND STRIP
      ========================================================== */}
      <div className="bg-[#FFE900]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="text-sm font-bold text-[#252B68]">
            Fostering growth, excellence and empathy.
          </p>

          <Link
            href="/admissions"
            className="text-sm font-bold text-[#252B68] underline decoration-2 underline-offset-4 transition hover:text-[#F58220]"
          >
            Begin your Mount View journey →
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
            School & Early Years Centre. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>

            <Link
              href="/admissions"
              className="transition hover:text-white"
            >
              Admissions
            </Link>

            <Link href="/newsletters" className="transition hover:text-white">
              Newsletters
            </Link>

            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}