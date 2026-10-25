"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ParentSidebar from "../../components/parent/ParentSidebar";
import ParentHeader from "../../components/parent/ParentHeader";

const TOKEN_KEY = "admin_token";

type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem("admin_user");

    if (!token || !raw) {
      router.replace("/parent/login");
      return;
    }

    try {
      const u = JSON.parse(raw) as StoredUser;
      const role = (u.role ?? "").toLowerCase().trim();

      if (role !== "parent" && role !== "guardian") {
        // Staff accidentally landing on /parent — send them home.
        router.replace("/admin");
        return;
      }

      setUser(u);
    } catch {
      router.replace("/parent/login");
      return;
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ParentSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <ParentHeader
          user={user}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-[11px] text-slate-500 lg:px-8">
          © {new Date().getFullYear()} Mount View International Primary School
          & Early Years Centre
        </footer>
      </div>
    </div>
  );
}