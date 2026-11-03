"use client";

import { useRef, useState } from "react";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

type FormState = "idle" | "submitting" | "success" | "error";

export default function AlumniForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitting = state === "submitting";
  const canSubmit = consent && !submitting;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setErrorMessage("");

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo must be under 5 MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setErrorMessage("Please tick the consent box before submitting.");
      return;
    }
    setState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const fd = new FormData(form);

    // ---- light client-side checks ----
    const fullName = String(fd.get("full_name") || "").trim();
    const yearLeft = Number(fd.get("year_left")) || null;
    const location = String(fd.get("location") || "").trim();
    const currentRole = String(fd.get("current_role") || "").trim();

    if (!fullName || !yearLeft || !location || !currentRole) {
      setErrorMessage("Please fill in all required fields marked with an asterisk.");
      setState("error");
      return;
    }

    // ---- build multipart payload ----
    const payload = new FormData();
    payload.append("full_name", fullName);
    payload.append("email", String(fd.get("email") || "").trim());
    payload.append("phone", String(fd.get("phone") || "").trim());
    payload.append("year_left", String(yearLeft));
    payload.append("location", location);
    payload.append("current_role", currentRole);
    payload.append("organization", String(fd.get("organization") || "").trim());
    payload.append("bio", String(fd.get("bio") || "").trim());
    payload.append("linkedin_url", String(fd.get("linkedin_url") || "").trim());
    payload.append("message_to_students", String(fd.get("message_to_students") || "").trim());
    payload.append("show_contact", fd.get("show_contact") === "on" ? "1" : "0");
    payload.append("consent", "1");

    if (photoFile) payload.append("photo", photoFile);

    try {
      const res = await fetch(`${API_URL}/api/alumni`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload, // browser sets multipart boundary automatically
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Submission failed (${res.status}). Please try again.`
        );
      }

      form.reset();
      clearPhoto();
      setConsent(false);
      setState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setState("error");
    }
  }

  /* =====================================================
     SUCCESS SCREEN
  ====================================================== */
  if (state === "success") {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50 p-10 text-center shadow-xl">
        <span className="mv-float pointer-events-none absolute right-6 top-6 text-4xl opacity-40">🎉</span>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg">
          ✓
        </div>
        <h3 className="mt-6 text-2xl font-black text-emerald-900">
          Thank you — you&apos;re in!
        </h3>
        <p className="mx-auto mt-3 max-w-md leading-7 text-emerald-800">
          Your details and photo have been received. Our team will review the
          submission and add you to the alumni directory shortly. Welcome back to
          the Mount View story.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-7 rounded-full bg-emerald-600 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-xl"
        >
          Submit another entry
        </button>
      </div>
    );
  }

  /* =====================================================
     FORM
  ====================================================== */
  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-10"
    >
      {state === "error" && errorMessage && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* ---------- 1. About you ---------- */}
      <fieldset disabled={submitting} className="space-y-6">
        <legend className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE900] text-sm font-black text-[#252B68]">
            1
          </span>
          <span className="text-lg font-black text-[#252B68]">About you</span>
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" name="full_name" required placeholder="e.g. Jane Mwale" />
          <Field
            label="Year you left Mount View"
            name="year_left"
            required
            type="number"
            placeholder="e.g. 2012"
            min={1975}
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            Current location <span className="text-rose-500">*</span>
          </label>
          <input
            name="location"
            required
            placeholder="City, Country — e.g. Lilongwe, Malawi"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20"
          />
        </div>

        {/* ---- Photo upload ---- */}
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            Profile photo (optional)
          </label>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl text-slate-400">
                  📷
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#252B68] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#171B4A] disabled:opacity-60">
                  {photoPreview ? "Change photo" : "Upload photo"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={submitting}
                  />
                </label>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WebP · Max 5 MB. This is the photo shown on your
                alumni card.
              </p>
            </div>
          </div>
        </div>
      </fieldset>

      {/* ---------- 2. What you're doing now ---------- */}
      <fieldset disabled={submitting} className="mt-10 space-y-6">
        <legend className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F58220] text-sm font-black text-white">
            2
          </span>
          <span className="text-lg font-black text-[#252B68]">What you&apos;re doing now</span>
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Current role / occupation" name="current_role" required placeholder="e.g. Software Engineer" />
          <Field label="Organisation (optional)" name="organization" placeholder="e.g. Google, or 'Self-employed'" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            What are you up to? (optional)
          </label>
          <textarea
            name="bio"
            rows={4}
            placeholder="A short bio — your studies, career journey, family, passions, achievements…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20"
          />
        </div>
      </fieldset>

      {/* ---------- 3. Contact ---------- */}
      <fieldset disabled={submitting} className="mt-10 space-y-6">
        <legend className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#252B68] text-sm font-black text-white">
            3
          </span>
          <span className="text-lg font-black text-[#252B68]">Contact &amp; links</span>
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email (optional)" name="email" type="email" placeholder="you@example.com" />
          <Field label="Phone (optional)" name="phone" type="tel" placeholder="+265 ..." />
        </div>

        <Field
          label="LinkedIn URL (optional)"
          name="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/…"
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition hover:bg-white">
          <input
            type="checkbox"
            name="show_contact"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#F58220] focus:ring-[#F58220]"
          />
          <span>
            Display my email and phone publicly on the alumni directory. If
            unchecked, they stay private and are visible only to school staff.
          </span>
        </label>
      </fieldset>

      {/* ---------- 4. Message ---------- */}
      <fieldset disabled={submitting} className="mt-10 space-y-6">
        <legend className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE900] text-sm font-black text-[#252B68]">
            4
          </span>
          <span className="text-lg font-black text-[#252B68]">
            A message for current students (optional)
          </span>
        </legend>

        <textarea
          name="message_to_students"
          rows={4}
          placeholder="Advice, encouragement, or a memory you'd like to share with today's Mount View learners…"
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20"
        />
      </fieldset>

      {/* ---------- Consent + submit ---------- */}
      <div className="mt-10 space-y-4">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${
            consent
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-[#252B68]/15 bg-[#252B68]/5 text-slate-700"
          }`}
        >
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#252B68] focus:ring-[#252B68]"
          />
          <span>
            I confirm I am a former student or staff member of Mount View
            International Primary School, and I consent to my details and photo
            being published on this alumni page (contact info only as I have
            chosen above).
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 font-black text-white shadow-lg transition ${
            canSubmit
              ? "bg-[#F58220] shadow-[#F58220]/30 hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-2xl"
              : "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
          }`}
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Submitting…
            </>
          ) : (
            <>
              Submit my details
              <span
                className={`transition ${
                  canSubmit ? "group-hover:translate-x-1" : ""
                }`}
              >
                →
              </span>
            </>
          )}
        </button>

        {!consent && !submitting && (
          <p className="text-center text-xs font-semibold text-slate-500">
            Tick the consent box above to enable submission.
          </p>
        )}
      </div>
    </form>
  );
}

/* =========================================================
   Reusable field
========================================================= */

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20"
      />
    </div>
  );
}