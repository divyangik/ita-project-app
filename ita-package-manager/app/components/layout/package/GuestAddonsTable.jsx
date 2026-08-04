export default function GuestAddonsTable({ addons = [], onChange, onDelete }) {
  function updateRow(index, patch) {
    const next = addons.map((a, i) => (i === index ? { ...a, ...patch } : a));
    onChange(next);
  }

  function addRow() {
    onChange([
      ...addons,
      {
        _localId: `new-${Date.now()}`,
        addon_name: "",
        description: "",
        price: 0,
        visible: true,
        display_order: addons.length + 1,
      },
    ]);
  }

  function removeRow(index) {
    const addon = addons[index];
    if (addon.id) {
      onDelete(addon.id);
    }
    onChange(addons.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Guest add-ons
            </h3>
            <p className="text-xs text-gray-500">
              Optional upgrades in the booking widget
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add add-on
        </button>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-6 py-3">Add-on name</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3">Price (+$)</th>
            <th className="px-6 py-3">Visible</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon, index) => (
            <tr
              key={addon.id ?? addon._localId}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-6 py-3">
                <input
                  type="text"
                  value={addon.addon_name}
                  onChange={(e) =>
                    updateRow(index, { addon_name: e.target.value })
                  }
                  placeholder="e.g. Extra night"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </td>
              <td className="px-6 py-3">
                <input
                  type="text"
                  value={addon.description || ""}
                  onChange={(e) =>
                    updateRow(index, { description: e.target.value })
                  }
                  placeholder="Optional overnight add-on"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </td>
              <td className="px-6 py-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addon.price}
                  onChange={(e) =>
                    updateRow(index, { price: Number(e.target.value) || 0 })
                  }
                  className="w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </td>
              <td className="px-6 py-3">
                <button
                  type="button"
                  onClick={() => updateRow(index, { visible: !addon.visible })}
                  className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: addon.visible ? "#0f172a" : "#d1d5db",
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      addon.visible ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </td>
              <td className="px-6 py-3">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Remove add-on"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}

          {addons.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-sm text-gray-400"
              >
                No add-ons yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
