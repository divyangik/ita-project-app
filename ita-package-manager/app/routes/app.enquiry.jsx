import { useState } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getEnquiries } from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import BookingWidget from "../components/layout/BookingWidget";
import EnquiryForm from "../components/layout/EnquiryForm";
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

export default function EnquiryPage() {
  const { enquiries } = useLoaderData();
  const [step, setStep] = useState("booking");
  const [bookingDetails, setBookingDetails] = useState(null);

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
  }

  return (
    <DashboardLayout
      sidebar={<Sidebar totalEnquiries={enquiries.length} />}
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
    >
      <div className="w-full space-y-8 px-8 py-6">
        {step === "booking" ? (
          <BookingWidget onProceed={handleProceed} />
        ) : (
          <EnquiryForm
            bookingDetails={bookingDetails}
            onBack={handleBack}
            onSubmitted={handleSubmitted}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
