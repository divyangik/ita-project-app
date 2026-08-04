export async function action({ request }) {
  const formData = await request.formData();
  const shopifyProductId = formData.get("shopify_product_id");
 
  const res = await fetch(
    `${process.env.PYTHON_SERVICE_URL}/store/enquiry/${encodeURIComponent(shopifyProductId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        message: formData.get("message"),
      }),
    }
  );
 
  const data = await res.json().catch(() => ({}));
 
  if (!res.ok) {
    return Response.json(
      { success: false, error: data.detail || "Something went wrong." },
      { status: res.status }
    );
  }
 
  return Response.json({ success: true });
}