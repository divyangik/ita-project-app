import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";

export default function GuestCategoryInlineManager({ kind, options }) {
  const [managerOpen, setManagerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [nameInput, setNameInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  // Separate fetchers for save vs delete, same as IncludesTab, so a
  // delete in flight doesn't get confused with a save in flight.
  const crudFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const saving = crudFetcher.state !== "idle";
  const deleting = deleteFetcher.state !== "idle";

   function openAddForm() {
    setEditingId(null);
    setNameInput("");
    setValueInput("");
    setMessageInput("");
    setManagerOpen(true);
  }

  function openEditForm(option) {
    setEditingId(option.id);
    setNameInput(option.name);
    setValueInput(option.value);
    setMessageInput(option.message || "");
    setManagerOpen(true);
  }

  function closeForm() {
    setManagerOpen(false);
    setEditingId(null);
    setNameInput("");
    setValueInput("");
    setMessageInput("");
  }

  // IMPORTANT: this is a plain button + onClick, not a <form onSubmit>.
  // This whole component lives inside the page's outer <Form method="post">,
  // and a nested <form> there is invalid HTML — the browser drops it and a
  // type="submit" button ends up submitting the outer page form instead,
  // which is what was causing the blank-page navigation.
  function handleSave() {
    if (!nameInput.trim() || !valueInput.trim()) return;

       crudFetcher.submit(
      {
        intent: editingId
          ? "update-guest-category-option"
          : "create-guest-category-option",
        id: editingId || "",
        kind,
        name: nameInput.trim(),
        value: valueInput.trim(),
        message: messageInput.trim(),
      },
      { method: "post", action: "/app/api/guest-category-options" },
    );
  }

  function handleDelete(option) {
    if (!confirm(`Delete "${option.name}" from your options?`)) return;

    setDeletingId(option.id);
    deleteFetcher.submit(
      { intent: "delete-guest-category-option", id: option.id },
      { method: "post", action: "/app/api/guest-category-options" },
    );
  }

  // Save/update succeeded — close the form. The parent page re-fetches
  // options via its own loader/list, same as before.
  useEffect(() => {
    if (crudFetcher.state === "idle" && crudFetcher.data?.success) {
      closeForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudFetcher.state, crudFetcher.data]);

  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteFetcher.data) {
      setDeletingId(null);
    }
  }, [deleteFetcher.state, deleteFetcher.data]);

  const kindLabel =
    kind === "package_type"
      ? "package type"
      : kind === "tour_type"
        ? "tour type"
        : "traveller";

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {!managerOpen ? (
        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add / edit {kindLabel} options
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {editingId ? `Edit ${kindLabel} option` : `New ${kindLabel} option`}
            </p>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Display name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Couple"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Value
              </label>
              <input
                type="text"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder="e.g. couple"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Customer-facing note (optional)
            </label>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="e.g. Counts as 2 guests — double the tour price"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Shown under this option in the storefront's Guest &amp; Rooms
              list. Leave blank to use the default text.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !nameInput.trim() || !valueInput.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add option"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {crudFetcher.data?.success === false && (
              <span className="text-xs text-red-600">
                {crudFetcher.data.error}
              </span>
            )}
          </div>

          <div className="mt-4 divide-y divide-gray-200 border-t border-gray-200 pt-2">
            {options.length === 0 && (
              <p className="py-2 text-xs text-gray-400">No options yet.</p>
            )}
            {options.map((option) => {
              const isDeleting = deleting && deletingId === option.id;
              return (
                <div
                  key={option.id}
                  className="flex items-center justify-between py-2"
                >
                                    <span className="text-sm text-gray-700">
                    {option.name}{" "}
                    <span className="text-xs text-gray-400">
                      ({option.value})
                    </span>
                    {option.message && (
                      <span className="block text-xs text-gray-400">
                        Note: {option.message}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(option)}
                      aria-label={`Edit ${option.name}`}
                      disabled={isDeleting}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600 disabled:opacity-40"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(option)}
                      aria-label={`Delete ${option.name}`}
                      disabled={isDeleting}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}