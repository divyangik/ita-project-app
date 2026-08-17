import { useState } from "react";
import { FieldError, inputClass } from "../shared/formValidation";
import GuestCategoryInlineManager from "./GuestCategoryInlineManager";

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

// Shared section header — one neutral style for every card, so the tab
// reads as a single coherent form rather than a row of colored panels.
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 border-b border-indigo-100 bg-indigo-50/50 px-6 py-5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function TourInformation({
  data = {},
  pkg = {},
  countries = [],
  cities = [],
  locationsFetcher,
  packageTypeOptions = [],
  travellerOptions = [],
  tourTypeOptions = [],
}) {  
  const [form, setForm] = useState(() => buildInitialForm(data, pkg));
  const [selectedTags, setSelectedTags] = useState(data?.tour_type_tags || []);
  const [selectedPackageTypes, setSelectedPackageTypes] = useState(
    data?.package_type_tags || [],
  );
  const [selectedTravellerTypes, setSelectedTravellerTypes] = useState(
    data?.traveller_types || [],
  );
  const [touched, setTouched] = useState({});
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");

  const savingLocation = locationsFetcher && locationsFetcher.state !== "idle";

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

  function togglePackageType(type) {
    setSelectedPackageTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleTravellerType(type) {
    setSelectedTravellerTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function handleAddCountry() {
    const trimmed = newCountry.trim();
    if (!trimmed || !locationsFetcher) return;
    locationsFetcher.submit(
      { intent: "add-country", name: trimmed },
      { method: "post" },
    );
    setNewCountry("");
  }

  function handleAddCity() {
    const trimmed = newCity.trim();
    if (!trimmed || !locationsFetcher) return;
    locationsFetcher.submit(
      { intent: "add-city", name: trimmed },
      { method: "post" },
    );
    setNewCity("");
  }

  function handleRemoveCountry(countryId) {
    if (!locationsFetcher) return;
    locationsFetcher.submit(
      { intent: "delete-country", country_id: countryId },
      { method: "post" },
    );
  }

  function handleRemoveCity(cityId) {
    if (!locationsFetcher) return;
    locationsFetcher.submit(
      { intent: "delete-city", city_id: cityId },
      { method: "post" },
    );
  }

  return (
    <div className="space-y-5">
      {/* Tour identity */}
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
        <SectionHeader
          icon={
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
          }
          title="Tour identity"
          subtitle="Title, duration, cities, and description"
        />

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
                className={inputClass(touched.start_city && errors.start_city)}
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
                className={inputClass(touched.end_city && errors.end_city)}
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
              )}
            />
            {touched.short_description && (
              <FieldError message={errors.short_description} />
            )}
          </div>
        </div>
      </div>

      {/* Countries & cities to be visited */}
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
        <SectionHeader
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          }
          title="Countries & cities to be visited"
          subtitle="Shown on the product page as the tour's route"
        />

        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">
              Countries to be visited
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCountry();
                  }
                }}
                placeholder="Enter country name"
                className={inputClass(false)}
              />
              <button
                type="button"
                onClick={handleAddCountry}
                disabled={savingLocation || !newCountry.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            </div>

            {countries.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {countries.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1.5 rounded-full bg-indigo-50 py-1.5 pl-3 pr-2 text-sm text-indigo-700"
                  >
                    {c.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(c.id)}
                      aria-label={`Remove ${c.name}`}
                      className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-gray-400">
                No countries added yet.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">
              Cities to be visited
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCity();
                  }
                }}
                placeholder="Enter city name"
                className={inputClass(false)}
              />
              <button
                type="button"
                onClick={handleAddCity}
                disabled={savingLocation || !newCity.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            </div>

            {cities.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {cities.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1.5 rounded-full bg-indigo-50 py-1.5 pl-3 pr-2 text-sm text-indigo-700"
                  >
                    {c.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(c.id)}
                      aria-label={`Remove ${c.name}`}
                      className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-gray-400">
                No cities added yet.
              </p>
            )}
          </div>
        </div>
      </div>

     {/* Package type & traveller options */}
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
        <SectionHeader
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
              <path d="M16 7a3 3 0 010 6" />
              <path d="M22 20c0-2.5-2-4-4-4.5" />
            </svg>
          }
          title="Package type & traveller options"
          subtitle="Which guest categories this tour is offered for"
        />

        <div className="divide-y divide-indigo-100 p-6">
          <div className="pb-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Package type
            </p>
            <div className="flex flex-wrap gap-4">
              {packageTypeOptions.map((type) => {
                const checked = selectedPackageTypes.includes(type.value);
                return (
                  <label
                    key={type.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePackageType(type.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {type.name}
                  </label>
                );
              })}
              {packageTypeOptions.length === 0 && (
                <p className="text-xs text-gray-400">
                  No package type options yet — use "Add / edit" below.
                </p>
              )}
            </div>
            <GuestCategoryInlineManager
              kind="package_type"
              options={packageTypeOptions}
            />
          </div>

          <div className="pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Traveller
            </p>
            <div className="flex flex-wrap gap-4">
              {travellerOptions.map((type) => {
                const checked = selectedTravellerTypes.includes(type.value);
                return (
                  <label
                    key={type.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTravellerType(type.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {type.name}
                  </label>
                );
              })}
              {travellerOptions.length === 0 && (
                <p className="text-xs text-gray-400">
                  No traveller options yet — use "Add / edit" below.
                </p>
              )}
            </div>
            <GuestCategoryInlineManager
              kind="traveller"
              options={travellerOptions}
            />
          </div>
        </div>

        {selectedPackageTypes.map((type) => (
          <input
            key={type}
            type="hidden"
            name="package_type_tags"
            value={type}
          />
        ))}
        {selectedTravellerTypes.map((type) => (
          <input
            key={type}
            type="hidden"
            name="traveller_types"
            value={type}
          />
        ))}
      </div>

      {/* Tour type tags */}
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
        <SectionHeader
          icon={
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
          }
          title="Tour type tags"
          subtitle="Click to toggle — active tags appear on the product page"
        />

        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {tourTypeOptions.map((tag) => {
              const active = selectedTags.includes(tag.value);

              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>

          {tourTypeOptions.length === 0 && (
            <p className="mt-3 text-xs text-gray-400">
              No tour type options yet — use "Add / edit" below.
            </p>
          )}

          {tourTypeOptions.length > 0 && selectedTags.length === 0 && (
            <p className="mt-3 text-xs text-gray-400">
              No tags selected — the product page's filter chips won't match
              this tour.
            </p>
          )}

          <GuestCategoryInlineManager kind="tour_type" options={tourTypeOptions} />

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