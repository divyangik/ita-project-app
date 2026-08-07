import { useState, useRef } from "react";
import {
  Building2,
  Bus,
  Camera,
  Flag,
  Utensils,
  Coffee,
  Plane,
  ShieldCheck,
  Waves,
  Bike,
  Sparkles,
  Wifi,
  ImagePlus,
  Info,
} from "lucide-react";
import { FieldError, inputClass } from "../shared/formValidation";

const INCLUDE_ITEMS = [
  { key: "hotels", label: "Hotels", icon: Building2 },
  { key: "transport", label: "Transport", icon: Bus },
  { key: "sightseeing", label: "Sightseeing", icon: Camera },
  { key: "activities", label: "Activities", icon: Flag },
  { key: "food", label: "Food", icon: Utensils },
  { key: "beverage", label: "Beverage", icon: Coffee },
  { key: "flights", label: "Flights", icon: Plane },
  { key: "insurance", label: "Insurance", icon: ShieldCheck },
  { key: "water_sports", label: "Water sports", icon: Waves },
  { key: "cycling", label: "Cycling", icon: Bike },
  { key: "spa", label: "Spa", icon: Sparkles },
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB, matches the UI copy

function defaultForm(data = {}) {
  return {
    hotels: data.hotels ?? false,
    transport: data.transport ?? false,
    sightseeing: data.sightseeing ?? false,
    activities: data.activities ?? false,
    food: data.food ?? false,
    beverage: data.beverage ?? false,
    flights: data.flights ?? false,
    insurance: data.insurance ?? false,
    water_sports: data.water_sports ?? false,
    cycling: data.cycling ?? false,
    spa: data.spa ?? false,
    wifi: data.wifi ?? false,

    hero_image: data.hero_image ?? "",
    image_alt_text: data.image_alt_text ?? "",

    primary_label: data.primary_label ?? "",
    primary_url: data.primary_url ?? "",
    secondary_label: data.secondary_label ?? "",
    enquiry_email_or_url: data.enquiry_email_or_url ?? "",

    show_selection_summary: data.show_selection_summary ?? false,
  };
}

function isValidUrlOrPath(value) {
  if (!value) return true;
  return /^(https?:\/\/|\/|mailto:)/i.test(value.trim());
}

function validate(form) {
  const errors = {};
  const anyIncluded = INCLUDE_ITEMS.some(({ key }) => form[key]);

  if (!anyIncluded) {
    errors.includes = "Select at least one included item.";
  }
  if (form.hero_image && !form.image_alt_text.trim()) {
    errors.image_alt_text = "Alt text is required when a hero image is set.";
  }
  if (form.primary_label.trim() && !form.primary_url.trim()) {
    errors.primary_url = "URL is required when a primary label is set.";
  }
  if (form.primary_url && !isValidUrlOrPath(form.primary_url)) {
    errors.primary_url = "Must start with http(s):// or /";
  }
  if (
    form.enquiry_email_or_url &&
    !isValidUrlOrPath(form.enquiry_email_or_url) &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.enquiry_email_or_url.trim())
  ) {
    errors.enquiry_email_or_url =
      "Enter a valid email, mailto:, URL, or path.";
  }

  return errors;
}

