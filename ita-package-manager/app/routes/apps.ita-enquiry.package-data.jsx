export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyProductId = url.searchParams.get("shopify_product_id");
 
  if (!shopifyProductId) {
    return Response.json({ view: null });
  }
 
  const res = await fetch(
    `${process.env.PYTHON_SERVICE_URL}/store/package/${encodeURIComponent(shopifyProductId)}`
  );
 
  const data = await res.json();
  return Response.json(data);
}