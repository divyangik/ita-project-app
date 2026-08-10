import { authenticate } from "../shopify.server";
import {
  getIncludeOptions,
  createIncludeOption,
  updateIncludeOption,
  deleteIncludeOption,
} from "../lib/python.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let options = [];
  try {
    options = await getIncludeOptions(session.shop);
  } catch (err) {
    console.error("Failed to fetch include options:", err);
    return { options: [], error: err.message };
  }

  return { options };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
      const option = await createIncludeOption(session.shop, {
        name: formData.get("name"),
        svg: formData.get("svg"),
      });
      return { success: true, option };
    }

    if (intent === "update") {
      const option = await updateIncludeOption(formData.get("id"), {
        name: formData.get("name"),
        svg: formData.get("svg"),
      });
      return { success: true, option };
    }

    if (intent === "delete") {
      await deleteIncludeOption(formData.get("id"));
      return { success: true, deletedId: formData.get("id") };
    }

    return { success: false, error: "Unknown intent" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}