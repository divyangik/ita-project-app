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

    const sanitized = {
      ...capacityData,
      maximum_age:
        capacityData.maximum_age === "" || capacityData.maximum_age === null
          ? null
          : Number(capacityData.maximum_age),
    };

    await saveTourCapacity(params.id, sanitized);
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
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-3 text-sm">
          {shopifyProduct.featuredImage?.url && (
            <img
              src={shopifyProduct.featuredImage.url}
              alt={shopifyProduct.featuredImage.altText || ""}
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-blue-900">
              Linked to Shopify product: {shopifyProduct.title}
            </p>
            <p className="text-xs text-blue-600">
              Status: {shopifyProduct.status} · Price: $
              {shopifyProduct.variants?.edges?.[0]?.node?.price}
            </p>
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

      {activeTab !== "tour-info" &&
        activeTab !== "dates" &&
        activeTab !== "pricing" &&
        activeTab !== "includes" && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            This section isn't built yet.
          </div>
        )}

      <Toast show={showToast} message="Changes saved successfully" />
    </DashboardLayout>
  );
}