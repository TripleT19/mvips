"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_FORM = {
  title: "",
  description: "",
  location: "",
  class_name: "",
  event_date: "",
  start_time: "",
  end_time: "",
  featured: false,
  status: "published",
  image: null,
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  /*
  |--------------------------------------------------------------------------
  | AUTH
  |--------------------------------------------------------------------------
  */

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      Accept: "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD EVENTS
  |--------------------------------------------------------------------------
  */

  const loadEvents = async () => {
    try {
      setLoading(true);
      setPageError("");

      const token = getToken();

      if (!token) {
        setEvents([]);
        setPageError(
          "Your admin session has expired. Please log in again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/events?per_page=100`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      let responseData = {};

      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to manage events."
          );
        }

        throw new Error(
          responseData.message ||
            "Failed to load events."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | Your Laravel response is:
      |
      | {
      |   success: true,
      |   data: {
      |     current_page: 1,
      |     data: [...]
      |   }
      | }
      |
      | Therefore the actual events are:
      |
      | responseData.data.data
      |
      */

      let eventList = [];

      if (
        responseData?.data?.data &&
        Array.isArray(responseData.data.data)
      ) {
        eventList = responseData.data.data;
      } else if (
        responseData?.data &&
        Array.isArray(responseData.data)
      ) {
        eventList = responseData.data;
      } else if (
        Array.isArray(responseData)
      ) {
        eventList = responseData;
      } else if (
        Array.isArray(responseData.events)
      ) {
        eventList = responseData.events;
      }

      setEvents(eventList);
    } catch (error) {
      console.error(
        "Events loading error:",
        error
      );

      setEvents([]);

      setPageError(
        error.message ||
          "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM });
    setImagePreview(null);
    setFormError("");
    setValidationErrors({});
    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const openEditModal = (event) => {
    setEditingEvent(event);

    setForm({
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      class_name: event?.class_name || "",
      event_date: event?.event_date
        ? String(event.event_date).substring(0, 10)
        : "",
      start_time: event?.start_time
        ? String(event.start_time).substring(0, 5)
        : "",
      end_time: event?.end_time
        ? String(event.end_time).substring(0, 5)
        : "",
      featured: Boolean(event?.featured),
      status: event?.status || "published",
      image: null,
    });

    setImagePreview(
      event?.image_url || null
    );

    setFormError("");
    setValidationErrors({});
    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM });
    setImagePreview(null);
    setFormError("");
    setValidationErrors({});
  };

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    if (name === "image") {
      const file = files?.[0] || null;

      setForm((previous) => ({
        ...previous,
        image: file,
      }));

      if (file) {
        setImagePreview(
          URL.createObjectURL(file)
        );
      }

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[name];

          return updated;
        }
      );
    }

    if (formError) {
      setFormError("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FIELD ERROR
  |--------------------------------------------------------------------------
  */

  const getFieldError = (field) => {
    const error =
      validationErrors?.[field];

    if (!error) return "";

    if (Array.isArray(error)) {
      return error[0] || "";
    }

    return String(error);
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");
    setValidationErrors({});
    setSuccessMessage("");

    try {
      const token = getToken();

      if (!token) {
        setFormError(
          "Your admin session has expired. Please log in again."
        );
        return;
      }

      const clientErrors = {};

      if (!form.title.trim()) {
        clientErrors.title = [
          "The event title is required.",
        ];
      }

      if (!form.event_date) {
        clientErrors.event_date = [
          "The event date is required.",
        ];
      }

      if (
        form.start_time &&
        form.end_time &&
        form.end_time < form.start_time
      ) {
        clientErrors.end_time = [
          "The end time cannot be earlier than the start time.",
        ];
      }

      if (
        Object.keys(clientErrors).length
      ) {
        setValidationErrors(
          clientErrors
        );

        setFormError(
          "Please correct the errors below."
        );

        return;
      }

      const formData = new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description || ""
      );

      formData.append(
        "location",
        form.location || ""
      );

      formData.append(
        "class_name",
        form.class_name || ""
      );

      formData.append(
        "event_date",
        form.event_date
      );

      formData.append(
        "start_time",
        form.start_time || ""
      );

      formData.append(
        "end_time",
        form.end_time || ""
      );

      formData.append(
        "featured",
        form.featured ? "1" : "0"
      );

      formData.append(
        "status",
        form.status
      );

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      let url =
        `${API_URL}/api/admin/events`;

      if (editingEvent) {
        url =
          `${API_URL}/api/admin/events/${editingEvent.id}`;

        formData.append(
          "_method",
          "PUT"
        );
      }

      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              "application/json",
          },
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 422) {
          setValidationErrors(
            data.errors || {}
          );

          setFormError(
            data.message ||
              "Please correct the errors below."
          );

          return;
        }

        if (response.status === 401) {
          setFormError(
            "Your admin session has expired. Please log in again."
          );

          return;
        }

        if (response.status === 403) {
          setFormError(
            "You do not have permission to manage events."
          );

          return;
        }

        throw new Error(
          data.message ||
            "Unable to save the event."
        );
      }

      setSuccessMessage(
        editingEvent
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setShowModal(false);
      setEditingEvent(null);
      setForm({ ...EMPTY_FORM });
      setImagePreview(null);
      setFormError("");
      setValidationErrors({});

      await loadEvents();
    } catch (error) {
      console.error(
        "Save event error:",
        error
      );

      setFormError(
        error.message ||
          "Unable to save the event."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteEvent = async (event) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${event.title}"?`
      )
    ) {
      return;
    }

    try {
      setPageError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/events/${event.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete the event."
        );
      }

      setSuccessMessage(
        "Event deleted successfully."
      );

      await loadEvents();
    } catch (error) {
      console.error(
        "Delete event error:",
        error
      );

      setPageError(
        error.message ||
          "Failed to delete the event."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  */

  const removeSelectedImage = () => {
    setForm((previous) => ({
      ...previous,
      image: null,
    }));

    setImagePreview(
      editingEvent?.image_url || null
    );
  };

  const getImageUrl = (event) => {
    if (!event?.image_url) {
      return null;
    }

    if (
      event.image_url.startsWith(
        "http://"
      ) ||
      event.image_url.startsWith(
        "https://"
      )
    ) {
      return event.image_url;
    }

    return `${API_URL}${event.image_url}`;
  };

  /*
  |--------------------------------------------------------------------------
  | DATE HELPERS
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) return "Date not set";

    const dateString =
      String(date).substring(0, 10);

    const parsed =
      new Date(
        `${dateString}T00:00:00`
      );

    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }

    return parsed.toLocaleDateString(
      "en-MW",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return "";

    const value =
      String(time).substring(0, 5);

    const [hours, minutes] =
      value.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-MW",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const isExpired = (event) => {
    if (!event?.event_date) {
      return false;
    }

    const dateString =
      String(
        event.event_date
      ).substring(0, 10);

    const eventDate =
      new Date(
        `${dateString}T00:00:00`
      );

    const now = new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    if (eventDate < today) {
      return true;
    }

    if (
      eventDate.getTime() ===
        today.getTime() &&
      event.end_time
    ) {
      const [hours, minutes] =
        String(
          event.end_time
        )
          .substring(0, 5)
          .split(":")
          .map(Number);

      const endDate =
        new Date();

      endDate.setHours(
        hours,
        minutes,
        0,
        0
      );

      return now > endDate;
    }

    return false;
  };

  /*
  |--------------------------------------------------------------------------
  | CLASS OPTIONS
  |--------------------------------------------------------------------------
  */

  const classOptions = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    return [
      ...new Set(
        events
          .map(
            (event) =>
              event?.class_name
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [events]);

  /*
  |--------------------------------------------------------------------------
  | FILTERED EVENTS
  |--------------------------------------------------------------------------
  */

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    const searchText =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !searchText ||
        event?.title
          ?.toLowerCase()
          .includes(searchText) ||
        event?.description
          ?.toLowerCase()
          .includes(searchText) ||
        event?.location
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        event?.status ===
          statusFilter;

      const matchesClass =
        classFilter === "all" ||
        event?.class_name ===
          classFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClass
      );
    });
  }, [
    events,
    search,
    statusFilter,
    classFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const safeEvents = Array.isArray(
    events
  )
    ? events
    : [];

  const upcomingCount =
    safeEvents.filter(
      (event) =>
        !isExpired(event) &&
        event.status ===
          "published"
    ).length;

  const expiredCount =
    safeEvents.filter(
      (event) =>
        isExpired(event)
    ).length;

  const featuredCount =
    safeEvents.filter(
      (event) =>
        Boolean(event.featured)
    ).length;

  const draftCount =
    safeEvents.filter(
      (event) =>
        event.status === "draft"
    ).length;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#252B68] text-white">
            <CalendarDays size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#172033]">
              Events
            </h1>

            <p className="text-xs text-gray-500">
              Manage upcoming school events
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#252B68] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#171B4A]"
        >
          <Plus size={17} />
          Add Event
        </button>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <Notice
          type="success"
          message={
            successMessage
          }
          onClose={() =>
            setSuccessMessage("")
          }
        />
      )}

      {/* ERROR */}
      {pageError && (
        <Notice
          type="error"
          message={pageError}
          onClose={() =>
            setPageError("")
          }
        />
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        <CompactStat
          label="Total"
          value={
            safeEvents.length
          }
          icon={
            <CalendarDays size={17} />
          }
        />

        <CompactStat
          label="Upcoming"
          value={
            upcomingCount
          }
          icon={
            <Clock size={17} />
          }
        />

        <CompactStat
          label="Featured"
          value={
            featuredCount
          }
          icon={
            <Star size={17} />
          }
        />

        <CompactStat
          label="Drafts"
          value={
            draftCount
          }
          icon={
            <Pencil size={17} />
          }
        />

        <CompactStat
          label="Expired"
          value={
            expiredCount
          }
          icon={
            <AlertCircle size={17} />
          }
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-3">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search events..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#252B68]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#252B68]"
          >
            <option value="all">
              All Statuses
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

          <select
            value={classFilter}
            onChange={(e) =>
              setClassFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#252B68]"
          >
            <option value="all">
              All Audiences
            </option>

            {classOptions.map(
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
      </div>

      {/* EVENTS */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-gray-200 border-t-[#252B68]" />

          <p className="mt-3 text-xs text-gray-500">
            Loading events...
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <CalendarDays
            size={34}
            className="mx-auto text-gray-300"
          />

          <p className="mt-3 text-sm font-semibold text-gray-700">
            No events found
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Add an event or change your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map(
            (event) => {
              const expired =
                isExpired(event);

              const image =
                getImageUrl(event);

              return (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* IMAGE */}
                  <div className="relative h-32 bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={
                          event.title
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={32}
                          className="text-gray-300"
                        />
                      </div>
                    )}

                    <div className="absolute left-2 top-2 flex gap-1">
                      {event.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE900] px-2 py-1 text-[10px] font-bold text-[#252B68]">
                          <Star size={10} />
                          Featured
                        </span>
                      )}

                      {expired && (
                        <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] font-semibold text-white">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-3">

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold text-[#172033]">
                        {event.title}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          event.status ===
                          "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {
                          event.status
                        }
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5 text-xs text-gray-600">

                      <div className="flex items-center gap-1.5">
                        <CalendarDays
                          size={13}
                          className="shrink-0 text-[#252B68]"
                        />

                        <span>
                          {formatDate(
                            event.event_date
                          )}
                        </span>
                      </div>

                      {(event.start_time ||
                        event.end_time) && (
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={13}
                            className="shrink-0 text-[#F58220]"
                          />

                          <span>
                            {event.start_time &&
                              formatTime(
                                event.start_time
                              )}

                            {event.start_time &&
                              event.end_time &&
                              " – "}

                            {event.end_time &&
                              formatTime(
                                event.end_time
                              )}
                          </span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            size={13}
                            className="shrink-0 text-[#F58220]"
                          />

                          <span className="truncate">
                            {
                              event.location
                            }
                          </span>
                        </div>
                      )}

                      {event.class_name && (
                        <div className="flex items-center gap-1.5">
                          <Users
                            size={13}
                            className="shrink-0 text-[#252B68]"
                          />

                          <span>
                            {
                              event.class_name
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-3 flex gap-1.5 border-t border-gray-100 pt-3">

                      <button
                        type="button"
                        onClick={() =>
                          setViewingEvent(
                            event
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            event
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#252B68] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#171B4A]"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteEvent(
                            event
                          )
                        }
                        className="flex items-center justify-center rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================================ */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">

          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">
                  {editingEvent
                    ? "Edit Event"
                    : "Add Event"}
                </h2>

                <p className="text-xs text-gray-500">
                  {editingEvent
                    ? "Update event details"
                    : "Add a school event"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-y-auto"
            >
              <div className="space-y-3.5 p-5">

                {/* ERROR */}
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex gap-2">
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <div>
                        <p className="text-xs font-bold text-red-800">
                          Please check the form
                        </p>

                        <p className="mt-0.5 text-xs text-red-700">
                          {formError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TITLE */}
                <FormField
                  label="Event Title"
                  required
                  error={getFieldError(
                    "title"
                  )}
                >
                  <input
                    type="text"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Inter House Quiz"
                    className={inputClass(
                      getFieldError(
                        "title"
                      )
                    )}
                  />
                </FormField>

                {/* DESCRIPTION */}
                <FormField
                  label="Description"
                  error={getFieldError(
                    "description"
                  )}
                >
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows={3}
                    placeholder="Describe the event..."
                    className={inputClass(
                      getFieldError(
                        "description"
                      )
                    )}
                  />
                </FormField>

                {/* LOCATION / AUDIENCE */}
                <div className="grid gap-3 sm:grid-cols-2">

                  <FormField
                    label="Location"
                    error={getFieldError(
                      "location"
                    )}
                  >
                    <input
                      type="text"
                      name="location"
                      value={
                        form.location
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="School Main Hall"
                      className={inputClass(
                        getFieldError(
                          "location"
                        )
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Audience"
                    error={getFieldError(
                      "class_name"
                    )}
                  >
                    <select
                      name="class_name"
                      value={
                        form.class_name
                      }
                      onChange={
                        handleChange
                      }
                      className={inputClass(
                        getFieldError(
                          "class_name"
                        )
                      )}
                    >
                      <option value="">
                        Whole School
                      </option>

                      <option value="Early Years">
                        Early Years
                      </option>

                      <option value="Reception">
                        Reception
                      </option>

                      <option value="Year 1">
                        Year 1
                      </option>

                      <option value="Year 2">
                        Year 2
                      </option>

                      <option value="Year 3">
                        Year 3
                      </option>

                      <option value="Year 4">
                        Year 4
                      </option>

                      <option value="Year 5">
                        Year 5
                      </option>

                      <option value="Year 6">
                        Year 6
                      </option>

                      <option value="Parents">
                        Parents
                      </option>

                      <option value="Staff">
                        Staff
                      </option>
                    </select>
                  </FormField>
                </div>

                {/* DATE / TIMES */}
                <div className="grid gap-3 sm:grid-cols-3">

                  <FormField
                    label="Date"
                    required
                    error={getFieldError(
                      "event_date"
                    )}
                  >
                    <input
                      type="date"
                      name="event_date"
                      value={
                        form.event_date
                      }
                      onChange={
                        handleChange
                      }
                      className={inputClass(
                        getFieldError(
                          "event_date"
                        )
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Start"
                    error={getFieldError(
                      "start_time"
                    )}
                  >
                    <input
                      type="time"
                      name="start_time"
                      value={
                        form.start_time
                      }
                      onChange={
                        handleChange
                      }
                      className={inputClass(
                        getFieldError(
                          "start_time"
                        )
                      )}
                    />
                  </FormField>

                  <FormField
                    label="End"
                    error={getFieldError(
                      "end_time"
                    )}
                  >
                    <input
                      type="time"
                      name="end_time"
                      value={
                        form.end_time
                      }
                      onChange={
                        handleChange
                      }
                      className={inputClass(
                        getFieldError(
                          "end_time"
                        )
                      )}
                    />
                  </FormField>
                </div>

                {/* IMAGE */}
                <FormField
                  label="Event Image"
                  error={getFieldError(
                    "image"
                  )}
                >
                  {imagePreview ? (
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={
                          imagePreview
                        }
                        alt="Preview"
                        className="h-36 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={
                          removeSelectedImage
                        }
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 p-3 hover:bg-gray-50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <Upload
                          size={17}
                          className="text-gray-500"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          Upload event image
                        </p>

                        <p className="text-[10px] text-gray-500">
                          JPG, PNG or WEBP — max 5MB
                        </p>
                      </div>

                      <input
                        type="file"
                        name="image"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          handleChange
                        }
                        className="hidden"
                      />
                    </label>
                  )}
                </FormField>

                {/* STATUS / FEATURED */}
                <div className="grid gap-3 sm:grid-cols-2">

                  <FormField
                    label="Status"
                    error={getFieldError(
                      "status"
                    )}
                  >
                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      className={inputClass(
                        getFieldError(
                          "status"
                        )
                      )}
                    >
                      <option value="published">
                        Published
                      </option>

                      <option value="draft">
                        Draft
                      </option>
                    </select>
                  </FormField>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={
                        form.featured
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4 rounded text-[#252B68]"
                    />

                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Featured event
                      </p>

                      <p className="text-[10px] text-gray-500">
                        Highlight on website
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#252B68] px-5 py-2 text-xs font-semibold text-white hover:bg-[#171B4A] disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingEvent
                    ? "Update Event"
                    : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW MODAL */}
      {/* ================================================================ */}

      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {getImageUrl(
              viewingEvent
            ) ? (
              <img
                src={getImageUrl(
                  viewingEvent
                )}
                alt={
                  viewingEvent.title
                }
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gray-100">
                <ImageIcon
                  size={40}
                  className="text-gray-300"
                />
              </div>
            )}

            <div className="p-5">

              <div className="flex flex-wrap gap-1.5">
                {viewingEvent.featured && (
                  <span className="rounded-full bg-[#FFE900] px-2.5 py-1 text-[10px] font-bold text-[#252B68]">
                    Featured
                  </span>
                )}

                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                  {
                    viewingEvent.status
                  }
                </span>

                {isExpired(
                  viewingEvent
                ) && (
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                    Expired
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-[#172033]">
                  {
                    viewingEvent.title
                  }
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setViewingEvent(
                      null
                    )
                  }
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">

                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-[#252B68]"
                  />

                  {formatDate(
                    viewingEvent.event_date
                  )}
                </div>

                {(viewingEvent.start_time ||
                  viewingEvent.end_time) && (
                  <div className="flex items-center gap-2">
                    <Clock
                      size={15}
                      className="text-[#F58220]"
                    />

                    {viewingEvent.start_time &&
                      formatTime(
                        viewingEvent.start_time
                      )}

                    {viewingEvent.start_time &&
                      viewingEvent.end_time &&
                      " – "}

                    {viewingEvent.end_time &&
                      formatTime(
                        viewingEvent.end_time
                      )}
                  </div>
                )}

                {viewingEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-[#F58220]"
                    />

                    {
                      viewingEvent.location
                    }
                  </div>
                )}

                {viewingEvent.class_name && (
                  <div className="flex items-center gap-2">
                    <Users
                      size={15}
                      className="text-[#252B68]"
                    />

                    {
                      viewingEvent.class_name
                    }
                  </div>
                )}
              </div>

              {viewingEvent.description && (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Description
                  </h3>

                  <p className="mt-1.5 whitespace-pre-line text-xs leading-6 text-gray-600">
                    {
                      viewingEvent.description
                    }
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setViewingEvent(
                      null
                    )
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const event =
                      viewingEvent;

                    setViewingEvent(
                      null
                    );

                    openEditModal(
                      event
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#252B68] px-4 py-2 text-xs font-semibold text-white hover:bg-[#171B4A]"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| FORM FIELD
|--------------------------------------------------------------------------
*/

function FormField({
  label,
  required = false,
  error = "",
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-red-600">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INPUT CLASS
|--------------------------------------------------------------------------
*/

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition ${
    error
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 bg-white focus:border-[#252B68]"
  }`;
}

/*
|--------------------------------------------------------------------------
| STAT
|--------------------------------------------------------------------------
*/

function CompactStat({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#252B68]/10 text-[#252B68]">
          {icon}
        </div>

        <span className="text-[10px] font-medium text-gray-500">
          {label}
        </span>
      </div>

      <p className="mt-1 text-lg font-bold text-[#172033]">
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| NOTICE
|--------------------------------------------------------------------------
*/

function Notice({
  type,
  message,
  onClose,
}) {
  const success =
    type === "success";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
        success
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle2 size={16} />
        ) : (
          <AlertCircle size={16} />
        )}

        <span className="text-xs font-medium">
          {message}
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 hover:bg-black/5"
      >
        <X size={15} />
      </button>
    </div>
  );
}