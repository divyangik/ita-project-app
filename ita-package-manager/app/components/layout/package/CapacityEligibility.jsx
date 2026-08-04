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
  };
}

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

      <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Custom package type
          </label>
          <input
            type="text"
            value={form.custom_package_type}
            onChange={(e) => update({ custom_package_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Custom message for package type
          </label>
          <input
            type="text"
            value={form.custom_package_message}
            onChange={(e) => update({ custom_package_message: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Extra nights type
          </label>
          <input
            type="text"
            value={form.extra_nights_type}
            onChange={(e) => update({ extra_nights_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Price for extra nights type
          </label>
          <input
            type="number"
            min="0"
            value={form.extra_nights_price}
            onChange={(e) =>
              update({ extra_nights_price: Number(e.target.value) || 0 })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Number of extra nights
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepper("extra_nights_count", -1, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              −
            </button>
            <input
              type="number"
              value={form.extra_nights_count}
              onChange={(e) =>
                update({ extra_nights_count: Number(e.target.value) || 1 })
              }
              className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => stepper("extra_nights_count", 1, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Private rooms type
          </label>
          <input
            type="text"
            value={form.private_rooms_type}
            onChange={(e) => update({ private_rooms_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Private rooms price
          </label>
          <input
            type="number"
            min="0"
            value={form.private_rooms_price}
            onChange={(e) =>
              update({ private_rooms_price: Number(e.target.value) || 0 })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Number of private rooms
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepper("private_rooms_count", -1, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              −
            </button>
            <input
              type="number"
              value={form.private_rooms_count}
              onChange={(e) =>
                update({ private_rooms_count: Number(e.target.value) || 1 })
              }
              className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => stepper("private_rooms_count", 1, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
