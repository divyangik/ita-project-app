// Public booking API for the new ITA site.
//   GET  /api/booking?shopify_product_id=123   -> trip data (dates, seats, prices, extras)
//   POST /api/booking  { intent: "quote" | "checkout", ... }
//        quote    -> price breakdown, nothing is created
//        checkout -> creates a Shopify Draft Order and returns { checkout_url }
// The browser never sets prices. Everything is recomputed here from the trip data.
import { unauthenticated } from "../shopify.server";
import {
  BookingError,
  buildDraftOrderInput,
  computeBooking,
  validateContact,
} from "../lib/booking.server";

const SERVICE = () => process.env.PYTHON_SERVICE_URL;

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (process.env.BOOKING_ALLOWED_ORIGINS || "http://localhost:8888")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = allowed.includes("*") || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : allowed[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

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
  return res.json();
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  try {
    const id = new URL(request.url).searchParams.get("shopify_product_id");
    const data = await fetchTrip(id);
    if (!data.view) return json(request, { view: null });
    // Only what the booking box needs
    return json(request, {
      view: true,
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
