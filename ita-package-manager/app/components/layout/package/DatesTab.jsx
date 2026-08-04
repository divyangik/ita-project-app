import { useState } from "react";

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

export default function DatesTab({ dates = [], packageBasePrice, fetcher }) {
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const adding = fetcher.state !== "idle";

  function handleAddDate() {
    if (!newStartDate || !newEndDate) return;

    fetcher.submit(
      {
        intent: "add-date",
        departure_date: newStartDate,
        return_date: newEndDate,
        adult_price: packageBasePrice ?? 0,
        notes: newMessage,
      },
      { method: "post" },
    );
    setNewStartDate("");
    setNewEndDate("");
    setNewMessage("");
  }

  function handleSetDefault(dateId) {
    fetcher.submit(
      { intent: "set-default-date", date_id: dateId },
      { method: "post" },
    );
  }

  function handleRemove(dateId) {
    fetcher.submit(
      { intent: "delete-date", date_id: dateId },
      { method: "post" },
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
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tour Date(s)
            </h3>
            <p className="text-xs text-gray-500">
              Departure and return dates shown on the booking widget
            </p>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              placeholder="Tour Start Date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              placeholder="Tour End Date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddDate}
            disabled={adding || !newStartDate || !newEndDate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
            {adding ? "Adding…" : "Add"}
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Message for custom date
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Scheduled dates
          </label>

          {dates.length === 0 ? (
            <p className="text-sm text-gray-400">No dates added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <span
                  key={d.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    d.is_default
                      ? "border-blue-300 bg-blue-50 text-blue-900"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 3v4M16 3v4" />
                  </svg>
                  {formatDateLabel(d.departure_date)}
                  {" – "}
                  {formatDateLabel(d.return_date)}
                  <button
                    type="button"
                    onClick={() => handleSetDefault(d.id)}
                    title="Set as default"
                    className={
                      d.is_default
                        ? "opacity-100"
                        : "opacity-40 hover:opacity-70"
                    }
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(d.id)}
                    aria-label="Remove date"
                    className="opacity-50 hover:opacity-100"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-3 w-3"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="mt-2.5 text-xs text-gray-400">
            ★ = default date pre-selected on the product page
          </p>
        </div>
      </div>
    </div>
  );
}
