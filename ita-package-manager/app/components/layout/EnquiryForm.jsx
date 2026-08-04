import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

function summarizeBooking(details) {
  if (!details) return "";
  const lines = [];
  if (details.tourTitle) lines.push(`Tour: ${details.tourTitle}`);
  if (details.departureCity || details.endCity) {
    lines.push(
      `Route: ${details.departureCity || "?"} to ${details.endCity || "?"}`,
    );
  }
  if (details.fromDate || details.toDate) {
    lines.push(`Dates: ${details.fromDate || "?"} to ${details.toDate || "?"}`);
  }
  lines.push(`Guests: ${details.guests}`);
  if (details.price) {
    lines.push(
      details.paymentType === "deposit"
        ? `Payment: Deposit $${details.deposit} (balance $${details.balance} later) of $${details.price} total`
        : `Payment: Full price $${details.price}`,
    );
  }
  return lines.join("\n");
}

export default function EnquiryForm({ bookingDetails, onBack, onSubmitted }) {
  const fetcher = useFetcher();
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const submitting = fetcher.state !== "idle";
  const sent = fetcher.data?.success === true;
  const error = fetcher.data?.success === false ? fetcher.data.error : null;

  useEffect(() => {
    setValues((v) => ({ ...v, message: summarizeBooking(bookingDetails) }));
  }, [bookingDetails]);

  useEffect(() => {
    if (sent) onSubmitted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent]);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Enquiry Now
        </h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        )}
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">
            Enquiry sent successfully!
          </p>
          <p className="text-sm text-gray-500">
            We'll be in touch with {values.name || "you"} shortly.
          </p>
        </div>
      ) : (
        <fetcher.Form method="post" action="/app/enquiries">
          <input
            type="hidden"
            name="package_title"
            value={bookingDetails?.tourTitle || ""}
          />
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            {error && (
              <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={values.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={values.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                value={values.phone}
                onChange={handleChange}
                placeholder="Enter 10 digit number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Message
              </label>
              <textarea
                name="message"
                rows={3}
                value={values.message}
                onChange={handleChange}
                placeholder="Tell us what you're looking for..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Enquiry Now"}
            </button>
          </div>
        </fetcher.Form>
      )}
    </div>
  );
}
