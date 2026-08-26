import { authenticate } from "../shopify.server";
import {
  createGuestCategoryOption,
  updateGuestCategoryOption,
  deleteGuestCategoryOption,
} from "../lib/python.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create-guest-category-option") {
      const option = await createGuestCategoryOption(session.shop, {
        kind: formData.get("kind"),
        name: formData.get("name"),
        value: formData.get("value"),
        message: formData.get("message") || null,
      });
      return { success: true, option };
    }

    if (intent === "update-guest-category-option") {
      const option = await updateGuestCategoryOption(formData.get("id"), {
        name: formData.get("name"),
        value: formData.get("value"),
        message: formData.get("message") || null,
      });
      return { success: true, option };
    }

    if (intent === "delete-guest-category-option") {
      const deletedId = formData.get("id");
      await deleteGuestCategoryOption(deletedId);
      return { success: true, deletedId };
    }

    return { success: false, error: "Unknown intent" };
  } catch (error) {
    return { success: false, error: error.message || "Something went wrong" };
  }
}