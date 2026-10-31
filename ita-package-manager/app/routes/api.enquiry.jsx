// POST /api/enquiry  { shopify_product_id, name, email, phone, message }
// Saves an enquiry from the website in the admin app (Enquiries page).
import { corsHeaders, json, postToService } from "../lib/cors.server";

export async function loader({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  try {
    const body = await request.json().catch(() => ({}));
    const productId = String(body.shopify_product_id || "");
    if (!productId) return json(request, { error: "Missing trip id." }, 400);
    const result = await postToService(`/store/enquiry/${encodeURIComponent(productId)}`, {
      name: String(body.name || "").slice(0, 120),
      email: String(body.email || "").slice(0, 200),
      phone: String(body.phone || "").slice(0, 40),
      message: String(body.message || "").slice(0, 4000),
    });
    if (!result.ok) {
      const detail = typeof result.data?.detail === "string" ? result.data.detail : "We could not send your enquiry. Please try again.";
      return json(request, { error: detail }, result.status === 422 ? 422 : 502);
    }
    return json(request, { success: true });
  } catch (e) {
    console.error("enquiry failed", e);
    return json(request, { error: "We could not send your enquiry. Please try again." }, 500);
  }
}