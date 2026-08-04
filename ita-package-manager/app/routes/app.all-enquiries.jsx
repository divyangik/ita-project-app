import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getEnquiries } from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";

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

export default function AllEnquiriesPage() {
  const { enquiries } = useLoaderData();

  return (
    <DashboardLayout
      sidebar={<Sidebar totalEnquiries={enquiries.length} />}
      header={
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">All Enquiries</h1>
          <p className="text-sm text-gray-500">
            View and manage all enquiries received from your booking widget
          </p>
        </div>
      }
    ></DashboardLayout>
  );
}
