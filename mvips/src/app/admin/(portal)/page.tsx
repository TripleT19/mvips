"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileText,
  Images,
  Edit3,
  Plus,
  ArrowRight,
  CalendarDays,
  Eye,
  Clock3,
  ImagePlus,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("admin_user");
      }
    }

    setLoading(false);
  }, []);

  function handleLogout() {
    const token = localStorage.getItem("admin_token");

    if (token) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/logout`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch(() => {
        // Even if the API request fails, clear the local session.
      });
    }

    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F58220]" />
          <p className="mt-4 text-sm text-slate-500">
            Loading administration portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          userName={user?.name || "Administrator"}
          userRole={user?.role || "Administrator"}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Welcome */}
            <section className="mb-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="mb-1 text-sm font-medium text-[#F58220]">
                    Welcome back
                  </p>

                  <h2 className="text-2xl font-bold tracking-tight text-[#252B68] sm:text-3xl">
                    {user?.name || "Administrator"}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Manage Mount View International Primary School's stories,
                    gallery, media and website content from one place.
                  </p>
                </div>

                <Link
                  href="/admin/stories/create"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 transition hover:-translate-y-0.5 hover:bg-[#df6f13]"
                >
                  <Plus size={18} />
                  Create Story
                </Link>
              </div>
            </section>

            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Published Stories"
                value="24"
                description="Stories published"
                icon={<FileText size={21} />}
                href="/admin/stories"
              />

              <StatCard
                title="Draft Stories"
                value="5"
                description="Awaiting publication"
                icon={<Edit3 size={21} />}
                href="/admin/stories"
              />

              <StatCard
                title="Gallery Photos"
                value="148"
                description="Photos uploaded"
                icon={<Images size={21} />}
                href="/admin/gallery"
              />

              <StatCard
                title="This Month"
                value="8"
                description="New stories & albums"
                icon={<CalendarDays size={21} />}
                href="/admin/stories"
              />
            </section>

            {/* Main content */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {/* Recent stories */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <h3 className="font-bold text-[#252B68]">
                      Recent Stories
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Latest website stories
                    </p>
                  </div>

                  <Link
                    href="/admin/stories"
                    className="flex items-center gap-1 text-xs font-semibold text-[#F58220] hover:underline"
                  >
                    View all
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  <StoryRow
                    title="Mount View Inter-House Quiz 2026"
                    category="School Events"
                    author="ICT Department"
                    date="25 Sep 2026"
                    status="Published"
                  />

                  <StoryRow
                    title="STEAM Learning at Mount View"
                    category="Learning"
                    author="Mount View School"
                    date="18 Sep 2026"
                    status="Published"
                  />

                  <StoryRow
                    title="A Day of Creativity and Discovery"
                    category="School Life"
                    author="Year 5 East"
                    date="12 Sep 2026"
                    status="Published"
                  />

                  <StoryRow
                    title="Year 6 Science Investigation"
                    category="Academics"
                    author="Science Department"
                    date="08 Sep 2026"
                    status="Draft"
                  />
                </div>
              </section>

              {/* Quick actions */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h3 className="font-bold text-[#252B68]">
                    Quick Actions
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Common administration tasks
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <QuickAction
                    href="/admin/stories/create"
                    icon={<Plus size={19} />}
                    title="Create Story"
                    description="Publish a new school story"
                  />

                  <QuickAction
                    href="/admin/gallery"
                    icon={<ImagePlus size={19} />}
                    title="Upload Photos"
                    description="Add photos to the gallery"
                  />

                  <QuickAction
                    href="/admin/stories"
                    icon={<Edit3 size={19} />}
                    title="Manage Stories"
                    description="Edit or publish stories"
                  />

                  <QuickAction
                    href="/"
                    icon={<Eye size={19} />}
                    title="View Website"
                    description="Open the public website"
                  />
                </div>
              </section>
            </div>

            {/* Bottom section */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Recent media */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#252B68]">
                      Recent Gallery Activity
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Recently added photos
                    </p>
                  </div>

                  <Link
                    href="/admin/gallery"
                    className="text-xs font-semibold text-[#F58220] hover:underline"
                  >
                    Manage gallery
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    "/images/gallery/school-1.jpg",
                    "/images/gallery/school-2.jpg",
                    "/images/gallery/school-3.jpg",
                    "/images/gallery/school-4.jpg",
                  ].map((image, index) => (
                    <div
                      key={image}
                      className="aspect-square overflow-hidden rounded-xl bg-slate-100"
                    >
                      <img
                        src={image}
                        alt={`Recent gallery photo ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Website status */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h3 className="font-bold text-[#252B68]">
                    Website Overview
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Current content status
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <StatusRow
                    label="Published stories"
                    value="24"
                    percentage="80%"
                  />

                  <StatusRow
                    label="Draft stories"
                    value="5"
                    percentage="17%"
                  />

                  <StatusRow
                    label="Gallery photos"
                    value="148"
                    percentage="93%"
                  />
                </div>

                <div className="mt-5 rounded-xl bg-[#252B68]/5 p-4">
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={18}
                      className="mt-0.5 text-[#F58220]"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#252B68]">
                        Keep your website up to date
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add new stories and photos regularly to keep families
                        connected with school life.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} Mount View International Primary
                School & Early Years Centre
              </p>

              <p className="mt-1 text-[11px] text-slate-300">
                Fostering growth, excellence and empathy
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252B68]/8 text-[#252B68]">
          {icon}
        </div>

        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#F58220]"
        />
      </div>

      <div className="mt-5">
        <p className="text-2xl font-bold text-[#252B68]">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </Link>
  );
}

function StoryRow({
  title,
  category,
  author,
  date,
  status,
}: {
  title: string;
  category: string;
  author: string;
  date: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/8 text-[#252B68] sm:flex">
        <FileText size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <span>{category}</span>
          <span>•</span>
          <span>{author}</span>
          <span>•</span>
          <span>{date}</span>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          status === "Published"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-50 text-amber-600"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#F58220]/20 hover:bg-[#F58220]/5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/8 text-[#252B68]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {description}
        </p>
      </div>

      <ArrowRight size={15} className="text-slate-300" />
    </Link>
  );
}

function StatusRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-[#252B68]">{value}</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#F58220]"
          style={{ width: percentage }}
        />
      </div>
    </div>
  );
}