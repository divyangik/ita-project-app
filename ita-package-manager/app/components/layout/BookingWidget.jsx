import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

export default function BookingWidget({ onProceed }) {
  const packagesFetcher = useFetcher();
  const packages = packagesFetcher.data?.packages || [];

  const [selectedId, setSelectedId] = useState("");
  const [values, setValues] = useState({
    tourTitle: "",
    departureCity: "",
    endCity: "",
    fromDate: "",
    toDate: "",
    guests: 1,
    price: 0,
    paymentType: "deposit",
  });

  useEffect(() => {
    packagesFetcher.load("/app/api/packages");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectPackage(id) {
    setSelectedId(id);
    const pkg = packages.find((p) => String(p.id) === String(id));
    if (!pkg) return;

    setValues((v) => ({
      ...v,
      tourTitle: pkg.title || "",
      departureCity: pkg.destination || "",
      endCity: pkg.region || "",
      price: Number(pkg.base_price) || 0,
    }));
  }

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function changeGuests(delta) {
    setValues((v) => ({ ...v, guests: Math.max(1, v.guests + delta) }));
  }

  const price = Number(values.price) || 0;
  const deposit = Math.round(price * 0.15);
  const balance = price - deposit;
  const noOfInstallments = 2;
  const installmentAmount =
    balance > 0 ? (balance / noOfInstallments).toFixed(2) : "0.00";

  function buildDetails() {
    return { ...values, price, deposit, balance };
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 pt-5">
        <div className="text-sm text-gray-700">
          Departure City :{" "}
          <span className="font-bold text-gray-900">
            {values.departureCity || "—"}
          </span>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-800">
            Package / Tour
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectPackage(e.target.value)}
            disabled={packagesFetcher.state === "loading"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
          >
            <option value="">
              {packagesFetcher.state === "loading"
                ? "Loading packages…"
                : "Select a package"}
            </option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title} — ${Number(pkg.base_price).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">
              From:
            </label>
            <input
              type="date"
              value={values.fromDate}
              onChange={(e) => update("fromDate", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">
              To:
            </label>
            <input
              type="date"
              value={values.toDate}
              onChange={(e) => update("toDate", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {values.departureCity || "—"}
              </p>
              <p className="text-xs text-gray-500">Tour Starts</p>
            </div>

            <div className="mx-3 flex flex-1 items-center">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="mx-1 h-px flex-1 border-t border-dashed border-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-400" />
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {values.endCity || "—"}
              </p>
              <p className="text-xs text-gray-500">Tour Ends</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-700">
            <span className="font-bold text-gray-900">Guest & Rooms</span>{" "}
            Maximum 20 guests at a time
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Traveler</p>
                <p className="text-xs text-gray-500">Double Occupancy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeGuests(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                −
              </button>
              <span className="w-4 text-center text-sm font-semibold">
                {values.guests}
              </span>
              <button
                type="button"
                onClick={() => changeGuests(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {values.guests} Traveler{values.guests > 1 ? "s" : ""}
        </p>

        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-start justify-between rounded-lg border p-3 ${values.paymentType === "deposit" ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          >
            <span className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1 accent-red-500"
                name="paymentType"
                checked={values.paymentType === "deposit"}
                onChange={() => update("paymentType", "deposit")}
              />
              <span className="text-sm font-semibold text-gray-900">
                I Want To Deposit
              </span>
            </span>
            <span className="text-right">
              <span className="block text-base font-bold text-gray-900">
                ${deposit.toLocaleString()}
              </span>
              <span className="block text-xs text-gray-500">
                ${balance.toLocaleString()} Balance Paid later.
                <br />
                (You can pay it in easy installments like ${
                  installmentAmount
                } X {noOfInstallments})
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${values.paymentType === "full" ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                className="accent-red-500"
                name="paymentType"
                checked={values.paymentType === "full"}
                onChange={() => update("paymentType", "full")}
              />
              <span className="text-sm font-semibold text-gray-900">
                Full Price,{" "}
                <span className="font-normal">I Want To Pay Full Payment</span>
              </span>
            </span>
            <span className="text-base font-bold text-gray-900">
              ${price.toLocaleString()}
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={() => onProceed(buildDetails())}
          disabled={!selectedId}
          className="flex-1 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enquiry Now
        </button>
        <button
          type="button"
          onClick={() => onProceed(buildDetails())}
          disabled={!selectedId}
          className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
