export function FieldError({ message }) {
  if (!message) return null;
  return (
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
      {message}
    </p>
  );
}

// Returns the className for an input given whether it currently has an error.
// `accent` picks the focus ring color when valid (matches each section's theme).
export function inputClass(hasError, accent = "blue") {
  const ACCENT_RING = {
    blue: "focus:border-blue-500 focus:ring-blue-500",
    green: "focus:border-green-500 focus:ring-green-500",
    purple: "focus:border-purple-500 focus:ring-purple-500",
    amber: "focus:border-amber-500 focus:ring-amber-500",
    rose: "focus:border-rose-500 focus:ring-rose-500",
    teal: "focus:border-teal-500 focus:ring-teal-500",
  };
  const base =
    "w-full rounded-lg border px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors";
  return hasError
    ? `${base} border-red-400 focus:border-red-500 focus:ring-red-500`
    : `${base} border-gray-300 ${ACCENT_RING[accent] || ACCENT_RING.blue}`;
}