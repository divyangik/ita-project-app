import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { createEnquiry, getEnquiries } from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import EnquiryList from "../components/layout/EnquiryList";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let enquiries = [];
  try {
    enquiries = await getEnquiries(session.shop);
  } catch (err) {
    console.error("Failed to fetch enquiries:", err);
  }

  return { enquiries };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    await createEnquiry(session.shop, {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message") || null,
      package_title: formData.get("package_title") || null,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to create enquiry:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export default function EnquiriesPage() {
  const { enquiries } = useLoaderData();

  return (
    <DashboardLayout
      sidebar={<Sidebar totalEnquiries={enquiries.length} />}
      header={
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">All Enquiries</h1>
          <p className="text-sm text-gray-500">
            Every enquiry submitted through the booking widget
          </p>
        </div>
      }
    >
      <div className="px-8 py-6">
        <EnquiryList enquiries={enquiries} />
      </div>
    </DashboardLayout>
  );
}
