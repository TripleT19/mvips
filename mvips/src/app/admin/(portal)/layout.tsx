"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Administrator");
  const [userRole, setUserRole] = useState("Administrator");

  useEffect(() => {
    const storedUser = localStorage.getItem("admin_user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        setUserName(user.name || "Administrator");
        setUserRole(user.role || "Administrator");
      } catch {
        // Ignore invalid stored user.
      }
    }
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
      ).catch(() => {});
    }

    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    window.location.href = "/admin/login";
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

