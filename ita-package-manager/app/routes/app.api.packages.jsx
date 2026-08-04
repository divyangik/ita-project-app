import { authenticate } from "../shopify.server";
import { getPackages } from "../lib/python.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let packages = [];
  try {
    packages = await getPackages(session.shop);
  } catch (err) {
    console.error("Failed to fetch packages for booking widget:", err);
  }

  return { packages };
}
