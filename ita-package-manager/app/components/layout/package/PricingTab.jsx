import { useState } from "react";
import Toggle from "../ui/Toggle";

const PAYMENT_STATUS_OPTIONS = [
  "Unpaid",
  "Deposit paid",
  "Partial payment",
  "Fully paid",
];
const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — $" },
  { value: "EUR", label: "EUR — €" },
  { value: "GBP", label: "GBP — £" },
  { value: "CAD", label: "CAD — $" },
];

function buildPricingInitial(data = {}, packageBasePrice) {
  return {
    price_per_person: data.price_per_person ?? packageBasePrice ?? "",
    currency: data.currency || "USD",
    price_note: data.price_note || "",
  };
}

function buildPaymentInitial(data = {}) {
  return {
    payment_status: data.payment_status || "Unpaid",
    amount_received: data.amount_received ?? 0,
    deposit_amount: data.deposit_amount ?? 0,
    balance_amount: data.balance_amount ?? 0,
    number_of_installments: data.number_of_installments ?? 1,
    installment_label: data.installment_label || "",
    option_label: data.option_label || "",
    cta_text: data.cta_text || "",
    show_deal_price_badge: data.show_deal_price_badge ?? true,
    preselect_full_payment: data.preselect_full_payment ?? true,
  };
}

export default function PricingTab({
  pricing = {},
  payment = {},
  packageBasePrice,
  onChange,
}) {
  const [pricingForm, setPricingForm] = useState(() =>
    buildPricingInitial(pricing, packageBasePrice),
  );
  // ...rest unchanged
  const [paymentForm, setPaymentForm] = useState(() =>
    buildPaymentInitial(payment),
  );

  function updatePricing(patch) {
    setPricingForm((prev) => {
      const next = { ...prev, ...patch };
      onChange?.({ pricing: next, payment: paymentForm });
      return next;
    });
  }

  function updatePayment(patch) {
    setPaymentForm((prev) => {
      const next = { ...prev, ...patch };
      onChange?.({ pricing: pricingForm, payment: next });
      return next;
    });
  }

  function handlePricingField(e) {
    updatePricing({ [e.target.name]: e.target.value });
  }

  function handlePaymentField(e) {
    const { name, value } = e.target;
    const numericFields = [
      "amount_received",
      "deposit_amount",
      "balance_amount",
      "number_of_installments",
    ];
    updatePayment({
      [name]: numericFields.includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : value,
    });
  }

  return (
    <div className="space-y-5">
      {/* Base price */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Base price</h3>
            <p className="text-xs text-gray-500">
              Per person rate and display settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Price per person
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <span className="text-lg font-semibold text-gray-400">$</span>
              <input
                type="number"
                name="price_per_person"
                min="0"
                step="0.01"
                value={pricingForm.price_per_person}
                onChange={handlePricingField}
                placeholder="0"
                className="w-full border-none bg-transparent py-2.5 pl-1.5 text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Currency
            </label>
            <select
              name="currency"
              value={pricingForm.currency}
              onChange={handlePricingField}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Price note
            </label>
            <input
              type="text"
              name="price_note"
              value={pricingForm.price_note}
              onChange={handlePricingField}
              placeholder="e.g. Per person on double occupancy basis"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Shown beneath the price
            </p>
          </div>
        </div>
      </div>

      {/* Payment status & options */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Payment status & options
            </h3>
            <p className="text-xs text-gray-500">
              Track payment and configure deposit / full payment settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Payment status
            </label>
            <select
              name="payment_status"
              value={paymentForm.payment_status}
              onChange={handlePaymentField}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Shown on the dashboard and package list
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Amount received ($)
            </label>
            <input
              type="number"
              name="amount_received"
              min="0"
              step="0.01"
              value={paymentForm.amount_received}
              onChange={handlePaymentField}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Total amount collected so far
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
          {/* Booking deposit option */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 text-gray-500"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">
                Booking deposit option
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Deposit amount ($)
                </label>
                <input
                  type="number"
                  name="deposit_amount"
                  min="0"
                  step="0.01"
                  value={paymentForm.deposit_amount}
                  onChange={handlePaymentField}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Balance amount ($)
                </label>
                <input
                  type="number"
                  name="balance_amount"
                  min="0"
                  step="0.01"
                  value={paymentForm.balance_amount}
                  onChange={handlePaymentField}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Number of installments
                </label>
                <input
                  type="number"
                  name="number_of_installments"
                  min="1"
                  value={paymentForm.number_of_installments}
                  onChange={handlePaymentField}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Installment label
                </label>
                <input
                  type="text"
                  name="installment_label"
                  value={paymentForm.installment_label}
                  onChange={handlePaymentField}
                  placeholder="e.g. $631.67 x 2"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Full payment option */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 text-gray-500"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">
                Full payment option
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Option label
                </label>
                <input
                  type="text"
                  name="option_label"
                  value={paymentForm.option_label}
                  onChange={handlePaymentField}
                  placeholder="e.g. Deal Price"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  CTA text
                </label>
                <input
                  type="text"
                  name="cta_text"
                  value={paymentForm.cta_text}
                  onChange={handlePaymentField}
                  placeholder="e.g. I want to pay full payment"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Show "deal price" badge
                  </p>
                </div>
                <Toggle
                  checked={paymentForm.show_deal_price_badge}
                  onChange={(v) => updatePayment({ show_deal_price_badge: v })}
                  label={
                    paymentForm.show_deal_price_badge ? "Enabled" : "Disabled"
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pre-select full payment
                  </p>
                </div>
                <Toggle
                  checked={paymentForm.preselect_full_payment}
                  onChange={(v) => updatePayment({ preselect_full_payment: v })}
                  label={
                    paymentForm.preselect_full_payment
                      ? "Highlighted by default"
                      : "Not highlighted"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
