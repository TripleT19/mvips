"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GalleryHorizontalEnd,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

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

type NavAccess =
  | "always"
  | "cms"
  | "academics"
  | "attendance"
  | "assessment_objectives"
  | "assessment_sheet"
  | "photos"
  | "results"
  | "admissions"
  | "fees"
  | "users"
  | "student_accounts"
  | "settings";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  access: NavAccess;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

type Caps = {
  role: string;
  is_parent: boolean;
  is_staff: boolean;
  is_specialist: boolean;
  is_bursar: boolean;
  is_admissions: boolean;
  can_cms: boolean;
  has_any_assignment: boolean;
  has_core_subject_assignment: boolean;
  has_club_lead: boolean;
  has_children: boolean;
};

type Child = {
  id: number;
  full_name: string;
  student_number: string;
  class_name?: string | null;
  stream_name?: string | null;
  stream_colour?: string | null;
};

/* ============================================================
 * STAFF NAV DEFINITION
 * ============================================================ */

const staffNavGroups: NavGroup[] = [
  {
    key: "cms",
    label: "Main Menu",
    items: [
      { label: "Contact Messages", href: "/admin/contact-messages", icon: Mail,                 access: "cms" },
      { label: "Newsletters",      href: "/admin/newsletters",      icon: FileText,             access: "cms" },
      { label: "Stories & News",   href: "/admin/stories",          icon: BookOpen,             access: "cms" },
      { label: "Events",           href: "/admin/events",           icon: CalendarDays,         access: "cms" },
      { label: "Gallery",          href: "/admin/gallery",          icon: GalleryHorizontalEnd, access: "cms" },
    ],
  },
  {
    key: "academics",
    label: "Academics",
    items: [
      { label: "Academics", href: "/admin/academics", icon: GraduationCap, access: "academics" },
    ],
  },
  {
    key: "teaching",
    label: "Teaching",
    items: [
      { label: "Attendance",            href: "/admin/attendance",            icon: ClipboardList,  access: "attendance" },
      { label: "Assessment Objectives", href: "/admin/assessment-objectives", icon: ListChecks,     access: "assessment_objectives" },
      { label: "Assessment Sheet",      href: "/admin/assessment-sheet",      icon: ClipboardCheck, access: "assessment_sheet" },
      { label: "Student Photos",        href: "/admin/student-photos",        icon: Camera,         access: "photos" },
    ],
  },
  {
    key: "results",
    label: "Results",
    items: [
      { label: "Results", href: "/admin/results", icon: BarChart3, access: "results" },
    ],
  },
  {
    key: "admissions",
    label: "Admissions",
    items: [
      { label: "Admissions", href: "/admin/admissions", icon: UserPlus, access: "admissions" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    items: [
      { label: "School Fees", href: "/admin/fees", icon: Landmark, access: "fees" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    items: [
      { label: "Users",            href: "/admin/users",                  icon: UserCircle, access: "users" },
      { label: "Student Accounts", href: "/admin/users/student-accounts", icon: Users,      access: "student_accounts" },
      { label: "Settings",         href: "/admin/settings",               icon: Settings,   access: "settings" },
    ],
  },
];

/* ============================================================
 * ACCESS MAP
 * ============================================================ */

function buildAccessSet(role: string, caps: Caps | null): Set<NavAccess> {
  const r = normalise(role);
  const set = new Set<NavAccess>();

  // ── Superusers ──
  if (["admin", "administrator", "super_admin", "superadmin"].includes(r)) {
    (["cms", "academics", "results", "users", "student_accounts", "settings"] as NavAccess[])
      .forEach((a) => set.add(a));
    return set;
  }

  // ── Headteacher / Principal ──
  if (["headteacher", "head_teacher", "principal"].includes(r)) {
    (["cms", "admissions", "assessment_sheet", "student_accounts", "settings"] as NavAccess[])
      .forEach((a) => set.add(a));
    return set;
  }

  // ── Lead / Class teacher ──
  if (["lead_teacher", "class_teacher"].includes(r)) {
    (["cms", "attendance", "assessment_objectives", "assessment_sheet", "photos", "settings"] as NavAccess[])
      .forEach((a) => set.add(a));
    return set;
  }

  // ── Assistant teacher / TA ──
  if (["assistant_teacher", "teaching_assistant", "ta"].includes(r)) {
    (["attendance", "assessment_sheet", "photos", "settings"] as NavAccess[])
      .forEach((a) => set.add(a));
    return set;
  }

  // ── Specialist teacher: dynamic based on core-subject assignment ──
  if (isSpecialistRole(r)) {
    if (caps?.has_core_subject_assignment) {
      (["assessment_objectives", "assessment_sheet", "settings"] as NavAccess[]).forEach((a) => set.add(a));
    } else {
      (["assessment_sheet", "settings"] as NavAccess[]).forEach((a) => set.add(a));
    }
    return set;
  }

  // ── Bursar / Finance ──
  if (["bursar", "finance", "accountant"].includes(r)) {
    (["attendance", "fees", "settings"] as NavAccess[]).forEach((a) => set.add(a));
    return set;
  }

  // ── Admissions officer ──
  if (["admissions_officer", "admissions"].includes(r)) {
    (["admissions", "attendance", "settings"] as NavAccess[]).forEach((a) => set.add(a));
    return set;
  }

  // ── Parent (fallback — normally handled before this runs) ──
  if (["parent", "guardian"].includes(r)) {
    return set;
  }

  return set;
}

function normalise(role: string): string {
  const r = (role || "").toLowerCase().trim();
  return r.replace(/[\s\-\.]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

const NON_SPECIALIST_ROLES = [
  "lead_teacher", "class_teacher", "assistant_teacher",
  "teaching_assistant", "ta", "stream_lead", "club_lead",
];

const SPECIALIST_ROLES = [
  "specialist", "specialist_teacher", "special_teacher", "spec_teacher",
  "subject_teacher", "teacher",
  "music_teacher", "art_teacher", "pe_teacher", "sports_teacher",
  "ict_teacher", "computing_teacher", "computer_teacher",
  "swimming_teacher", "dance_teacher", "drama_teacher",
  "language_teacher", "languages_teacher", "foreign_language_teacher",
  "reading_teacher", "library_teacher", "librarian",
  "science_teacher", "maths_teacher", "math_teacher",
  "english_teacher", "history_teacher", "geography_teacher",
];

function isSpecialistRole(role: string): boolean {
  const r = normalise(role);
  if (NON_SPECIALIST_ROLES.includes(r)) return false;
  if (SPECIALIST_ROLES.includes(r)) return true;
  return r.endsWith("_teacher");
}

function getInitials(name?: string) {
  if (!name) return "MV";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  // Exact-match only for dashboards (so /admin/parent doesn't highlight on /admin/parent/children/5)
  if (href === "/admin" || href === "/admin/parent") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const HOME_ITEM_STAFF: NavItem = {
  label: "Dashboard",
  href: "/admin",
  icon: LayoutDashboard,
  access: "always",
};

const HOME_ITEM_PARENT: NavItem = {
  label: "Dashboard",
  href: "/admin/parent",
  icon: LayoutDashboard,
  access: "always",
};

/* ============================================================
 * PARENT NAV BUILDER
 * ============================================================ */

function buildParentNav(children: Child[]): NavGroup[] {
  const groups: NavGroup[] = [];

  if (children.length > 0) {
    groups.push({
      key: "parent_children",
      label: `My Children (${children.length})`,
      items: children.map((c) => ({
        label: c.full_name,
        href: `/admin/parent/children/${c.id}`,
        icon: UserCircle,
        access: "always",
      })),
    });
  } else {
    groups.push({
      key: "parent_children",
      label: "My Children",
      items: [
        {
          label: "No children linked",
          href: "/admin/parent",
          icon: UserCircle,
          access: "always",
        },
      ],
    });
  }

  groups.push({
    key: "parent_account",
    label: "Account",
    items: [
      { label: "Profile", href: "/admin/profile", icon: Settings, access: "always" },
    ],
  });

  return groups;
}

/* ============================================================
 * SIDEBAR
 * ============================================================ */

export default function AdminSidebar({
  mobileOpen = false,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  /* ---------- Bootstrap: localStorage user ---------- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  /* ---------- Fetch capabilities (+ children for parents) ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMetaLoading(true);
      try {
        if (!API_URL) return;

        const res = await fetch(`${API_URL}/api/admin/portal/capabilities`, {
          headers: authHeaders(),
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        if (res.ok && json?.data) {
          setCaps(json.data as Caps);

          if (json.data.is_parent) {
            const chRes = await fetch(`${API_URL}/api/admin/parent/children`, {
              headers: authHeaders(),
              cache: "no-store",
            });
            if (chRes.ok) {
              const chJson = await chRes.json();
              if (!cancelled) setChildren(chJson.data ?? []);
            }
          }
        }
      } catch {
        /* Capabilities endpoint unreachable — fallback to localStorage role */
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ---------- Derived role / parent state ---------- */
  const effectiveRole = caps?.role || user?.role || "";
  const isParent = !!caps?.is_parent ||
    ["parent", "guardian"].includes(normalise(user?.role || ""));

  /* ---------- Build nav ---------- */
  const visibleGroups: NavGroup[] = useMemo(() => {
    if (!effectiveRole) return [];

    if (isParent) {
      return buildParentNav(children);
    }

    // Staff: hide until caps loaded (prevents flash of wrong items for specialists)
    if (metaLoading && !caps) return [];

    const allowed = buildAccessSet(effectiveRole, caps);

    return staffNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => allowed.has(item.access)),
      }))
      .filter((group) => group.items.length > 0);
  }, [effectiveRole, isParent, children, caps, metaLoading]);

  /* ---------- Auto-open the group containing the active route ---------- */
  useEffect(() => {
    if (visibleGroups.length === 0) {
      setOpenGroupKey(null);
      return;
    }
    const groupWithActive = visibleGroups.find((g) =>
      g.items.some((i) => isActivePath(pathname, i.href))
    );
    if (groupWithActive) {
      setOpenGroupKey(groupWithActive.key);
      return;
    }
    setOpenGroupKey((prev) => prev ?? visibleGroups[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visibleGroups]);

  useEffect(() => {
    if (!mobileOpen) return;
    const active = document.querySelector<HTMLElement>('aside a[data-active="true"]');
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [mobileOpen, pathname, openGroupKey]);

  const closeMobileSidebar = () => setMobileOpen?.(false);
  const toggleGroup = (key: string) =>
    setOpenGroupKey((prev) => (prev === key ? null : key));

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && API_URL) {
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
      router.replace("/admin/login");
    }
  };

  /* ---------- Item renderer ---------- */
  const renderItem = (item: NavItem, mobile = false) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        data-active={active ? "true" : "false"}
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
        <span className="flex-1 truncate">{item.label}</span>
        {active && <ChevronRight size={14} className="shrink-0 text-[#252B68]" />}
      </Link>
    );
  };

  /* ---------- Group renderer ---------- */
  const renderGroup = (group: NavGroup, mobile = false) => {
    const isOpen = openGroupKey === group.key;
    const containsActive = group.items.some((i) => isActivePath(pathname, i.href));

    return (
      <div key={group.key}>
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          aria-expanded={isOpen}
          className={`group flex h-9 w-full items-center justify-between gap-2 rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
            containsActive ? "text-[#FFE900]" : "text-white/40 hover:text-white/70"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {containsActive && <span className="h-1.5 w-1.5 rounded-full bg-[#FFE900]" />}
            <span className="truncate">{group.label}</span>
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        </button>

        <div
          className={`grid overflow-hidden transition-all duration-200 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <nav className="space-y-1 pt-1">
              {group.items.map((item) => renderItem(item, mobile))}
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupOrItem = (group: NavGroup, mobile = false) => {
    // Single-item groups render as a flat link
    if (group.items.length === 1) {
      return (
        <div key={group.key} className="mt-1">
          {renderItem(group.items[0], mobile)}
        </div>
      );
    }
    return renderGroup(group, mobile);
  };

  /* ---------- Sidebar body ---------- */
  const sidebarContent = (mobile = false) => (
    <div className="flex min-h-full flex-col">
      {/* Brand */}
      <div className="px-4 pb-4 pt-4">
        <Link
          href={isParent ? "/admin/parent" : "/admin"}
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
              {isParent ? "Parent Portal" : "Administration"}
            </p>
          </div>
        </Link>
      </div>

      <div className="mx-4 border-t border-white/10" />

      {/* Home + groups */}
      <div className="flex-1 px-3 pt-4">
        {renderItem(isParent ? HOME_ITEM_PARENT : HOME_ITEM_STAFF, mobile)}

        {metaLoading && !isParent ? (
          <div className="mt-4 space-y-2">
            <div className="h-9 animate-pulse rounded-lg bg-white/5" />
            <div className="h-9 animate-pulse rounded-lg bg-white/5" />
            <div className="h-9 animate-pulse rounded-lg bg-white/5" />
          </div>
        ) : visibleGroups.length > 0 ? (
          <div className="mt-3 space-y-3">
            {visibleGroups.map((g) => renderGroupOrItem(g, mobile))}
          </div>
        ) : (
          effectiveRole && (
            <p className="mt-3 px-3 text-[11px] text-white/40">
              {isParent
                ? "No children have been linked to your account yet. Please contact the school office."
                : "Only Dashboard is available for your role."}
            </p>
          )
        )}
      </div>

      {/* Website shortcut */}
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

      {/* User + logout */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFE900] text-xs font-extrabold text-[#252B68]">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">
              {user?.name || (isParent ? "Parent" : "Administrator")}
            </p>
            <p className="truncate text-[9px] text-white/40">
              {user?.email || (isParent ? "Parent account" : "Admin account")}
            </p>
          </div>
          <ShieldCheck size={15} className="shrink-0 text-[#FFE900]" />
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#252B68] via-[#171B4A] to-[#101335]" />
        <div className="relative h-full overflow-y-auto overscroll-contain">
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

      {/* Mobile drawer */}
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
          {sidebarContent(true)}
        </div>
      </aside>
    </>
  );
}