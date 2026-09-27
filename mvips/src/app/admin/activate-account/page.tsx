"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  UserCheck,
} from "lucide-react";

function ActivateAccountForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    match: false,
  });

  function handlePasswordChange(value: string) {
    setPassword(value);

    setPasswordChecks((current) => ({
      ...current,
      length: value.length >= 8,
      match:
        value.length > 0 &&
        value === passwordConfirmation,
    }));
  }

  function handleConfirmationChange(value: string) {
    setPasswordConfirmation(value);

    setPasswordChecks((current) => ({
      ...current,
      match:
        password.length > 0 &&
        password === value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!token || !email) {
      setError(
        "This account activation link is invalid or incomplete."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setError("The passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activate-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            token,
            email,
            password,
            password_confirmation: passwordConfirmation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to activate your account. The activation link may have expired."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to activate your account."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * Missing/invalid URL information.
   */
  if (!token || !email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7FB] px-5 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-xl sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#172033]">
              Invalid Activation Link
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This activation link is incomplete or invalid.
              Please use the latest activation email sent by
              Mount View.
            </p>

            <Link
              href="/admin/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white transition hover:bg-[#1d2257]"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Successful activation.
   */
  if (success) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#F6F7FB]">
        <div className="grid min-h-screen lg:grid-cols-2">
          {/* LEFT */}
          <section className="relative hidden overflow-hidden bg-[#252B68] lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10" />

            <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/10" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={145}
                height={145}
                className="rounded-2xl object-contain shadow-xl"
              />

              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
                  <ShieldCheck className="h-4 w-4 text-[#FFE900]" />
                  Secure Administration Portal
                </div>

                <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                  Welcome to
                  <span className="block text-[#FFE900]">
                    Mount View
                  </span>
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                  Your administration account is now ready.
                  You can sign in using your new password.
                </p>
              </div>

              <p className="text-sm text-white/55">
                Fostering growth, excellence and empathy
              </p>
            </div>
          </section>

          {/* RIGHT */}
          <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-6 flex flex-col items-center text-center lg:hidden">
                <Image
                  src="/logo.jpg"
                  alt="Mount View International Primary School"
                  width={90}
                  height={90}
                  className="h-20 w-20 rounded-xl object-contain shadow-md"
                />

                <h1 className="mt-3 text-xl font-bold text-[#252B68]">
                  Mount View International
                </h1>

                <p className="text-sm text-gray-500">
                  Primary School & Early Years Centre
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-xl sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-[#172033]">
                  Account Activated
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Your Mount View administration account has
                  been activated successfully.
                </p>

                <div className="mt-5 rounded-xl bg-[#F6F7FB] p-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Account
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-[#172033]">
                    {email}
                  </p>
                </div>

                <Link
                  href="/admin/login"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257]"
                >
                  Go to Administrator Login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7FB]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            LEFT BRANDING
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#252B68] lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10" />

          <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            {/* Logo */}
            <Image
              src="/logo.jpg"
              alt="Mount View International Primary School"
              width={145}
              height={145}
              className="rounded-2xl object-contain shadow-xl"
              priority
            />

            {/* Main message */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <UserCheck className="h-4 w-4 text-[#FFE900]" />
                Account Activation
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Welcome to the
                <span className="block text-[#FFE900]">
                  Mount View
                </span>
                Administration Portal
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75 xl:text-lg">
                Complete your account setup by creating a
                secure password.
              </p>
            </div>

            <p className="text-sm text-white/55">
              Fostering growth, excellence and empathy
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT FORM
        ====================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={90}
                height={90}
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

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#252B68]/10">
                  <UserCheck className="h-5 w-5 text-[#252B68]" />
                </div>

                <h2 className="text-2xl font-bold text-[#172033]">
                  Activate Your Account
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-gray-500">
                  Create a password to complete your Mount View
                  administration account setup.
                </p>

                <div className="mt-4 rounded-xl bg-gray-50 px-3.5 py-3">
                  <p className="text-xs text-gray-400">
                    Account email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-[#172033]">
                    {email}
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-[#172033]"
                  >
                    Create Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        handlePasswordChange(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password"
                      minLength={8}
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-[#252B68]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="mb-1.5 block text-sm font-semibold text-[#172033]"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password_confirmation"
                      type={
                        showConfirmation
                          ? "text"
                          : "password"
                      }
                      value={passwordConfirmation}
                      onChange={(event) =>
                        handleConfirmationChange(
                          event.target.value
                        )
                      }
                      placeholder="Confirm your password"
                      minLength={8}
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmation(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showConfirmation
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-[#252B68]"
                    >
                      {showConfirmation ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="rounded-xl border border-gray-100 bg-[#F6F7FB] p-3.5">
                  <p className="mb-2 text-xs font-semibold text-[#172033]">
                    Password requirements
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <PasswordRequirement
                      valid={passwordChecks.length}
                      text="At least 8 characters"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.match}
                      text="Passwords match"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {isLoading
                    ? "Activating Account..."
                    : "Activate My Account"}
                </button>
              </form>

              <div className="mt-5 border-t border-gray-100 pt-5 text-center">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#252B68] transition hover:text-[#F58220]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to administrator login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   PASSWORD REQUIREMENT
============================================================ */

function PasswordRequirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        valid
          ? "text-green-600"
          : "text-gray-500"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-green-100"
            : "bg-gray-200"
        }`}
      >
        {valid ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>

      {text}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F6F7FB]">
          <Loader2 className="h-7 w-7 animate-spin text-[#252B68]" />
        </main>
      }
    >
      <ActivateAccountForm />
    </Suspense>
  );
}
