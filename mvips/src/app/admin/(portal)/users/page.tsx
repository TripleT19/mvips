"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

/* ============================================================
 * CONFIG
 * ============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SCHOOL_EMAIL_DOMAIN = "mountviewmw.com";
const MAX_BULK_USERS = 100;
const TOKEN_KEY = "admin_token";

/* ============================================================
 * ROLES — 10 canonical roles
 *
 *   Admin · Headteacher · Admissions Officer · Bursar
 *   Lead Teacher · Class Teacher · Assistant Teacher · Specialist Teacher
 *   Editor · Staff
 * ============================================================ */

type UserRole =
  | "admin"
  | "headteacher"
  | "admissions_officer"
  | "bursar"
  | "lead_teacher"
  | "class_teacher"
  | "assistant_teacher"
  | "specialist_teacher"
  | "editor"
  | "staff";

type RoleGroup = "Leadership" | "Teaching" | "Operations" | "Support";

interface RoleOption {
  value: UserRole;
  label: string;
  group: RoleGroup;
  description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  // ── Leadership ────────────────────────────────────────────────
  {
    value: "admin",
    label: "Administrator",
    group: "Leadership",
    description:
      "Full access to every module including user management and system settings.",
  },
  {
    value: "headteacher",
    label: "Headteacher",
    group: "Leadership",
    description:
      "School head. Approves admission decisions, signs off report cards and oversees all academics.",
  },

  // ── Teaching ──────────────────────────────────────────────────
  {
    value: "lead_teacher",
    label: "Lead Teacher",
    group: "Teaching",
    description:
      "Stream lead. Reviews grades and signs off results across their stream.",
  },
  {
    value: "class_teacher",
    label: "Class Teacher",
    group: "Teaching",
    description:
      "Manages their class: registers, all-subject grades, traits and comments.",
  },
  {
    value: "assistant_teacher",
    label: "Assistant Teacher",
    group: "Teaching",
    description:
      "Supports a class teacher with attendance and grade entry.",
  },
  {
    value: "specialist_teacher",
    label: "Specialist Teacher",
    group: "Teaching",
    description:
      "Teaches a single subject (Music, Art, PE, ICT, Languages, Computing, …). Can grade only the subjects assigned to them.",
  },

  // ── Operations ────────────────────────────────────────────────
  {
    value: "admissions_officer",
    label: "Admissions Officer",
    group: "Operations",
    description:
      "Manages applications, documents, assessments and admission decisions.",
  },
  {
    value: "bursar",
    label: "Bursar",
    group: "Operations",
    description:
      "Manages school finances, fee records, payments and financial reporting.",
  },
  {
    value: "editor",
    label: "Editor",
    group: "Operations",
    description:
      "Creates and edits stories, events, gallery albums and newsletters.",
  },

  // ── Support ───────────────────────────────────────────────────
  {
    value: "staff",
    label: "Staff",
    group: "Support",
    description:
      "General staff account with portal access and limited write permissions.",
  },
];

const ROLE_GROUPS: { group: RoleGroup; label: string }[] = [
  { group: "Leadership", label: "Leadership" },
  { group: "Teaching", label: "Teaching" },
  { group: "Operations", label: "Operations" },
  { group: "Support", label: "Support" },
];

const GROUP_COLORS: Record<RoleGroup, string> = {
  Leadership: "bg-purple-50 text-purple-700",
  Teaching: "bg-blue-50 text-blue-700",
  Operations: "bg-amber-50 text-amber-700",
  Support: "bg-slate-100 text-slate-700",
};

function rolesInGroup(group: RoleGroup): RoleOption[] {
  return ROLE_OPTIONS.filter((r) => r.group === group);
}

/* ============================================================
 * TYPES
 * ============================================================ */

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
  summary?: { total: number; successful: number; failed: number };
  results?: BulkResult[];
}

type ActionType = "edit" | "reset-password" | "resend-activation" | "delete";

