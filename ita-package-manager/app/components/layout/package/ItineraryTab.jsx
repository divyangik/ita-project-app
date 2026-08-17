import { useRef, useState } from "react";

export default function ItineraryTab({
  data = {},
  onChange,
  onDelete,
  isDeleting,
  collectionProducts = [],
  addons = [],
  onAddAddon,
  onRemoveAddon,
  isAddonBusy,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const currentUrl = data.itinerary_pdf_url || "";

  const [selectedProductId, setSelectedProductId] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    onChange?.(file);
  }

  function handleAddClick() {
    if (!selectedProductId) return;
    const product = collectionProducts.find((p) => p.id === selectedProductId);
    if (!product) return;
    onAddAddon?.(product);
    setSelectedProductId("");
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Email itinerary PDF</h3>
            <p className="text-xs text-gray-500">Upload the PDF customers receive by email</p>
          </div>
        </div>

        {currentUrl && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              Current itinerary PDF
            </a>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Removing…" : "Remove"}
            </button>
          </div>
        )}

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          {currentUrl ? "Replace PDF" : "Upload PDF"}
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />

        {selectedFile && (
          <p className="mt-2 text-xs text-gray-500">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) — click{" "}
            <span className="font-medium text-gray-700">Save changes</span> above to upload.
          </p>
        )}

        <p className="mt-2 text-xs text-gray-400">Max file size 100MB.</p>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Product Addon</h3>

        {collectionProducts.length === 0 ? (
          <p className="text-sm text-gray-400">
            No products found — make sure this package has a Shopify collection linked, and that the collection has products in it.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="">Select a product…</option>
              {collectionProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddClick}
              disabled={!selectedProductId || isAddonBusy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          </div>
        )}

        {addons.length > 0 && (
          <div className="mt-4 space-y-2">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {addon.image_url && (
                    <img
                      src={addon.image_url}
                      alt=""
                      className="h-8 w-8 flex-shrink-0 rounded object-cover"
                    />
                  )}
                  <span className="truncate text-gray-900">{addon.product_title}</span>
                  {addon.price != null && (
                    <span className="flex-shrink-0 text-gray-400">${addon.price}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAddon?.(addon.id)}
                  disabled={isAddonBusy}
                  className="flex-shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}