"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN_KEY = "admin_token";

type ContactMessage = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  enquiry_type: string;
  child_name: string | null;
  class_name: string | null;
  message: string;
  reply_body: string | null;
  status: string;
  replied_at: string | null;
  created_at: string;
  replayer?: { id: number; name: string } | null;
  handler?: { id: number; name: string } | null;
};

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (json) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminContactMessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [selected, setSelected] = useState<ContactMessage | null>(null);

  async function load(page = 1, opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "25");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(
        `${API_URL}/api/admin/contact-messages?${params.toString()}`,
        { headers: authHeaders(), cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Unable to load messages.");

      setItems(Array.isArray(json.data?.data) ? json.data.data : []);
      setPagination({
        current_page: json.data?.current_page ?? 1,
        last_page: json.data?.last_page ?? 1,
        total: json.data?.total ?? 0,
      });
    } catch (e: any) {
      setError(e?.message || "Unable to load messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, { silent: true }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function openMessage(msg: ContactMessage) {
    setSelected(msg);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/contact-messages/${msg.id}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const json = await res.json();
        setSelected(json.data);
      }
    } catch {
      /* non-fatal */
    }
    // Refresh list so status reflects read
    load(pagination.current_page, { silent: true });
  }

  async function updateStatus(msg: ContactMessage, status: string) {
    try {
      await fetch(`${API_URL}/api/admin/contact-messages/${msg.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ status }),
      });
      setToast({ type: "success", message: "Message updated." });
      setSelected(null);
      await load(pagination.current_page, { silent: true });
    } catch {
      setToast({ type: "error", message: "Failed to update message." });
    }
  }

  async function removeMessage(msg: ContactMessage) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${API_URL}/api/admin/contact-messages/${msg.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setToast({ type: "success", message: "Message deleted." });
      setSelected(null);
      await load(pagination.current_page, { silent: true });
    } catch {
      setToast({ type: "error", message: "Failed to delete message." });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
              <Mail size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Mount View Admin
              </p>
              <h1 className="text-base font-black text-[#252B68]">
                Contact Messages
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              load(pagination.current_page, { silent: true });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {toast && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or message…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#252B68]"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading messages…
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Mail size={22} />
              </div>
              <p className="mt-4 font-bold text-[#172033]">No messages yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Enquiries from the contact form will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">Received</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#172033]">
                            {m.full_name}
                          </p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-[#252B68]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#252B68]">
                            {m.enquiry_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p className="line-clamp-1 max-w-xs">{m.message}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(m.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                              m.status === "new"
                                ? "bg-[#F58220]/10 text-[#F58220]"
                                : m.status === "read"
                                ? "bg-blue-50 text-blue-700"
                                : m.status === "replied"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openMessage(m)}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#252B68] hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMessage(m)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            aria-label="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Page {pagination.current_page} of {pagination.last_page} ·{" "}
                    {pagination.total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pagination.current_page <= 1}
                      onClick={() => load(pagination.current_page - 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      disabled={
                        pagination.current_page >= pagination.last_page
                      }
                      onClick={() => load(pagination.current_page + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <MessageModal
          message={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => updateStatus(selected, status)}
          onDelete={() => removeMessage(selected)}
          onReplied={async (updated) => {
            setSelected(updated);
            setToast({
              type: "success",
              message: `Reply sent to ${updated.email}`,
            });
            await load(pagination.current_page, { silent: true });
          }}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------
| Message Modal (with reply form)
------------------------------------------------------------------ */

function MessageModal({
  message,
  onClose,
  onStatusChange,
  onDelete,
  onReplied,
}: {
  message: ContactMessage;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onReplied: (updated: ContactMessage) => Promise<void>;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(
    message.status !== "replied"
  );

  async function sendReply() {
    if (!replyBody.trim()) {
      setReplyError("Please write a reply before sending.");
      return;
    }

    setSending(true);
    setReplyError("");

    try {
      const res = await fetch(
        `${API_URL}/api/admin/contact-messages/${message.id}/reply`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({ reply_body: replyBody.trim() }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.message || "Failed to send the reply. Please try again."
        );
      }

      const updated: ContactMessage = json.data ?? {
        ...message,
        reply_body: replyBody.trim(),
        status: "replied",
        replied_at: new Date().toISOString(),
      };

      await onReplied(updated);
    } catch (e: any) {
      setReplyError(e?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              Contact Enquiry · #{message.id}
            </p>
            <h2 className="mt-1 text-lg font-black">{message.full_name}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          {/* Contact details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email
              </p>
              <a
                href={`mailto:${message.email}`}
                className="mt-1 block break-all font-semibold text-[#F58220] hover:underline"
              >
                {message.email}
              </a>
            </div>

            {message.phone && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phone
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {message.phone}
                </p>
              </div>
            )}
          </div>

          {(message.child_name || message.class_name) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {message.child_name && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Child
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {message.child_name}
                  </p>
                </div>
              )}
              {message.class_name && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {message.class_name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Original message */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Message
            </p>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
              {message.message}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Received {formatDate(message.created_at)}
            </p>
          </div>

          {/* Existing reply (if any) */}
          {message.reply_body && message.replied_at && (
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <MailCheck size={13} />
                Your reply · {formatDate(message.replied_at)}
              </p>
              <p className="mt-2 whitespace-pre-line rounded-xl border border-emerald-100 bg-emerald-50 p-4 leading-7 text-emerald-900">
                {message.reply_body}
              </p>
              {message.replayer && (
                <p className="mt-2 text-xs text-emerald-700/70">
                  Sent by {message.replayer.name}
                </p>
              )}
            </div>
          )}

          {/* Reply form */}
          {showReplyBox ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#252B68]">
                Write a reply
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This will be emailed to{" "}
                <span className="font-semibold text-slate-700">
                  {message.email}
                </span>
                . The original message will be included for context.
              </p>

              <textarea
                rows={6}
                value={replyBody}
                onChange={(e) => {
                  setReplyBody(e.target.value);
                  setReplyError("");
                }}
                placeholder="Dear Parent, thank you for your enquiry…"
                className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
                disabled={sending}
              />

              {replyError && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle size={13} />
                  {replyError}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {message.status === "replied" && (
                  <button
                    type="button"
                    onClick={() => setShowReplyBox(false)}
                    disabled={sending}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={sendReply}
                  disabled={sending || !replyBody.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F58220] px-5 py-2 text-xs font-bold text-white hover:bg-[#d96e12] disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">
                  This message has already been replied to.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReplyBox(true)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  Reply Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStatusChange("read")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Mark as Read
            </button>
            <button
              type="button"
              onClick={() => onStatusChange("archived")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Archive
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#252B68] px-5 py-2 text-xs font-bold text-white hover:bg-[#1c2156]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}