interface ActionMenuState {
  user: UserRecord;
  top: number;
  left: number;
}

const ACTION_MENU_WIDTH = 224;
const ACTION_MENU_HEIGHT = 200;
const ACTION_MENU_OFFSET = 6;

/* ============================================================
 * HELPERS
 * ============================================================ */

function createBulkRow(): BulkUser {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    name: "",
    emailUsername: "",
    role: "class_teacher",
  };
}

/**
 * Collapse any known role spelling into the canonical 10-role set.
 *
 * Legacy / specialist variants (from earlier versions of the system)
 * are mapped so existing accounts keep rendering correctly:
 *   administrator       → admin
 *   principal / head_*  → headteacher
 *   hod / deputy_head   → lead_teacher
 *   stream_lead         → lead_teacher
 *   teacher / club_lead → class_teacher
 *   teaching_assistant  → assistant_teacher
 *   accountant / finance → bursar
 *   content_editor      → editor
 *
 * Every specialist variant collapses into specialist_teacher:
 *   subject_teacher, specialist, music_teacher, art_teacher, pe_teacher,
 *   ict_teacher, computing_teacher, computer_teacher, swimming_teacher,
 *   dance_teacher, drama_teacher, language_teacher, languages_teacher,
 *   foreign_language_teacher, reading_teacher, library_teacher,
 *   librarian, science_teacher, maths_teacher, math_teacher,
 *   english_teacher, history_teacher, geography_teacher
 */
function normalizeRole(value: string): UserRole | null {
  const role = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (role) {
    case "admin":
    case "administrator":
      return "admin";

    case "headteacher":
    case "head_teacher":
    case "head":
    case "headmaster":
    case "principal":
      return "headteacher";

    case "lead_teacher":
    case "stream_lead":
    case "hod":
    case "h_o_d":
    case "head_of_department":
    case "deputy_head":
    case "deputy":
      return "lead_teacher";

    case "class_teacher":
    case "teacher":
    case "club_lead":
      return "class_teacher";

    case "assistant_teacher":
    case "teaching_assistant":
    case "assistant":
    case "ta":
      return "assistant_teacher";

    // Specialist teachers — every variant rolls into specialist_teacher
    case "specialist_teacher":
    case "specialist":
    case "special_teacher":
    case "spec_teacher":
    case "subject_teacher":
    case "music_teacher":
    case "art_teacher":
    case "pe_teacher":
    case "sports_teacher":
    case "ict_teacher":
    case "computing_teacher":
    case "computer_teacher":
    case "swimming_teacher":
    case "dance_teacher":
    case "drama_teacher":
    case "language_teacher":
    case "languages_teacher":
    case "foreign_language_teacher":
    case "reading_teacher":
    case "library_teacher":
    case "librarian":
    case "science_teacher":
    case "maths_teacher":
    case "math_teacher":
    case "english_teacher":
    case "history_teacher":
    case "geography_teacher":
      return "specialist_teacher";

    case "admissions_officer":
    case "admission_officer":
    case "admissions":
      return "admissions_officer";

    case "bursar":
    case "finance":
    case "finance_officer":
    case "accountant":
      return "bursar";

    case "editor":
    case "content_editor":
      return "editor";

    case "staff":
      return "staff";

    default:
      return null;
  }
}

function roleLabel(role?: string | null): string {
  if (!role) return "—";
  const normalized = normalizeRole(role);
  if (normalized) {
    return ROLE_OPTIONS.find((r) => r.value === normalized)?.label ?? normalized;
  }
  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function roleDescription(role?: string | null): string | null {
  const normalized = normalizeRole(role ?? "");
  return normalized
    ? ROLE_OPTIONS.find((r) => r.value === normalized)?.description ?? null
    : null;
}

function roleColor(role?: string | null): string {
  const normalized = normalizeRole(role ?? "");
  const option = ROLE_OPTIONS.find((r) => r.value === normalized);
  return option ? GROUP_COLORS[option.group] : GROUP_COLORS.Support;
}

function normalizeEmailUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ".").replace(/@.*$/, "");
}

