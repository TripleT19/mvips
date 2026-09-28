"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GalleryHorizontalEnd,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AdminUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
};

type AdminSidebarProps = {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
};

const mainNavigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Stories & News",
    href: "/admin/stories",
    icon: BookOpen,
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    label: "Gallery",
    href: "/admin/gallery",
    icon: GalleryHorizontalEnd,
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: Images,
  },
];

const administrationNavigation = [
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function getInitials(name?: string) {
  if (!name) return "MV";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AdminSidebar({
  mobileOpen = false,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("admin_user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const isAdministrator =
    user?.role === "administrator" ||
    user?.role === "admin";

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileSidebar = () => {
    setMobileOpen?.(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const token = localStorage.getItem("admin_token");

      if (token && API_URL) {
        await fetch(`${API_URL}/api/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }
    } catch {
      // Local logout still happens if the API request fails.
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");

      router.replace("/admin/login");
    }
  };

  const renderNavigationItem = (
    item: {
      label: string;
      href: string;
      icon: React.ElementType;
      adminOnly?: boolean;
    },
    mobile = false
  ) => {
    if (item.adminOnly && !isAdministrator) {
      return null;
    }

    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={mobile ? closeMobileSidebar : undefined}
        className={`group relative flex h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-all ${
          active
            ? "bg-white text-[#252B68] shadow-sm"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#FFE900]" />
        )}

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            active
              ? "bg-[#252B68] text-[#FFE900]"
              : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white"
          }`}
        >
          <Icon size={17} strokeWidth={2} />
        </span>

        <span className="flex-1 truncate">
          {item.label}
        </span>

        {active && (
          <ChevronRight
            size={14}
            className="shrink-0 text-[#252B68]"
          />
        )}
      </Link>
    );
  };

  const sidebarContent = (mobile = false) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-4 pb-4 pt-4">
        <Link
          href="/admin"
          onClick={mobile ? closeMobileSidebar : undefined}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <Image
              src="/logo.jpg"
              alt="Mount View International Primary School"
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
              Administration
            </p>
          </div>
        </Link>
      </div>

      <div className="mx-4 border-t border-white/10" />

      {/* Main navigation */}
      <div className="px-3 pt-4">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
          Main menu
        </p>

        <nav className="space-y-1">
          {mainNavigation.map((item) =>
            renderNavigationItem(item, mobile)
          )}
        </nav>
      </div>

      {/* Administration */}
      <div className="px-3 pt-5">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
          Administration
        </p>

        <nav className="space-y-1">
          {administrationNavigation.map((item) =>
            renderNavigationItem(item, mobile)
          )}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Website shortcut */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFE900]/10 text-[#FFE900]">
              <GraduationCap size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white">
                School Website
              </p>

              <p className="truncate text-[9px] text-white/40">
                Public website
              </p>
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

      {/* User */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFE900] text-xs font-extrabold text-[#252B68]">
            {getInitials(user?.name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">
              {user?.name || "Administrator"}
            </p>

            <p className="truncate text-[9px] text-white/40">
              {user?.email || "Admin account"}
            </p>
          </div>

          <ShieldCheck
            size={15}
            className="shrink-0 text-[#FFE900]"
          />
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
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-[#171B4A] lg:block">
        <div className="absolute inset-0 bg-gradient-to-b from-[#252B68] via-[#171B4A] to-[#101335]" />

        <div className="relative h-full overflow-hidden">
          {sidebarContent(false)}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#171B4A] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#252B68] via-[#171B4A] to-[#101335]" />

        <div className="relative h-full">
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/15"
          >
            <X size={17} />
          </button>

          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}