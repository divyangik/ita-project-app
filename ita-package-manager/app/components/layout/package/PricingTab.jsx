import { useState } from "react";
import Toggle from "../ui/Toggle";
import { FieldError, inputClass } from "../shared/formValidation";

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

function validate(pricingForm, paymentForm) {
  const errors = {};

  const price = Number(pricingForm.price_per_person);
  if (pricingForm.price_per_person === "" || Number.isNaN(price)) {
    errors.price_per_person = "Price per person is required.";
  } else if (price <= 0) {
    errors.price_per_person = "Price must be greater than 0.";
  }

  const deposit = Number(paymentForm.deposit_amount) || 0;
  const balance = Number(paymentForm.balance_amount) || 0;

  if (deposit < 0) {
    errors.deposit_amount = "Deposit can't be negative.";
  } else if (!Number.isNaN(price) && price > 0 && deposit > price) {
    errors.deposit_amount = "Deposit can't exceed the price per person.";
  }

  if (balance < 0) {
    errors.balance_amount = "Balance can't be negative.";
  }

  if (
    !Number.isNaN(price) &&
    price > 0 &&
    deposit > 0 &&
    balance > 0 &&
    Math.abs(deposit + balance - price) > 0.01
  ) {
    errors.balance_amount = `Deposit + balance should equal $${price.toFixed(2)} (currently $${(deposit + balance).toFixed(2)}).`;
  }

  const installments = Number(paymentForm.number_of_installments);
  if (!installments || installments < 1) {
    errors.number_of_installments = "Must be at least 1.";
  }

  return errors;
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
  const [paymentForm, setPaymentForm] = useState(() =>
    buildPaymentInitial(payment),
  );
  const [touched, setTouched] = useState({});

  const errors = validate(pricingForm, paymentForm);

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

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
      {/* Base price — green accent */}
      <div className="overflow-hidden rounded-xl border border-green-100 bg-white">
        <div className="flex items-start gap-3 border-b border-green-100 bg-gradient-to-r from-green-50/80 to-white px-6 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
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

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Price per person <span className="text-red-500">*</span>
            </label>
            <div
              className={`flex items-center rounded-lg border px-3 transition-colors focus-within:ring-1 ${
                touched.price_per_person && errors.price_per_person
                  ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500"
                  : "border-gray-300 focus-within:border-green-500 focus-within:ring-green-500"
              }`}
            >
              <span className="text-lg font-semibold text-gray-400">$</span>
              <input
                type="number"
                name="price_per_person"
                min="0"
                step="0.01"
                value={pricingForm.price_per_person}
                onChange={handlePricingField}
                onBlur={() => markTouched("price_per_person")}
                placeholder="0"
                className="w-full border-none bg-transparent py-2.5 pl-1.5 text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            {touched.price_per_person && (
              <FieldError message={errors.price_per_person} />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Currency
            </label>
            <select
              name="currency"
              value={pricingForm.currency}
              onChange={handlePricingField}
              className={inputClass(false, "green")}
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
              className={inputClass(false, "green")}
            />
            <p className="mt-1 text-xs text-gray-400">
              Shown beneath the price
            </p>
          </div>
        </div>
      </div>

      {/* Payment status & options — blue accent */}
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="flex items-start gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 to-white px-6 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
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

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment status
              </label>
              <select
                name="payment_status"
                value={paymentForm.payment_status}
                onChange={handlePaymentField}
                className={inputClass(false, "blue")}
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
                className={inputClass(false, "blue")}
              />
              <p className="mt-1 text-xs text-gray-400">
                Total amount collected so far
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            {/* Booking deposit option — amber tile */}
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-800">
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
                    onBlur={() => markTouched("deposit_amount")}
                    className={inputClass(
                      touched.deposit_amount && errors.deposit_amount,
                      "amber",
                    )}
                  />
                  {touched.deposit_amount && (
                    <FieldError message={errors.deposit_amount} />
                  )}
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
                    onBlur={() => markTouched("balance_amount")}
                    className={inputClass(
                      touched.balance_amount && errors.balance_amount,
                      "amber",
                    )}
                  />
                  {touched.balance_amount && (
                    <FieldError message={errors.balance_amount} />
                  )}
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
                    onBlur={() => markTouched("number_of_installments")}
                    className={inputClass(
                      touched.number_of_installments &&
                        errors.number_of_installments,
                      "amber",
                    )}
                  />
                  {touched.number_of_installments && (
                    <FieldError message={errors.number_of_installments} />
                  )}
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
                    className={inputClass(false, "amber")}
                  />
                </div>
              </div>
            </div>

            {/* Full payment option — teal tile */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <span className="text-sm font-semibold text-teal-800">
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
                    className={inputClass(false, "teal")}
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
                    className={inputClass(false, "teal")}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Show "deal price" badge
                  </p>
                  <Toggle
                    checked={paymentForm.show_deal_price_badge}
                    onChange={(v) => updatePayment({ show_deal_price_badge: v })}
                    label={
                      paymentForm.show_deal_price_badge
                        ? "Enabled"
                        : "Disabled"
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pre-select full payment
                  </p>
                  <Toggle
                    checked={paymentForm.preselect_full_payment}
                    onChange={(v) =>
                      updatePayment({ preselect_full_payment: v })
                    }
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
    </div>
  );
}