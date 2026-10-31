// Public booking API for the new ITA site.
//   GET  /api/booking?shopify_product_id=123   -> trip data (dates, seats, prices, extras)
//   POST /api/booking  { intent: "quote" | "checkout", ... }
//        quote    -> price breakdown, nothing is created
//        checkout -> creates a Shopify Draft Order and returns { checkout_url }
// The browser never sets prices. Everything is recomputed here from the trip data.
import { unauthenticated } from "../shopify.server";
import { corsHeaders } from "../lib/cors.server";
import {
  BookingError,
  buildDraftOrderInput,
  computeBooking,
  validateContact,
} from "../lib/booking.server";

const SERVICE = () => process.env.PYTHON_SERVICE_URL;

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

async function fetchTrip(productId) {
  if (!productId) throw new BookingError("Missing trip id.");
  const res = await fetch(`${SERVICE()}/store/package/${encodeURIComponent(productId)}`);
  if (!res.ok) throw new BookingError("Trip data is not available right now.", 502);
  return withExtraNights(await res.json());
}

// Extras: the add-ons table, plus "Extra nights" and "Custom package type" from the Capacity tab.
// Each one has its own maximum (0 = no limit).
function withExtraNights(data) {
  if (!data?.view) return data;
  const cap = data.capacity || {};
  data.addons = (data.addons || []).map((a) => ({
    ...a,
    max_qty: Number(a.max_quantity) > 0 ? Number(a.max_quantity) : 0,
  }));

  const nightPrice = Number(cap.extra_nights_price || 0);
  if (cap.extra_nights_type && nightPrice > 0) {
    data.addons.push({
      id: "extra_nights",
      addon_name: cap.extra_nights_type,
      description: "Per extra night",
      price: nightPrice,
      visible: true,
      display_order: 998,
      max_qty: Number(cap.extra_nights_count) > 0 ? Number(cap.extra_nights_count) : 0,
    });
  }

  // "Custom package type" (for example Pets) with its price in "Custom price"
  const customPrice = Number(String(cap.custom_package_message || "").replace(/[^0-9.]/g, ""));
  if (cap.custom_package_type && customPrice > 0) {
    data.addons.push({
      id: "custom_package",
      addon_name: cap.custom_package_type,
      description: "",
      price: customPrice,
      visible: true,
      display_order: 999,
      max_qty: 0,
    });
  }
  return data;
}

// Every field of the trip that the booking widget shows.
function buildTrip(data) {
  const info = data.tour_info || {};
  const cap = data.capacity || {};
  const pay = data.payment || {};
  const pricing = data.pricing || {};
  const cta = data.cta_buttons || {};
  const names = (list) => (list || []).map((i) => i.name).filter(Boolean);
  return {
    pricing: {
      price_per_person: Number(pricing.price_per_person || 0),
      price_note: pricing.price_note || "",
      currency: pricing.currency || "USD",
    },
    info: {
      departure_city: info.departure_city || "",
      start_city: info.start_city || "",
      end_city: info.end_city || "",
      duration_label: info.duration_label || "",
      days: Number(info.days) || 0,
      nights: Number(info.nights) || 0,
      country: info.country || "",
    },
    capacity: {
      min_group_size: Number(cap.min_group_size) || 0,
      max_group_size: Number(cap.max_group_size) || 0,
      minimum_age: Number(cap.minimum_age) || 0,
      maximum_age: Number(cap.maximum_age) || 0,
      child_allowed: cap.child_allowed !== false,
      infant_allowed: cap.infant_allowed !== false,
      wheelchair_accessible: cap.wheelchair_accessible === true,
      fitness_level: cap.fitness_level || "",
      passport_required: cap.passport_required === true,
      visa_required: cap.visa_required === true,
      notes: cap.notes || "",
      custom_package_type: cap.custom_package_type || "",
      custom_package_message: cap.custom_package_message || "",
      private_rooms_type: cap.private_rooms_type || "",
      couple_room_type: cap.couple_room_type || "",
      child_room_type: cap.child_room_type || "",
    },
    payment: {
      deposit_amount: Number(pay.deposit_amount || 0),
      installments: Number(pay.number_of_installments) || 1,
      option_label: pay.option_label || "",
      show_deal_price_badge: pay.show_deal_price_badge !== false,
      preselect_full_payment: pay.preselect_full_payment !== false,
    },
    included: names(data.included_items),
    cities: names(data.cities),
    package_types: (data.guest_type_details?.package_type || []).map((g) => g.name).filter(Boolean),
    traveller_types: (data.guest_type_details?.traveller_type || []).map((g) => g.name).filter(Boolean),
    has_itinerary_pdf: Boolean(data.itinerary?.itinerary_pdf_url),
    cta: {
      primary_label: cta.primary_label || "",
      secondary_label: cta.secondary_label || "",
      enquiry_email_or_url: cta.enquiry_email_or_url || "",
    },
  };
}

