"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const mapUrl =
  "https://www.google.com/maps/place/Mount+View+International+Primary+School+and+Early+Years+Centre/@-15.7960625,35.0714375,17z/data=!3m1!4b1!4m6!3m5!1s0x18d84f17f3d82731:0x1efcb27554b97db7!8m2!3d-15.7960625!4d35.0714375!16s%2Fg%2F11g6mh83zg?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D";

const ENQUIRY_OPTIONS = [
  { value: "admissions", label: "Admissions" },
  { value: "school-information", label: "School Information" },
  { value: "curriculum", label: "Curriculum & Learning" },
  { value: "school-life", label: "School Life" },
  { value: "general", label: "General Enquiry" },
];

export default function ContactPage() {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    enquiry_type: "",
    child_name: "",
    class_name: "",
    message: "",
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch(`${API_URL}/api/contact-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          enquiry_type: form.enquiry_type,
          child_name: form.child_name.trim() || null,
          class_name: form.class_name.trim() || null,
          message: form.message.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (json && json.errors) {
          const flat = {};
          for (const key of Object.keys(json.errors)) {
            const value = json.errors[key];
            flat[key] = Array.isArray(value) ? String(value[0]) : String(value);
          }
          setFieldErrors(flat);
          setErrorMessage(
            json.message || "Please correct the highlighted fields."
          );
        } else {
          setErrorMessage(
            (json && json.message) ||
              "Something went wrong. Please try again."
          );
        }
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        enquiry_type: "",
        child_name: "",
        class_name: "",
        message: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        "We couldn't send your message. Please check your connection and try again."
      );
    }
  }

  function resetForm() {
    setStatus("idle");
    setErrorMessage("");
    setFieldErrors({});
  }

  return (
    <main className="bg-white">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#FFE900]/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full bg-[#FFE900] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#252B68]">
              Get in touch
            </p>

            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              We would love to
              <span className="block text-[#FFE900]">hear from you.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              Whether you are considering Mount View for your child, looking
              for more information about our learning environment, or simply
              have a question, our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          QUICK CONTACT CARDS
      ========================================================= */}
      <section className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <a
            href="tel:+265881668001"
            className="group rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F58220] text-2xl">
              📞
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#252B68]">Call Us</h2>

            <p className="mt-2 leading-7 text-slate-600">
              Speak with our team for admissions and general enquiries.
            </p>

            <p className="mt-2 font-semibold text-[#F58220]">0881 668 001</p>
          </a>

          <a
            href="mailto:info@mountviewmw.com"
            className="group rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl">
              ✉️
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#252B68]">Email Us</h2>

            <p className="mt-2 leading-7 text-slate-600">
              Send us your questions and our team will get back to you.
            </p>

            <p className="mt-2 break-all font-semibold text-[#F58220]">
              info@mountviewmw.com
            </p>
          </a>

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252B68] text-2xl">
              📍
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#252B68]">Find Us</h2>

            <p className="mt-2 leading-7 text-slate-600">
              Visit Mount View International Primary School &amp; Early Years
              Centre.
            </p>

            <p className="mt-2 font-semibold text-[#F58220]">
              Blantyre, Malawi
            </p>
          </a>
        </div>
      </section>

      {/* =========================================================
          CONTACT FORM + INFORMATION
      ========================================================= */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* LEFT INFORMATION */}
          <div>
            <p className="font-bold uppercase tracking-widest text-[#F58220]">
              Start a conversation
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl">
              How can we help?
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Choosing a school is an important decision. We are happy to
              answer your questions and help you understand more about the
              Mount View learning experience.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#252B68] text-white">
                  ✓
                </div>

                <div>
                  <h3 className="font-bold text-[#252B68]">
                    Admissions enquiries
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Ask about joining our Early Years or Primary school.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F58220] text-white">
                  ✓
                </div>

                <div>
                  <h3 className="font-bold text-[#252B68]">
                    School information
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Find out more about our curriculum, learning and school
                    environment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFE900] text-[#252B68]">
                  ✓
                </div>

                <div>
                  <h3 className="font-bold text-[#252B68]">
                    General enquiries
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Have another question? Send us a message and we will
                    direct it to the appropriate team.
                  </p>
                </div>
              </div>
            </div>

            {/* DIRECT CONTACT */}
            <div className="mt-10 rounded-3xl bg-[#F5F6FC] p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-[#F58220]">
                Contact details
              </p>

              <div className="mt-5 space-y-4">
                <a
                  href="tel:+265881668001"
                  className="flex items-center gap-3 text-[#252B68] transition hover:text-[#F58220]"
                >
                  <span className="text-xl">📞</span>
                  <span className="font-semibold">0881 668 001</span>
                </a>

                <a
                  href="mailto:info@mountviewmw.com"
                  className="flex items-center gap-3 break-all text-[#252B68] transition hover:text-[#F58220]"
                >
                  <span className="text-xl">✉️</span>
                  <span className="font-semibold">info@mountviewmw.com</span>
                </a>

                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-[#252B68] transition hover:text-[#F58220]"
                >
                  <span className="text-xl">📍</span>

                  <span className="font-semibold">
                    Mount View International Primary School &amp; Early Years
                    Centre
                    <br />
                    Blantyre, Malawi
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:p-10">
            {status !== "success" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-[#252B68] sm:text-3xl">
                    Send us a message
                  </h2>

                  <p className="mt-2 text-slate-600">
                    Complete the form below and tell us how we can assist.
                  </p>
                </div>

                {status === "error" && errorMessage && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* FULL NAME */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-bold text-[#252B68]"
                    >
                      Full Name *
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full rounded-xl border px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                        fieldErrors.full_name
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-[#252B68] focus:ring-[#252B68]/10"
                      }`}
                    />

                    {fieldErrors.full_name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={12} />
                        {fieldErrors.full_name}
                      </p>
                    )}
                  </div>

                  {/* EMAIL + PHONE */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-bold text-[#252B68]"
                      >
                        Email Address *
                      </label>

                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                          fieldErrors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-300 focus:border-[#252B68] focus:ring-[#252B68]/10"
                        }`}
                      />

                      {fieldErrors.email && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle size={12} />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-bold text-[#252B68]"
                      >
                        Phone Number
                      </label>

                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="0881 668 001"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                      />
                    </div>
                  </div>

                  {/* ENQUIRY TYPE */}
                  <div>
                    <label
                      htmlFor="enquiryType"
                      className="mb-2 block text-sm font-bold text-[#252B68]"
                    >
                      Enquiry Type *
                    </label>

                    <select
                      id="enquiryType"
                      required
                      value={form.enquiry_type}
                      onChange={(e) => update("enquiry_type", e.target.value)}
                      className={`w-full rounded-xl border bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:ring-2 ${
                        fieldErrors.enquiry_type
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-[#252B68] focus:ring-[#252B68]/10"
                      }`}
                    >
                      <option value="" disabled>
                        Select an enquiry type
                      </option>

                      {ENQUIRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {fieldErrors.enquiry_type && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={12} />
                        {fieldErrors.enquiry_type}
                      </p>
                    )}
                  </div>

                  {/* CHILD NAME + CLASS */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="childName"
                        className="mb-2 block text-sm font-bold text-[#252B68]"
                      >
                        Child&apos;s Name
                        <span className="ml-1 font-normal text-slate-400">
                          (optional)
                        </span>
                      </label>

                      <input
                        id="childName"
                        type="text"
                        value={form.child_name}
                        onChange={(e) => update("child_name", e.target.value)}
                        placeholder="Child's name"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="className"
                        className="mb-2 block text-sm font-bold text-[#252B68]"
                      >
                        Year / Class
                        <span className="ml-1 font-normal text-slate-400">
                          (optional)
                        </span>
                      </label>

                      <input
                        id="className"
                        type="text"
                        value={form.class_name}
                        onChange={(e) => update("class_name", e.target.value)}
                        placeholder="e.g. Year 5 East"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                      />
                    </div>
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-bold text-[#252B68]"
                    >
                      Message *
                    </label>

                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="How can we help you?"
                      className={`w-full resize-none rounded-xl border px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                        fieldErrors.message
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-[#252B68] focus:ring-[#252B68]/10"
                      }`}
                    />

                    {fieldErrors.message && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={12} />
                        {fieldErrors.message}
                      </p>
                    )}
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F58220] px-6 py-4 font-bold text-white transition hover:bg-[#d96e12] hover:shadow-lg disabled:opacity-60"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Enquiry"
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-500">
                    By submitting this form, you are sending an enquiry to
                    Mount View International Primary School &amp; Early Years
                    Centre.
                  </p>
                </form>
              </>
            ) : (
              <div className="flex min-h-[550px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF7EE] text-green-600">
                  <CheckCircle2 size={40} />
                </div>

                <h2 className="mt-7 text-3xl font-black text-[#252B68]">
                  Thank you for contacting us!
                </h2>

                <p className="mt-4 max-w-md leading-7 text-slate-600">
                  Your enquiry has been received by our team. We&apos;ll review
                  your message and get back to you using the contact details
                  you provided.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full bg-[#252B68] px-7 py-3 font-bold text-white transition hover:bg-[#1c2054]"
                  >
                    Send Another Message
                  </button>

                  <Link
                    href="/"
                    className="rounded-full border-2 border-[#252B68]/20 px-7 py-3 font-bold text-[#252B68] transition hover:bg-[#252B68] hover:text-white"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          LOCATION / GOOGLE MAPS
      ========================================================= */}
      <section className="bg-[#F5F6FC] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="font-bold uppercase tracking-widest text-[#F58220]">
              Find us
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Visit Mount View
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Find Mount View International Primary School &amp; Early Years
              Centre in Blantyre using Google Maps.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-xl lg:grid-cols-[1.3fr_0.7fr]">
            <div className="relative min-h-[430px] bg-[#252B68]">
              <iframe
                title="Mount View International Primary School and Early Years Centre location"
                src="https://www.google.com/maps?q=Mount%20View%20International%20Primary%20School%20and%20Early%20Years%20Centre%2C%20Blantyre%2C%20Malawi&output=embed"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="pointer-events-none absolute bottom-5 left-5 rounded-xl bg-white px-4 py-3 shadow-lg">
                <p className="text-sm font-bold text-[#252B68]">
                  Mount View International Primary School
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Blantyre, Malawi
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl">
                📍
              </div>

              <h3 className="mt-6 text-2xl font-black text-[#252B68]">
                Mount View International Primary School
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Mount View International Primary School &amp; Early Years Centre
                <br />
                Blantyre, Malawi
              </p>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-sm font-bold uppercase tracking-wider text-[#F58220]">
                  Contact
                </p>

                <a
                  href="tel:+265881668001"
                  className="mt-3 block font-semibold text-[#252B68] hover:text-[#F58220]"
                >
                  0881 668 001
                </a>

                <a
                  href="mailto:info@mountviewmw.com"
                  className="mt-2 block break-all font-semibold text-[#252B68] hover:text-[#F58220]"
                >
                  info@mountviewmw.com
                </a>
              </div>

              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#F58220] px-6 py-3.5 font-bold text-white transition hover:bg-[#d96e12]"
              >
                Open in Google Maps
                <span className="ml-2">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="font-bold uppercase tracking-widest text-[#F58220]">
              Questions
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">
              Frequently asked questions
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              Here are some common areas families may want to ask about when
              getting to know Mount View.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-[#252B68]">
                How can I enquire about admissions?
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                You can use the enquiry form on this page or visit our
                Admissions page for more information about beginning your
                child&apos;s Mount View journey.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-[#252B68]">
                What can I ask the school about?
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                Families can contact the school about admissions, curriculum,
                learning, school life, activities and other general school
                enquiries.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-[#252B68]">
                Can I arrange a school visit?
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                Please contact the school before visiting so that appropriate
                arrangements can be confirmed.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-[#252B68]">
                How will I receive a response to my enquiry?
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                When sending an enquiry, provide an accurate email address or
                phone number so that the school team can respond using your
                preferred contact details.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMISSIONS CTA
      ========================================================= */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#252B68]">
          <div className="relative px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FFE900]/10" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#F58220]/10" />

            <div className="relative">
              <p className="font-bold uppercase tracking-widest text-[#FFE900]">
                Ready to learn more?
              </p>

              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black text-white sm:text-4xl">
                Begin your child&apos;s Mount View journey.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
                Explore our admissions information or get in touch with our
                team to learn more about the school.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/admissions"
                  className="rounded-full bg-[#FFE900] px-7 py-3.5 font-bold text-[#252B68] transition hover:bg-yellow-300"
                >
                  Explore Admissions
                </Link>

                <Link
                  href="/about"
                  className="rounded-full border-2 border-white/30 px-7 py-3.5 font-bold text-white transition hover:border-white hover:bg-white/10"
                >
                  Discover Mount View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BRAND STATEMENT
      ========================================================= */}
      <section className="border-t border-slate-100 bg-white px-4 py-14 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-2xl font-black text-[#252B68] sm:text-3xl">
            Fostering growth,
            <span className="text-[#F58220]"> excellence </span>
            and
            <span className="text-[#252B68]"> empathy.</span>
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Mount View International Primary School &amp; Early Years Centre
          </p>
        </div>
      </section>
    </main>
  );
}