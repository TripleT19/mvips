"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  X,
  Image as ImageIcon,
  Calendar,
  User,
  BookOpen,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock3,
  Upload,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Category = {
  id: number;
  name: string;
  slug?: string;
};

type Story = {
  id: number;
  title: string;
  slug: string;
  author: string;
  class_name: string | null;
  event_date: string | null;
  published_date: string | null;
  category_id: number;
  category: Category | null;
  image_path: string | null;
  image_url: string | null;
  excerpt: string | null;
  content: string;
  featured: boolean;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const CLASS_OPTIONS = [
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];

const EMPTY_FORM = {
  title: "",
  category_id: "",
  class_name: "",
  event_date: "",
  excerpt: "",
  content: "",
  featured: false,
  status: "draft" as "draft" | "published",
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

function getImageUrl(story: Story): string | null {
  if (!story.image_url && !story.image_path) {
    return null;
  }

  if (story.image_url) {
    if (
      story.image_url.startsWith("http://") ||
      story.image_url.startsWith("https://")
    ) {
      return story.image_url;
    }

    return `${API_URL}${story.image_url.startsWith("/") ? "" : "/"}${
      story.image_url
    }`;
  }

  return `${API_URL}/storage/${story.image_path}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [modal, setModal] = useState<
    "create" | "edit" | "view" | "delete" | null
  >(null);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* -------------------------------------------------------------------------- */
  /* Fetch admin user                                                           */
  /* -------------------------------------------------------------------------- */

  async function fetchAdminUser() {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      setAdminUser(data.user || data.data || null);
    } catch {
      // Silent because story page can still operate.
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Fetch categories                                                           */
  /* -------------------------------------------------------------------------- */

  async function fetchCategories() {
    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load categories.");
      }

      const data = await response.json();

      setCategories(data.categories || data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Fetch stories                                                              */
  /* -------------------------------------------------------------------------- */

  async function fetchStories() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(`${API_URL}/api/admin/stories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "Unable to load stories."
        );
      }

      const data = await response.json();

      setStories(
        data.stories ||
          data.data?.data ||
          data.data ||
          []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load stories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminUser();
    fetchCategories();
    fetchStories();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Filtering                                                                  */
  /* -------------------------------------------------------------------------- */

  const filteredStories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesSearch =
        !query ||
        story.title.toLowerCase().includes(query) ||
        story.excerpt?.toLowerCase().includes(query) ||
        story.author.toLowerCase().includes(query) ||
        story.class_name?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        story.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        String(story.category_id) === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [stories, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStories.length / itemsPerPage)
  );

  const paginatedStories = filteredStories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* -------------------------------------------------------------------------- */
  /* Statistics                                                                 */
  /* -------------------------------------------------------------------------- */

  const publishedCount = stories.filter(
    (story) => story.status === "published"
  ).length;

  const draftCount = stories.filter(
    (story) => story.status === "draft"
  ).length;

  const featuredCount = stories.filter(
    (story) => story.featured
  ).length;

  /* -------------------------------------------------------------------------- */
  /* Form helpers                                                               */
  /* -------------------------------------------------------------------------- */

  function resetForm() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setEditingStory(null);
    setError("");
  }

  function openCreate() {
    resetForm();
    setModal("create");
  }

  function openEdit(story: Story) {
    setEditingStory(story);

    setForm({
      title: story.title || "",
      category_id: story.category_id
        ? String(story.category_id)
        : "",
      class_name: story.class_name || "",
      event_date: story.event_date
        ? story.event_date.substring(0, 10)
        : "",
      excerpt: story.excerpt || "",
      content: story.content || "",
      featured: Boolean(story.featured),
      status: story.status || "draft",
    });

    setImageFile(null);
    setImagePreview(getImageUrl(story));

    setError("");
    setModal("edit");
  }

  function openView(story: Story) {
    setSelectedStory(story);
    setModal("view");
  }

  function openDelete(story: Story) {
    setSelectedStory(story);
    setModal("delete");
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    setSelectedStory(null);
    setEditingStory(null);
    resetForm();
  }

  function handleInput(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  /* -------------------------------------------------------------------------- */
  /* Save story                                                                 */
  /* -------------------------------------------------------------------------- */

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter a story title.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!form.content.trim()) {
      setError("Please enter the story content.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("category_id", form.category_id);
      formData.append(
        "class_name",
        form.class_name || ""
      );

      formData.append(
        "event_date",
        form.event_date || ""
      );

      formData.append(
        "excerpt",
        form.excerpt.trim()
      );

      formData.append(
        "content",
        form.content.trim()
      );

      formData.append(
        "featured",
        form.featured ? "1" : "0"
      );

      formData.append("status", form.status);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let url = `${API_URL}/api/admin/stories`;
      let method = "POST";

      if (editingStory) {
        url = `${API_URL}/api/admin/stories/${editingStory.id}`;
        formData.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const validationErrors = data?.errors;

        if (validationErrors) {
          const firstError = Object.values(
            validationErrors
          )[0];

          if (Array.isArray(firstError)) {
            throw new Error(firstError[0]);
          }
        }

        throw new Error(
          data?.message || "Unable to save story."
        );
      }

      setSuccess(
        editingStory
          ? "Story updated successfully."
          : "Story created successfully."
      );

      await fetchStories();

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 600);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save story."
      );
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Delete story                                                               */
  /* -------------------------------------------------------------------------- */

  async function handleDelete() {
    if (!selectedStory) return;

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/stories/${selectedStory.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to delete story."
        );
      }

      await fetchStories();

      setModal(null);
      setSelectedStory(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete story."
      );
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Small UI helpers                                                           */
  /* -------------------------------------------------------------------------- */

  function StatusBadge({
    status,
  }: {
    status: "draft" | "published";
  }) {
    const published = status === "published";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
          published
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {published ? (
          <CheckCircle2 size={12} />
        ) : (
          <Clock3 size={12} />
        )}
        {published ? "Published" : "Draft"}
      </span>
    );
  }

  function CategoryBadge({
    category,
  }: {
    category: Category | null;
  }) {
    return (
      <span className="inline-flex max-w-[130px] truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-[#252B68]">
        {category?.name || "Uncategorised"}
      </span>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-full bg-slate-50">
      {/* ---------------------------------------------------------------------- */}
      {/* Header                                                                 */}
      {/* ---------------------------------------------------------------------- */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252B68] text-white shadow-sm">
                  <FileText size={18} />
                </div>

                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    Stories
                  </h1>

                  <p className="text-xs text-slate-500">
                    Create and manage Mount View school stories.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#252B68] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d2257]"
            >
              <Plus size={17} />
              New Story
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Main                                                                   */}
      {/* ---------------------------------------------------------------------- */}

      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        {/* Statistics */}

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Total Stories
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {stories.length}
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50 p-2 text-[#252B68]">
                <FileText size={17} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Published
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {publishedCount}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 size={17} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Drafts
                </p>

                <p className="mt-1 text-xl font-bold text-amber-700">
                  {draftCount}
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock3 size={17} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Featured
                </p>

                <p className="mt-1 text-xl font-bold text-[#F58220]">
                  {featuredCount}
                </p>
              </div>

              <div className="rounded-lg bg-orange-50 p-2 text-[#F58220]">
                <Star size={17} />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search stories..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative min-w-[145px]">
                <Filter
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              >
                <option value="all">All Categories</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}

        {error && !modal && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* -------------------------------------------------------------------- */}
        {/* Stories table                                                        */}
        {/* -------------------------------------------------------------------- */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="w-[44%] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Story
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Class
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center"
                    >
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#252B68]" />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading stories...
                      </p>
                    </td>
                  </tr>
                ) : paginatedStories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center"
                    >
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <FileText size={20} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No stories found
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedStories.map((story) => {
                    const imageUrl = getImageUrl(story);

                    return (
                      <tr
                        key={story.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openView(story)}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <div className="h-12 w-16 flex-none overflow-hidden rounded-lg bg-slate-100">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                  <ImageIcon size={19} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {story.title}
                                </p>

                                {story.featured && (
                                  <Star
                                    size={13}
                                    className="flex-none fill-[#F58220] text-[#F58220]"
                                  />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                {story.excerpt ||
                                  "No excerpt provided."}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <CategoryBadge
                            category={story.category}
                          />
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600">
                          {story.class_name || "Whole School"}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={story.status}
                          />
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(
                            story.event_date ||
                              story.published_date
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openView(story)}
                              title="View"
                              className="rounded-md p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-[#252B68]"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(story)}
                              title="Edit"
                              className="rounded-md p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDelete(story)}
                              title="Delete"
                              className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}

          {!loading && filteredStories.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredStories.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredStories.length}
                </span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="px-2 text-xs font-medium text-slate-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ====================================================================== */}
      {/* CREATE / EDIT MODAL                                                    */}
      {/* ====================================================================== */}

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px]">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}

            <div className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {modal === "edit"
                    ? "Edit Story"
                    : "Create Story"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Share news and activities from Mount View.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto"
            >
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_270px]">
                {/* Left */}

                <div className="space-y-4">
                  {/* Title */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Story Title{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      name="title"
                      value={form.title}
                      onChange={handleInput}
                      placeholder="Enter story title"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                    />
                  </div>

                  {/* Category / Class */}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Category{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="category_id"
                        value={form.category_id}
                        onChange={handleInput}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                      >
                        <option value="">
                          Select category
                        </option>

                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Year Group / Class
                      </label>

                      <select
                        name="class_name"
                        value={form.class_name}
                        onChange={handleInput}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                      >
                        <option value="">
                          Whole School
                        </option>

                        {CLASS_OPTIONS.map((className) => (
                          <option
                            key={className}
                            value={className}
                          >
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Event date */}

                  <div className="max-w-xs">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Event Date
                    </label>

                    <input
                      type="date"
                      name="event_date"
                      value={form.event_date}
                      onChange={handleInput}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                    />

                    <p className="mt-1 text-[10px] text-slate-400">
                      Optional — when the event actually happened.
                    </p>
                  </div>

                  {/* Excerpt */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Short Excerpt
                    </label>

                    <textarea
                      name="excerpt"
                      value={form.excerpt}
                      onChange={handleInput}
                      rows={2}
                      placeholder="A short description shown on story cards..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                    />
                  </div>

                  {/* Content */}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Story Content{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <span className="text-[10px] text-slate-400">
                        {form.content.length} characters
                      </span>
                    </div>

                    <textarea
                      name="content"
                      value={form.content}
                      onChange={handleInput}
                      placeholder="Write the full story..."
                      className="min-h-[210px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                    />
                  </div>
                </div>

                {/* Right */}

                <div className="space-y-4">
                  {/* Image */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Featured Image
                    </label>

                    <div className="overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-40 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1.5 text-white transition hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-40 cursor-pointer flex-col items-center justify-center px-4 text-center">
                          <div className="mb-2 rounded-lg bg-white p-2.5 text-slate-400 shadow-sm">
                            <Upload size={19} />
                          </div>

                          <span className="text-xs font-semibold text-slate-700">
                            Upload image
                          </span>

                          <span className="mt-1 text-[10px] text-slate-400">
                            JPG, PNG or WebP · Max 5MB
                          </span>

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {imagePreview && (
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#252B68] hover:underline">
                        <Upload size={13} />
                        Change image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Publishing */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="mb-3 text-xs font-bold text-slate-800">
                      Publishing
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                          Status
                        </label>

                        <select
                          name="status"
                          value={form.status}
                          onChange={handleInput}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-[#252B68]"
                        >
                          <option value="draft">
                            Draft
                          </option>

                          <option value="published">
                            Published
                          </option>
                        </select>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(event) =>
                            setForm((previous) => ({
                              ...previous,
                              featured:
                                event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#252B68] focus:ring-[#252B68]"
                        />

                        <span className="text-xs font-medium text-slate-700">
                          Feature this story
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Automatic information */}

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="mb-3 text-xs font-bold text-slate-800">
                      Automatic Information
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <User
                          size={14}
                          className="mt-0.5 flex-none text-slate-400"
                        />

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Author
                          </p>

                          <p className="mt-0.5 text-xs font-medium text-slate-700">
                            {editingStory?.author ||
                              adminUser?.name ||
                              "Current Administrator"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar
                          size={14}
                          className="mt-0.5 flex-none text-slate-400"
                        />

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Publication Date
                          </p>

                          <p className="mt-0.5 text-xs font-medium text-slate-700">
                            {editingStory?.published_date
                              ? formatDateTime(
                                  editingStory.published_date
                                )
                              : form.status ===
                                "published"
                              ? "Set automatically when published"
                              : "Set automatically"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors */}

              {error && (
                <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mx-5 mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                  {success}
                </div>
              )}

              {/* Footer */}

              <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d2257] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingStory
                    ? "Update Story"
                    : "Create Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* VIEW MODAL                                                             */}
      {/* ====================================================================== */}

      {modal === "view" && selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px]">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}

            <div className="flex flex-none items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <BookOpen
                  size={17}
                  className="text-[#252B68]"
                />

                <span className="text-sm font-bold text-slate-900">
                  Story Preview
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* Content */}

            <div className="min-h-0 overflow-y-auto">
              {getImageUrl(selectedStory) && (
                <img
                  src={getImageUrl(selectedStory) as string}
                  alt={selectedStory.title}
                  className="h-56 w-full object-cover"
                />
              )}

              <div className="p-5">
                {/* Meta */}

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <CategoryBadge
                    category={selectedStory.category}
                  />

                  <StatusBadge
                    status={selectedStory.status}
                  />

                  {selectedStory.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-[#F58220]">
                      <Star
                        size={12}
                        className="fill-current"
                      />
                      Featured
                    </span>
                  )}
                </div>

                <h2 className="max-w-3xl text-2xl font-bold tracking-tight text-slate-900">
                  {selectedStory.title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <User size={13} />
                    {selectedStory.author}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={13} />
                    {selectedStory.class_name ||
                      "Whole School"}
                  </span>

                  {selectedStory.event_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      Event:{" "}
                      {formatDate(
                        selectedStory.event_date
                      )}
                    </span>
                  )}

                  {selectedStory.published_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      Published:{" "}
                      {formatDate(
                        selectedStory.published_date
                      )}
                    </span>
                  )}
                </div>

                {selectedStory.excerpt && (
                  <div className="mt-5 rounded-xl border-l-4 border-[#FFE900] bg-yellow-50 px-4 py-3">
                    <p className="text-sm font-medium leading-6 text-slate-700">
                      {selectedStory.excerpt}
                    </p>
                  </div>
                )}

                <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedStory.content}
                </div>

                <div className="mt-7 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  Last updated{" "}
                  {formatDateTime(
                    selectedStory.updated_at
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}

            <div className="flex flex-none items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => openDelete(selectedStory)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(selectedStory)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1d2257]"
                >
                  <Edit3 size={14} />
                  Edit Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* DELETE MODAL                                                           */}
      {/* ====================================================================== */}

      {modal === "delete" && selectedStory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              Delete Story?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                "{selectedStory.title}"
              </span>
              ? This action cannot be undone.
            </p>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                Delete Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}