"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  LogOut,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";
const PARENT_TOKEN_KEY = "parent_token";
const PARENT_USER_KEY = "parent_user";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

function formatRole(role: string) {
  if (!role) return "Parent";
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(date: string | null) {
  if (!date) return "Not available";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  if (!name) return "P";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ParentProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* ---------- Load profile ---------- */
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setProfileError("");

      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace("/parent/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(PARENT_TOKEN_KEY);
        localStorage.removeItem(PARENT_USER_KEY);
        router.replace("/parent/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Unable to load your profile.");
      }

      if (!data.success || !data.data) {
        throw new Error("Invalid profile response.");
      }

      const user: UserProfile = data.data;
      setProfile(user);
      setName(user.name || "");
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      localStorage.setItem(PARENT_USER_KEY, JSON.stringify(user));
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Update profile ---------- */
  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace("/parent/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(PARENT_TOKEN_KEY);
        localStorage.removeItem(PARENT_USER_KEY);
        router.replace("/parent/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Unable to update your profile.");
      }

      if (!data.success || !data.data) {
        throw new Error("Invalid profile response.");
      }

      const updated: UserProfile = data.data;
      setProfile(updated);
      setName(updated.name);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(updated));
      localStorage.setItem(PARENT_USER_KEY, JSON.stringify(updated));

      setProfileMessage("Your profile has been updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  /* ---------- Change password ---------- */
  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace("/parent/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/profile/password`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(PARENT_TOKEN_KEY);
        localStorage.removeItem(PARENT_USER_KEY);
        router.replace("/parent/login");
        return;
      }

      if (!res.ok) {
        if (data.errors) {
          const first = Object.values(data.errors)[0];
          if (Array.isArray(first) && first.length > 0) {
            throw new Error(String(first[0]));
          }
        }
        throw new Error(data?.message || "Unable to change your password.");
      }

      // Backend revokes old tokens and returns a new one — store it everywhere
      if (data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(PARENT_TOKEN_KEY, data.token);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Your password has been changed successfully.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* ---------- Sign out ---------- */
  function handleSignOut() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      fetch(`${API_URL}/api/admin/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(PARENT_TOKEN_KEY);
    localStorage.removeItem(PARENT_USER_KEY);

    router.replace("/parent/login");
  }

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-[#252B68]" />
          <span className="text-sm font-medium">Loading your profile…</span>
        </div>
      </div>
    );
  }

  /* ---------- Page ---------- */
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
          <User size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal information and password.
          </p>
        </div>
      </div>

      {profileError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Personal Information */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
                  <User size={19} />
                </div>
                <div>
                  <h2 className="font-bold text-[#172033]">
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update the name associated with your account.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleProfileSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172033]">
                  Full name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={255}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#172033] outline-none transition focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172033]">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={profile?.email || ""}
                    readOnly
                    tabIndex={-1}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Email addresses can only be changed by the school office.
                </p>
              </div>

              {profileMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 size={17} />
                  {profileMessage}
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d2257] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Change Password */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F58220]/10 text-[#F58220]">
                  <Lock size={19} />
                </div>
                <div>
                  <h2 className="font-bold text-[#172033]">
                    Change Password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Keep your account secure with a strong password.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              <PasswordInput
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrentPassword}
                setVisible={setShowCurrentPassword}
                placeholder="Enter your current password"
              />
              <PasswordInput
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNewPassword}
                setVisible={setShowNewPassword}
                placeholder="Enter your new password"
              />
              <PasswordInput
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                setVisible={setShowConfirmPassword}
                placeholder="Repeat your new password"
              />

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                Your new password must contain at least 8 characters.
              </div>

              {passwordError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 size={17} />
                  {passwordMessage}
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#dd7116] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Changing…
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* Profile card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col items-center px-5 py-7 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#252B68] text-2xl font-bold text-white shadow-lg">
                {getInitials(profile?.name || "")}
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                {profile?.name || "Parent"}
              </h2>
              <p className="mt-1 break-all text-sm text-slate-500">
                {profile?.email || ""}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-3 py-1.5 text-xs font-semibold text-[#252B68]">
                <ShieldCheck size={14} />
                {formatRole(profile?.role || "Parent")}
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-2 text-xs font-medium ${
                  profile?.is_active ? "text-green-600" : "text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    profile?.is_active ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
                {profile?.is_active ? "Account active" : "Account inactive"}
              </div>
            </div>
          </section>

          {/* Account information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#172033]">Account Information</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div>
                  <p className="text-xs text-slate-400">Account created</p>
                  <p className="mt-1 text-sm font-medium text-[#172033]">
                    {formatDate(profile?.created_at || null)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div>
                  <p className="text-xs text-slate-400">Account role</p>
                  <p className="mt-1 text-sm font-medium text-[#172033]">
                    {formatRole(profile?.role || "Parent")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Account email</p>
                  <p className="mt-1 break-all text-sm font-medium text-[#172033]">
                    {profile?.email || ""}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#172033]">Sign out</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sign out of your parent account on this device.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
 * Password input
 * ============================================================ */

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  setVisible,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#172033]">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-[#172033] outline-none transition focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}