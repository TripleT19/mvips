"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  MoreVertical,
  Pencil,
  KeyRound,
  Mail,
  Trash2,
  X,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/*
|--------------------------------------------------------------------------
| SCHOOL EMAIL DOMAIN
|--------------------------------------------------------------------------
|
| Manual bulk creation automatically adds this domain.
|
| Example:
| john.banda
| becomes:
| john.banda@mounviewmw.com
|
*/
const SCHOOL_EMAIL_DOMAIN = "mounviewmw.com";

const MAX_BULK_USERS = 100;

type UserRole = "administrator" | "editor" | "staff";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface BulkUser {
  id: string;
  name: string;
  emailUsername: string;
  role: UserRole;
}

interface BulkResult {
  row: number;
  name: string;
  email: string;
  role: string;
  success: boolean;
  message: string;
}

interface BulkResponse {
  success: boolean;
  message?: string;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  results?: BulkResult[];
}

type ActionType =
  | "edit"
  | "reset-password"
  | "resend-activation"
  | "delete";

function createBulkRow(): BulkUser {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    name: "",
    emailUsername: "",
    role: "staff",
  };
}

function normalizeRole(value: string): UserRole | null {
  const role = value.trim().toLowerCase();

  if (role === "administrator" || role === "admin") {
    return "administrator";
  }

  if (role === "editor") {
    return "editor";
  }

  if (role === "staff") {
    return "staff";
  }

  return null;
}

function normalizeEmailUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/@.*$/, "");
}

function isValidEmailUsername(value: string): boolean {
  if (!value.trim()) return false;

  /*
   * Allows:
   * john
   * john.banda
   * john-banda
   * john_banda
   * john.banda123
   */
  return /^[a-z0-9]+([._-][a-z0-9]+)*$/i.test(value.trim());
}

function fullSchoolEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${SCHOOL_EMAIL_DOMAIN}`;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<"manual" | "csv">("manual");

  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([
    createBulkRow(),
  ]);

  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");

  const [submittingBulk, setSubmittingBulk] = useState(false);

  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(
    null
  );

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "staff" as UserRole,
    is_active: true,
  });

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error">("success");

  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkSummary, setBulkSummary] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const [showDeleteModal, setShowDeleteModal] =
    useState<UserRecord | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;

  /*
  |--------------------------------------------------------------------------
  | Load Users
  |--------------------------------------------------------------------------
  */

  async function loadUsers(page = 1, showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (roleFilter) {
        params.set("role", roleFilter);
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load the users."
        );
      }

      setUsers(Array.isArray(data.data) ? data.data : []);

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      setResultTitle("Unable to Load Users");
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading users."
      );
      setResultType("error");
      setShowResultModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1, false);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users]
  );

  const inactiveUsers = useMemo(
    () => users.filter((user) => !user.is_active).length,
    [users]
  );

  /*
  |--------------------------------------------------------------------------
  | Manual Bulk Users
  |--------------------------------------------------------------------------
  */

  function addBulkRow() {
    if (bulkUsers.length >= MAX_BULK_USERS) {
      setCsvError(
        `You can add a maximum of ${MAX_BULK_USERS} users at a time.`
      );
      return;
    }

    setCsvError("");

    setBulkUsers((current) => [...current, createBulkRow()]);
  }

  function removeBulkRow(id: string) {
    if (bulkUsers.length === 1) {
      return;
    }

    setBulkUsers((current) =>
      current.filter((user) => user.id !== id)
    );
  }

  function updateBulkUser(
    id: string,
    field: keyof BulkUser,
    value: string
  ) {
    setBulkUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user;

        if (field === "emailUsername") {
          return {
            ...user,
            emailUsername: normalizeEmailUsername(value),
          };
        }

        return {
          ...user,
          [field]: value,
        };
      })
    );

    setCsvError("");
  }

  /*
  |--------------------------------------------------------------------------
  | Duplicate Detection
  |--------------------------------------------------------------------------
  */

  const duplicateBulkEmails = useMemo(() => {
    const counts = new Map<string, number>();

    bulkUsers.forEach((user) => {
      const username = normalizeEmailUsername(user.emailUsername);

      if (!username) return;

      const email = fullSchoolEmail(username);

      counts.set(email, (counts.get(email) || 0) + 1);
    });

    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([email]) => email)
    );
  }, [bulkUsers]);

  const existingEmails = useMemo(() => {
    const emails = new Set<string>();

    users.forEach((user) => {
      if (user.email) {
        emails.add(user.email.trim().toLowerCase());
      }
    });

    return emails;
  }, [users]);

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | Existing-user checking from the current page is useful for immediate
  | feedback, but the Laravel backend MUST also check the entire database.
  |
  | We also make a request to the backend when submitting, so duplicate
  | emails on another pagination page are still caught.
  |--------------------------------------------------------------------------
  */

  function getBulkRowError(user: BulkUser): string | null {
    const username = normalizeEmailUsername(user.emailUsername);

    if (!user.name.trim()) {
      return "Name is required.";
    }

    if (!username) {
      return "Email username is required.";
    }

    if (!isValidEmailUsername(username)) {
      return "Use only letters, numbers, dots, hyphens or underscores.";
    }

    const email = fullSchoolEmail(username);

    if (duplicateBulkEmails.has(email)) {
      return "This email is duplicated in the list.";
    }

    if (existingEmails.has(email)) {
      return "Email already exists.";
    }

    return null;
  }

  const validBulkUserCount = useMemo(() => {
    return bulkUsers.filter((user) => !getBulkRowError(user)).length;
  }, [bulkUsers, duplicateBulkEmails, existingEmails]);

  /*
  |--------------------------------------------------------------------------
  | CSV Import
  |--------------------------------------------------------------------------
  |
  | Expected CSV:
  |
  | name,email,role
  | John Banda,john.banda,staff
  | Mary Phiri,mary.phiri,editor
  |
  | Full email addresses are also accepted:
  |
  | john.banda@mounviewmw.com
  |
  */

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    return result;
  }

  function importCSV(file: File) {
    setCsvError("");
    setCsvFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");

        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          setCsvError(
            "The CSV file must contain a header row and at least one user."
          );
          return;
        }

        const headers = parseCSVLine(lines[0]).map((header) =>
          header.toLowerCase().trim()
        );

        const nameIndex = headers.indexOf("name");
        const emailIndex = headers.indexOf("email");
        const roleIndex = headers.indexOf("role");

        if (nameIndex === -1 || emailIndex === -1 || roleIndex === -1) {
          setCsvError(
            "CSV must contain these columns: name, email, role."
          );
          return;
        }

        const imported: BulkUser[] = [];

        for (let i = 1; i < lines.length; i++) {
          const columns = parseCSVLine(lines[i]);

          const name = columns[nameIndex]?.trim() || "";
          let email = columns[emailIndex]?.trim().toLowerCase() || "";
          const roleValue = columns[roleIndex]?.trim() || "";

          if (!name && !email && !roleValue) {
            continue;
          }

          /*
           * Accept:
           * john.banda
           * john.banda@mounviewmw.com
           */

          if (email.includes("@")) {
            const domain = email.split("@")[1];

            if (domain !== SCHOOL_EMAIL_DOMAIN) {
              continue;
            }

            email = email.split("@")[0];
          }

          const role = normalizeRole(roleValue);

          imported.push({
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${i}-${Math.random()}`,
            name,
            emailUsername: normalizeEmailUsername(email),
            role: role || "staff",
          });

          if (imported.length >= MAX_BULK_USERS) {
            break;
          }
        }

        if (!imported.length) {
          setCsvError(
            `No valid users were found. Emails must use @${SCHOOL_EMAIL_DOMAIN}.`
          );
          return;
        }

        setBulkUsers(imported);
        setBulkMode("manual");
        setCsvError("");
      } catch {
        setCsvError(
          "The CSV file could not be read. Please check its format."
        );
      }
    };

    reader.onerror = () => {
      setCsvError("Unable to read the CSV file.");
    };

    reader.readAsText(file);
  }

  function handleCSVChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Please select a CSV file.");
      return;
    }

    importCSV(file);

    event.target.value = "";
  }

  function downloadCSVTemplate() {
    const csv = [
      "name,email,role",
      `John Banda,john.banda,staff`,
      `Mary Phiri,mary.phiri,editor`,
      `Peter Mbewe,peter.mbewe,staff`,
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mount-view-users-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  /*
  |--------------------------------------------------------------------------
  | Submit Bulk Users
  |--------------------------------------------------------------------------
  */

  async function submitBulkUsers(event: FormEvent) {
    event.preventDefault();

    setCsvError("");

    const errors = bulkUsers
      .map((user, index) => ({
        index,
        error: getBulkRowError(user),
      }))
      .filter((item) => item.error);

    if (errors.length) {
      const firstError = errors[0];

      setCsvError(
        `Please fix Row ${firstError.index + 1}: ${firstError.error}`
      );
      return;
    }

    if (!validBulkUserCount) {
      setCsvError("Please add at least one valid user.");
      return;
    }

    if (bulkUsers.length > MAX_BULK_USERS) {
      setCsvError(
        `A maximum of ${MAX_BULK_USERS} users can be added at once.`
      );
      return;
    }

    const payload = {
      users: bulkUsers.map((user) => ({
        name: user.name.trim(),
        email: fullSchoolEmail(user.emailUsername),
        role: user.role,
      })),
    };

    setSubmittingBulk(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: BulkResponse = await response.json();

      if (!response.ok && !data.results) {
        throw new Error(
          data?.message || "Unable to create the users."
        );
      }

      setBulkResults(data.results || []);

      setBulkSummary(
        data.summary || {
          total: payload.users.length,
          successful: 0,
          failed: payload.users.length,
        }
      );

      setResultTitle(
        data.summary?.failed
          ? "Bulk User Creation Completed"
          : "Users Added Successfully"
      );

      setResultMessage(
        data.message ||
          "The bulk user creation process has finished."
      );

      setResultType(
        data.summary?.failed ? "error" : "success"
      );

      setShowAddModal(false);
      setShowResultModal(true);

      setBulkUsers([createBulkRow()]);
      setCsvFileName("");

      await loadUsers(1, false);
    } catch (error) {
      setResultTitle("Unable to Add Users");
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding users."
      );
      setResultType("error");
      setShowResultModal(true);
    } finally {
      setSubmittingBulk(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Individual User Management
  |--------------------------------------------------------------------------
  */

  function openEditUser(user: UserRecord) {
    setActionMenu(null);

    setEditingUser(user);

    setEditForm({
      name: user.name,
      email: user.email,
      role:
        normalizeRole(user.role) || "staff",
      is_active: user.is_active,
    });
  }

  async function updateUser(event: FormEvent) {
    event.preventDefault();

    if (!editingUser) return;

    setProcessingAction(`edit-${editingUser.id}`);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            email: editForm.email.trim().toLowerCase(),
            role: editForm.role,
            is_active: editForm.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update the user."
        );
      }

      setEditingUser(null);

      setResultTitle("User Updated");
      setResultMessage(
        data?.message || "The user account was updated successfully."
      );
      setResultType("success");
      setShowResultModal(true);

      await loadUsers(pagination.current_page, false);
    } catch (error) {
      setResultTitle("Unable to Update User");
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the user."
      );
      setResultType("error");
      setShowResultModal(true);
    } finally {
      setProcessingAction(null);
    }
  }

  async function performAction(
    user: UserRecord,
    action: ActionType
  ) {
    setActionMenu(null);

    const actionKey = `${action}-${user.id}`;
    setProcessingAction(actionKey);

    try {
      let url = "";
      let method = "POST";

      if (action === "reset-password") {
        url = `${API_URL}/api/admin/users/${user.id}/reset-password`;
      }

      if (action === "resend-activation") {
        url = `${API_URL}/api/admin/users/${user.id}/resend-activation`;
      }

      if (action === "delete") {
        url = `${API_URL}/api/admin/users/${user.id}`;
        method = "DELETE";
      }

      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "The requested action could not be completed."
        );
      }

      let title = "Action Completed";

      if (action === "reset-password") {
        title = "Password Reset Email Sent";
      }

      if (action === "resend-activation") {
        title = "Activation Email Sent";
      }

      if (action === "delete") {
        title = "User Deleted";
      }

      setResultTitle(title);
      setResultMessage(
        data?.message || "The action was completed successfully."
      );
      setResultType("success");
      setShowResultModal(true);

      if (
        action === "delete" &&
        users.length === 1 &&
        pagination.current_page > 1
      ) {
        await loadUsers(pagination.current_page - 1, false);
      } else {
        await loadUsers(pagination.current_page, false);
      }
    } catch (error) {
      setResultTitle("Action Failed");
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
      setResultType("error");
      setShowResultModal(true);
    } finally {
      setProcessingAction(null);
      setShowDeleteModal(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Open Add Modal
  |--------------------------------------------------------------------------
  */

  function openAddModal() {
    setBulkUsers([createBulkRow()]);
    setBulkMode("manual");
    setCsvError("");
    setCsvFileName("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (submittingBulk) return;

    setShowAddModal(false);
    setCsvError("");
    setCsvFileName("");
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage Mount View administration accounts and access.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 transition hover:bg-[#df7014]"
        >
          <UserPlus size={18} />
          Add Users
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Users
              </p>

              <p className="mt-2 text-3xl font-bold text-[#252B68]">
                {pagination.total}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#252B68]/10">
              <Users className="text-[#252B68]" size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {activeUsers}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <UserCheck className="text-emerald-600" size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inactive
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {inactiveUsers}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <UserX className="text-amber-600" size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Users Listing */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="border-b border-slate-200 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white"
            >
              <option value="">All roles</option>
              <option value="administrator">Administrator</option>
              <option value="editor">Editor</option>
              <option value="staff">Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadUsers(pagination.current_page, false);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin text-[#F58220]"
              />
              Loading users...
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Users size={28} className="text-slate-400" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#172033]">
              No users found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              No accounts match your current search or filter.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Add Users
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Added
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isProcessing =
                      processingAction?.endsWith(`-${user.id}`);

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68] text-sm font-bold text-white">
                              {user.name
                                ?.split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </div>

                            <div>
                              <p className="font-semibold text-[#172033]">
                                {user.name}
                              </p>

                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-[#252B68]/10 px-3 py-1 text-xs font-semibold capitalize text-[#252B68]">
                            {user.role === "administrator"
                              ? "Administrator"
                              : user.role}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Awaiting Activation
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              disabled={Boolean(isProcessing)}
                              onClick={() =>
                                setActionMenu(
                                  actionMenu === user.id
                                    ? null
                                    : user.id
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#252B68] disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2
                                  size={19}
                                  className="animate-spin"
                                />
                              ) : (
                                <MoreVertical size={19} />
                              )}
                            </button>

                            {actionMenu === user.id && (
                              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => openEditUser(user)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil size={16} />
                                  Edit Account
                                </button>

                                {user.is_active ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      performAction(
                                        user,
                                        "reset-password"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <KeyRound size={16} />
                                    Reset Password
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      performAction(
                                        user,
                                        "resend-activation"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Mail size={16} />
                                    Resend Activation
                                  </button>
                                )}

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowDeleteModal(user)
                                  }
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                  Delete Account
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {users.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.total}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.current_page <= 1}
                  onClick={() =>
                    loadUsers(pagination.current_page - 1)
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-500">
                  Page {pagination.current_page} of{" "}
                  {pagination.last_page}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.current_page >= pagination.last_page
                  }
                  onClick={() =>
                    loadUsers(pagination.current_page + 1)
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================================================================ */}
      {/* ADD USERS MODAL                                                   */}
      {/* ================================================================ */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">
                  Add Users
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Create multiple school administration accounts at once.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={submittingBulk}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="border-b border-slate-200 px-5 pt-4 sm:px-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkMode("manual");
                    setCsvError("");
                  }}
                  className={`rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    bulkMode === "manual"
                      ? "border-[#F58220] text-[#F58220]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users size={17} />
                    Manual Entry
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBulkMode("csv");
                    setCsvError("");
                  }}
                  className={`rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    bulkMode === "csv"
                      ? "border-[#F58220] text-[#F58220]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileSpreadsheet size={17} />
                    Import CSV
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {bulkMode === "manual" ? (
                <>
                  {/* School email information */}
                  <div className="mb-5 rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#252B68] shadow-sm">
                        <Mail size={19} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#252B68]">
                          School Email Accounts
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          Enter only the email username. The system will
                          automatically add{" "}
                          <span className="font-semibold text-[#252B68]">
                            @{SCHOOL_EMAIL_DOMAIN}
                          </span>
                          .
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Example:{" "}
                          <span className="font-medium">
                            john.banda
                          </span>{" "}
                          →{" "}
                          <span className="font-medium">
                            john.banda@{SCHOOL_EMAIL_DOMAIN}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {csvError && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p>{csvError}</p>
                    </div>
                  )}

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="w-12 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                            #
                          </th>

                          <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                            Full Name
                          </th>

                          <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                            School Email
                          </th>

                          <th className="w-44 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                            Role
                          </th>

                          <th className="w-14 px-3 py-3" />
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {bulkUsers.map((user, index) => {
                          const rowError = getBulkRowError(user);

                          const email =
                            user.emailUsername.trim()
                              ? fullSchoolEmail(
                                  user.emailUsername
                                )
                              : "";

                          return (
                            <tr key={user.id}>
                              <td className="px-3 py-3 text-center text-sm font-medium text-slate-400">
                                {index + 1}
                              </td>

                              <td className="px-3 py-3 align-top">
                                <input
                                  type="text"
                                  value={user.name}
                                  onChange={(event) =>
                                    updateBulkUser(
                                      user.id,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g. John Banda"
                                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2 ${
                                    !user.name.trim()
                                      ? "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
                                      : "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
                                  }`}
                                />

                                {rowError &&
                                  !user.name.trim() && (
                                    <p className="mt-1 text-xs text-red-600">
                                      Name is required.
                                    </p>
                                  )}
                              </td>

                              <td className="px-3 py-3 align-top">
                                <div className="flex h-11">
                                  <input
                                    type="text"
                                    value={user.emailUsername}
                                    onChange={(event) =>
                                      updateBulkUser(
                                        user.id,
                                        "emailUsername",
                                        event.target.value
                                      )
                                    }
                                    placeholder="john.banda"
                                    className={`min-w-0 flex-1 rounded-l-xl border px-3 text-sm outline-none transition focus:ring-2 ${
                                      rowError &&
                                      (rowError.includes(
                                        "already"
                                      ) ||
                                        rowError.includes(
                                          "duplicated"
                                        ) ||
                                        rowError.includes(
                                          "Email"
                                        ))
                                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                                        : "border-slate-200 bg-white focus:border-[#252B68] focus:ring-[#252B68]/10"
                                    }`}
                                  />

                                  <div className="flex items-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                                    @{SCHOOL_EMAIL_DOMAIN}
                                  </div>
                                </div>

                                {email && (
                                  <p
                                    className={`mt-1 text-xs ${
                                      rowError
                                        ? "text-red-600"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {rowError || email}
                                  </p>
                                )}
                              </td>

                              <td className="px-3 py-3 align-top">
                                <select
                                  value={user.role}
                                  onChange={(event) =>
                                    updateBulkUser(
                                      user.id,
                                      "role",
                                      event.target.value
                                    )
                                  }
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                                >
                                  <option value="staff">
                                    Staff
                                  </option>

                                  <option value="editor">
                                    Editor
                                  </option>

                                  <option value="administrator">
                                    Administrator
                                  </option>
                                </select>
                              </td>

                              <td className="px-3 py-3 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeBulkRow(user.id)
                                  }
                                  disabled={
                                    bulkUsers.length === 1
                                  }
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                  title="Remove row"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Existing / duplicate warning summary */}
                  {(duplicateBulkEmails.size > 0 ||
                    bulkUsers.some(
                      (user) =>
                        existingEmails.has(
                          fullSchoolEmail(
                            normalizeEmailUsername(
                              user.emailUsername
                            )
                          )
                        )
                    )) && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={19}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <div>
                          <p className="text-sm font-bold text-amber-800">
                            Duplicate email addresses detected
                          </p>

                          <p className="mt-1 text-sm text-amber-700">
                            An email address already exists or has
                            been entered more than once. Please fix
                            the highlighted row before continuing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add row */}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={addBulkRow}
                      disabled={
                        bulkUsers.length >= MAX_BULK_USERS
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#252B68]/30 px-4 py-2.5 text-sm font-semibold text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68]/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={17} />
                      Add Another User
                    </button>

                    <p className="text-xs text-slate-400">
                      {bulkUsers.length} / {MAX_BULK_USERS} users
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* CSV import */}
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Upload
                        size={24}
                        className="text-[#252B68]"
                      />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-[#172033]">
                      Import users from CSV
                    </h3>

                    <p className="mx-auto mt-1 max-w-lg text-sm leading-relaxed text-slate-500">
                      Upload a CSV containing the user name, school
                      email username and role. The system will
                      automatically apply{" "}
                      <strong>
                        @{SCHOOL_EMAIL_DOMAIN}
                      </strong>
                      .
                    </p>

                    <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d2255]">
                        <Upload size={17} />
                        Choose CSV File

                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCSVChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={downloadCSVTemplate}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Download size={17} />
                        Download Template
                      </button>
                    </div>

                    {csvFileName && (
                      <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm">
                        <FileSpreadsheet
                          size={17}
                          className="text-emerald-600"
                        />
                        {csvFileName}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-[#252B68]/10 bg-[#252B68]/5 p-4">
                    <p className="text-sm font-bold text-[#252B68]">
                      CSV format
                    </p>

                    <div className="mt-3 overflow-x-auto rounded-lg bg-[#172033] p-4">
                      <code className="whitespace-pre text-xs text-white/90">
{`name,email,role
John Banda,john.banda,staff
Mary Phiri,mary.phiri,editor
Peter Mbewe,peter.mbewe,staff`}
                      </code>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      You may also provide the full school email,
                      for example{" "}
                      <span className="font-semibold">
                        john.banda@{SCHOOL_EMAIL_DOMAIN}
                      </span>
                      . Other email domains will not be accepted.
                    </p>
                  </div>

                  {csvError && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p>{csvError}</p>
                    </div>
                  )}

                  {/* Imported users preview */}
                  {bulkUsers.length > 0 && csvFileName && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#172033]">
                            Imported Users
                          </h3>

                          <p className="text-xs text-slate-500">
                            Review the users before creating their
                            accounts.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBulkMode("manual")}
                          className="text-sm font-semibold text-[#252B68] hover:underline"
                        >
                          Review & Edit
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                #
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Name
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Email
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Role
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {bulkUsers.map((user, index) => {
                              const error =
                                getBulkRowError(user);

                              return (
                                <tr key={user.id}>
                                  <td className="px-4 py-3 text-sm text-slate-400">
                                    {index + 1}
                                  </td>

                                  <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                    {user.name || "—"}
                                  </td>

                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {user.emailUsername
                                      ? fullSchoolEmail(
                                          user.emailUsername
                                        )
                                      : "—"}
                                  </td>

                                  <td className="px-4 py-3 text-sm capitalize text-slate-600">
                                    {user.role}
                                  </td>

                                  <td className="px-4 py-3">
                                    {error ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                        <AlertCircle size={13} />
                                        {error}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        Ready
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-[#252B68]">
                  {validBulkUserCount}
                </span>{" "}
                user
                {validBulkUserCount === 1 ? "" : "s"} ready to
                create
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={submittingBulk}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitBulkUsers}
                  disabled={
                    submittingBulk ||
                    validBulkUserCount === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 transition hover:bg-[#df7014] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingBulk ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Creating Users...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create {validBulkUserCount || ""} User
                      {validBulkUserCount === 1 ? "" : "s"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* EDIT USER MODAL                                                   */}
      {/* ================================================================ */}

      {editingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">
                  Edit User
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update this account's details and access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={updateUser}>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Role
                  </label>

                  <select
                    value={editForm.role}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        role: event.target.value as UserRole,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  >
                    <option value="staff">Staff</option>
                    <option value="editor">Editor</option>
                    <option value="administrator">
                      Administrator
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Account Status
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Control whether this user can sign in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((current) => ({
                        ...current,
                        is_active: !current.is_active,
                      }))
                    }
                    className={`relative h-6 w-11 rounded-full transition ${
                      editForm.is_active
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        editForm.is_active
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    processingAction ===
                    `edit-${editingUser.id}`
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
                >
                  {processingAction ===
                  `edit-${editingUser.id}` ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DELETE MODAL                                                      */}
      {/* ================================================================ */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Trash2 size={22} className="text-red-600" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                Delete User Account?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                You are about to permanently delete{" "}
                <span className="font-semibold text-slate-700">
                  {showDeleteModal.name}
                </span>
                . This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  performAction(showDeleteModal, "delete")
                }
                disabled={
                  processingAction ===
                  `delete-${showDeleteModal.id}`
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processingAction ===
                `delete-${showDeleteModal.id}` ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* RESULT MODAL                                                      */}
      {/* ================================================================ */}

      {showResultModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  resultType === "success"
                    ? "bg-emerald-50"
                    : "bg-red-50"
                }`}
              >
                {resultType === "success" ? (
                  <CheckCircle2
                    size={23}
                    className="text-emerald-600"
                  />
                ) : (
                  <AlertCircle
                    size={23}
                    className="text-red-600"
                  />
                )}
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                {resultTitle}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {resultMessage}
              </p>

              {/* Bulk results */}
              {bulkSummary && bulkResults.length > 0 && (
                <div className="mt-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xl font-bold text-[#252B68]">
                        {bulkSummary.total}
                      </p>

                      <p className="text-xs text-slate-500">
                        Total
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">
                        {bulkSummary.successful}
                      </p>

                      <p className="text-xs text-emerald-700">
                        Created
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 p-3 text-center">
                      <p className="text-xl font-bold text-red-600">
                        {bulkSummary.failed}
                      </p>

                      <p className="text-xs text-red-700">
                        Failed
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                    <div className="divide-y divide-slate-100">
                      {bulkResults.map((result) => (
                        <div
                          key={`${result.row}-${result.email}`}
                          className="flex items-start gap-3 p-3"
                        >
                          {result.success ? (
                            <CheckCircle2
                              size={18}
                              className="mt-0.5 shrink-0 text-emerald-500"
                            />
                          ) : (
                            <AlertCircle
                              size={18}
                              className="mt-0.5 shrink-0 text-red-500"
                            />
                          )}

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700">
                              {result.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {result.email}
                            </p>

                            <p
                              className={`mt-1 text-xs ${
                                result.success
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {result.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  setBulkResults([]);
                  setBulkSummary(null);
                }}
                className="rounded-xl bg-[#252B68] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close action menu when clicking elsewhere */}
      {actionMenu !== null && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setActionMenu(null)}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}
    </div>
  );
}