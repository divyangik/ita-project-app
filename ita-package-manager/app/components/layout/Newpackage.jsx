import { useState, useEffect, useRef, useMemo } from "react";
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

// The backend still requires `region`, but we no longer collect it from the
// user — it's inferred from the collection name so the API contract stays
// unchanged. Falls back to a sensible default when nothing matches.
function inferRegion(collectionTitle) {
  const title = (collectionTitle || "").toLowerCase();
  const match = REGION_OPTIONS.find((region) =>
    title.includes(region.toLowerCase()),
  );
  return match || "International";
}

const inputBase =
  "w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition placeholder-gray-400 focus:outline-none focus:ring-2";
const inputNormal = "border-gray-300 focus:border-blue-500 focus:ring-blue-100";
const inputError = "border-red-400 focus:border-red-500 focus:ring-red-100";
const inputReadOnly =
  "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-0";

function FieldError({ message }) {
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

export default function NewPackage({ open, onClose, fetcher }) {
  const collectionsFetcher = useFetcher();
  const productsFetcher = useFetcher();
  const formRef = useRef(null);
  const collectionBoxRef = useRef(null);

  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedCollectionTitle, setSelectedCollectionTitle] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [daysValue, setDaysValue] = useState("");
  const [nightsValue, setNightsValue] = useState("");
  const [status, setStatus] = useState("Draft");

  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const submitting = fetcher.state !== "idle";

  // Load collections once, when the modal opens
  useEffect(() => {
    if (
      open &&
      collectionsFetcher.state === "idle" &&
      !collectionsFetcher.data
    ) {
      collectionsFetcher.load("/app/api/collections");
    }
  }, [open]);

  // Reset the form each time the modal is opened fresh
  useEffect(() => {
    if (open) {
      setSelectedCollectionId("");
      setSelectedCollectionTitle("");
      setCollectionSearch("");
      setCollectionDropdownOpen(false);
      setSelectedProductId("");
      setSelectedVariantId("");
      setTitle("");
      setBasePrice("");
      setPaymentStatus("Unpaid");
      setDaysValue("");
      setNightsValue("");
      setStatus("Draft");
      setErrors({});
      setSubmitAttempted(false);
    }
  }, [open]);

  // Close the collection combobox on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        collectionBoxRef.current &&
        !collectionBoxRef.current.contains(e.target)
      ) {
        setCollectionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const collections = collectionsFetcher.data?.collections || [];
  const products = productsFetcher.data?.products || [];

  const filteredCollections = useMemo(() => {
    const term = collectionSearch.trim().toLowerCase();
    if (!term) return collections;
    return collections.filter((c) =>
      (c.title || "").toLowerCase().includes(term),
    );
  }, [collections, collectionSearch]);

  function clearError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleCollectionInputChange(e) {
    const value = e.target.value;
    setCollectionSearch(value);
    setCollectionDropdownOpen(true);

    // Editing the text invalidates the previous selection until they pick again
    if (selectedCollectionId) {
      setSelectedCollectionId("");
      setSelectedCollectionTitle("");
      setSelectedProductId("");
      setSelectedVariantId("");
      setTitle("");
      setBasePrice("");
    }
  }

  function handleCollectionSelect(collection) {
    setSelectedCollectionId(collection.id);
    setSelectedCollectionTitle(collection.title || "");
    setCollectionSearch(collection.title || "");
    setCollectionDropdownOpen(false);
    clearError("collection");

    setSelectedProductId("");
    setSelectedVariantId("");
    setTitle("");
    setBasePrice("");

    productsFetcher.load(
      `/app/api/products-by-collection/${encodeURIComponent(collection.id)}`,
    );
  }

  function handleProductChange(e) {
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);

    setSelectedProductId(productId);
    clearError("product");

    if (product) {
      setSelectedVariantId(product.variantId || "");
      setTitle(product.title || "");
      setBasePrice(product.price ?? "");
      setStatus(mapShopifyStatus(product.status));
      clearError("title");
      clearError("base_price");
    } else {
      setSelectedVariantId("");
      setTitle("");
      setBasePrice("");
    }
  }

  function validateDuration(days, nights) {
    const daysNum = Number(days);
    const nightsNum = Number(nights);

    if (!days || !nights) return null; // don't nag until both are filled
    if (
      !Number.isInteger(daysNum) ||
      !Number.isInteger(nightsNum) ||
      daysNum <= 0 ||
      nightsNum <= 0
    ) {
      return "Days and nights must be positive whole numbers.";
    }
    if (nightsNum > daysNum) {
      return "Nights cannot exceed days.";
    }
    if (daysNum - nightsNum > 1) {
      return "That combination isn't realistic — nights must equal days or be one less (e.g. 10 Days / 9 Nights).";
    }
    return null;
  }

  function handleDaysChange(e) {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setDaysValue(digitsOnly);
    const durationError = validateDuration(digitsOnly, nightsValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (durationError) next.duration = durationError;
      else delete next.duration;
      return next;
    });
  }

  function handleNightsChange(e) {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setNightsValue(digitsOnly);
    const durationError = validateDuration(daysValue, digitsOnly);
    setErrors((prev) => {
      const next = { ...prev };
      if (durationError) next.duration = durationError;
      else delete next.duration;
      return next;
    });
  }

  function validate() {
    const nextErrors = {};

    if (!selectedCollectionId) {
      nextErrors.collection = "Please select a collection.";
    }

    if (!selectedProductId) {
      nextErrors.product = "Please select a package.";
    }

    if (!title.trim()) {
      nextErrors.title =
        "Title is missing — select a package to auto-fill it.";
    }

    const priceNum = Number(basePrice);
    if (basePrice === "" || Number.isNaN(priceNum)) {
      nextErrors.base_price =
        "Base price is missing — select a package to auto-fill it.";
    } else if (priceNum <= 0) {
      nextErrors.base_price = "Base price must be a positive number.";
    }

    if (!daysValue || !nightsValue) {
      nextErrors.duration = "Enter both days and nights.";
    } else {
      const durationError = validateDuration(daysValue, nightsValue);
      if (durationError) nextErrors.duration = durationError;
    }

    if (!paymentStatus) {
      nextErrors.payment_status = "Select a payment status.";
    }

    if (!status) {
      nextErrors.status = "Select an initial status.";
    }

    return nextErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    fetcher.submit(formRef.current);
  }

  // Re-validate live once the user has already tried to submit once,
  // so error messages clear as they fix things
  useEffect(() => {
    if (!submitAttempted) return;
    setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCollectionId,
    selectedProductId,
    title,
    basePrice,
    daysValue,
    nightsValue,
    paymentStatus,
    status,
  ]);

  if (!open) return null;

  const durationHidden =
    daysValue && nightsValue ? `${daysValue} Days / ${nightsValue} Nights` : "";
  const destinationHidden = selectedCollectionTitle;
  const regionHidden = inferRegion(selectedCollectionTitle);

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
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Shopify selection */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Select from Shopify
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Searchable collection combobox */}
                <div ref={collectionBoxRef} className="relative">
                  <label className="mb-1.5 block text-sm font-medium text-gray-800">
                    Destination collection{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      role="combobox"
                      aria-expanded={collectionDropdownOpen}
                      autoComplete="off"
                      value={collectionSearch}
                      onChange={handleCollectionInputChange}
                      onFocus={() => setCollectionDropdownOpen(true)}
                      disabled={collectionsFetcher.state === "loading"}
                      placeholder={
                        collectionsFetcher.state === "loading"
                          ? "Loading…"
                          : "Type to search collections…"
                      }
                      className={`${inputBase} ${
                        errors.collection ? inputError : inputNormal
                      } pr-8 disabled:cursor-not-allowed disabled:bg-gray-100`}
                    />
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>

                    {collectionDropdownOpen &&
                      collectionsFetcher.state !== "loading" && (
                        <div className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {filteredCollections.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-500">
                              {collections.length === 0
                                ? "No collections found"
                                : `No collections match "${collectionSearch}"`}
                            </p>
                          ) : (
                            filteredCollections.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleCollectionSelect(c)}
                                className={`block w-full truncate px-3 py-2 text-left text-sm transition hover:bg-blue-50 ${
                                  c.id === selectedCollectionId
                                    ? "bg-blue-50 font-medium text-blue-700"
                                    : "text-gray-700"
                                }`}
                              >
                                {c.title}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                  </div>
                  <FieldError message={errors.collection} />
                  {collectionsFetcher.data?.error && (
                    <p className="mt-1 text-xs text-red-600">
                      Error: {collectionsFetcher.data.error}
                    </p>
                  )}
                </div>

                {/* Plain (non-searchable) package dropdown */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-800">
                    Travel package <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={handleProductChange}
                    disabled={
                      !selectedCollectionId ||
                      productsFetcher.state === "loading"
                    }
                    className={`${inputBase} ${
                      errors.product ? inputError : inputNormal
                    } bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none`}
                  >
                    <option value="">
                      {productsFetcher.state === "loading"
                        ? "Loading…"
                        : "Select a package"}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.product} />
                </div>
              </div>

              {selectedProductId && (
                <p className="mt-3 flex items-center gap-1 text-xs text-blue-700">
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
                  Title and price below are pulled from this package.
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
            {/* destination / region are derived from the collection, not
                collected from the user — kept as hidden fields so the
                backend API contract is unchanged */}
            <input type="hidden" name="destination" value={destinationHidden} />
            <input type="hidden" name="region" value={regionHidden} />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Package / Tour title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                readOnly
                value={title}
                placeholder="Auto-filled after selecting a package"
                className={`${inputBase} ${inputReadOnly}`}
              />
              <FieldError message={errors.title} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    readOnly
                    value={basePrice}
                    placeholder="0"
                    className={`${inputBase} ${inputReadOnly} pl-6`}
                  />
                </div>
                <FieldError message={errors.base_price} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Payment status
                </label>
                <select
                  name="payment_status"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    clearError("payment_status");
                  }}
                  className={`${inputBase} ${
                    errors.payment_status ? inputError : inputNormal
                  } bg-white`}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.payment_status} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Duration <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={daysValue}
                    onChange={handleDaysChange}
                    placeholder="Days e.g. 10"
                    className={`${inputBase} ${
                      errors.duration ? inputError : inputNormal
                    }`}
                  />
                  <span className="mt-1 block text-xs text-gray-400">Days</span>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={nightsValue}
                    onChange={handleNightsChange}
                    placeholder="Nights e.g. 9"
                    className={`${inputBase} ${
                      errors.duration ? inputError : inputNormal
                    }`}
                  />
                  <span className="mt-1 block text-xs text-gray-400">
                    Nights
                  </span>
                </div>
              </div>
              {daysValue && nightsValue && !errors.duration && (
                <p className="mt-1.5 text-xs text-gray-500">
                  {daysValue} Days / {nightsValue} Nights
                </p>
              )}
              <input type="hidden" name="duration" value={durationHidden} />
              <FieldError message={errors.duration} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Initial status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  clearError("status");
                }}
                className={`${inputBase} ${
                  errors.status ? inputError : inputNormal
                } bg-white`}
              >
                <option value="Draft">Draft — not published yet</option>
                <option value="Published">Published — live now</option>
              </select>
              <FieldError message={errors.status} />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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