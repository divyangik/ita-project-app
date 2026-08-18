import { useState } from "react";

function buildInitial(data = {}) {
  return {
    max_group_size: data.max_group_size ?? 1,
    min_group_size: data.min_group_size ?? 1,
    minimum_age: data.minimum_age ?? 0,
    maximum_age: data.maximum_age ?? "",
    child_allowed: data.child_allowed ?? true,
    infant_allowed: data.infant_allowed ?? true,
    wheelchair_accessible: data.wheelchair_accessible ?? false,
    fitness_level: data.fitness_level || "Easy",
    passport_required: data.passport_required ?? true,
    visa_required: data.visa_required ?? false,
    notes: data.notes || "",

    // -------- Custom fields --------
    custom_package_type: data.custom_package_type || "",
    custom_package_message: data.custom_package_message || "",
    extra_nights_type: data.extra_nights_type || "",
    extra_nights_price: data.extra_nights_price ?? 0,
    extra_nights_count: data.extra_nights_count ?? 1,
    private_rooms_type: data.private_rooms_type || "",
    private_rooms_price: data.private_rooms_price ?? 0,
    private_rooms_count: data.private_rooms_count ?? 1,

    couple_room_type: data.couple_room_type || "",
    couple_room_price: data.couple_room_price ?? 0,
    couple_room_count: data.couple_room_count ?? 1,
    child_room_type: data.child_room_type || "",
    child_room_price: data.child_room_price ?? 0,
    child_room_count: data.child_room_count ?? 1,
  };
}

// Each add-on group gets its own accent so the tiles are easy to tell apart
// at a glance. Custom package type is included here now too, so it gets
// the same Type + Price layout/behavior as the others instead of being two
// separate plain boxes above the grid — it just has no Count column since
// there's no backend field for it.
const GROUPS = [
  {
    key: "custom_package",
    title: "Custom package type",
    accent: "slate",
    typeField: "custom_package_type",
    priceField: "custom_package_message",
    priceLabel: "Custom price",
    hasCount: false,
    // Unlike the other groups' price fields (real Integer columns),
    // custom_package_message is stored as free-form Text on the backend —
    // Pydantic rejects a JS number there with a 422 ("Input should be a
    // valid string"). Keep it as a string all the way through.
    priceIsText: true,
  },
  {
    key: "extra_nights",
    title: "Extra nights",
    accent: "blue",
    typeField: "extra_nights_type",
    priceField: "extra_nights_price",
    countField: "extra_nights_count",
  },
  {
    key: "private_rooms",
    title: "Private rooms",
    accent: "blue",
    typeField: "private_rooms_type",
    priceField: "private_rooms_price",
    countField: "private_rooms_count",
  },
  {
    key: "couple_room",
    title: "Couple room",
    accent: "rose",
    typeField: "couple_room_type",
    priceField: "couple_room_price",
    countField: "couple_room_count",
  },
  {
    key: "child_room",
    title: "Child room",
    accent: "amber",
    typeField: "child_room_type",
    priceField: "child_room_price",
    countField: "child_room_count",
  },
];

const ACCENTS = {
  slate: {
    bg: "bg-slate-50/60",
    border: "border-slate-200",
    dot: "bg-slate-500",
    text: "text-slate-700",
    ring: "focus:border-slate-500 focus:ring-slate-100",
  },
  blue: {
    bg: "bg-blue-50/60",
    border: "border-blue-100",
    dot: "bg-blue-500",
    text: "text-blue-700",
    ring: "focus:border-blue-500 focus:ring-blue-100",
  },
  rose: {
    bg: "bg-rose-50/60",
    border: "border-rose-100",
    dot: "bg-rose-500",
    text: "text-rose-700",
    ring: "focus:border-rose-500 focus:ring-rose-100",
  },
  amber: {
    bg: "bg-amber-50/60",
    border: "border-amber-100",
    dot: "bg-amber-500",
    text: "text-amber-700",
    ring: "focus:border-amber-500 focus:ring-amber-100",
  },
};

export default function CapacityEligibility({ data = {}, onChange }) {
  const [form, setForm] = useState(() => buildInitial(data));

  function update(patch) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      onChange?.(next);
      return next;
    });
  }

  function stepper(name, delta, min = 0) {
    const current = Number(form[name]) || 0;
    update({ [name]: Math.max(min, current + delta) });
  }

  // Fixes the "stuck at 0, can't backspace" bug: previously every
  // keystroke ran `Number(e.target.value) || 0`, so clearing the field to
  // type a new value snapped it straight back to "0" before you could type
  // anything else. Now an in-progress empty field is allowed to actually
  // be empty; it only falls back to the default once you leave the field
  // (onBlur) or if you never type anything at all.
  function numberFieldProps(field, fallback) {
    return {
      value: form[field],
      onChange: (e) => {
        const raw = e.target.value;
        update({ [field]: raw === "" ? "" : Number(raw) });
      },
      onBlur: (e) => {
        if (e.target.value === "") update({ [field]: fallback });
      },
    };
  }

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-6 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-gray-600">
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
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Capacity & eligibility
          </h3>
          <p className="text-xs text-gray-500">
            Custom package and add-on options
          </p>
        </div>
      </div>

      {/* Add-on tiles: custom package type / extra nights / private rooms /
          couple room / child room — same Type + Price (+ Count) layout for
          all of them. */}
      <div className="grid grid-cols-1 gap-4 border-t border-gray-200 p-6 sm:grid-cols-2">
        {GROUPS.map((group) => {
          const accent = ACCENTS[group.accent];
          const hasCount = group.hasCount !== false;

          return (
            <div
              key={group.key}
              className={`rounded-xl border ${accent.border} ${accent.bg} p-5`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
                <h4 className={`text-sm font-semibold ${accent.text}`}>
                  {group.title}
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Type
                  </label>
                  <input
                    type="text"
                    value={form[group.typeField]}
                    onChange={(e) => update({ [group.typeField]: e.target.value })}
                    placeholder={`e.g. ${group.title}`}
                    className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${accent.ring}`}
                  />
                </div>

                <div className={hasCount ? "grid grid-cols-2 gap-3" : ""}>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {group.priceLabel || "Price"}
                    </label>
                    {group.priceIsText ? (
                      <input
                        type="text"
                        placeholder="0"
                        value={form[group.priceField]}
                        onChange={(e) =>
                          update({ [group.priceField]: e.target.value })
                        }
                        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${accent.ring}`}
                      />
                    ) : (
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...numberFieldProps(group.priceField, 0)}
                        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${accent.ring}`}
                      />
                    )}
                  </div>

                  {hasCount && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Count
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stepper(group.countField, -1, 1)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...numberFieldProps(group.countField, 1)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => stepper(group.countField, 1, 1)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}