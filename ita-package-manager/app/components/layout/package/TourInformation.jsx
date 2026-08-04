import { useState } from "react";

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

const REGION_OPTIONS = [
  "Central America",
  "South America",
  "North America",
  "Caribbean",
];

function buildInitialForm(data = {}, pkg = {}) {
  return {
    tour_title: data.tour_title || pkg.title || "",
    duration_label: data.duration_label || pkg.duration || "",
    departure_city: data.departure_city || "",
    start_city: data.start_city || "",
    end_city: data.end_city || "",
    days: data.days || "",
    nights: data.nights || "",
    country: data.country || pkg.destination || "",
    region: data.region || pkg.region || REGION_OPTIONS[0],
    short_description: data.short_description || "",
    featured: data.featured || false,
  };
}

export default function TourInformation({ data = {}, pkg = {} }) {
  const [form, setForm] = useState(() => buildInitialForm(data, pkg));
  const [selectedTags, setSelectedTags] = useState(data?.tour_type_tags || []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
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
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tour title
            </label>
            <input
              name="tour_title"
              value={form.tour_title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Duration label
              </label>
              <input
                name="duration_label"
                value={form.duration_label}
                onChange={handleChange}
                placeholder="e.g. 7 Days, 1 Country, 1 City"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Shown below the title on the product page
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Departure city
              </label>
              <input
                name="departure_city"
                value={form.departure_city}
                onChange={handleChange}
                placeholder="e.g. Belize"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Start city
              </label>
              <input
                name="start_city"
                value={form.start_city}
                onChange={handleChange}
                placeholder="e.g. Los Angeles"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                End city
              </label>
              <input
                name="end_city"
                value={form.end_city}
                onChange={handleChange}
                placeholder="e.g. San Francisco"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Days / Nights
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="days"
                  value={form.days}
                  onChange={handleChange}
                  placeholder="Days"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  name="nights"
                  value={form.nights}
                  onChange={handleChange}
                  placeholder="Nights"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Short description
            </label>
            <textarea
              rows={4}
              name="short_description"
              value={form.short_description}
              onChange={handleChange}
              placeholder="Describe the tour experience..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
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
              Categories & tags
            </h3>
            <p className="text-xs text-gray-500">
              Breadcrumb path and tour type labels
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Region
            </label>
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Country
            </label>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tour type tags
          </h3>

          <div className="flex flex-wrap gap-3">
            {TOUR_TYPE_OPTIONS.map((tag) => {
              const active = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {selectedTags.map((tag) => (
            <input key={tag} type="hidden" name="tour_type_tags" value={tag} />
          ))}

          <p className="mt-2 text-xs text-gray-500">
            Click to toggle — active tags appear on the product page.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />
          <label className="text-sm font-medium text-gray-700">
            Featured tour
          </label>
        </div>
      </div>
    </div>
  );
}
