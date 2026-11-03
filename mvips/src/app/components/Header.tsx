"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
| Navigation config
------------------------------------------------------------------ */

type NavLink = { type: "link"; name: string; href: string };

type NavGroup = {
  type: "group";
  name: string;
  matchPrefixes: string[];
  items: { name: string; href: string; description?: string }[];
};

type NavItem = NavLink | NavGroup;

const navigation: NavItem[] = [
  { type: "link", name: "Home", href: "/" },
  {
    type: "group",
    name: "About",
    matchPrefixes: ["/about", "/alumni"],
    items: [
      {
        name: "School Overview",
        href: "/about#overview",
        description: "Who we are and what we stand for",
      },
      {
        name: "Mission & Vision",
        href: "/about#mission-vision",
        description: "The purpose that guides our school",
      },
      {
        name: "Founder",
        href: "/about#founder",
        description: "The vision that started it all in 1975",
      },
      {
        name: "Governance & Board",
        href: "/about#board",
        description: "Board members and our chairman",
      },
      {
        name: "School Leadership",
        href: "/about#principal",
        description: "Principal and administration",
      },
      {
        name: "Academic Team",
        href: "/about#lead-teachers",
        description: "Curriculum leads, coordinators and class teachers",
      },
      {
        name: "Celebrating Our People",
        href: "/about#celebrating",
        description: "10+ years of dedicated service",
      },
      {
        name: "Alumni",
        href: "/alumni",
        description: "Reconnect with the Mount View community",
      },
    ],
  },
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
  const [scrolled, setScrolled] = useState(false);

  /* Track scroll for compact header state */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Auto-close drawer on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Body scroll lock + Escape close while drawer is open */
  useEffect(() => {
    if (!menuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      {/* ----------------------------------------------------------------
          Local animation styles — no extra CSS file needed
      ---------------------------------------------------------------- */}
      <style>{`
        @keyframes hdr-fade-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
        }
        @keyframes hdr-drawer-in {
          from { transform: translateX(100%) }
          to   { transform: translateX(0)    }
        }
        @keyframes hdr-backdrop-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes hdr-dot-pulse {
          0%,100% { opacity: 1;   transform: scale(1)   }
          50%     { opacity: 0.5; transform: scale(1.4) }
        }
        @keyframes hdr-logo-shine {
          from { transform: translateX(-120%) }
          to   { transform: translateX(220%)  }
        }

        .hdr-fade-in      { animation: hdr-fade-in 0.18s ease-out }
        .hdr-drawer-in    { animation: hdr-drawer-in 0.28s cubic-bezier(0.22,0.9,0.32,1) }
        .hdr-backdrop-in  { animation: hdr-backdrop-in 0.2s ease-out }
        .hdr-dot-pulse    { animation: hdr-dot-pulse 2s ease-in-out infinite }

        .hdr-logo-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.75) 50%, transparent 70%);
          transform: translateX(-120%);
          pointer-events: none;
        }
        .group:hover .hdr-logo-shine::after {
          animation: hdr-logo-shine 1.1s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .hdr-fade-in,
          .hdr-drawer-in,
          .hdr-backdrop-in,
          .hdr-dot-pulse { animation: none }
          .group:hover .hdr-logo-shine::after { animation: none }
        }
      `}</style>

      {/* ================================================================
          TOP BAR
      ================================================================ */}
      <div className="relative overflow-hidden bg-[#171B4A] text-white">
        {/* soft glow accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#F58220]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2.5 text-xs sm:justify-between sm:px-6 sm:text-sm lg:px-8">
          <p className="flex items-center gap-2 font-medium text-white/90">
            <span className="hdr-dot-pulse h-1.5 w-1.5 rounded-full bg-[#FFE900]" />
            Welcome to Mount View International Primary School &amp; Early
            Years Centre
          </p>

          <div className="hidden items-center gap-4 text-xs font-semibold text-blue-100 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Lilongwe, Malawi
            </span>

            <span className="h-1 w-1 rounded-full bg-[#FFE900]" />

            <a
              href="tel:+2651750100"
              className="inline-flex items-center gap-1.5 transition hover:text-[#FFE900]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +265 1 750 100
            </a>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN HEADER
      ================================================================ */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200 bg-white/98 shadow-lg backdrop-blur-xl"
            : "border-slate-100 bg-white/95 shadow-sm backdrop-blur-md"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          {/* LOGO + NAME */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center gap-3"
          >
            <div className="relative shrink-0 overflow-hidden rounded-2xl hdr-logo-shine">
              <Image
                src="/logo12.png"
                alt="Mount View International Primary School logo"
                width={75}
                height={75}
                priority
                className={`object-contain transition-all duration-300 group-hover:scale-105 ${
                  scrolled ? "h-12 w-12" : "h-16 w-16"
                }`}
              />
            </div>

            <div
              className={`max-w-[260px] transition-all duration-300 ${
                scrolled ? "hidden sm:block" : ""
              }`}
            >
              <h1 className="text-sm font-extrabold uppercase leading-tight tracking-tight text-[#252B68] sm:text-base">
                Mount View International
                <br />
                Primary School
              </h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F58220] sm:text-xs">
                &amp; Early Years Centre
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {navigation.map((item) =>
              item.type === "link" ? (
                <DesktopLink
                  key={item.name}
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

            <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden="true" />

            <Link
              href="/parent/login"
              aria-current={pathname === "/parent/login" ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#252B68] px-4 py-2 text-sm font-bold transition-all duration-200 ${
                pathname === "/parent/login"
                  ? "bg-[#252B68] text-white shadow-md"
                  : "text-[#252B68] hover:-translate-y-0.5 hover:bg-[#252B68] hover:text-white hover:shadow-md"
              }`}
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
              href="/contact"
              aria-current={pathname === "/contact" ? "page" : undefined}
              className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                pathname === "/contact"
                  ? "bg-[#252B68] text-white shadow-md"
                  : "bg-[#F58220] text-white shadow-md shadow-[#F58220]/20 hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-lg"
              }`}
            >
              Contact Us
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>

          {/* MOBILE TRIGGER */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#252B68] text-[#252B68] transition hover:bg-[#252B68] hover:text-white lg:hidden"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
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
                aria-hidden="true"
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
                aria-hidden="true"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ================================================================
          MOBILE DRAWER
      ================================================================ */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="hdr-backdrop-in fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="hdr-drawer-in fixed bottom-0 right-0 top-0 z-50 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl lg:hidden"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <Image
                  src="/logo12.png"
                  alt="Mount View logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <p className="text-[11px] font-black uppercase leading-tight text-[#252B68]">
                    Mount View
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#F58220]">
                    Primary School
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-[#252B68] hover:text-white"
                aria-label="Close navigation menu"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {navigation.map((item) =>
                  item.type === "link" ? (
                    <MobileLink
                      key={item.name}
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
              </div>
            </div>

            {/* CTAs pinned at bottom */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
              <Link
                href="/parent/login"
                aria-current={pathname === "/parent/login" ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`mb-2 flex items-center justify-center gap-2 rounded-xl border-2 border-[#252B68] px-5 py-3 font-bold transition ${
                  pathname === "/parent/login"
                    ? "bg-[#252B68] text-white"
                    : "text-[#252B68] hover:bg-[#252B68]/5"
                }`}
              >
                <svg
                  width="16"
                  height="16"
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
                href="/contact"
                aria-current={pathname === "/contact" ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-5 py-3 text-center font-bold transition ${
                  pathname === "/contact"
                    ? "bg-[#252B68] text-white"
                    : "bg-[#F58220] text-white hover:bg-[#d96e12]"
                }`}
              >
                Contact Us
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------
| Helpers
------------------------------------------------------------------ */

function splitHref(href: string) {
  const [path, hash = ""] = href.split("#");
  return { path, hash };
}

function isLinkActive(pathname: string, href: string) {
  const { path, hash } = splitHref(href);
  if (hash) return pathname === path;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isNavItemActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return isLinkActive(pathname, href);
}

function isGroupActive(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/* ------------------------------------------------------------------
| Desktop components
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
  const isWide = group.items.length > 4;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
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
          className={`hdr-fade-in absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
            isWide ? "left-0 w-[640px]" : "left-1/2 w-96 -translate-x-1/2"
          }`}
        >
          {/* Brand accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#252B68] via-[#F58220] to-[#FFE900]" />

          <div
            className={
              isWide ? "grid grid-cols-2 gap-1 p-2" : "px-2 py-2"
            }
          >
            {group.items.map((item) => {
              const itemActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                    itemActive ? "bg-[#252B68]/5" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition ${
                      itemActive
                        ? "bg-[#F58220] shadow-[0_0_0_3px_rgba(245,130,32,0.15)]"
                        : "bg-slate-300 group-hover:bg-[#252B68]"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-black ${
                        itemActive
                          ? "text-[#252B68]"
                          : "text-slate-700 group-hover:text-[#252B68]"
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

                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1.5 shrink-0 -translate-x-1 text-slate-300 opacity-0 transition group-hover:translate-x-0 group-hover:text-[#F58220] group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
| Mobile components
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
            const itemActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.name}
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