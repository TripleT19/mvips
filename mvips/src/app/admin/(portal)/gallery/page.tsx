"use client";

import {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from "react";

import {
  Plus,
  Search,
  Image as ImageIcon,
  Edit3,
  Trash2,
  X,
  Upload,
  Star,
  CalendarDays,
  Users,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type GalleryImage = {
  id: number;
  image_path: string;
  image_url: string | null;
  sort_order: number;
};

type Gallery = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  author: string | null;
  class_name: string | null;
  event_date: string | null;
  featured: boolean;
  status: "draft" | "published";
  image_count: number;
  cover_image: string | null;
  images: GalleryImage[];
  created_at: string;
  updated_at: string;
};

type FormDataType = {
  title: string;
  description: string;
  class_name: string;
  event_date: string;
  featured: boolean;
  status: "draft" | "published";
};

const CLASS_OPTIONS = [
  "Whole School",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];

function getImageUrl(url: string | null): string | null {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatDate(date: string | null) {
  if (!date) return "No event date";

  return new Date(date).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [classFilter, setClassFilter] =
    useState("all");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [editingGallery, setEditingGallery] =
    useState<Gallery | null>(null);

  const [viewingGallery, setViewingGallery] =
    useState<Gallery | null>(null);

  const [saving, setSaving] = useState(false);

  const [deletingImageId, setDeletingImageId] =
    useState<number | null>(null);

  const [deletingGalleryId, setDeletingGalleryId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] =
    useState<FormDataType>({
      title: "",
      description: "",
      class_name: "",
      event_date: "",
      featured: false,
      status: "published",
    });

  const [newImages, setNewImages] =
    useState<File[]>([]);

  const [newImagePreviews, setNewImagePreviews] =
    useState<string[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement>(null);


  /*
  |--------------------------------------------------------------------------
  | AUTH
  |--------------------------------------------------------------------------
  */

  function getToken() {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("admin_token");
  }


  /*
  |--------------------------------------------------------------------------
  | LOAD GALLERIES
  |--------------------------------------------------------------------------
  */

  async function loadGalleries() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (statusFilter !== "all") {
        params.set(
          "status",
          statusFilter
        );
      }

      if (classFilter !== "all") {
        params.set(
          "class_name",
          classFilter
        );
      }

      params.set("per_page", "50");

      const response = await fetch(
        `${API_URL}/api/admin/gallery?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");

        window.location.href =
          "/admin/login";

        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load gallery."
        );
      }

      setGalleries(
        data.data?.data || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load gallery."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGalleries();
  }, [
    statusFilter,
    classFilter,
  ]);


  /*
  |--------------------------------------------------------------------------
  | SEARCH DEBOUNCE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadGalleries();
      }, 350);

    return () => clearTimeout(timer);
  }, [search]);


  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  function resetForm() {
    setForm({
      title: "",
      description: "",
      class_name: "",
      event_date: "",
      featured: false,
      status: "published",
    });

    setNewImages([]);
    setNewImagePreviews([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }


  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE
  |--------------------------------------------------------------------------
  */

  function openCreate() {
    setEditingGallery(null);
    resetForm();
    setError("");
    setMessage("");
    setModalOpen(true);
  }


  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT
  |--------------------------------------------------------------------------
  */

  function openEdit(gallery: Gallery) {
    setEditingGallery(gallery);

    setForm({
      title: gallery.title,
      description:
        gallery.description || "",
      class_name:
        gallery.class_name || "",
      event_date:
        gallery.event_date
          ? gallery.event_date.substring(0, 10)
          : "",
      featured: gallery.featured,
      status: gallery.status,
    });

    setNewImages([]);
    setNewImagePreviews([]);

    setError("");
    setMessage("");
    setModalOpen(true);
  }


  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingGallery(null);
    resetForm();
  }


  /*
  |--------------------------------------------------------------------------
  | SELECT IMAGES
  |--------------------------------------------------------------------------
  */

  function handleImageSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const validFiles: File[] = [];

    for (const file of files) {
      if (
        ![
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ].includes(file.type)
      ) {
        setError(
          `${file.name} is not a supported image type.`
        );

        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(
          `${file.name} is larger than 5MB.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      event.target.value = "";
      return;
    }

    const combined = [
      ...newImages,
      ...validFiles,
    ];

    setNewImages(combined);

    const previews =
      combined.map((file) =>
        URL.createObjectURL(file)
      );

    setNewImagePreviews(previews);

    setError("");

    event.target.value = "";
  }


  /*
  |--------------------------------------------------------------------------
  | REMOVE NEW IMAGE
  |--------------------------------------------------------------------------
  */

  function removeNewImage(index: number) {
    setNewImages((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );

    setNewImagePreviews((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | REMOVE EXISTING IMAGE
  |--------------------------------------------------------------------------
  */

  async function removeExistingImage(
    image: GalleryImage
  ) {
    if (!editingGallery) return;

    if (editingGallery.images.length <= 1) {
      setError(
        "A gallery must contain at least one image."
      );

      return;
    }

    const confirmed = window.confirm(
      "Remove this image from the gallery?"
    );

    if (!confirmed) return;

    try {
      setDeletingImageId(image.id);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/gallery-images/${image.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to remove image."
        );
      }

      const updatedImages =
        editingGallery.images.filter(
          (item) =>
            item.id !== image.id
        );

      const updatedGallery = {
        ...editingGallery,
        images: updatedImages,
        image_count:
          updatedImages.length,
        cover_image:
          updatedImages[0]?.image_url ||
          null,
      };

      setEditingGallery(
        updatedGallery
      );

      if (viewingGallery?.id === editingGallery.id) {
        setViewingGallery(
          updatedGallery
        );
      }

      setGalleries((current) =>
        current.map((item) =>
          item.id === updatedGallery.id
            ? updatedGallery
            : item
        )
      );

      setMessage(
        "Image removed successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove image."
      );
    } finally {
      setDeletingImageId(null);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE GALLERY
  |--------------------------------------------------------------------------
  */

  async function saveGallery() {
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Please enter a gallery title.");
      return;
    }

    if (
      !editingGallery &&
      newImages.length === 0
    ) {
      setError(
        "Please select at least one image."
      );

      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";

        return;
      }

      const data = new FormData();

      data.append(
        "title",
        form.title.trim()
      );

      data.append(
        "description",
        form.description
      );

      if (form.class_name) {
        data.append(
          "class_name",
          form.class_name === "Whole School"
            ? ""
            : form.class_name
        );
      }

      if (form.event_date) {
        data.append(
          "event_date",
          form.event_date
        );
      }

      data.append(
        "featured",
        form.featured ? "1" : "0"
      );

      data.append(
        "status",
        form.status
      );

      if (!editingGallery) {
        newImages.forEach((file) => {
          data.append(
            "images[]",
            file
          );
        });
      } else {
        data.append(
          "_method",
          "PUT"
        );

        newImages.forEach((file) => {
          data.append(
            "images[]",
            file
          );
        });
      }

      const url = editingGallery
        ? `${API_URL}/api/admin/gallery/${editingGallery.id}`
        : `${API_URL}/api/admin/gallery`;

      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (result.errors) {
          const firstError =
            Object.values(
              result.errors
            )[0];

          if (
            Array.isArray(firstError)
          ) {
            throw new Error(
              firstError[0]
            );
          }
        }

        throw new Error(
          result.message ||
            "Unable to save gallery."
        );
      }

      setMessage(
        editingGallery
          ? "Gallery updated successfully."
          : "Gallery created successfully."
      );

      setModalOpen(false);
      setEditingGallery(null);
      resetForm();

      await loadGalleries();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save gallery."
      );
    } finally {
      setSaving(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | DELETE GALLERY
  |--------------------------------------------------------------------------
  */

  async function deleteGallery(
    gallery: Gallery
  ) {
    const confirmed =
      window.confirm(
        `Delete "${gallery.title}" and all ${gallery.image_count} images? This cannot be undone.`
      );

    if (!confirmed) return;

    try {
      setDeletingGalleryId(
        gallery.id
      );

      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/gallery/${gallery.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete gallery."
        );
      }

      setGalleries((current) =>
        current.filter(
          (item) =>
            item.id !== gallery.id
        )
      );

      setMessage(
        "Gallery deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete gallery."
      );
    } finally {
      setDeletingGalleryId(null);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | OPEN VIEW
  |--------------------------------------------------------------------------
  */

  function openView(gallery: Gallery) {
    setViewingGallery(gallery);
    setViewOpen(true);
  }


  return (
    <div className="min-h-full bg-slate-50">

      {/* HEADER */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-4 py-4 sm:px-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252B68] text-white">
                  <ImageIcon size={19} />
                </div>

                <div>
                  <h1 className="text-lg font-bold text-[#172033]">
                    Gallery
                  </h1>

                  <p className="text-xs text-slate-500">
                    Manage school photo albums
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#252B68] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d2257]"
            >
              <Plus size={17} />
              Add Gallery
            </button>

          </div>

        </div>
      </div>


      {/* MESSAGES */}

      {(message || error) && (
        <div className="px-4 pt-4 sm:px-6">

          {message && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
              <CheckCircle2 size={17} />
              {message}
              <button
                onClick={() =>
                  setMessage("")
                }
                className="ml-auto"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={17} />
              {error}
              <button
                onClick={() =>
                  setError("")
                }
                className="ml-auto"
              >
                <X size={15} />
              </button>
            </div>
          )}

        </div>
      )}


      {/* FILTERS */}

      <div className="px-4 py-4 sm:px-6">

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search galleries..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-[#252B68] focus:bg-white"
            />

          </div>

          <select
            value={classFilter}
            onChange={(e) =>
              setClassFilter(e.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#252B68]"
          >
            <option value="all">
              All Classes
            </option>

            {CLASS_OPTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={
                    item === "Whole School"
                      ? ""
                      : item
                  }
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#252B68]"
          >
            <option value="all">
              All Status
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

        </div>
      </div>


      {/* CONTENT */}

      <div className="px-4 pb-8 sm:px-6">

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-[#252B68]"
            />
          </div>

        ) : galleries.length === 0 ? (

          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <ImageIcon
                size={25}
                className="text-slate-400"
              />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              No galleries found
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Create your first photo gallery.
            </p>

            <button
              onClick={openCreate}
              className="mt-4 rounded-lg bg-[#252B68] px-4 py-2 text-sm font-semibold text-white"
            >
              Add Gallery
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {galleries.map(
              (gallery) => (

                <div
                  key={gallery.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  {/* COVER */}

                  <button
                    onClick={() =>
                      openView(gallery)
                    }
                    className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
                  >

                    {gallery.cover_image ? (

                      <img
                        src={getImageUrl(
                          gallery.cover_image
                        ) || ""}
                        alt={gallery.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={36}
                          className="text-slate-300"
                        />
                      </div>

                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">

                      <div className="flex items-center gap-2 text-xs font-medium text-white">

                        <ImageIcon size={14} />

                        {gallery.image_count}{" "}
                        {gallery.image_count === 1
                          ? "image"
                          : "images"}

                      </div>

                    </div>

                    {gallery.featured && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#FFE900] px-2 py-1 text-[10px] font-bold text-[#172033]">
                        <Star
                          size={11}
                          fill="currentColor"
                        />
                        Featured
                      </span>
                    )}

                  </button>


                  {/* DETAILS */}

                  <div className="p-3">

                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">

                        <h2 className="truncate text-sm font-bold text-[#172033]">
                          {gallery.title}
                        </h2>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays
                            size={13}
                          />

                          {formatDate(
                            gallery.event_date
                          )}
                        </div>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                          gallery.status ===
                          "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {gallery.status}
                      </span>

                    </div>


                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">

                      <Users size={13} />

                      {gallery.class_name ||
                        "Whole School"}

                    </div>


                    {/* ACTIONS */}

                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">

                      <button
                        onClick={() =>
                          openView(gallery)
                        }
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        onClick={() =>
                          openEdit(gallery)
                        }
                        className="flex items-center justify-center rounded-lg border border-slate-200 px-2.5 text-slate-600 transition hover:bg-slate-50"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() =>
                          deleteGallery(gallery)
                        }
                        disabled={
                          deletingGalleryId ===
                          gallery.id
                        }
                        className="flex items-center justify-center rounded-lg border border-red-200 px-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingGalleryId ===
                        gallery.id ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ================================================================ */}
      {/* CREATE / EDIT MODAL */}
      {/* ================================================================ */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">

          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="text-base font-bold text-[#172033]">
                  {editingGallery
                    ? "Edit Gallery"
                    : "Add Gallery"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingGallery
                    ? "Update the album and manage its images."
                    : "Create a photo album with multiple images."}
                </p>

              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="overflow-y-auto px-5 py-5">

              <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">

                {/* LEFT */}

                <div className="space-y-4">

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Gallery Title *
                    </label>

                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. Sports Day 2026"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                    />

                  </div>


                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description:
                            e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Brief description of the event..."
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#252B68]"
                    />

                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Year Group / Class
                      </label>

                      <select
                        value={
                          form.class_name ||
                          "Whole School"
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            class_name:
                              e.target.value ===
                              "Whole School"
                                ? ""
                                : e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#252B68]"
                      >
                        {CLASS_OPTIONS.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          )
                        )}
                      </select>

                    </div>


                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Event Date
                      </label>

                      <input
                        type="date"
                        value={
                          form.event_date
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            event_date:
                              e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#252B68]"
                      />

                    </div>

                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">

                      <input
                        type="checkbox"
                        checked={
                          form.featured
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            featured:
                              e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-[#252B68]"
                      />

                      <span className="text-xs font-semibold text-slate-700">
                        Featured Gallery
                      </span>

                    </label>


                    <div>

                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            status:
                              e.target.value as
                                | "draft"
                                | "published",
                          })
                        }
                        className="h-full w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#252B68]"
                      >
                        <option value="published">
                          Published
                        </option>

                        <option value="draft">
                          Draft
                        </option>
                      </select>

                    </div>

                  </div>


                  {/* AUTOMATIC AUTHOR */}

                  {editingGallery?.author && (

                    <div className="rounded-lg bg-slate-50 px-3 py-2.5">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Author
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-slate-700">
                        {editingGallery.author}
                      </p>

                    </div>

                  )}

                </div>


                {/* RIGHT - IMAGES */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label className="text-xs font-semibold text-slate-700">
                      Images *
                    </label>

                    <span className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP · Max 5MB each
                    </span>

                  </div>


                  {/* UPLOAD BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex min-h-[110px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[#252B68] hover:bg-slate-100"
                  >

                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Upload
                        size={18}
                        className="text-[#252B68]"
                      />
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      Click to add images
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      You can select multiple images at once
                    </p>

                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={
                      handleImageSelection
                    }
                    className="hidden"
                  />


                  {/* EXISTING IMAGES */}

                  {editingGallery &&
                    editingGallery.images.length >
                      0 && (

                      <div className="mt-4">

                        <div className="mb-2 flex items-center justify-between">

                          <p className="text-xs font-semibold text-slate-700">
                            Current Images
                          </p>

                          <span className="text-[11px] text-slate-400">
                            {editingGallery.images.length} images
                          </span>

                        </div>


                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">

                          {editingGallery.images.map(
                            (image, index) => (

                              <div
                                key={image.id}
                                className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                              >

                                <img
                                  src={
                                    getImageUrl(
                                      image.image_url
                                    ) || ""
                                  }
                                  alt={`Gallery image ${
                                    index + 1
                                  }`}
                                  className="h-full w-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExistingImage(
                                      image
                                    )
                                  }
                                  disabled={
                                    deletingImageId ===
                                    image.id
                                  }
                                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                                  title="Remove image"
                                >
                                  {deletingImageId ===
                                  image.id ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <X size={14} />
                                  )}
                                </button>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}


                  {/* NEW IMAGES */}

                  {newImagePreviews.length >
                    0 && (

                    <div className="mt-4">

                      <div className="mb-2 flex items-center justify-between">

                        <p className="text-xs font-semibold text-slate-700">
                          New Images
                        </p>

                        <span className="text-[11px] text-[#252B68]">
                          {newImages.length} ready
                        </span>

                      </div>


                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">

                        {newImagePreviews.map(
                          (preview, index) => (

                            <div
                              key={`${preview}-${index}`}
                              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                            >

                              <img
                                src={preview}
                                alt={`New image ${
                                  index + 1
                                }`}
                                className="h-full w-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeNewImage(
                                    index
                                  )
                                }
                                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveGallery}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#252B68] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d2257] disabled:opacity-60"
              >

                {saving && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? "Saving..."
                  : editingGallery
                    ? "Save Changes"
                    : "Create Gallery"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================================================================ */}
      {/* VIEW GALLERY */}
      {/* ================================================================ */}

      {viewOpen &&
        viewingGallery && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">

            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-base font-bold text-[#172033]">
                      {viewingGallery.title}
                    </h2>

                    {viewingGallery.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE900] px-2 py-1 text-[10px] font-bold text-[#172033]">
                        <Star
                          size={10}
                          fill="currentColor"
                        />
                        Featured
                      </span>
                    )}

                  </div>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {viewingGallery.image_count} images
                    {" · "}
                    {viewingGallery.class_name ||
                      "Whole School"}
                    {" · "}
                    {formatDate(
                      viewingGallery.event_date
                    )}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setViewOpen(false)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={19} />
                </button>

              </div>


              {/* IMAGE GRID */}

              <div className="overflow-y-auto bg-slate-50 p-4">

                {viewingGallery.description && (

                  <p className="mb-4 max-w-3xl text-sm text-slate-600">
                    {viewingGallery.description}
                  </p>

                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                  {viewingGallery.images.map(
                    (image, index) => (

                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm"
                      >

                        <img
                          src={
                            getImageUrl(
                              image.image_url
                            ) || ""
                          }
                          alt={`${viewingGallery.title} image ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">

                          <span className="text-[10px] font-medium text-white">
                            Image {index + 1}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* FOOTER */}

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">

                <div className="text-xs text-slate-500">
                  Added by{" "}
                  <span className="font-semibold text-slate-700">
                    {viewingGallery.author ||
                      "Administrator"}
                  </span>
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => {
                      setViewOpen(false);
                      openEdit(
                        viewingGallery
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Edit3 size={14} />
                    Edit Gallery
                  </button>

                  <button
                    onClick={() =>
                      setViewOpen(false)
                    }
                    className="rounded-lg bg-[#252B68] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d2257]"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}