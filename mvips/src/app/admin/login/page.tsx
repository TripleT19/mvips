"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);

    const email = form.get("email");
    const password = form.get("password");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            remember: rememberMe,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.errors?.email?.[0] ||
          data?.message ||
          "The email or password is incorrect.";

        throw new Error(message);
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      window.location.href = "/admin";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7FB]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT BRANDING PANEL */}
        <section className="relative hidden overflow-hidden bg-[#252B68] lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
          {/* Decorative shapes */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10" />
          <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            {/* Logo */}
            <div>
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={170}
                height={170}
                className="h-auto w-[125px] rounded-2xl object-contain shadow-xl xl:w-[145px]"
                priority
              />
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-[#FFE900]" />
                Secure Administration Portal
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Welcome to the
                <span className="block text-[#FFE900]">
                  Mount View
                </span>
                Administration Portal
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75 xl:text-lg">
                Manage school news, stories, gallery content and other
                website information from one secure place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <span className="font-semibold text-[#FFE900]">
                    1975
                  </span>{" "}
                  Established
                </div>

                <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <span className="font-semibold text-[#FFE900]">
                    600+
                  </span>{" "}
                  Students
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-6 text-sm text-white/55">
              <p>
                Mount View International Primary School
              </p>

              <p>
                Fostering growth, excellence and empathy
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={110}
                height={110}
                className="h-20 w-20 rounded-xl object-contain shadow-md"
                priority
              />

              <h1 className="mt-3 text-xl font-bold text-[#252B68]">
                Mount View International
              </h1>

              <p className="text-sm text-gray-500">
                Primary School & Early Years Centre
              </p>
            </div>

            {/* Login card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#252B68]/10">
                  <LockKeyhole className="h-5 w-5 text-[#252B68]" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
                  Administrator Login
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-gray-500">
                  Sign in to manage the Mount View school website.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-[#172033]"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@mountviewmw.com"
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-[#172033]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#252B68]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#252B68] focus:ring-[#252B68]"
                    />

                    <span className="text-sm text-gray-600">
                      Remember me
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#252B68]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-5 flex gap-3 rounded-xl bg-[#F6F7FB] p-3.5">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#252B68]" />

                <p className="text-xs leading-5 text-gray-500">
                  This area is restricted to authorised Mount View
                  administrators and staff.
                </p>
              </div>

              {/* Back to website */}
              <div className="mt-5 border-t border-gray-100 pt-5 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#252B68] transition hover:text-[#F58220]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to school website
                </Link>
              </div>
            </div>

            {/* Small-screen footer */}
            <p className="mt-5 text-center text-xs text-gray-400 lg:hidden">
              © {new Date().getFullYear()} Mount View International
              Primary School & Early Years Centre
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

