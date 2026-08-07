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
  getPackageCountries,
  addPackageCountry,
  deletePackageCountry,
  getPackageCities,
  addPackageCity,
  deletePackageCity,
} from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import TourInformation from "../components/layout/package/TourInformation";
import DatesTab from "../components/layout/package/DatesTab";
import CapacityEligibility from "../components/layout/package/CapacityEligibility";
import PricingTab from "../components/layout/package/PricingTab";
import GuestAddonsTable from "../components/layout/package/GuestAddonsTable";
import IncludesTab from "../components/layout/package/IncludesTab";
import Toast from "../components/layout/ui/Toast";
import ChipRepeater from "../components/layout/shared/ChipRepeater";
import TourDatesRepeater from "../components/layout/shared/TourDatesRepeater";
import { FieldError, inputClass } from "../components/layout/shared/formValidation";

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

  let countries = [];
  try {
    countries = (await getPackageCountries(packageData.id)) || [];
  } catch {
    countries = [];
  }

  let cities = [];
  try {
    cities = (await getPackageCities(packageData.id)) || [];
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

  return {
    package: packageData,
    tourInfo,
    tourDates,
    tourCapacity,
    tourPricing,
    tourPayment,
    guestAddons,
    tourIncludes,
    countries,
    cities,
    shopifyProduct,
  };
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-pricing") {
    const { pricing, payment } = JSON.parse(formData.get("pricing_json"));
    const addons = JSON.parse(formData.get("addons_json"));

    await saveTourPricing(params.id, pricing);
    await saveTourPayment(params.id, payment);

    // Keep the packages table's price + payment_status in sync for dashboard display
    await updatePackage(params.id, {
      base_price: pricing.price_per_person || undefined,
      payment_status: payment.payment_status,
    });

    for (const addon of addons) {
      const { id, _localId, ...data } = addon;
      if (id) {
        await updateGuestAddon(id, data);
      } else {
        await createGuestAddon(params.id, data);
      }
    }

    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "save-includes") {
    const includesData = JSON.parse(formData.get("includes_json"));
    await saveTourIncludes(params.id, includesData);
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "save-capacity") {
    const capacityData = JSON.parse(formData.get("capacity_json"));

    function numOrNull(v) {
      return v === "" || v === null || v === undefined ? null : Number(v);
    }
    function numOrZero(v) {
      return v === "" || v === null || v === undefined ? 0 : Number(v);
    }

    const sanitized = {
      ...capacityData,
      maximum_age: numOrNull(capacityData.maximum_age),
      extra_nights_price: numOrZero(capacityData.extra_nights_price),
      extra_nights_count: numOrZero(capacityData.extra_nights_count) || 1,
      private_rooms_price: numOrZero(capacityData.private_rooms_price),
      private_rooms_count: numOrZero(capacityData.private_rooms_count) || 1,
      couple_room_price: numOrZero(capacityData.couple_room_price),
      couple_room_count: numOrZero(capacityData.couple_room_count) || 1,
      child_room_price: numOrZero(capacityData.child_room_price),
      child_room_count: numOrZero(capacityData.child_room_count) || 1,
    };

    await saveTourCapacity(params.id, sanitized);
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "save-itinerary") {
    const itineraryData = JSON.parse(formData.get("itinerary_json"));

    // product_code + custom_date_message live on TourInfo
    await saveTourInfo(params.id, {
      product_code: itineraryData.product_code,
      custom_date_message: itineraryData.custom_date_message,
    });

    // itinerary_pdf lives alongside hero_image on TourIncludes
    await saveTourIncludes(params.id, {
      itinerary_pdf: itineraryData.itinerary_pdf,
      itinerary_pdf_filename: itineraryData.itinerary_pdf_filename,
    });

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

  if (intent === "add-country") {
    const created = await addPackageCountry(params.id, {
      name: formData.get("name"),
      display_order: Number(formData.get("display_order")) || 1,
    });
    return { saved: true, savedAt: Date.now(), country: created };
  }

  if (intent === "delete-country") {
    await deletePackageCountry(params.id, Number(formData.get("country_id")));
    return { saved: true, savedAt: Date.now() };
  }

  if (intent === "add-city") {
    const created = await addPackageCity(params.id, {
      name: formData.get("name"),
      display_order: Number(formData.get("display_order")) || 1,
    });
    return { saved: true, savedAt: Date.now(), city: created };
  }

  if (intent === "delete-city") {
    await deletePackageCity(params.id, Number(formData.get("city_id")));
    return { saved: true, savedAt: Date.now() };
  }

  // Default: Tour info save
  const payload = {
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
    tour_type_tags: formData.getAll("tour_type_tags"),
    featured: formData.get("featured") === "on",
  };

  await saveTourInfo(params.id, payload);

  // Keep packages.title/destination/region in sync so they're correct everywhere else displayed
  await updatePackage(params.id, {
    title: payload.tour_title || undefined,
    destination: payload.country || undefined,
    region: payload.region || undefined,
  });

  return { saved: true, savedAt: Date.now() };
}

