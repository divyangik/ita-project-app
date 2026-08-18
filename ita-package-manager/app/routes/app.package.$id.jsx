import { useState, useEffect } from "react";
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  useFetcher,
  Link,
} from "react-router";

import { authenticate } from "../shopify.server";
import {
  getPackage,
  updatePackage,
  getTourInfo,
  saveTourInfo,
  getTourDates,
  createTourDate,
  setDefaultTourDate,
  deleteTourDate,
  getTourCapacity,
  saveTourCapacity,
  getTourPricing,
  saveTourPricing,
  getTourPayment,
  saveTourPayment,
  getGuestAddons,
  createGuestAddon,
  updateGuestAddon,
  deleteGuestAddon,
  getTourIncludes,
  saveTourIncludes,
  getIncludeOptions,
  getPackageIncludeSelections,
  savePackageIncludeSelections,
  getGuestCategoryOptions,
  getTourItinerary,
  uploadItineraryPdf,
  deleteItineraryPdf,
  getPackageCountries,
  addPackageCountry,
  deletePackageCountry,
  getPackageCities,
  addPackageCity,
  deletePackageCity,
  getProductAddons,
  createProductAddon,
  deleteProductAddon,
} from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import TourInformation from "../components/layout/package/TourInformation";
import DatesTab from "../components/layout/package/DatesTab";
import CapacityEligibility from "../components/layout/package/CapacityEligibility";
import PackageTravellerOptions from "../components/layout/package/PackageTravellerOptions";
import PricingTab from "../components/layout/package/PricingTab";
import GuestAddonsTable from "../components/layout/package/GuestAddonsTable";
import IncludesTab from "../components/layout/package/IncludesTab";
import ItineraryTab from "../components/layout/package/ItineraryTab";
import Toast from "../components/layout/ui/Toast";

// Package type & traveller options (Travel Package tab) and Tour type tags
// (Includes tab) both live on the same tour_info record as the fields the
// Tour info tab edits. Since the FastAPI PUT fully overwrites tour_info,
// every save from any of these three tabs must send the COMPLETE record —
// this fetches what's currently saved and layers just the caller's fields
// on top, so saving one tab never wipes what another tab owns.
async function mergeAndSaveTourInfo(packageId, overrides) {
  const current = await getTourInfo(packageId);

  await saveTourInfo(packageId, {
    tour_title: current.tour_title || "",
    duration_label: current.duration_label || "",
    departure_city: current.departure_city || "",
    start_city: current.start_city || "",
    end_city: current.end_city || "",
    days: current.days ?? null,
    nights: current.nights ?? null,
    country: current.country || "",
    region: current.region || "",
    category: current.category || "",
    short_description: current.short_description || "",
    tour_type_tags: current.tour_type_tags || [],
    package_type_tags: current.package_type_tags || [],
    traveller_types: current.traveller_types || [],
    featured: current.featured || false,
    ...overrides,
  });
}

