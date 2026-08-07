export default function TourDatesRepeater({ dates, onAdd, onRemove, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-800">
        Tour Date(s)
      </label>

      <div className="space-y-3">
        {dates.map((d, idx) => (
          <div key={d._key} className="flex items-end gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex-1">
              <span className="mb-1 block text-xs text-gray-500">Start date</span>
              <input
                type="date"
                value={d.departure_date || ""}
                onChange={(e) => onChange(idx, "departure_date", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-xs text-gray-500">End date</span>
              <input
                type="date"
                value={d.return_date || ""}
                onChange={(e) => onChange(idx, "return_date", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add date
      </button>
    </div>
  );
}