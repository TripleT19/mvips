"use client";

import { Menu, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName: string;
  userRole: string;
}

export default function AdminHeader({
  onMenuClick,
  userName,
  userRole,
}: AdminHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = userName
    ? userName
        .split(" ")
        .map((name) => name.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MV";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-[#252B68] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={23} />
        </button>

        <div>
          <p className="hidden text-xs font-semibold uppercase tracking-wider text-slate-400 sm:block">
            Mount View Administration
          </p>
          <h1 className="text-lg font-bold text-[#252B68] sm:text-xl">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#252B68]"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F58220] ring-2 ring-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-sm font-bold text-white">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                {userName}
              </p>
              <p className="text-[11px] capitalize text-slate-400">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {userName}
                </p>
                <p className="mt-0.5 text-xs capitalize text-slate-400">
                  {userRole}
                </p>
              </div>

              <a
                href="/admin/settings"
                className="mt-1 block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#252B68]"
              >
                Account settings
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}