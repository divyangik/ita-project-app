import { useState } from "react";
import GuestCategoryInlineManager from "./GuestCategoryInlineManager";

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

// Controlled component (data + onChange), same pattern as CapacityEligibility.
// `data` is the tour_info record — reads package_type_tags / traveller_types
// off it and reports the full { package_type_tags, traveller_types } shape
// back through onChange whenever a box is toggled.
export default function PackageTravellerOptions({
  data = {},
  packageTypeOptions = [],
  travellerOptions = [],
  onChange,
}) {
  const [selectedPackageTypes, setSelectedPackageTypes] = useState(
    () => data.package_type_tags || [],
  );
  const [selectedTravellerTypes, setSelectedTravellerTypes] = useState(
    () => data.traveller_types || [],
  );

  function emit(packageTypes, travellerTypes) {
    onChange?.({
      package_type_tags: packageTypes,
      traveller_types: travellerTypes,
    });
  }

  function togglePackageType(type) {
    setSelectedPackageTypes((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      emit(next, selectedTravellerTypes);
      return next;
    });
  }

  function toggleTravellerType(type) {
    setSelectedTravellerTypes((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      emit(selectedPackageTypes, next);
      return next;
    });
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-indigo-100 bg-white">
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
    </div>
  );
}