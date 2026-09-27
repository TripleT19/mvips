"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Save,
  Send,
  X,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

export default function CreateStoryPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    author: "",
    class_name: "",
    event_date: "",
    published_date: "",
    category_id: "",
    excerpt: "",
    content: "",
    featured: false,
    status: "draft",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/categories`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "admin_token"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(null);
    setImagePreview(null);
  }

  async function saveStory(
    event: FormEvent,
    desiredStatus?: string
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    const data = new FormData();

    data.append("title", form.title);
    data.append("author", form.author);
    data.append("class_name", form.class_name);
    data.append("event_date", form.event_date);
    data.append("published_date", form.published_date);
    data.append("category_id", form.category_id);
    data.append("excerpt", form.excerpt);
    data.append("content", form.content);
    data.append(
      "featured",
      form.featured ? "1" : "0"
    );
    data.append(
      "status",
      desiredStatus || form.status
    );

    if (image) {
      data.append("image", image);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/stories`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "admin_token"
            )}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const firstValidationError =
          result?.errors
            ? Object.values(result.errors)[0]?.[0]
            : null;

        throw new Error(
          firstValidationError ||
            result?.message ||
            "Unable to save the story."
        );
      }

      window.location.href = "/admin/stories";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the story."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/stories"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#252B68]"
        >
          <ArrowLeft size={17} />
          Back to Stories
        </Link>

        <h2 className="mt-4 text-2xl font-bold text-[#252B68]">
          Create Story
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add a new story to the Mount View school website.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={(event) =>
          saveStory(event, "draft")
        }
      >
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Main */}
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-bold text-[#252B68]">
                Story Details
              </h3>

              <div className="mt-5 space-y-5">
                <Field
                  label="Story Title"
                  required
                  value={form.title}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      title: value,
                    })
                  }
                  placeholder="Enter the story title"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Author"
                    value={form.author}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        author: value,
                      })
                    }
                    placeholder="e.g. Mount View School"
                  />

                  <Field
                    label="Class / Stream"
                    value={form.class_name}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        class_name: value,
                      })
                    }
                    placeholder="e.g. Year 5 East"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Event Date
                    </label>

                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          event_date:
                            event.target.value,
                        })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Published Date
                    </label>

                    <input
                      type="datetime-local"
                      value={form.published_date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          published_date:
                            event.target.value,
                        })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Excerpt
                  </label>

                  <textarea
                    rows={4}
                    value={form.excerpt}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        excerpt: event.target.value,
                      })
                    }
                    placeholder="Short description shown on the News page..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Full Story
                  </label>

                  <textarea
                    rows={12}
                    value={form.content}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        content: event.target.value,
                      })
                    }
                    placeholder="Write the full story here..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#252B68]">
                Publication
              </h3>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category_id:
                          event.target.value,
                      })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#252B68]"
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

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        featured:
                          event.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-[#F58220]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Featured story
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Highlight this story on the News page.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* Image */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#252B68]">
                Main Photo
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG or WebP. Maximum 5 MB.
              </p>

              {imagePreview ? (
                <div className="relative mt-4 overflow-hidden rounded-xl">
                  <img
                    src={imagePreview}
                    alt="Story preview"
                    className="aspect-video w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="mt-4 flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#F58220]/50 hover:bg-[#F58220]/5">
                  <ImagePlus
                    size={28}
                    className="text-[#252B68]"
                  />

                  <span className="mt-3 text-sm font-semibold text-slate-600">
                    Upload photo
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    Click to choose an image
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </section>

            {/* Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#252B68] transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={(event) =>
                  saveStory(event, "published")
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F58220] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df6f13] disabled:opacity-50"
              >
                <Send size={17} />
                {saving
                  ? "Publishing..."
                  : "Publish Story"}
              </button>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-[#F58220]">*</span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#252B68] focus:bg-white focus:ring-2 focus:ring-[#252B68]/10"
      />
    </div>
  );
}