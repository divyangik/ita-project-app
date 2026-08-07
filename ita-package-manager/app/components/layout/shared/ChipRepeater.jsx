import { useState } from "react";

export default function ChipRepeater({ label, placeholder, items, onAdd, onRemove }) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1.5 pl-3 pr-2 text-sm text-gray-700"
            >
              {item.name}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                aria-label={`Remove ${item.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}