export async function loader({ params, request }) {
  const { session, admin } = await authenticate.admin(request);

  const packageData = await getPackage({ id: params.id, shop: session.shop });
  const tourInfo = await getTourInfo(packageData.id);
  const tourDates = await getTourDates(packageData.id);

  let tourIncludes = {};
  try {
    tourIncludes = (await getTourIncludes(packageData.id)) || {};
  } catch {
    tourIncludes = {};
  }

  let includeOptions = [];
  try {
    includeOptions = (await getIncludeOptions(session.shop)) || [];
  } catch {
    includeOptions = [];
  }

  let selectedIncludeIds = [];
  try {
    const selection = await getPackageIncludeSelections(packageData.id);
    selectedIncludeIds = selection?.option_ids || [];
  } catch {
    selectedIncludeIds = [];
  }

  let packageTypeOptions = [];
  try {
    packageTypeOptions =
      (await getGuestCategoryOptions(session.shop, "package_type")) || [];
  } catch {
    packageTypeOptions = [];
  }

  let travellerOptions = [];
  try {
    travellerOptions =
      (await getGuestCategoryOptions(session.shop, "traveller")) || [];
  } catch {
    travellerOptions = [];
  }

  let tourTypeOptions = [];
  try {
    tourTypeOptions =
      (await getGuestCategoryOptions(session.shop, "tour_type")) || [];
  } catch {
    tourTypeOptions = [];
  }

  let tourCapacity = {};
  try {
    tourCapacity = (await getTourCapacity(packageData.id)) || {};
  } catch {
    tourCapacity = {};
  }

  let tourPricing = {};
  try {
    tourPricing = (await getTourPricing(packageData.id)) || {};
  } catch {
    tourPricing = {};
  }

  let tourPayment = {};
  try {
    tourPayment = (await getTourPayment(packageData.id)) || {};
  } catch {
    tourPayment = {};
  }

  let guestAddons = [];
  try {
    guestAddons = (await getGuestAddons(packageData.id)) || [];
  } catch {
    guestAddons = [];
  }

  let tourItinerary = {};
  try {
    tourItinerary = (await getTourItinerary(packageData.id)) || {};
  } catch {
    tourItinerary = {};
  }

  let productAddons = [];
  try {
    productAddons = (await getProductAddons(packageData.id)) || [];
  } catch {
    productAddons = [];
  }

  let countries = [];
  try {
    countries = (await getPackageCountries(packageData.id, session.shop)) || [];
  } catch {
    countries = [];
  }

  let cities = [];
  try {
    cities = (await getPackageCities(packageData.id, session.shop)) || [];
  } catch {
    cities = [];
  }

  // If this package is linked to a Shopify product, pull live details
  let shopifyProduct = null;
  if (packageData.shopify_product_id) {
    try {
      const response = await admin.graphql(
        `#graphql
        query GetProduct($id: ID!) {
          product(id: $id) {
            id
            title
            status
            description
            onlineStoreUrl
            featuredImage { url altText }
            variants(first: 1) { edges { node { id price } } }
          }
        }`,
        {
          variables: {
            id: `gid://shopify/Product/${packageData.shopify_product_id}`,
          },
        },
      );
      const data = await response.json();
      shopifyProduct = data.data.product;
    } catch {
      shopifyProduct = null;
    }
  }

  // Products available for the "Product Addon" dropdown — always pulled from
  // the dedicated T-shirt collection, NOT the package's own linked travel
  // collection. Set TSHIRT_COLLECTION_HANDLE in your env if the handle in
  // your store differs from the default "t-shirts".
  const TSHIRT_COLLECTION_HANDLE =
    process.env.TSHIRT_COLLECTION_HANDLE || "t-shirts";

  let collectionProducts = [];
  try {
    const response = await admin.graphql(
      `#graphql
      query GetTshirtCollectionProducts($handle: String!) {
        collectionByHandle(handle: $handle) {
          products(first: 50) {
            edges {
              node {
                id
                title
                featuredImage { url }
                variants(first: 1) { edges { node { id price } } }
              }
            }
          }
        }
      }`,
      {
        variables: {
          handle: TSHIRT_COLLECTION_HANDLE,
        },
      },
    );
    const data = await response.json();
    const edges = data?.data?.collectionByHandle?.products?.edges || [];
    collectionProducts = edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      imageUrl: node.featuredImage?.url || null,
      variantId: node.variants?.edges?.[0]?.node?.id || null,
      price: node.variants?.edges?.[0]?.node?.price || null,
    }));
  } catch {
    collectionProducts = [];
  }

  return {
    package: packageData,
    tourInfo,
    tourDates,
    tourCapacity,
    tourPricing,
    tourPayment,
    guestAddons,
    tourIncludes,
    includeOptions,
    selectedIncludeIds,
    tourItinerary,
    shopifyProduct,
    countries,
    cities,
    productAddons,
    collectionProducts,
    packageTypeOptions,
    travellerOptions,
    tourTypeOptions,
    shop: session.shop,
  };
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add-country") {
    const country = await addPackageCountry(params.id, session.shop, {
      name: formData.get("name"),
      display_order: 1,
    });
    return { saved: true, savedAt: Date.now(), country };
  }

  if (intent === "delete-country") {
    await deletePackageCountry(
      params.id,
      Number(formData.get("country_id")),
      session.shop,
    );
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "add-city") {
    const city = await addPackageCity(params.id, session.shop, {
      name: formData.get("name"),
      display_order: 1,
    });
    return { saved: true, savedAt: Date.now(), city };
  }

  if (intent === "delete-city") {
    await deletePackageCity(
      params.id,
      Number(formData.get("city_id")),
      session.shop,
    );
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "upload-itinerary-pdf") {
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return { error: "No file selected" };
    }
    const updated = await uploadItineraryPdf(params.id, file);
    return { saved: true, savedAt: Date.now(), tourItinerary: updated };
  }

  if (intent === "delete-itinerary-pdf") {
    const updated = await deleteItineraryPdf(params.id);
    return { saved: true, savedAt: Date.now(), tourItinerary: updated };
  }

  if (intent === "add-product-addon") {
    const payload = {
      shopify_product_id: formData.get("shopify_product_id"),
      shopify_variant_id: formData.get("shopify_variant_id") || null,
      product_title: formData.get("product_title"),
      price: formData.get("price") ? Number(formData.get("price")) : null,
      image_url: formData.get("image_url") || null,
    };
    const productAddons = await createProductAddon(params.id, payload).then(() =>
      getProductAddons(params.id),
    );
    return { saved: true, savedAt: Date.now(), productAddons };
  }

  if (intent === "delete-product-addon") {
    await deleteProductAddon(Number(formData.get("addon_id")));
    const productAddons = await getProductAddons(params.id);
    return { saved: true, savedAt: Date.now(), productAddons };
  }

  if (intent === "save-pricing") {
    const { pricing, payment } = JSON.parse(formData.get("pricing_json"));

    await saveTourPricing(params.id, pricing);
    await saveTourPayment(params.id, payment);

    // Keep the packages table's price + payment_status in sync for dashboard display
    await updatePackage(params.id, {
      base_price: pricing.price_per_person || undefined,
      payment_status: payment.payment_status,
    });

    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "save-includes") {
    const { selected_option_ids, tour_type_tags, ...includesData } =
      JSON.parse(formData.get("includes_json"));

    await saveTourIncludes(params.id, includesData);
    await savePackageIncludeSelections(params.id, selected_option_ids || []);
    await mergeAndSaveTourInfo(params.id, {
      tour_type_tags: tour_type_tags || [],
    });

    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "save-travel-package") {
    const { package_type_tags, traveller_types } = JSON.parse(
      formData.get("travel_package_json"),
    );
    const capacityData = JSON.parse(formData.get("capacity_json"));
    const addons = JSON.parse(formData.get("addons_json"));

    await mergeAndSaveTourInfo(params.id, {
      package_type_tags: package_type_tags || [],
      traveller_types: traveller_types || [],
    });

    const sanitizedCapacity = {
      ...capacityData,
      maximum_age:
        capacityData.maximum_age === "" || capacityData.maximum_age === null
          ? null
          : Number(capacityData.maximum_age),
    };
    await saveTourCapacity(params.id, sanitizedCapacity);

    for (const addon of addons) {
      const { id, _localId, ...data } = addon;
      if (id) {
        // This loop re-syncs every addon on every Capacity/Travel-package
        // save, even ones the user didn't touch. That races against the
        // standalone delete-addon fetcher (fired immediately when the
        // trash icon is clicked): if a delete lands first, this update
        // hits an addon that's already gone and the backend correctly
        // 404s. Treat that as "already deleted, nothing to do" rather
        // than aborting the whole save — the row is gone either way,
        // which is the outcome the user wanted.
        try {
          await updateGuestAddon(id, data);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!message.includes("404")) throw err;
          console.warn(
            `Skipped updating addon ${id}: already deleted (likely raced with a delete request).`,
          );
        }
      } else {
        await createGuestAddon(params.id, data);
      }
    }

    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "toggle-publish") {
    const nextStatus = formData.get("next_status");
    await updatePackage(params.id, { status: nextStatus });
    return { saved: true, savedAt: Date.now(), newStatus: nextStatus };
  }

  if (intent === "delete-addon") {
    await deleteGuestAddon(Number(formData.get("addon_id")));
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "add-date") {
    await createTourDate({
      package_id: Number(params.id),
      departure_date: formData.get("departure_date"),
      return_date: formData.get("return_date"),
      adult_price: Number(formData.get("adult_price")),
      notes: formData.get("notes"),
    });
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "set-default-date") {
    await setDefaultTourDate(Number(formData.get("date_id")));
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "delete-date") {
    await deleteTourDate(Number(formData.get("date_id")));
    return { saved: true, savedAt: Date.now() };
  }

  // Default: Tour info save (Tour identity + Countries & cities only —
  // tag fields are owned by other tabs now, so we preserve them via merge).
  await mergeAndSaveTourInfo(params.id, {
    tour_title: formData.get("tour_title"),
    duration_label: formData.get("duration_label"),
    departure_city: formData.get("departure_city"),
    start_city: formData.get("start_city"),
    end_city: formData.get("end_city"),
    days: Number(formData.get("days")) || null,
    nights: Number(formData.get("nights")) || null,
    country: formData.get("country"),
    region: formData.get("region"),
    short_description: formData.get("short_description"),
    featured: formData.get("featured") === "on",
  });

  // Keep packages.title/destination/region in sync so they're correct everywhere else displayed
  await updatePackage(params.id, {
    title: formData.get("tour_title") || undefined,
    destination: formData.get("country") || undefined,
    region: formData.get("region") || undefined,
  });

  return { saved: true, savedAt: Date.now() };
}