// Everything the trip card on the website shows, taken from the admin app data.
function buildCard(data) {
  const info = data.tour_info || {};
  const today = new Date().toISOString().slice(0, 10);
  const openDates = (data.dates || []).filter(
    (d) =>
      ["Available", "Guaranteed"].includes(d.status) &&
      String(d.departure_date) > today &&
      !(d.seats_total > 0 && d.seats_available <= 0),
  );
  const prices = openDates.map((d) => Number(d.adult_price)).filter((n) => n > 0);
  const fromPrice = prices.length
    ? Math.min(...prices)
    : Number(data.pricing?.price_per_person || 0) || null;
  const days = Number(info.days) || 0;
  const nights = Number(info.nights) || 0;
  const duration =
    info.duration_label ||
    (days ? `${days} day${days === 1 ? "" : "s"}${nights ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}` : "") ||
    data.package?.duration ||
    "";
  return {
    from_price: fromPrice,
    currency: data.pricing?.currency || "USD",
    price_note: data.pricing?.price_note || "",
    duration,
    start_city: info.start_city || "",
    end_city: info.end_city || "",
    departure_city: info.departure_city || "",
    hotels_included: data.includes?.hotels === true,
    included: (data.included_items || []).map((i) => i.name),
    next_dates: openDates.map((d) => ({
      departure_date: d.departure_date,
      return_date: d.return_date,
    })),
    cta: {
      primary_label: data.cta_buttons?.primary_label || "",
      secondary_label: data.cta_buttons?.secondary_label || "",
    },
  };
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  try {
    const id = new URL(request.url).searchParams.get("shopify_product_id");
    const data = await fetchTrip(id);
    if (!data.view) return json(request, { view: null });
    // Only what the booking box and the trip card need
    return json(request, {
      view: true,
      card: buildCard(data),
      trip: buildTrip(data),
      title: data.package?.title,
      currency: data.pricing?.currency || "USD",
      deposit_per_person: Number(data.payment?.deposit_amount || 0),
      child_allowed: data.capacity?.child_allowed !== false,
      max_group_size: data.capacity?.max_group_size || 0,
      min_group_size: data.capacity?.min_group_size || 0,
      dates: data.dates,
      addons: data.addons,
    });
  } catch (e) {
    return fail(request, e);
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json(request, { error: "Method not allowed" }, 405);
  }
  try {
    const body = await request.json().catch(() => {
      throw new BookingError("Invalid request.");
    });
    const productId = String(body.shopify_product_id || "");
    const data = await fetchTrip(productId);
    const quote = computeBooking({ data, input: body });

    if (body.intent !== "checkout") return json(request, { quote });

    const contact = validateContact(body.contact);
    const shop = data.package?.shop_domain;
    if (!shop) throw new BookingError("Shop is not configured for this trip.", 500);

    const { admin } = await unauthenticated.admin(shop);
    const response = await admin.graphql(
      `#graphql
      mutation CreateBookingDraft($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id name invoiceUrl }
          userErrors { field message }
        }
      }`,
      { variables: { input: buildDraftOrderInput(quote, contact, productId) } },
    );
    const result = await response.json();
    const payload = result?.data?.draftOrderCreate;
    if (result?.errors || !payload) {
      console.error("draftOrderCreate failed", JSON.stringify(result?.errors));
      throw new BookingError("Could not start checkout. Please try again.", 502);
    }
    if (payload.userErrors?.length || !payload.draftOrder?.invoiceUrl) {
      console.error("draftOrderCreate userErrors", JSON.stringify(payload.userErrors));
      throw new BookingError("Could not start checkout. Please try again.", 502);
    }
    return json(request, {
      quote,
      checkout_url: payload.draftOrder.invoiceUrl,
      order_name: payload.draftOrder.name,
    });
  } catch (e) {
    return fail(request, e);
  }
}

function fail(request, e) {
  if (e instanceof BookingError) {
    return json(request, { error: e.message }, e.status);
  }
  console.error("booking error", e);
  return json(request, { error: "Something went wrong. Please try again." }, 500);
}