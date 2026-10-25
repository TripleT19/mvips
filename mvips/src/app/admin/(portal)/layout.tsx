
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Administrator");
  const [userRole, setUserRole] = useState("Administrator");
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthentication() {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");

          router.replace("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to verify the admin session.");
        }

        const storedUser = localStorage.getItem("admin_user");

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);

            if (!cancelled) {
              setUserName(user.name || "Administrator");
              setUserRole(user.role || "Administrator");
            }
          } catch {
            localStorage.removeItem("admin_user");
          }
        }

        if (!cancelled) {
          setAuthChecking(false);
        }
      } catch {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      }
    }

    checkAuthentication();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
      ).catch(() => {});
    }

    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    window.location.href = "/admin/login";
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#252B68]" />
          Verifying admin session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
      />

      <div className="lg:ml-[260px]">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
          userRole={userRole}
        />

        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
