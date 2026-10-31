// CORS for the public website routes (enquiry, itinerary email).
// Allowed websites come from BOOKING_ALLOWED_ORIGINS (comma separated).
export function corsHeaders(request) {
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

export function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

// Sends a JSON body to the Python service and returns { ok, status, data }
export async function postToService(path, body) {
  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}