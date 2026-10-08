"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
| Navigation config
------------------------------------------------------------------ */

type NavLink = {
  type: "link";
  name: string;
  href: string;
};

type NavGroup = {
  type: "group";
  name: string;
  /** All hrefs that should mark this group as "active" */
  matchPrefixes: string[];
  items: { name: string; href: string; description?: string }[];
};

type NavItem = NavLink | NavGroup;

const navigation: NavItem[] = [
  { type: "link", name: "Home", href: "/" },
  { type: "link", name: "About", href: "/about" },
  { type: "link", name: "Academics", href: "/academics" },
  { type: "link", name: "Admissions", href: "/admissions" },
  { type: "link", name: "School Life", href: "/school-life" },
  {
    type: "group",
    name: "News & Media",
    matchPrefixes: ["/news", "/newsletters"],
    items: [
      {
        name: "News & Stories",
        href: "/news",
        description: "Latest updates from our school community",
      },
      {
        name: "Newsletters",
        href: "/newsletters",
        description: "Download past editions as PDF",
      },
    ],
  },
  { type: "link", name: "Gallery", href: "/gallery" },
];

/* ------------------------------------------------------------------
| Header
------------------------------------------------------------------ */

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
            {navigation.map((item) =>
              item.type === "link" ? (
                <DesktopLink
                  key={item.href}
                  href={item.href}
                  name={item.name}
                  active={isLinkActive(pathname, item.href)}
                />
              ) : (
                <DesktopDropdown
                  key={item.name}
                  group={item}
                  pathname={pathname}
                />
              )
            )}

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
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
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
                {navigation.map((item) =>
                  item.type === "link" ? (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      name={item.name}
                      active={isLinkActive(pathname, item.href)}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  ) : (
                    <MobileGroup
                      key={item.name}
                      group={item}
                      pathname={pathname}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  )
                )}

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

/* ------------------------------------------------------------------
| Helpers
------------------------------------------------------------------ */

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/* ------------------------------------------------------------------
| Desktop
------------------------------------------------------------------ */

function DesktopLink({
  href,
  name,
  active,
}: {
  href: string;
  name: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-[#252B68] text-white shadow-sm"
          : "text-slate-600 hover:bg-[#252B68]/5 hover:text-[#252B68]"
      }`}
    >
      {name}

      {active && (
        <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FFE900]" />
      )}
    </Link>
  );
}

function DesktopDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const active = isGroupActive(pathname, group.matchPrefixes);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Close when route changes */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
          active || open
            ? "bg-[#252B68] text-white shadow-sm"
            : "text-slate-600 hover:bg-[#252B68]/5 hover:text-[#252B68]"
        }`}
      >
        {group.name}

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>

        {active && (
          <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FFE900]" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl"
        >
          {group.items.map((item) => {
            const itemActive = isLinkActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`group flex items-start gap-3 px-4 py-3 transition ${
                  itemActive
                    ? "bg-[#252B68]/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    itemActive ? "bg-[#F58220]" : "bg-slate-300"
                  }`}
                />

                <div className="min-w-0">
                  <p
                    className={`text-sm font-black ${
                      itemActive ? "text-[#252B68]" : "text-slate-700"
                    }`}
                  >
                    {item.name}
                  </p>

                  {item.description && (
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
| Mobile
------------------------------------------------------------------ */

function MobileLink({
  href,
  name,
  active,
  onNavigate,
}: {
  href: string;
  name: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`flex items-center justify-between rounded-xl px-4 py-3.5 font-semibold transition ${
        active
          ? "bg-[#252B68] text-white"
          : "text-slate-700 hover:bg-[#252B68]/5 hover:text-[#252B68]"
      }`}
    >
      <span>{name}</span>

      {active && <span className="h-2 w-2 rounded-full bg-[#FFE900]" />}
    </Link>
  );
}

function MobileGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isGroupActive(pathname, group.matchPrefixes);
  const [open, setOpen] = useState(active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 font-semibold transition ${
          active
            ? "bg-[#252B68] text-white"
            : "text-slate-700 hover:bg-[#252B68]/5 hover:text-[#252B68]"
        }`}
      >
        <span>{group.name}</span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 space-y-1 pl-3">
          {group.items.map((item) => {
            const itemActive = isLinkActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  itemActive
                    ? "bg-[#252B68]/10 text-[#252B68]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#252B68]"
                }`}
              >
                <span>{item.name}</span>

                {itemActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F58220]" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}