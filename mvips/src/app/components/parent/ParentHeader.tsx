"use client";

import { Menu, UserCircle } from "lucide-react";
import Link from "next/link";

type ParentHeaderProps = {
  user?: { name?: string; email?: string } | null;
  onMenuClick?: () => void;
  title?: string;
};

function getInitials(name?: string) {
  if (!name) return "P";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default function ParentHeader({
  user,
  onMenuClick,
  title,
}: ParentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#172033]">
          {title || "Parent Portal"}
        </p>
        <p className="hidden truncate text-[11px] text-slate-500 sm:block">
          Mount View International Primary School
        </p>
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-bold text-[#172033]">
            {user?.name || "Parent"}
          </p>
          <p className="text-[10px] text-slate-500">{user?.email || ""}</p>
        </div>

        <Link
          href="/parent/profile"
          aria-label="Open profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-xs font-bold text-white shadow-sm ring-2 ring-white transition hover:scale-105"
        >
          {user?.name ? getInitials(user.name) : <UserCircle size={16} />}
        </Link>
      </div>
    </header>
  );
}