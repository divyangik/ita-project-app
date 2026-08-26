import { useEffect, useMemo, useState } from "react";
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

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function validateDates(start, end) {
  const today = todayIso();

  if (start && start < today) {
    return { start: "Start date can't be in the past." };
  }
  if (end && end < today) {
    return { end: "End date can't be in the past." };
  }
  if (start && end && end === start) {
    return { end: "End date can't be the same as the start date." };
  }
  if (start && end && end < start) {
    return { end: "End date must be after the start date." };
  }
  return {};
}

export default function DatesTab({ dates = [], packageBasePrice, fetcher }) {
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Draft notes text per existing date, keyed by date id — lets each card be
  // edited independently and only sent to the server when its own Save is clicked.
  const [noteDrafts, setNoteDrafts] = useState(() =>
    Object.fromEntries(dates.map((d) => [d.id, d.notes || ""])),
  );
  const [savingDateId, setSavingDateId] = useState(null);

  // Keep drafts in sync when dates are added/removed, without clobbering
  // text the user is actively editing in an existing card.
  useEffect(() => {
    setNoteDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      const currentIds = new Set(dates.map((d) => d.id));

      dates.forEach((d) => {
        if (!(d.id in next)) {
          next[d.id] = d.notes || "";
          changed = true;
        }
      });
      Object.keys(next).forEach((id) => {
        if (!currentIds.has(Number(id))) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [dates]);

  const adding = fetcher.state !== "idle";

  // Clear the per-card "Saving…" state once the fetcher round-trips back to idle.
  useEffect(() => {
    if (fetcher.state === "idle") {
      setSavingDateId(null);
    }
  }, [fetcher.state]);
  const min = useMemo(() => todayIso(), []);
  const errors = useMemo(
    () => validateDates(newStartDate, newEndDate),
    [newStartDate, newEndDate],
  );
  const hasErrors = Boolean(errors.start || errors.end);

  function handleStartChange(e) {
    const value = e.target.value;
    setNewStartDate(value);
    // If the end date is no longer valid against the new start date, clear it
    // so the user can't submit a stale, now-invalid pair.
    if (newEndDate && (newEndDate <= value)) {
      setNewEndDate("");
    }
  }

  function handleAddDate() {
    if (!newStartDate || !newEndDate) return;
    if (validateDates(newStartDate, newEndDate).start) return;
    if (validateDates(newStartDate, newEndDate).end) return;

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

  function handleSaveNote(dateId) {
    setSavingDateId(dateId);
    fetcher.submit(
      {
        intent: "update-date",
        date_id: dateId,
        notes: noteDrafts[dateId] ?? "",
      },
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

        <div className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="date"
              min={min}
              value={newStartDate}
              onChange={handleStartChange}
              placeholder="Tour Start Date"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                errors.start
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {errors.start && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5 shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {errors.start}
              </p>
            )}
          </div>

          <div className="flex-1">
            <input
              type="date"
              min={newStartDate || min}
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              disabled={!newStartDate}
              placeholder="Tour End Date"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.end
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {errors.end && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5 shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {errors.end}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddDate}
            disabled={adding || !newStartDate || !newEndDate || hasErrors}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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

       

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Scheduled dates
          </label>

          {dates.length === 0 ? (
            <p className="text-sm text-gray-400">No dates added yet.</p>
          ) : (
            <div className="space-y-2">
              {dates.map((d) => {
                const draft = noteDrafts[d.id] ?? "";
                const dirty = draft !== (d.notes || "");

                return (
                  <div
                    key={d.id}
                    className={`rounded-lg border p-3 ${
                      d.is_default
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5 shrink-0"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 3v4M16 3v4" />
                      </svg>
                      <span>
                        {formatDateLabel(d.departure_date)}
                        {" – "}
                        {formatDateLabel(d.return_date)}
                      </span>
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
                        className="ml-auto opacity-50 hover:opacity-100"
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
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={draft}
                        placeholder="Message for this date (optional)"
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [d.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNote(d.id)}
                        disabled={!dirty || savingDateId === d.id}
                        className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingDateId === d.id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
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