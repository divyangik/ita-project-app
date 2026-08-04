import { useState } from "react";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import BookingWidget from "../components/layout/BookingWidget";
import EnquiryForm from "../components/layout/EnquiryForm";
import EnquiryList from "../components/layout/EnquiryList";

const API_BASE_URL = process.env.PACKAGE_SERVICE_URL;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const res = await fetch(
    `${API_BASE_URL}/enquiries?shop=${encodeURIComponent(session.shop)}`,
    { headers: { "x-internal-key": INTERNAL_KEY } },
  );
  const enquiries = res.ok ? await res.json() : [];
  return { enquiries };
}

export default function EnquiryPage() {
  const { enquiries } = useLoaderData();
  const [step, setStep] = useState("booking");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  function handleProceed(details) {
    setBookingDetails(details);
    setStep("enquiry");
  }

  function handleBack() {
    setStep("booking");
  }

  function handleSubmitted() {
    setStep("booking");
    setBookingDetails(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <DashboardLayout
      sidebar={<Sidebar />}
      header={
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">New Enquiry</h1>
          <p className="text-sm text-gray-500">
            {step === "booking"
              ? "Select a package and travel details"
              : "Enter contact details to complete the enquiry"}
          </p>
        </div>
      }
    ></DashboardLayout>
  );
}