const TABS = [
  { key: "tour-info", label: "Tour info" },
  { key: "travel-package", label: "Travel Package" },
  { key: "dates", label: "Dates" },
  { key: "pricing", label: "Pricing" },
  { key: "includes", label: "Includes" },
  { key: "itinerary", label: "Itinerary" },
];

export default function EditPackage() {
  const {
    package: pkg,
    tourInfo,
    tourDates,
    tourCapacity,
    tourPricing,
    tourPayment,
    guestAddons,
    tourIncludes,
    includeOptions,
    selectedIncludeIds,
    tourItinerary,
    shopifyProduct,
    countries,
    cities,
    productAddons,
    collectionProducts,
    packageTypeOptions,
    travellerOptions,
    tourTypeOptions,
    shop,
  } = useLoaderData();

  const actionData = useActionData();
  const navigation = useNavigation();

  // All fetchers declared together, before anything references them
  const datesFetcher = useFetcher();
  const travelPackageFetcher = useFetcher();
  const pricingFetcher = useFetcher();
  const locationsFetcher = useFetcher();
  const addonsFetcher = useFetcher();
  const publishFetcher = useFetcher();
  const includesFetcher = useFetcher();
  const itineraryFetcher = useFetcher();
  const productAddonFetcher = useFetcher();

  const [activeTab, setActiveTab] = useState("tour-info");
  const [showToast, setShowToast] = useState(false);

  const [capacityForm, setCapacityForm] = useState(() => ({
    max_group_size: tourCapacity.max_group_size ?? 1,
    min_group_size: tourCapacity.min_group_size ?? 1,
    minimum_age: tourCapacity.minimum_age ?? 0,
    maximum_age: tourCapacity.maximum_age ?? "",
    child_allowed: tourCapacity.child_allowed ?? true,
    infant_allowed: tourCapacity.infant_allowed ?? true,
    wheelchair_accessible: tourCapacity.wheelchair_accessible ?? false,
    fitness_level: tourCapacity.fitness_level || "Easy",
    passport_required: tourCapacity.passport_required ?? true,
    visa_required: tourCapacity.visa_required ?? false,
    notes: tourCapacity.notes || "",

    // -------- New fields --------
    custom_package_type: tourCapacity.custom_package_type || "",
    custom_package_message: tourCapacity.custom_package_message || "",
    extra_nights_type: tourCapacity.extra_nights_type || "",
    extra_nights_price: tourCapacity.extra_nights_price ?? 0,
    private_rooms_type: tourCapacity.private_rooms_type || "",
    private_rooms_price: tourCapacity.private_rooms_price ?? 0,
  }));

  // Package type & traveller options — moved here from the Tour info tab.
  const [travelPackageForm, setTravelPackageForm] = useState(() => ({
    package_type_tags: tourInfo.package_type_tags || [],
    traveller_types: tourInfo.traveller_types || [],
  }));

  const [pricingForm, setPricingForm] = useState(() => ({
    pricing: {
      price_per_person: tourPricing.price_per_person ?? pkg.base_price ?? "",
      currency: tourPricing.currency || "USD",
      price_note: tourPricing.price_note || "",
    },
    payment: {
      payment_status: tourPayment.payment_status || "Unpaid",
      amount_received: tourPayment.amount_received ?? 0,
      deposit_amount: tourPayment.deposit_amount ?? 0,
      balance_amount: tourPayment.balance_amount ?? 0,
      number_of_installments: tourPayment.number_of_installments ?? 1,
      installment_label: tourPayment.installment_label || "",
      option_label: tourPayment.option_label || "",
      cta_text: tourPayment.cta_text || "",
      show_deal_price_badge: tourPayment.show_deal_price_badge ?? true,
      preselect_full_payment: tourPayment.preselect_full_payment ?? true,
    },
  }));

  const [addonsForm, setAddonsForm] = useState(() =>
    guestAddons.map((a) => ({ ...a })),
  );

  // Matches IncludesTab's actual internal shape exactly (see defaultForm in
  // IncludesTab.jsx) — this is only a fallback used if Save is clicked
  // before IncludesTab ever calls onChange.
  const [includesForm, setIncludesForm] = useState(() => ({
    selected_option_ids: selectedIncludeIds || [],
    hero_image: tourIncludes.hero_image || "",
    image_alt_text: tourIncludes.image_alt_text || "",
    primary_label: tourIncludes.primary_label || "",
    primary_url: tourIncludes.primary_url || "",
    secondary_label: tourIncludes.secondary_label || "",
    enquiry_email_or_url: tourIncludes.enquiry_email_or_url || "",
    show_selection_summary: tourIncludes.show_selection_summary ?? false,
    tour_type_tags: tourInfo.tour_type_tags || [],
  }));

  // Just the staged File object — nothing to prefill, there's no text to edit
  const [itineraryFile, setItineraryFile] = useState(null);

  const isSaving = navigation.state === "submitting";

  // All useEffects together, after fetchers/state, before handler functions
  useEffect(() => {
    if (actionData?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  useEffect(() => {
    if (
      datesFetcher.data?.message === "Tour date deleted" ||
      datesFetcher.data?.id
    ) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [datesFetcher.data]);

  useEffect(() => {
    if (travelPackageFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [travelPackageFetcher.data]);

  useEffect(() => {
    if (pricingFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pricingFetcher.data]);

  useEffect(() => {
    if (addonsFetcher.data?.saved || addonsFetcher.data?.message) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [addonsFetcher.data]);

  useEffect(() => {
    if (publishFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [publishFetcher.data]);

  useEffect(() => {
    if (includesFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [includesFetcher.data]);

  useEffect(() => {
    if (itineraryFetcher.data?.saved) {
      setShowToast(true);
      setItineraryFile(null); // clear the staged file now that it's persisted
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [itineraryFetcher.data]);

  useEffect(() => {
    if (productAddonFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [productAddonFetcher.data]);

  // Handler functions
  function handleSaveTravelPackage() {
    travelPackageFetcher.submit(
      {
        intent: "save-travel-package",
        travel_package_json: JSON.stringify(travelPackageForm),
        capacity_json: JSON.stringify(capacityForm),
        addons_json: JSON.stringify(addonsForm),
      },
      { method: "post" },
    );
  }

  function handleAddonDelete(addonId) {
    addonsFetcher.submit(
      { intent: "delete-addon", addon_id: addonId },
      { method: "post" },
    );
  }

  function handleSavePricing() {
    pricingFetcher.submit(
      {
        intent: "save-pricing",
        pricing_json: JSON.stringify(pricingForm),
      },
      { method: "post" },
    );
  }

  function handleSaveIncludes() {
    includesFetcher.submit(
      { intent: "save-includes", includes_json: JSON.stringify(includesForm) },
      { method: "post" },
    );
  }

  function handleSaveItinerary() {
    if (!itineraryFile) return;
    const formData = new FormData();
    formData.append("intent", "upload-itinerary-pdf");
    formData.append("file", itineraryFile);
    itineraryFetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  }

  function handleDeleteItinerary() {
    itineraryFetcher.submit(
      { intent: "delete-itinerary-pdf" },
      { method: "post" },
    );
  }

  function handleAddProductAddon(product) {
    productAddonFetcher.submit(
      {
        intent: "add-product-addon",
        shopify_product_id: product.id,
        shopify_variant_id: product.variantId || "",
        product_title: product.title,
        price: product.price || "",
        image_url: product.imageUrl || "",
      },
      { method: "post" },
    );
  }

  function handleRemoveProductAddon(addonId) {
    productAddonFetcher.submit(
      { intent: "delete-product-addon", addon_id: addonId },
      { method: "post" },
    );
  }

  function handleTogglePublish() {
    const nextStatus = pkg.status === "Published" ? "Draft" : "Published";
    publishFetcher.submit(
      { intent: "toggle-publish", next_status: nextStatus },
      { method: "post" },
    );
  }

  const statusLabel = pkg.status === "Published" ? "Live" : pkg.status;
  const statusDotClass =
    pkg.status === "Published" ? "bg-green-500" : "bg-amber-500";

  const heroBadgeLabel = capacityForm.custom_package_type || "Vacation Package";
  const adminProductUrl = pkg.shopify_product_id
    ? `https://${shop}/admin/products/${pkg.shopify_product_id}`
    : null;
  const storefrontUrl = shopifyProduct?.onlineStoreUrl || null;

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          totalPackages={pkg.totalPackages}
          currentPackage={{ id: pkg.id, title: pkg.title }}
          onNewPackage={() => {}}
        />
      }
      header={null}
    >
      {/* Sticky bar: breadcrumb (with title), status meta, publish/save actions */}
      <div className="sticky top-0 z-20 -mx-8 -mt-8 mb-6 border-b border-gray-200 bg-[#f6f6f7]/95 px-8 pt-6 pb-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link to="/app/packages" className="shrink-0 text-blue-600 hover:text-blue-700">
              All packages
            </Link>
            <span className="text-gray-400">/</span>
            <span className="truncate font-semibold text-gray-900">
              {pkg.title}
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishFetcher.state !== "idle"}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M12 3v12M8 7l4-4 4 4" />
                <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
              </svg>
              {publishFetcher.state !== "idle"
                ? "Updating…"
                : pkg.status === "Published"
                  ? "Unpublish"
                  : "Publish"}
            </button>

            {activeTab === "tour-info" && (
              <button
                type="submit"
                form="tour-info-form"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            )}

            {activeTab === "travel-package" && (
              <button
                type="button"
                onClick={handleSaveTravelPackage}
                disabled={travelPackageFetcher.state !== "idle"}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {travelPackageFetcher.state !== "idle" ? "Saving…" : "Save changes"}
              </button>
            )}

            {activeTab === "pricing" && (
              <button
                type="button"
                onClick={handleSavePricing}
                disabled={pricingFetcher.state !== "idle"}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {pricingFetcher.state !== "idle" ? "Saving…" : "Save changes"}
              </button>
            )}

            {activeTab === "includes" && (
              <button
                type="button"
                onClick={handleSaveIncludes}
                disabled={includesFetcher.state !== "idle"}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {includesFetcher.state !== "idle" ? "Saving…" : "Save changes"}
              </button>
            )}

            {activeTab === "itinerary" && (
              <button
                type="button"
                onClick={handleSaveItinerary}
                disabled={!itineraryFile || itineraryFetcher.state !== "idle"}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {itineraryFetcher.state !== "idle" ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
            {statusLabel}
          </span>
          <span className="text-gray-300">·</span>
          <span>
            {actionData?.savedAt
              ? `Saved at ${new Date(actionData.savedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Not saved yet"}
          </span>
          <span className="text-gray-300">·</span>
          <span>#{pkg.package_code || pkg.id}</span>
        </div>
      </div>

      {/* Hero card — visual summary of the package */}
      <div
        className="relative mb-6 flex min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl bg-cover bg-center p-8 shadow-sm"
        style={
          shopifyProduct?.featuredImage?.url
            ? { backgroundImage: `url(${shopifyProduct.featuredImage.url})` }
            : undefined
        }
      >
        {/* Fallback gradient when there's no product photo yet */}
        {!shopifyProduct?.featuredImage?.url && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600" />
        )}
        {/* Legibility overlay for photo backgrounds */}
        {shopifyProduct?.featuredImage?.url && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        )}

        <div className="relative">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {heroBadgeLabel}
          </span>

          <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white drop-shadow-sm">
            {pkg.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-indigo-600">
                <path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span className="text-gray-500">Destination</span>
              <span className="font-semibold text-gray-900">{pkg.destination}</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-indigo-600">
                <path d="M20.6 12l-8.3 8.3a2 2 0 01-2.8 0l-6.2-6.2a2 2 0 010-2.8L11.6 3H19a1 1 0 011 1v8z" />
                <circle cx="15" cy="8" r="1.5" />
              </svg>
              <span className="text-gray-500">Price</span>
              <span className="font-semibold text-gray-900">
                ${Number(pkg.base_price).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-indigo-600">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold text-gray-900">{pkg.payment_status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              activeTab === tab.key
                ? "border-slate-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tour-info" && (
        <Form method="post" id="tour-info-form">
          <TourInformation
            data={tourInfo}
            pkg={pkg}
            countries={countries}
            cities={cities}
            locationsFetcher={locationsFetcher}
          />
        </Form>
      )}

      {activeTab === "travel-package" && (
        <>
          <PackageTravellerOptions
            data={tourInfo}
            packageTypeOptions={packageTypeOptions}
            travellerOptions={travellerOptions}
            onChange={setTravelPackageForm}
          />
          <CapacityEligibility data={tourCapacity} onChange={setCapacityForm} />
          <GuestAddonsTable
            addons={addonsForm}
            onChange={setAddonsForm}
            onDelete={handleAddonDelete}
          />
        </>
      )}

      {activeTab === "dates" && (
        <DatesTab
          dates={tourDates}
          packageBasePrice={pkg.base_price}
          fetcher={datesFetcher}
        />
      )}

      {activeTab === "pricing" && (
        <PricingTab
          pricing={tourPricing}
          payment={tourPayment}
          packageBasePrice={pkg.base_price}
          onChange={setPricingForm}
        />
      )}

      {activeTab === "includes" && (
        <IncludesTab
          data={{
            ...tourIncludes,
            selected_option_ids: selectedIncludeIds,
            tour_type_tags: tourInfo.tour_type_tags || [],
          }}
          initialOptions={includeOptions}
          tourTypeOptions={tourTypeOptions}
          onChange={setIncludesForm}
        />
      )}

      {activeTab === "itinerary" && (
        <ItineraryTab
          data={itineraryFetcher.data?.tourItinerary || tourItinerary}
          onChange={setItineraryFile}
          onDelete={handleDeleteItinerary}
          isDeleting={itineraryFetcher.state !== "idle"}
          collectionProducts={collectionProducts}
          addons={productAddonFetcher.data?.productAddons || productAddons}
          onAddAddon={handleAddProductAddon}
          onRemoveAddon={handleRemoveProductAddon}
          isAddonBusy={productAddonFetcher.state !== "idle"}
        />
      )}

      {activeTab !== "tour-info" &&
        activeTab !== "travel-package" &&
        activeTab !== "dates" &&
        activeTab !== "pricing" &&
        activeTab !== "includes" &&
        activeTab !== "itinerary" && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            This section isn't built yet.
          </div>
        )}

      <Toast show={showToast} message="Changes saved successfully" />
    </DashboardLayout>
  );
}