"use client";

import {
  ChevronRight, GraduationCap, Home, Loader2, LogOut, Settings, UserCircle, X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

type Child = {
  id: number;
  slug: string;
  full_name: string;
  student_number: string;
  class_name?: string | null;
  stream_name?: string | null;
};

type ParentSidebarProps = {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
};

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getInitials(name?: string) {
  if (!name) return "P";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/parent") return pathname === "/parent";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ParentSidebar({
  mobileOpen = false,
  setMobileOpen,
}: ParentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/parent/children`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/parent/login");
          return;
        }
        const data = await res.json();
        if (!cancelled && res.ok) {
          setChildren(data.data ?? []);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const closeMobileSidebar = () => setMobileOpen?.(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch(`${API_URL}/api/admin/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
      }
    } catch {
      /* local logout still runs */
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("admin_user");
      localStorage.removeItem("parent_token");
      localStorage.removeItem("parent_user");
      router.replace("/parent/login");
    }
  }

  const renderChildLink = (child: Child) => {
    const href = `/parent/children/${child.slug}`;
    const active = isActive(pathname, href);

    return (
      <Link
        key={child.id}
        href={href}
        onClick={closeMobileSidebar}
        className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all ${
          active
            ? "bg-white text-[#252B68] shadow-sm"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#FFE900]" />
        )}
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
            active
              ? "bg-[#252B68] text-[#FFE900]"
              : "bg-white/5 text-white/70"
          }`}
        >
          <UserCircle size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{child.full_name}</p>
          <p className={`truncate text-[10px] ${active ? "text-slate-500" : "text-white/40"}`}>
            {child.class_name ?? ""}{child.stream_name ? ` · ${child.stream_name}` : ""}
          </p>
        </div>
        {active && <ChevronRight size={12} className="shrink-0" />}
      </Link>
    );
  };

  const sidebarBody = (mobile = false) => (
    <div className="flex min-h-full flex-col">
      <div className="px-4 pb-4 pt-4">
        <Link
          href="/parent"
          onClick={mobile ? closeMobileSidebar : undefined}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <Image
              src="/logo.jpg"
              alt="Mount View"
              fill
              sizes="44px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold leading-4 text-white">
              Mount View
            </p>
            <p className="truncate text-[10px] font-medium leading-4 text-white/55">
              International Primary School
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#FFE900]">
              Parent Portal
            </p>
          </div>
        </Link>
      </div>

      <div className="mx-4 border-t border-white/10" />

      <div className="flex-1 px-3 pt-4">
        <Link
          href="/parent"
          onClick={mobile ? closeMobileSidebar : undefined}
          className={`group relative flex h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-all ${
            pathname === "/parent"
              ? "bg-white text-[#252B68] shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          }`}
        >
          {pathname === "/parent" && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#FFE900]" />
          )}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              pathname === "/parent"
                ? "bg-[#252B68] text-[#FFE900]"
                : "bg-white/5 text-white/70"
            }`}
          >
            <Home size={17} />
          </span>
          <span className="flex-1">Dashboard</span>
        </Link>

        <div className="mt-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            {children.length > 0
              ? `My Children (${children.length})`
              : "My Children"}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-white/40" />
            </div>
          ) : children.length === 0 ? (
            <p className="px-3 text-[11px] leading-relaxed text-white/50">
              No children linked to your account yet.
            </p>
          ) : (
            <nav className="space-y-1">
              {children.map(renderChildLink)}
            </nav>
          )}
        </div>

        <div className="mt-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Account
          </p>
          <Link
            href="/parent/profile"
            onClick={mobile ? closeMobileSidebar : undefined}
            className={`group relative flex h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-all ${
              isActive(pathname, "/parent/profile")
                ? "bg-white text-[#252B68] shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isActive(pathname, "/parent/profile")
                  ? "bg-[#252B68] text-[#FFE900]"
                  : "bg-white/5 text-white/70"
              }`}
            >
              <Settings size={17} />
            </span>
            <span className="flex-1">Profile</span>
          </Link>
        </div>
      </div>

      <div className="px-3 pb-3 pt-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFE900]/10 text-[#FFE900]">
              <GraduationCap size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white">School Website</p>
              <p className="truncate text-[9px] text-white/40">Public website</p>
            </div>
            <Link
              href="/"
              target="_blank"
              aria-label="Open school website"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFE900] text-xs font-extrabold text-[#252B68]">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">
              {user?.name || "Parent"}
            </p>
            <p className="truncate text-[9px] text-white/40">
              {user?.email || "Parent account"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-2.5 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-[10px] font-bold text-white/55 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut size={13} />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-[#171B4A] lg:block">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#252B68] via-[#171B4A] to-[#101335]" />
        <div className="relative h-full overflow-y-auto overscroll-contain">
          {sidebarBody(false)}
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#171B4A] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#252B68] via-[#171B4A] to-[#101335]" />
        <div className="relative h-full overflow-y-auto overscroll-contain">
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/15"
          >
            <X size={17} />
          </button>
          {sidebarBody(true)}
        </div>
      </aside>
    </>
  );
}