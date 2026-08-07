import { useState } from "react";
import { FieldError, inputClass } from "../shared/formValidation";

const TOUR_TYPE_OPTIONS = [
  "Group Tour",
  "Family & Fun",
  "Adventure",
  "Cultural",
  "Beach",
  "Solo Travel",
  "Honeymoon",
  "Wildlife",
];

const SHORT_DESCRIPTION_MAX = 500;

// Duration strings are stored as "10 Days / 9 Nights" (see NewPackage.jsx),
// so days/nights are derived from pkg.duration rather than entered by hand.
function parseDaysNights(durationLabel) {
  const match = String(durationLabel || "").match(
    /(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?/i,
  );
  if (!match) return { days: "", nights: "" };
  return { days: match[1], nights: match[2] };
}

function buildInitialForm(data = {}, pkg = {}) {
  const durationLabel = data.duration_label || pkg.duration || "";
  const derived = parseDaysNights(durationLabel);
  const startCity = data.start_city || "";

  return {
    tour_title: data.tour_title || pkg.title || "",
    duration_label: durationLabel,
    departure_city: startCity || data.departure_city || "",
    start_city: startCity,
    end_city: data.end_city || "",
    days: data.days || derived.days,
    nights: data.nights || derived.nights,
    country: data.country || pkg.destination || "",
    region: data.region || pkg.region || "",
    short_description: data.short_description || "",
    featured: data.featured || false,
  };
}

function validate(form) {
  const errors = {};

  if (!form.start_city.trim()) {
    errors.start_city = "Start city is required.";
  }
  if (!form.end_city.trim()) {
    errors.end_city = "End city is required.";
  }
  if (
    form.start_city.trim() &&
    form.end_city.trim() &&
    form.start_city.trim().toLowerCase() === form.end_city.trim().toLowerCase()
  ) {
    errors.end_city = "End city should differ from start city.";
  }
  if (form.short_description.length > SHORT_DESCRIPTION_MAX) {
    errors.short_description = `Keep it under ${SHORT_DESCRIPTION_MAX} characters (currently ${form.short_description.length}).`;
  }

  return errors;
}

export default function TourInformation({ data = {}, pkg = {} }) {
  const [form, setForm] = useState(() => buildInitialForm(data, pkg));
  const [selectedTags, setSelectedTags] = useState(data?.tour_type_tags || []);
  const [touched, setTouched] = useState({});

  const errors = validate(form);

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "start_city") {
      setForm((prev) => ({
        ...prev,
        start_city: value,
        departure_city: value,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <div className="space-y-5">
      {/* Tour identity — blue accent */}
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="flex items-start gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 to-white px-6 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tour identity
            </h3>
            <p className="text-xs text-gray-500">
              Title, duration, cities, and description
            </p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tour title
            </label>
            <input
              name="tour_title"
              value={form.tour_title}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-0"
            />
            <p className="mt-1 text-xs text-gray-400">
              Synced from the linked Shopify package — edit it from the
              package selection instead.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Duration label
              </label>
              <input
                name="duration_label"
                value={form.duration_label}
                readOnly
                placeholder="e.g. 7 Days, 1 Country, 1 City"
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              <p className="mt-1 text-xs text-gray-400">
                Set when the package's duration is created
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Departure city
              </label>
              <input
                name="departure_city"
                value={form.departure_city}
                readOnly
                placeholder="Same as start city"
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              <p className="mt-1 text-xs text-gray-400">
                Always matches start city
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Start city <span className="text-red-500">*</span>
              </label>
              <input
                name="start_city"
                value={form.start_city}
                onChange={handleChange}
                onBlur={() => markTouched("start_city")}
                placeholder="e.g. Los Angeles"
                className={inputClass(
                  touched.start_city && errors.start_city,
                  "blue",
                )}
              />
              {touched.start_city && <FieldError message={errors.start_city} />}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                End city <span className="text-red-500">*</span>
              </label>
              <input
                name="end_city"
                value={form.end_city}
                onChange={handleChange}
                onBlur={() => markTouched("end_city")}
                placeholder="e.g. San Francisco"
                className={inputClass(
                  touched.end_city && errors.end_city,
                  "blue",
                )}
              />
              {touched.end_city && <FieldError message={errors.end_city} />}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Days / Nights
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="days"
                  value={form.days}
                  readOnly
                  placeholder="Days"
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  name="nights"
                  value={form.nights}
                  readOnly
                  placeholder="Nights"
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Auto-filled from duration
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Short description
              </label>
              <span
                className={`text-xs ${
                  form.short_description.length > SHORT_DESCRIPTION_MAX
                    ? "font-medium text-red-500"
                    : "text-gray-400"
                }`}
              >
                {form.short_description.length}/{SHORT_DESCRIPTION_MAX}
              </span>
            </div>
            <textarea
              rows={4}
              name="short_description"
              value={form.short_description}
              onChange={handleChange}
              onBlur={() => markTouched("short_description")}
              placeholder="Describe the tour experience..."
              className={inputClass(
                touched.short_description && errors.short_description,
                "blue",
              )}
            />
            {touched.short_description && (
              <FieldError message={errors.short_description} />
            )}
          </div>
        </div>
      </div>

      {/* Tour type tags — purple accent */}
      <div className="overflow-hidden rounded-xl border border-purple-100 bg-white">
        <div className="flex items-start gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 to-white px-6 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M20.6 12.6L12.6 20.6a2 2 0 01-2.8 0l-8-8V4h8.6l8 8a2 2 0 010 2.8z" />
              <circle cx="7.5" cy="7.5" r="1" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tour type tags
            </h3>
            <p className="text-xs text-gray-500">
              Click to toggle — active tags appear on the product page
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {TOUR_TYPE_OPTIONS.map((tag) => {
              const active = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {selectedTags.length === 0 && (
            <p className="mt-3 text-xs text-amber-600">
              No tags selected — the product page's filter chips won't match
              this tour.
            </p>
          )}

          {selectedTags.map((tag) => (
            <input key={tag} type="hidden" name="tour_type_tags" value={tag} />
          ))}
        </div>
      </div>

      <input type="hidden" name="country" value={form.country} />
      <input type="hidden" name="region" value={form.region} />
      {form.featured && <input type="hidden" name="featured" value="on" />}
    </div>
  );
}