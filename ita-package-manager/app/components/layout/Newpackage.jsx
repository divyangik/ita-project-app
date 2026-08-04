import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

const REGION_OPTIONS = [
  "Central America",
  "South America",
  "North America",
  "Caribbean",
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "Unpaid", label: "Unpaid" },
  { value: "Deposit paid", label: "Deposit paid" },
  { value: "Partial payment", label: "Partial payment" },
  { value: "Fully paid", label: "Fully paid" },
];

function mapShopifyStatus(status) {
  // Shopify: ACTIVE | DRAFT | ARCHIVED  →  our enum: Published | Draft | Archived
  if (status === "ACTIVE") return "Published";
  if (status === "ARCHIVED") return "Archived";
  return "Draft";
}

export default function NewPackage({ open, onClose, fetcher }) {
  const collectionsFetcher = useFetcher();
  const productsFetcher = useFetcher();

  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedCollectionTitle, setSelectedCollectionTitle] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [region, setRegion] = useState(REGION_OPTIONS[0]);
  const [basePrice, setBasePrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("Draft");

  const submitting = fetcher.state !== "idle";

  // Load collections once, when the modal opens
  useEffect(() => {
    console.log(
      "Modal open state:",
      open,
      "fetcher state:",
      collectionsFetcher.state,
    );
    if (
      open &&
      collectionsFetcher.state === "idle" &&
      !collectionsFetcher.data
    ) {
      console.log("Triggering collections load");
      collectionsFetcher.load("/app/api/collections");
    }
  }, [open]);

  const collections = collectionsFetcher.data?.collections || [];
  const products = productsFetcher.data?.products || [];

  function handleCollectionChange(e) {
    const collectionId = e.target.value;
    const collection = collections.find((c) => c.id === collectionId);

    setSelectedCollectionId(collectionId);
    setSelectedCollectionTitle(collection?.title || "");
    setSelectedProductId("");
    setSelectedVariantId("");

    if (collectionId) {
      productsFetcher.load(
        `/app/api/products-by-collection/${encodeURIComponent(collectionId)}`,
      );
      // Optional: prefill destination from collection name
      setDestination(collection?.title || "");
    }
  }

  function handleProductChange(e) {
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);

    setSelectedProductId(productId);

    if (product) {
      setSelectedVariantId(product.variantId || "");
      setTitle(product.title);
      setBasePrice(product.price);
      setStatus(mapShopifyStatus(product.status));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Create new package
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <fetcher.Form
          method="post"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Shopify selection */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Select from Shopify
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-800">
                    Destination collection
                  </label>
                  <select
                    value={selectedCollectionId}
                    onChange={handleCollectionChange}
                    disabled={collectionsFetcher.state === "loading"}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      {collectionsFetcher.state === "loading"
                        ? "Loading…"
                        : collections.length === 0
                          ? "No collections found"
                          : "Select a collection"}
                    </option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {collectionsFetcher.data?.error && (
                    <p className="mt-1 text-xs text-red-600">
                      Error: {collectionsFetcher.data.error}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-800">
                    Travel package
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={handleProductChange}
                    disabled={
                      !selectedCollectionId ||
                      productsFetcher.state === "loading"
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                  >
                    <option value="">
                      {productsFetcher.state === "loading"
                        ? "Loading…"
                        : "Select a product"}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProductId && (
                <p className="mt-2.5 flex items-center gap-1 text-xs text-blue-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Fields below are pre-filled from Shopify — you can still
                  edit them.
                </p>
              )}
            </div>

            {/* Hidden fields carrying the Shopify IDs */}
            <input
              type="hidden"
              name="shopify_product_id"
              value={selectedProductId}
            />
            <input
              type="hidden"
              name="shopify_variant_id"
              value={selectedVariantId}
            />
            <input
              type="hidden"
              name="shopify_collection_id"
              value={selectedCollectionId}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Package / Tour title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Afro Belize Garifuna Experience"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Destination / Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="destination"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Belize"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Region
                </label>
                <select
                  name="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Base price (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    name="base_price"
                    required
                    min="0"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-6 pr-3 text-sm shadow-sm placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Payment status
                </label>
                <select
                  name="payment_status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 7 Days, 1 Country, 1 City"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Initial status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="Draft">Draft — not published yet</option>
                <option value="Published">Published — live now</option>
              </select>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
              {submitting ? "Creating…" : "Create & edit"}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}