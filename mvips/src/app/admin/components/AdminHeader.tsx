"use client";

import {
  Bell,
  Check,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName: string;
  userRole: string;
}

type NotificationItem = {
  id: string;
  read_at: string | null;
  created_at: string;
  title: string;
  message: string;
  application_id: number | null;
  application_number: string | null;
  url: string | null;
};

export default function AdminHeader({
  onMenuClick,
  userName,
  userRole,
}: AdminHeaderProps) {
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const initials = userName
    ? userName
        .split(" ")
        .map((name) => name.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MV";

  const authHeaders = useCallback((): HeadersInit => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token")
        : null;
    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!API_URL) return;
    try {
      setLoadingNotifs(true);
      const response = await fetch(
        `${API_URL}/api/admin/admissions/notifications`,
        { headers: authHeaders(), cache: "no-store" }
      );

      if (!response.ok) return;

      const data = await response.json();
      setNotifications(data?.data ?? []);
      setUnreadCount(data?.unread_count ?? 0);
    } catch {
      /* non-fatal */
    } finally {
      setLoadingNotifs(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 45_000);
    return () => clearInterval(id);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    if (!API_URL) return;
    try {
      await fetch(
        `${API_URL}/api/admin/admissions/notifications/read-all`,
        { method: "POST", headers: authHeaders() }
      );
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
    } catch {
      /* non-fatal */
    }
  }

  async function openNotification(notification: NotificationItem) {
    setNotifOpen(false);

    if (!notification.read_at && API_URL) {
      try {
        await fetch(
          `${API_URL}/api/admin/admissions/notifications/${notification.id}/read`,
          { method: "POST", headers: authHeaders() }
        );
        setUnreadCount((c) => Math.max(c - 1, 0));
      } catch {
        /* non-fatal */
      }
    }

    if (notification.application_id) {
      router.push(
        `/admin/admissions?application=${notification.application_id}`
      );
    }
  }

  function formatRelative(value: string) {
    try {
      const d = new Date(value);
      const diff = Date.now() - d.getTime();
      const minutes = Math.floor(diff / 60_000);
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString();
    } catch {
      return value;
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
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

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              if (!notifOpen) loadNotifications();
            }}
            className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#252B68]"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F58220] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-14 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[#172033]">
                    Notifications
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      title="Mark all as read"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Close notifications"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {loadingNotifs && notifications.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Loading…
                  </div>
                )}

                {!loadingNotifs && notifications.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No notifications
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      You are all caught up.
                    </p>
                  </div>
                )}

                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      notification.read_at ? "" : "bg-[#FFE900]/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          notification.read_at
                            ? "bg-slate-200"
                            : "bg-[#F58220]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#172033]">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-600">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          {formatRelative(notification.created_at)}
                          {notification.application_number && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono">
                              {notification.application_number}
                              <ExternalLink size={9} />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
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