const TABS = [
  { key: "tour-info", label: "Tour info" },
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
    countries: initialCountries,
    cities: initialCities,
    shopifyProduct,
  } = useLoaderData();

  const actionData = useActionData();
  const navigation = useNavigation();

  // All fetchers declared together, before anything references them
  const datesFetcher = useFetcher();
  const capacityFetcher = useFetcher();
  const pricingFetcher = useFetcher();
  const addonsFetcher = useFetcher();
  const publishFetcher = useFetcher();
  const includesFetcher = useFetcher();
  const itineraryFetcher = useFetcher();
  const countriesFetcher = useFetcher();
  const citiesFetcher = useFetcher();

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

    custom_package_type: tourCapacity.custom_package_type || "",
    custom_package_message: tourCapacity.custom_package_message || "",
    extra_nights_type: tourCapacity.extra_nights_type || "",
    extra_nights_price: tourCapacity.extra_nights_price ?? 0,
    extra_nights_count: tourCapacity.extra_nights_count ?? 1,
    private_rooms_type: tourCapacity.private_rooms_type || "",
    private_rooms_price: tourCapacity.private_rooms_price ?? 0,
    private_rooms_count: tourCapacity.private_rooms_count ?? 1,

    couple_room_type: tourCapacity.couple_room_type || "",
    couple_room_price: tourCapacity.couple_room_price ?? 0,
    couple_room_count: tourCapacity.couple_room_count ?? 1,
    child_room_type: tourCapacity.child_room_type || "",
    child_room_price: tourCapacity.child_room_price ?? 0,
    child_room_count: tourCapacity.child_room_count ?? 1,
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

  // Matches IncludesTab's actual internal shape exactly (see buildInitial in IncludesTab.jsx) —
  // this is only a fallback used if Save is clicked before IncludesTab ever calls onChange.
  const [includesForm, setIncludesForm] = useState(() => ({
    included: tourIncludes.included || [],
    hero_image_url: tourIncludes.hero_image_url || "",
    hero_image_alt: tourIncludes.hero_image_alt || "",
    primary_label: tourIncludes.primary_label || "Book Online",
    primary_url: tourIncludes.primary_url || "",
    secondary_label: tourIncludes.secondary_label || "Enquire Now",
    secondary_url: tourIncludes.secondary_url || "",
    show_selection_summary: tourIncludes.show_selection_summary ?? false,
  }));

  // -------- Itinerary tab state (countries, cities, product code, PDF) --------
  const [countries, setCountries] = useState(initialCountries || []);
  const [cities, setCities] = useState(initialCities || []);
  const [productCode, setProductCode] = useState(tourInfo?.product_code || "");
  const [customDateMessage, setCustomDateMessage] = useState(
    tourInfo?.custom_date_message || "",
  );
  const [itineraryPdf, setItineraryPdf] = useState(
    tourIncludes?.itinerary_pdf || null,
  );
  const [itineraryPdfName, setItineraryPdfName] = useState(
    tourIncludes?.itinerary_pdf_filename || "",
  );
  const [itineraryPdfError, setItineraryPdfError] = useState("");
  const [itineraryTouched, setItineraryTouched] = useState({});

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
    if (capacityFetcher.data?.saved) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [capacityFetcher.data]);

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
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [itineraryFetcher.data]);

  // Reconcile local countries/cities state once the server confirms add/delete
  useEffect(() => {
    if (countriesFetcher.data?.country) {
      setCountries((prev) => [...prev, countriesFetcher.data.country]);
    }
  }, [countriesFetcher.data]);

  useEffect(() => {
    if (citiesFetcher.data?.city) {
      setCities((prev) => [...prev, citiesFetcher.data.city]);
    }
  }, [citiesFetcher.data]);

  // Handler functions
  function handleSaveCapacity() {
    capacityFetcher.submit(
      { intent: "save-capacity", capacity_json: JSON.stringify(capacityForm) },
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
        addons_json: JSON.stringify(addonsForm),
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
    itineraryFetcher.submit(
      {
        intent: "save-itinerary",
        itinerary_json: JSON.stringify({
          product_code: productCode,
          custom_date_message: customDateMessage,
          itinerary_pdf: itineraryPdf,
          itinerary_pdf_filename: itineraryPdfName,
        }),
      },
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

  function addCountry(name) {
    countriesFetcher.submit(
      {
        intent: "add-country",
        name,
        display_order: countries.length + 1,
      },
      { method: "post" },
    );
  }

  function removeCountry(id) {
    setCountries((prev) => prev.filter((c) => c.id !== id));
    countriesFetcher.submit(
      { intent: "delete-country", country_id: id },
      { method: "post" },
    );
  }

  function addCity(name) {
    citiesFetcher.submit(
      { intent: "add-city", name, display_order: cities.length + 1 },
      { method: "post" },
    );
  }

  function removeCity(id) {
    setCities((prev) => prev.filter((c) => c.id !== id));
    citiesFetcher.submit(
      { intent: "delete-city", city_id: id },
      { method: "post" },
    );
  }

  function handlePdfChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setItineraryPdfError("Please choose a PDF file.");
      return;
    }
    const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_PDF_BYTES) {
      setItineraryPdfError("PDF is larger than 10MB — please choose a smaller file.");
      return;
    }

    setItineraryPdfError("");
    const reader = new FileReader();
    reader.onload = () => {
      setItineraryPdf(reader.result); // data:application/pdf;base64,....
      setItineraryPdfName(file.name);
    };
    reader.readAsDataURL(file);
  }

  const statusLabel = pkg.status === "Published" ? "Live" : pkg.status;
  const statusDotClass =
    pkg.status === "Published" ? "bg-green-500" : "bg-amber-500";

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
      <nav className="mb-2 flex items-center gap-1.5 text-sm text-gray-500">
        <Link to="/app/packages" className="text-blue-600 hover:text-blue-700">
          All packages
        </Link>
        <span>/</span>
        <span className="text-gray-700">{pkg.title}</span>
      </nav>

      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{pkg.title}</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishFetcher.state !== "idle"}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
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
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          )}

          {activeTab === "dates" && (
            <button
              type="button"
              onClick={handleSaveCapacity}
              disabled={capacityFetcher.state !== "idle"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {capacityFetcher.state !== "idle" ? "Saving…" : "Save changes"}
            </button>
          )}

          {activeTab === "pricing" && (
            <button
              type="button"
              onClick={handleSavePricing}
              disabled={pricingFetcher.state !== "idle"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pricingFetcher.state !== "idle" ? "Saving…" : "Save changes"}
            </button>
          )}

          {activeTab === "includes" && (
            <button
              type="button"
              onClick={handleSaveIncludes}
              disabled={includesFetcher.state !== "idle"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {includesFetcher.state !== "idle" ? "Saving…" : "Save changes"}
            </button>
          )}

          {activeTab === "itinerary" && (
            <button
              type="button"
              onClick={handleSaveItinerary}
              disabled={itineraryFetcher.state !== "idle"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {itineraryFetcher.state !== "idle" ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
          {statusLabel}
        </span>
        <span>·</span>
        <span>
          {actionData?.savedAt
            ? `Saved at ${new Date(actionData.savedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Not saved yet"}
        </span>
        <span>·</span>
        <span>#{pkg.package_code || pkg.id}</span>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-600">
        <span className="font-medium text-gray-500">Package: </span>
        <span className="text-gray-900">{pkg.title}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium text-gray-500">Destination: </span>
        <span className="text-gray-900">{pkg.destination}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium text-gray-500">Price: </span>
        <span className="text-gray-900">
          ${Number(pkg.base_price).toLocaleString()}
        </span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium text-gray-500">Payment: </span>
        <span className="text-gray-900">{pkg.payment_status}</span>
      </div>

      {shopifyProduct && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-stretch">
            <div className="relative h-28 w-28 flex-shrink-0 sm:h-32 sm:w-32">
              {shopifyProduct.featuredImage?.url ? (
                <img
                  src={shopifyProduct.featuredImage.url}
                  alt={shopifyProduct.featuredImage.altText || shopifyProduct.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-10 w-10"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M20 12V8H6a2 2 0 010-4h12v4" />
                    <path d="M4 6v12a2 2 0 002 2h14v-4" />
                    <path d="M18 12a2 2 0 000 4h4v-4z" />
                  </svg>
                  Linked Shopify product
                </div>
                <p className="truncate text-base font-semibold text-gray-900">
                  {shopifyProduct.title}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        shopifyProduct.status === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {shopifyProduct.status === "ACTIVE"
                      ? "Active"
                      : shopifyProduct.status}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="font-medium text-gray-700">
                    $
                    {Number(
                      shopifyProduct.variants?.edges?.[0]?.node?.price || 0,
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:flex">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                Synced
              </span>
            </div>
          </div>
        </div>
      )}

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
          <TourInformation data={tourInfo} pkg={pkg} />
        </Form>
      )}

      {activeTab === "dates" && (
        <>
          <DatesTab
            dates={tourDates}
            packageBasePrice={pkg.base_price}
            fetcher={datesFetcher}
          />
          <CapacityEligibility data={tourCapacity} onChange={setCapacityForm} />
        </>
      )}

      {activeTab === "pricing" && (
        <>
          <PricingTab
            pricing={tourPricing}
            payment={tourPayment}
            packageBasePrice={pkg.base_price}
            onChange={setPricingForm}
          />
          <GuestAddonsTable
            addons={addonsForm}
            onChange={setAddonsForm}
            onDelete={handleAddonDelete}
          />
        </>
      )}

      {activeTab === "includes" && (
        <IncludesTab data={tourIncludes} onChange={setIncludesForm} />
      )}

      {activeTab === "itinerary" && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Country(s) to be Visited
                </h3>
              </div>
            </div>
            <div className="p-5">
              <ChipRepeater
                label=""
                placeholder="Enter country name"
                items={countries}
                onAdd={addCountry}
                onRemove={removeCountry}
              />
              {countries.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  Add at least one country so the itinerary map has something
                  to show.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Cities to be Visited
                </h3>
              </div>
            </div>
            <div className="p-5">
              <ChipRepeater
                label=""
                placeholder="Enter city name"
                items={cities}
                onAdd={addCity}
                onRemove={removeCity}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-rose-100 bg-white">
            <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Message for Custom Date
                </h3>
              </div>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={customDateMessage}
                onChange={(e) => setCustomDateMessage(e.target.value)}
                onBlur={() => setItineraryTouched((prev) => ({ ...prev, customDateMessage: true }))}
                maxLength={200}
                placeholder="e.g. Custom dates available on request — enquire for pricing"
                className={inputClass(false, "rose")}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                {customDateMessage.length}/200 characters
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-amber-100 bg-white">
            <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Product code (Rezdy)
                </h3>
              </div>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={productCode}
                onChange={(e) =>
                  setProductCode(e.target.value.toUpperCase().replace(/\s+/g, ""))
                }
                onBlur={() =>
                  setItineraryTouched((prev) => ({ ...prev, productCode: true }))
                }
                placeholder="e.g. PANAMA-REAL-2026"
                className={inputClass(
                  itineraryTouched.productCode &&
                    productCode &&
                    !/^[A-Z0-9-]+$/.test(productCode),
                  "amber",
                )}
              />
              {itineraryTouched.productCode &&
                productCode &&
                !/^[A-Z0-9-]+$/.test(productCode) && (
                  <FieldError message="Only letters, numbers, and hyphens allowed." />
                )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-teal-100 bg-white">
            <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Email Itinerary PDF
                </h3>
              </div>
            </div>
            <div className="p-5">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-teal-700"
              />
              {itineraryPdfError && (
                <div className="mt-2">
                  <FieldError message={itineraryPdfError} />
                </div>
              )}
              {itineraryPdfName && !itineraryPdfError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-teal-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  {itineraryPdfName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast show={showToast} message="Changes saved successfully" />
    </DashboardLayout>
  );
}