export default function IncludesTab({ data, onChange }) {
  const [form, setForm] = useState(() => defaultForm(data));
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef(null);

  const errors = validate(form);

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function update(patch) {
    const next = { ...form, ...patch };
    setForm(next);
    onChange?.(next);
  }

  function toggleInclude(key) {
    update({ [key]: !form[key] });
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image is larger than 2MB — please choose a smaller file.");
      return;
    }
    setImageError("");
    const reader = new FileReader();
    reader.onload = () => {
      update({ hero_image: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      {/* Package includes — blue accent */}
      <section className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="flex items-start gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 to-white px-5 py-4">
          <svg
            className="mt-0.5 h-4 w-4 text-blue-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Package includes
            </h3>
            <p className="text-xs text-gray-500">
              Toggle items shown in the "Tour Package Includes" section
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {INCLUDE_ITEMS.map(({ key, label, icon: Icon }) => {
              const active = form[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleInclude(key)}
                  aria-pressed={active}
                  className={`flex w-[86px] flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-colors ${
                    active
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active ? "text-blue-600" : "text-gray-400"
                    }`}
                    strokeWidth={1.75}
                  />
                  <span
                    className={`text-xs font-medium ${
                      active ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.includes && (
            <div className="mt-3">
              <FieldError message={errors.includes} />
            </div>
          )}
        </div>
      </section>

      {/* Hero image — amber accent */}
      <section className="overflow-hidden rounded-xl border border-amber-100 bg-white">
        <div className="flex items-start gap-2 border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
          <ImagePlus className="mt-0.5 h-4 w-4 text-amber-600" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Hero image</h3>
            <p className="text-xs text-gray-500">
              Main product image for the listing
            </p>
          </div>
        </div>

        <div className="p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-amber-400 bg-amber-50"
                : "border-gray-300 hover:border-amber-300 hover:bg-amber-50/30"
            }`}
          >
            {form.hero_image ? (
              <img
                src={form.hero_image}
                alt={form.image_alt_text || "Hero preview"}
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <>
                <ImagePlus
                  className="mb-2 h-6 w-6 text-amber-400"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-amber-600">Click</span> to
                  upload or drag an image here
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Recommended 600 × 600px · JPG or PNG · Max 2MB
                </p>
              </>
            )}
          </div>
          {imageError && (
            <div className="mt-2">
              <FieldError message={imageError} />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Image alt text{" "}
              {form.hero_image && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={form.image_alt_text}
              onChange={(e) => update({ image_alt_text: e.target.value })}
              onBlur={() => markTouched("image_alt_text")}
              placeholder="Describe the image for accessibility..."
              className={inputClass(
                touched.image_alt_text && errors.image_alt_text,
                "amber",
              )}
            />
            {touched.image_alt_text && (
              <FieldError message={errors.image_alt_text} />
            )}
            <p className="mt-1 text-xs text-gray-400">
              Required for accessibility and SEO
            </p>
          </div>
        </div>
      </section>

      {/* CTA buttons — teal accent */}
      <section className="overflow-hidden rounded-xl border border-teal-100 bg-white">
        <div className="flex items-start gap-2 border-b border-teal-100 bg-gradient-to-r from-teal-50/80 to-white px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 text-teal-600" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">CTA buttons</h3>
            <p className="text-xs text-gray-500">
              Labels and links for the booking widget buttons
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Primary label
              </label>
              <input
                type="text"
                value={form.primary_label}
                onChange={(e) => update({ primary_label: e.target.value })}
                placeholder="Book Online"
                className={inputClass(false, "teal")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Primary URL
              </label>
              <input
                type="text"
                value={form.primary_url}
                onChange={(e) => update({ primary_url: e.target.value })}
                onBlur={() => markTouched("primary_url")}
                placeholder="/checkout"
                className={inputClass(
                  touched.primary_url && errors.primary_url,
                  "teal",
                )}
              />
              {touched.primary_url && (
                <FieldError message={errors.primary_url} />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Secondary label
              </label>
              <input
                type="text"
                value={form.secondary_label}
                onChange={(e) => update({ secondary_label: e.target.value })}
                placeholder="Enquire Now"
                className={inputClass(false, "teal")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Enquiry email or URL
              </label>
              <input
                type="text"
                value={form.enquiry_email_or_url}
                onChange={(e) =>
                  update({ enquiry_email_or_url: e.target.value })
                }
                onBlur={() => markTouched("enquiry_email_or_url")}
                placeholder="mailto:info@example.com"
                className={inputClass(
                  touched.enquiry_email_or_url && errors.enquiry_email_or_url,
                  "teal",
                )}
              />
              {touched.enquiry_email_or_url && (
                <FieldError message={errors.enquiry_email_or_url} />
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Show "your selection" summary
            </p>
            <label className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.show_selection_summary}
                onClick={() =>
                  update({
                    show_selection_summary: !form.show_selection_summary,
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.show_selection_summary ? "bg-teal-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.show_selection_summary
                      ? "translate-x-4.5"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                Show traveler summary above buttons
              </span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}