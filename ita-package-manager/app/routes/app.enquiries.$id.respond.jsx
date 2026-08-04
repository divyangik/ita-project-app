import { authenticate } from "../shopify.server";
import { updateEnquiryResponded } from "../lib/python.server";

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const leadResponded = formData.get("lead_responded") === "true";

  try {
    await updateEnquiryResponded(session.shop, params.id, leadResponded);
    return { success: true };
  } catch (err) {
    console.error("Failed to update enquiry response status:", err);
    return { success: false };
  }
}
