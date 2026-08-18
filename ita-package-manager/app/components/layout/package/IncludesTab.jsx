import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import GuestCategoryInlineManager from "./GuestCategoryInlineManager";

function defaultForm(data = {}, selectedIds = []) {
  return {
    selected_option_ids: selectedIds,

    // Not editable from this tab anymore, but kept so an existing
    // package's saved values aren't wiped out when this tab saves.
    hero_image: data.hero_image ?? "",
    image_alt_text: data.image_alt_text ?? "",
    primary_label: data.primary_label ?? "",
    primary_url: data.primary_url ?? "",
    secondary_label: data.secondary_label ?? "",
    enquiry_email_or_url: data.enquiry_email_or_url ?? "",
    show_selection_summary: data.show_selection_summary ?? false,

    // Moved here from the Tour info tab.
    tour_type_tags: data.tour_type_tags || [],
  };
}

function IconPreview({ svg, className = "h-5 w-5" }) {
  if (!svg) return null;
  return (
    <span
      className={`inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function IncludesTab({
  data,
  initialOptions = [],
  tourTypeOptions = [],
  onChange,
}) {
  const initialSelected = data.selected_option_ids || [];

  const [form, setForm] = useState(() => defaultForm(data, initialSelected));
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialSelected),
  );
  const [options, setOptions] = useState(initialOptions);
  const [selectedTags, setSelectedTags] = useState(
    () => data.tour_type_tags || [],
  );

  // `data.tour_type_tags` is only initialized into state once (above), so
  // it never re-syncs on its own. If a tour type option's *value* is
  // renamed while this page is open, the loader revalidates and
  // `data.tour_type_tags` picks up the correctly-migrated value from the
  // backend cascade — but `selectedTags` stays stale, showing the tag as
  // "unselected". Re-selecting it then stacks the new value on top of the
  // stale one, and the next save overwrites the correct DB value with
  // that stale, duplicated array. Re-sync whenever the underlying data
  // actually changes (stringified so an inline `|| []` array literal on
  // every parent render doesn't spuriously refire this).
  useEffect(() => {
    setSelectedTags(data.tour_type_tags || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data.tour_type_tags || [])]);

  const [managerOpen, setManagerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [svgInput, setSvgInput] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const crudFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const saving = crudFetcher.state !== "idle";
  const deleting = deleteFetcher.state !== "idle";

  function update(patch) {
    const next = { ...form, ...patch };
    setForm(next);
    onChange?.(next);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      update({ selected_option_ids: Array.from(next) });
      return next;
    });
  }

  function toggleTag(tag) {
    setSelectedTags((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      update({ tour_type_tags: next });
      return next;
    });
  }

  function openAddForm() {
    setEditingId(null);
    setNameInput("");
    setSvgInput("");
    setManagerOpen(true);
  }

  function openEditForm(option) {
    setEditingId(option.id);
    setNameInput(option.name);
    setSvgInput(option.svg);
    setManagerOpen(true);
  }

  function closeForm() {
    setManagerOpen(false);
    setEditingId(null);
    setNameInput("");
    setSvgInput("");
  }

  function handleSave(e) {
    e.preventDefault();
    if (!nameInput.trim() || !svgInput.trim()) return;

    crudFetcher.submit(
      {
        intent: editingId ? "update" : "create",
        ...(editingId ? { id: editingId } : {}),
        name: nameInput.trim(),
        svg: svgInput.trim(),
      },
      { method: "post", action: "/app/api/include-options" },
    );
  }

  function handleDelete(option) {
    if (!confirm(`Delete "${option.name}" from your includes library?`))
      return;

    setDeletingId(option.id);
    deleteFetcher.submit(
      { intent: "delete", id: option.id },
      { method: "post", action: "/app/api/include-options" },
    );
  }

  // New/updated option comes back from the API — merge into the list.
  useEffect(() => {
    if (!crudFetcher.data?.success || !crudFetcher.data?.option) return;

    const saved = crudFetcher.data.option;
    setOptions((prev) => {
      const exists = prev.some((o) => o.id === saved.id);
      return exists
        ? prev.map((o) => (o.id === saved.id ? saved : o))
        : [...prev, saved];
    });
    closeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudFetcher.data]);

  // Deletion confirmed — drop from the list and clear any selection of it.
  useEffect(() => {
    if (!deleteFetcher.data?.success || !deleteFetcher.data?.deletedId)
      return;

    const removedId = Number(deleteFetcher.data.deletedId);
    setOptions((prev) => prev.filter((o) => o.id !== removedId));
    setSelectedIds((prev) => {
      if (!prev.has(removedId)) return prev;
      const next = new Set(prev);
      next.delete(removedId);
      update({ selected_option_ids: Array.from(next) });
      return next;
    });
    setDeletingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteFetcher.data]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-start gap-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 text-blue-600"
            strokeWidth={1.75}
          />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Package includes
            </h3>
            <p className="text-xs text-gray-500">
              Select the items shown in the "Tour Package Includes" section.
              Hover a card to edit or remove it from your library.
            </p>
          </div>
        </div>

        {options.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
            No includes in your library yet — add your first one below.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const active = selectedIds.has(option.id);
              const isDeleting = deleting && deletingId === option.id;

              return (
                <div key={option.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => toggleSelected(option.id)}
                    aria-pressed={active}
                    disabled={isDeleting}
                    className={`flex w-[86px] flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-colors disabled:opacity-40 ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <IconPreview
                      svg={option.svg}
                      className={`h-5 w-5 ${
                        active ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`w-full truncate text-xs font-medium ${
                        active ? "text-blue-700" : "text-gray-500"
                      }`}
                    >
                      {option.name}
                    </span>
                  </button>

                  <div className="absolute -right-1.5 -top-1.5 hidden gap-1 group-hover:flex">
                    <button
                      type="button"
                      onClick={() => openEditForm(option)}
                      aria-label={`Edit ${option.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-blue-300 hover:text-blue-600"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(option)}
                      aria-label={`Delete ${option.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4">
          {!managerOpen ? (
            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add / edit includes
            </button>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {editingId ? "Edit include" : "New include"}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Networking"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Icon (SVG code)
                    </label>
                    <textarea
                      value={svgInput}
                      onChange={(e) => setSvgInput(e.target.value)}
                      rows={4}
                      placeholder='<svg viewBox="0 0 24 24">...</svg>'
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Preview
                  </span>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <IconPreview
                      svg={svgInput}
                      className="h-7 w-7 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !nameInput.trim() || !svgInput.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Add include"}
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
            </div>
          )}
        </div>
      </section>

      {/* Tour type tags — moved here from the Tour info tab */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-start gap-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 text-blue-600"
            strokeWidth={1.75}
          />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tour type tags
            </h3>
            <p className="text-xs text-gray-500">
              Click to toggle — active tags appear on the product page.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {tourTypeOptions.map((tag) => {
            const active = selectedTags.includes(tag.value);

            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        {tourTypeOptions.length === 0 && (
          <p className="mt-3 text-xs text-gray-400">
            No tour type options yet — use "Add / edit" below.
          </p>
        )}

        {tourTypeOptions.length > 0 && selectedTags.length === 0 && (
          <p className="mt-3 text-xs text-gray-400">
            No tags selected — the product page's filter chips won't match
            this tour.
          </p>
        )}

        <GuestCategoryInlineManager kind="tour_type" options={tourTypeOptions} />
      </section>
    </div>
  );
}