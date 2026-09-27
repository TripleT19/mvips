"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Academics", href: "/academics" },
  { name: "Admissions", href: "/admissions" },
  { name: "School Life", href: "/school-life" },
  { name: "News", href: "/news" },
  { name: "Gallery", href: "/gallery" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-[#252B68] px-4 py-2.5 text-center text-sm text-white">
        <p className="font-medium">
          Welcome to Mount View International Primary School & Early Years
          Centre
        </p>
      </div>

      {/* MAIN HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* LOGO + SCHOOL NAME */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center gap-3"
          >
            <div className="relative shrink-0">
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School logo"
                width={75}
                height={75}
                priority
                className="h-16 w-16 object-contain transition duration-300 group-hover:scale-105"
              />
            </div>

            <div className="max-w-[260px]">
              <h1 className="text-sm font-extrabold uppercase leading-tight text-[#252B68] sm:text-base">
                Mount View International
                <br />
                Primary School
              </h1>

              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F58220] sm:text-xs">
                & Early Years Centre
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#252B68] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#252B68]/5 hover:text-[#252B68]"
                  }`}
                >
                  {item.name}

                  {/* Active indicator */}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FFE900]" />
                  )}
                </Link>
              );
            })}

            {/* CONTACT BUTTON */}
            <Link
              href="/contact"
              aria-current={pathname === "/contact" ? "page" : undefined}
              className={`ml-3 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                pathname === "/contact"
                  ? "bg-[#252B68] text-white shadow-md"
                  : "bg-[#F58220] text-white hover:bg-[#d96e12] hover:shadow-md"
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#252B68] text-[#252B68] transition hover:bg-[#252B68] hover:text-white lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
            <nav
              className="mx-auto max-w-7xl px-4 py-4 sm:px-6"
              aria-label="Mobile navigation"
            >
              <div className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3.5 font-semibold transition ${
                        active
                          ? "bg-[#252B68] text-white"
                          : "text-slate-700 hover:bg-[#252B68]/5 hover:text-[#252B68]"
                      }`}
                    >
                      <span>{item.name}</span>

                      {active && (
                        <span className="h-2 w-2 rounded-full bg-[#FFE900]" />
                      )}
                    </Link>
                  );
                })}

                <Link
                  href="/contact"
                  aria-current={pathname === "/contact" ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`mt-3 block rounded-xl px-5 py-3.5 text-center font-bold transition ${
                    pathname === "/contact"
                      ? "bg-[#252B68] text-white"
                      : "bg-[#F58220] text-white hover:bg-[#d96e12]"
                  }`}
                >
                  Contact Us
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}