function isValidEmailUsername(value: string): boolean {
  if (!value.trim()) return false;
  return /^[a-z0-9]+([._-][a-z0-9]+)*$/i.test(value.trim());
}

function fullSchoolEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${SCHOOL_EMAIL_DOMAIN}`;
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name?: string): string {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

/* ============================================================
 * MAIN PAGE
 * ============================================================ */

export default function UsersPage() {
  /* ----------- Data ----------- */
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

  /* ----------- Add modal ----------- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<"manual" | "csv">("manual");
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([createBulkRow()]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [submittingBulk, setSubmittingBulk] = useState(false);

  /* ----------- Row actions ----------- */
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  /* ----------- Edit modal ----------- */
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "class_teacher" as UserRole,
    is_active: true,
  });

  /* ----------- Result modal ----------- */
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

  /* ----------- Delete confirm ----------- */
  const [showDeleteModal, setShowDeleteModal] = useState<UserRecord | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  /* -------- Action menu auto-close -------- */
  useEffect(() => {
    if (!actionMenu) return;
    const close = () => setActionMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenu]);

  /* -------- Load users -------- */
  async function loadUsers(page = 1, showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load the users.");
      }

      setUsers(Array.isArray(data.data) ? data.data : []);
      if (data.pagination) setPagination(data.pagination);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(1, false), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  /* -------- Stats -------- */
  const activeUsers = useMemo(
    () => users.filter((u) => u.is_active).length,
    [users]
  );
  const inactiveUsers = useMemo(
    () => users.filter((u) => !u.is_active).length,
    [users]
  );

  /* -------- Bulk row ops -------- */
  function addBulkRow() {
    if (bulkUsers.length >= MAX_BULK_USERS) {
      setCsvError(`You can add a maximum of ${MAX_BULK_USERS} users at a time.`);
      return;
    }
    setCsvError("");
    setBulkUsers((current) => [...current, createBulkRow()]);
  }

  function removeBulkRow(id: string) {
    if (bulkUsers.length === 1) return;
    setBulkUsers((current) => current.filter((u) => u.id !== id));
  }

  function updateBulkUser(id: string, field: keyof BulkUser, value: string) {
    setBulkUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user;
        if (field === "emailUsername") {
          return { ...user, emailUsername: normalizeEmailUsername(value) };
        }
        return { ...user, [field]: value };
      })
    );
    setCsvError("");
  }

  /* -------- Duplicate detection -------- */
  const duplicateBulkEmails = useMemo(() => {
    const counts = new Map<string, number>();
    bulkUsers.forEach((user) => {
      const username = normalizeEmailUsername(user.emailUsername);
      if (!username) return;
      const email = fullSchoolEmail(username);
      counts.set(email, (counts.get(email) || 0) + 1);
    });
    return new Set(
      [...counts.entries()].filter(([, c]) => c > 1).map(([email]) => email)
    );
  }, [bulkUsers]);

  const existingEmails = useMemo(() => {
    const emails = new Set<string>();
    users.forEach((u) => {
      if (u.email) emails.add(u.email.trim().toLowerCase());
    });
    return emails;
  }, [users]);

  function getBulkRowError(user: BulkUser): string | null {
    const username = normalizeEmailUsername(user.emailUsername);
    if (!user.name.trim()) return "Name is required.";
    if (!username) return "Email username is required.";
    if (!isValidEmailUsername(username)) {
      return "Use only letters, numbers, dots, hyphens or underscores.";
    }
    const email = fullSchoolEmail(username);
    if (duplicateBulkEmails.has(email)) return "This email is duplicated in the list.";
    if (existingEmails.has(email)) return "Email already exists.";
    return null;
  }

  const validBulkUserCount = useMemo(
    () => bulkUsers.filter((u) => !getBulkRowError(u)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulkUsers, duplicateBulkEmails, existingEmails]
  );

  /* -------- CSV import -------- */
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
        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
        const nameIndex = headers.indexOf("name");
        const emailIndex = headers.indexOf("email");
        const roleIndex = headers.indexOf("role");
        if (nameIndex === -1 || emailIndex === -1 || roleIndex === -1) {
          setCsvError("CSV must contain these columns: name, email, role.");
          return;
        }
        const imported: BulkUser[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[nameIndex]?.trim() || "";
          let email = cols[emailIndex]?.trim().toLowerCase() || "";
          const roleValue = cols[roleIndex]?.trim() || "";
          if (!name && !email && !roleValue) continue;
          if (email.includes("@")) {
            const domain = email.split("@")[1];
            if (domain !== SCHOOL_EMAIL_DOMAIN) continue;
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
            role: role || "class_teacher",
          });
          if (imported.length >= MAX_BULK_USERS) break;
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
        setCsvError("The CSV file could not be read. Please check its format.");
      }
    };
    reader.onerror = () => setCsvError("Unable to read the CSV file.");
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
      "John Banda,john.banda,class_teacher",
      "Grace Tembo,grace.tembo,headteacher",
      "Patrick Chirwa,patrick.chirwa,admissions_officer",
      "Ruth Kalua,ruth.kalua,bursar",
      "Daniel Moyo,daniel.moyo,lead_teacher",
      "David Kumwenda,david.kumwenda,assistant_teacher",
      "Memory Phiri,memory.phiri,specialist_teacher",
      "Alice Mvula,alice.mvula,editor",
      "Susan Msiska,susan.msiska,staff",
      "Peter Mbewe,peter.mbewe,admin",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mount-view-users-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  /* -------- Submit bulk -------- */
  async function submitBulkUsers(event: FormEvent) {
    event.preventDefault();
    setCsvError("");

    const errors = bulkUsers
      .map((user, index) => ({ index, error: getBulkRowError(user) }))
      .filter((item) => item.error);

    if (errors.length) {
      const first = errors[0];
      setCsvError(`Please fix Row ${first.index + 1}: ${first.error}`);
      return;
    }
    if (!validBulkUserCount) {
      setCsvError("Please add at least one valid user.");
      return;
    }
    if (bulkUsers.length > MAX_BULK_USERS) {
      setCsvError(`A maximum of ${MAX_BULK_USERS} users can be added at once.`);
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
        throw new Error(data?.message || "Unable to create the users.");
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
        data.message || "The bulk user creation process has finished."
      );
      setResultType(data.summary?.failed ? "error" : "success");
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

  /* -------- Action menu -------- */
  function openActionMenu(
    user: UserRecord,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - ACTION_MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + ACTION_MENU_WIDTH > vw - 8) left = vw - ACTION_MENU_WIDTH - 8;

    const spaceBelow = vh - rect.bottom - ACTION_MENU_OFFSET;
    const top =
      spaceBelow < ACTION_MENU_HEIGHT
        ? Math.max(8, rect.top - ACTION_MENU_HEIGHT - ACTION_MENU_OFFSET)
        : rect.bottom + ACTION_MENU_OFFSET;

    setActionMenu({ user, top, left });
  }
  function closeActionMenu() {
    setActionMenu(null);
  }

  /* -------- Edit -------- */
  function openEditUser(user: UserRecord) {
    closeActionMenu();
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role) || "class_teacher",
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
        throw new Error(data?.message || "Unable to update the user.");
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

  /* -------- Row actions -------- */
  async function performAction(user: UserRecord, action: ActionType) {
    closeActionMenu();
    const key = `${action}-${user.id}`;
    setProcessingAction(key);
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

      const title =
        action === "reset-password"
          ? "Password Reset Email Sent"
          : action === "resend-activation"
          ? "Activation Email Sent"
          : action === "delete"
          ? "User Deleted"
          : "Action Completed";

      setResultTitle(title);
      setResultMessage(data?.message || "The action was completed successfully.");
      setResultType("success");
      setShowResultModal(true);

      if (action === "delete" && users.length === 1 && pagination.current_page > 1) {
        await loadUsers(pagination.current_page - 1, false);
      } else {
        await loadUsers(pagination.current_page, false);
      }
    } catch (error) {
      setResultTitle("Action Failed");
      setResultMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setResultType("error");
      setShowResultModal(true);
    } finally {
      setProcessingAction(null);
      setShowDeleteModal(null);
    }
  }

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

  /* -------- Render -------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage every Mount View staff account and their portal role.
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
        <StatCard
          label="Total Users"
          value={pagination.total}
          icon={<Users className="text-[#252B68]" size={23} />}
          bg="bg-[#252B68]/10"
          color="text-[#252B68]"
        />
        <StatCard
          label="Active"
          value={activeUsers}
          icon={<UserCheck className="text-emerald-600" size={23} />}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <StatCard
          label="Inactive"
          value={inactiveUsers}
          icon={<UserX className="text-amber-600" size={23} />}
          bg="bg-amber-50"
          color="text-amber-600"
        />
      </div>

      {/* Listing */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="border-b border-slate-200 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
              />
            </div>
            <RoleSelect
              value={roleFilter}
              onChange={setRoleFilter}
              includeAllOption
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-[#F58220]" />
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
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    {["User", "Email", "Role", "Status", "Added", "Actions"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                            i === 5 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const isProcessing =
                      processingAction?.endsWith(`-${user.id}`) ?? false;
                    const isMenuOpen = actionMenu?.user.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68] text-sm font-bold text-white">
                              {initials(user.name)}
                            </div>
                            <p className="font-semibold text-[#172033]">
                              {user.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleColor(
                              user.role
                            )}`}
                          >
                            {roleLabel(user.role)}
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
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) =>
                              isMenuOpen
                                ? closeActionMenu()
                                : openActionMenu(user, e)
                            }
                            className={`rounded-lg p-2 transition disabled:opacity-50 ${
                              isMenuOpen
                                ? "bg-[#252B68] text-white hover:bg-[#1d2255]"
                                : "text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                            }`}
                            aria-label="Open user actions"
                          >
                            {isProcessing ? (
                              <Loader2 size={19} className="animate-spin" />
                            ) : (
                              <MoreVertical size={19} />
                            )}
                          </button>
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
                  onClick={() => loadUsers(pagination.current_page - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="px-2 text-sm text-slate-500">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  type="button"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => loadUsers(pagination.current_page + 1)}
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

      {/* -------- Fixed action menu -------- */}
      {actionMenu && (
        <>
          <button
            type="button"
            aria-label="Close actions menu"
            onClick={closeActionMenu}
            className="fixed inset-0 z-[140] cursor-default bg-transparent"
          />
          <div
            role="menu"
            style={{
              position: "fixed",
              top: actionMenu.top,
              left: actionMenu.left,
              width: ACTION_MENU_WIDTH,
            }}
            className="z-[150] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-2xl"
          >
            <button
              type="button"
              onClick={() => openEditUser(actionMenu.user)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit Account
            </button>
            {actionMenu.user.is_active ? (
              <button
                type="button"
                onClick={() => performAction(actionMenu.user, "reset-password")}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <KeyRound size={16} />
                Reset Password
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  performAction(actionMenu.user, "resend-activation")
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Mail size={16} />
                Resend Activation
              </button>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(actionMenu.user);
                closeActionMenu();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </>
      )}

      {/* ============================ ADD MODAL ============================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">Add Users</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Create multiple staff accounts at once.
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

            <div className="border-b border-slate-200 px-5 pt-4 sm:px-6">
              <div className="flex gap-2">
                <TabButton
                  active={bulkMode === "manual"}
                  onClick={() => {
                    setBulkMode("manual");
                    setCsvError("");
                  }}
                  icon={<Users size={17} />}
                >
                  Manual Entry
                </TabButton>
                <TabButton
                  active={bulkMode === "csv"}
                  onClick={() => {
                    setBulkMode("csv");
                    setCsvError("");
                  }}
                  icon={<FileSpreadsheet size={17} />}
                >
                  Import CSV
                </TabButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {bulkMode === "manual" ? (
                <>
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
                          Enter only the email username. The system adds{" "}
                          <span className="font-semibold text-[#252B68]">
                            @{SCHOOL_EMAIL_DOMAIN}
                          </span>{" "}
                          automatically.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Example:{" "}
                          <span className="font-medium">john.banda</span> →{" "}
                          <span className="font-medium">
                            john.banda@{SCHOOL_EMAIL_DOMAIN}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {csvError && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{csvError}</p>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[860px]">
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
                          <th className="w-60 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                            Role
                          </th>
                          <th className="w-14 px-3 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkUsers.map((user, index) => {
                          const rowError = getBulkRowError(user);
                          const email = user.emailUsername.trim()
                            ? fullSchoolEmail(user.emailUsername)
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
                                  onChange={(e) =>
                                    updateBulkUser(
                                      user.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. John Banda"
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                                />
                                {rowError && !user.name.trim() && (
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
                                    onChange={(e) =>
                                      updateBulkUser(
                                        user.id,
                                        "emailUsername",
                                        e.target.value
                                      )
                                    }
                                    placeholder="john.banda"
                                    className={`min-w-0 flex-1 rounded-l-xl border px-3 text-sm outline-none transition focus:ring-2 ${
                                      rowError &&
                                      (rowError.includes("already") ||
                                        rowError.includes("duplicated") ||
                                        rowError.includes("Email"))
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
                                <RoleSelect
                                  value={user.role}
                                  onChange={(value) =>
                                    updateBulkUser(user.id, "role", value)
                                  }
                                />
                                <p className="mt-1 text-xs leading-snug text-slate-500">
                                  {roleDescription(user.role)}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => removeBulkRow(user.id)}
                                  disabled={bulkUsers.length === 1}
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

                  {(duplicateBulkEmails.size > 0 ||
                    bulkUsers.some((u) =>
                      existingEmails.has(
                        fullSchoolEmail(normalizeEmailUsername(u.emailUsername))
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
                            An email address already exists or has been entered
                            more than once. Please fix the highlighted row
                            before continuing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={addBulkRow}
                      disabled={bulkUsers.length >= MAX_BULK_USERS}
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
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Upload size={24} className="text-[#252B68]" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#172033]">
                      Import users from CSV
                    </h3>
                    <p className="mx-auto mt-1 max-w-lg text-sm leading-relaxed text-slate-500">
                      Upload a CSV containing name, school email username and
                      role. The system will apply{" "}
                      <strong>@{SCHOOL_EMAIL_DOMAIN}</strong> automatically.
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
                        <FileSpreadsheet size={17} className="text-emerald-600" />
                        {csvFileName}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-[#252B68]/10 bg-[#252B68]/5 p-4">
                    <p className="text-sm font-bold text-[#252B68]">CSV format</p>
                    <div className="mt-3 overflow-x-auto rounded-lg bg-[#172033] p-4">
                      <code className="whitespace-pre text-xs text-white/90">
{`name,email,role
John Banda,john.banda,class_teacher
Grace Tembo,grace.tembo,headteacher
Patrick Chirwa,patrick.chirwa,admissions_officer
Ruth Kalua,ruth.kalua,bursar
Daniel Moyo,daniel.moyo,lead_teacher
David Kumwenda,david.kumwenda,assistant_teacher
Memory Phiri,memory.phiri,specialist_teacher
Alice Mvula,alice.mvula,editor
Susan Msiska,susan.msiska,staff
Peter Mbewe,peter.mbewe,admin`}
                      </code>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      Accepted roles:{" "}
                      {ROLE_OPTIONS.map((r) => r.value).join(", ")}. You may
                      also use the full school email, e.g.{" "}
                      <span className="font-semibold">
                        john.banda@{SCHOOL_EMAIL_DOMAIN}
                      </span>
                      .
                    </p>
                  </div>

                  {csvError && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{csvError}</p>
                    </div>
                  )}

                  {bulkUsers.length > 0 && csvFileName && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#172033]">
                            Imported Users
                          </h3>
                          <p className="text-xs text-slate-500">
                            Review before creating their accounts.
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
                              {["#", "Name", "Email", "Role", "Status"].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                  >
                                    {h}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bulkUsers.map((user, index) => {
                              const error = getBulkRowError(user);
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
                                      ? fullSchoolEmail(user.emailUsername)
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {roleLabel(user.role)}
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

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-[#252B68]">
                  {validBulkUserCount}
                </span>{" "}
                user{validBulkUserCount === 1 ? "" : "s"} ready to create
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
                  disabled={submittingBulk || validBulkUserCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F58220]/20 transition hover:bg-[#df7014] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingBulk ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
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

      {/* ============================ EDIT MODAL ============================ */}
      {editingUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">Edit User</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update this account&apos;s details and role.
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

            <form onSubmit={updateUser} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, name: e.target.value }))
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
                    onChange={(e) =>
                      setEditForm((c) => ({ ...c, email: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role
                  </label>
                  <div className="space-y-3">
                    {ROLE_GROUPS.map(({ group, label }) => (
                      <div key={group}>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {label}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {rolesInGroup(group).map((role) => {
                            const active = editForm.role === role.value;
                            return (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() =>
                                  setEditForm((c) => ({
                                    ...c,
                                    role: role.value,
                                  }))
                                }
                                className={`rounded-xl border p-3 text-left transition ${
                                  active
                                    ? "border-[#252B68] bg-[#252B68]/5 ring-2 ring-[#252B68]/20"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <p className="text-sm font-semibold text-[#172033]">
                                  {role.label}
                                </p>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                  {role.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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
                      setEditForm((c) => ({
                        ...c,
                        is_active: !c.is_active,
                      }))
                    }
                    className={`relative h-6 w-11 rounded-full transition ${
                      editForm.is_active ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        editForm.is_active ? "left-6" : "left-1"
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
                  disabled={processingAction === `edit-${editingUser.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2255] disabled:opacity-50"
                >
                  {processingAction === `edit-${editingUser.id}` ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
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

      {/* ============================ DELETE MODAL ============================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
                onClick={() => performAction(showDeleteModal, "delete")}
                disabled={processingAction === `delete-${showDeleteModal.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processingAction === `delete-${showDeleteModal.id}` ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
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

      {/* ============================ RESULT MODAL ============================ */}
      {showResultModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  resultType === "success" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {resultType === "success" ? (
                  <CheckCircle2 size={23} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={23} className="text-red-600" />
                )}
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                {resultTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {resultMessage}
              </p>

              {bulkSummary && bulkResults.length > 0 && (
                <div className="mt-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xl font-bold text-[#252B68]">
                        {bulkSummary.total}
                      </p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">
                        {bulkSummary.successful}
                      </p>
                      <p className="text-xs text-emerald-700">Created</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-3 text-center">
                      <p className="text-xl font-bold text-red-600">
                        {bulkSummary.failed}
                      </p>
                      <p className="text-xs text-red-700">Failed</p>
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
    </div>
  );
}

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */

function StatCard({
  label,
  value,
  icon,
  bg,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#F58220] text-[#F58220]"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

function RoleSelect({
  value,
  onChange,
  includeAllOption = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAllOption?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ||
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
      }
    >
      {includeAllOption && <option value="">All roles</option>}
      {ROLE_GROUPS.map(({ group, label }) => (
        <optgroup key={group} label={label}>
          {rolesInGroup(group).map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}