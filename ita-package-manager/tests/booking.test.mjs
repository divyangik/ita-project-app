import test from "node:test";
import assert from "node:assert/strict";
import {
  BookingError,
  buildDraftOrderInput,
  computeBooking,
  validateContact,
} from "../app/lib/booking.server.js";

const data = {
  view: true,
  package: { title: "Boquete Discovery" },
  pricing: { currency: "USD" },
  payment: { deposit_amount: 500 },
  capacity: { max_group_size: 10, min_group_size: 0, child_allowed: true },
  dates: [
    { id: 1, departure_date: "2027-03-01", return_date: "2027-03-08", adult_price: 2000, child_price: 1500, single_supplement: 400, seats_total: 10, seats_available: 3, status: "Available" },
    { id: 2, departure_date: "2027-04-01", return_date: "2027-04-08", adult_price: 2100, child_price: null, single_supplement: null, seats_total: 0, seats_available: 0, status: "Guaranteed" },
    { id: 3, departure_date: "2027-05-01", return_date: "2027-05-08", adult_price: 2100, seats_total: 10, seats_available: 0, status: "Available" },
    { id: 4, departure_date: "2026-01-01", return_date: "2026-01-08", adult_price: 2000, seats_total: 10, seats_available: 5, status: "Available" },
    { id: 5, departure_date: "2027-06-01", return_date: "2027-06-08", adult_price: 2000, seats_total: 10, seats_available: 5, status: "Sold Out" },
  ],
  addons: [{ id: 9, addon_name: "Airport transfer", price: 60 }],
};
const today = "2026-10-26";
const q = (input) => computeBooking({ data, input, today });
const rejects = (input, re) =>
  assert.throws(() => q(input), (e) => e instanceof BookingError && re.test(e.message));

test("2 adults, deposit", () => {
  const r = q({ date_id: 1, rows: [{ type: "adult", qty: 2 }], payment_type: "deposit" });
  assert.equal(r.total, "4000.00");
  assert.equal(r.due_now, "1000.00");
  assert.equal(r.balance, "3000.00");
  assert.equal(r.travelers, 2);
});

test("full payment", () => {
  const r = q({ date_id: 1, rows: [{ type: "adult", qty: 2 }], payment_type: "full" });
  assert.equal(r.due_now, "4000.00");
  assert.equal(r.balance, "0.00");
});

test("couple counts as 2 travelers, child uses child price, single adds supplement", () => {
  const r = q({ date_id: 1, rows: [{ type: "couple", qty: 1 }, { type: "child", qty: 1 }], payment_type: "full" });
  assert.equal(r.travelers, 3);
  assert.equal(r.total, "5500.00");
  const s = q({ date_id: 1, rows: [{ type: "single", qty: 1 }], payment_type: "full" });
  assert.equal(s.total, "2400.00");
});

test("child falls back to adult price", () => {
  const r = q({ date_id: 2, rows: [{ type: "child", qty: 1 }], payment_type: "full" });
  assert.equal(r.total, "2100.00");
});

test("addons add to the total and are checked", () => {
  const r = q({ date_id: 1, rows: [{ type: "adult", qty: 2 }], addons: [{ id: 9, qty: 2 }], payment_type: "full" });
  assert.equal(r.total, "4120.00");
  rejects({ date_id: 1, rows: [{ type: "adult", qty: 2 }], addons: [{ id: 9, qty: 3 }] }, /quantity/);
  rejects({ date_id: 1, rows: [{ type: "adult", qty: 1 }], addons: [{ id: 99, qty: 1 }] }, /no longer/);
});

test("seat rules", () => {
  rejects({ date_id: 1, rows: [{ type: "adult", qty: 4 }] }, /Only 3 seats/);
  rejects({ date_id: 3, rows: [{ type: "adult", qty: 1 }] }, /sold out/);
  const ok = q({ date_id: 2, rows: [{ type: "adult", qty: 8 }], payment_type: "full" }); // unlimited
  assert.equal(ok.travelers, 8);
});

test("date rules", () => {
  rejects({ date_id: 4, rows: [{ type: "adult", qty: 1 }] }, /passed/);
  rejects({ date_id: 5, rows: [{ type: "adult", qty: 1 }] }, /not open/);
  rejects({ date_id: 77, rows: [{ type: "adult", qty: 1 }] }, /departure date/);
});

test("group size and bad input", () => {
  rejects({ date_id: 2, rows: [{ type: "adult", qty: 11 }] }, /Maximum 10/);
  rejects({ date_id: 2, rows: [] }, /at least one/);
  rejects({ date_id: 2, rows: [{ type: "vip", qty: 1 }] }, /Unknown/);
  rejects({ date_id: 2, rows: [{ type: "adult", qty: -1 }] }, /not valid/);
});

test("browser total is ignored", () => {
  const r = q({ date_id: 1, rows: [{ type: "adult", qty: 1 }], total: 1, due_now: 1, payment_type: "full" });
  assert.equal(r.total, "2000.00");
});

test("no deposit configured means full amount", () => {
  const d2 = { ...data, payment: { deposit_amount: 0 } };
  const r = computeBooking({ data: d2, input: { date_id: 1, rows: [{ type: "adult", qty: 1 }], payment_type: "deposit" }, today });
  assert.equal(r.due_now, "2000.00");
  assert.equal(r.payment_type, "full");
});

test("contact validation", () => {
  assert.throws(() => validateContact({ name: "", email: "a@b.co", phone: "1" }), /Name/);
  assert.throws(() => validateContact({ name: "A", email: "nope", phone: "1" }), /email/);
  assert.throws(() => validateContact({ name: "A", email: "a@b.co", phone: " " }), /Phone/);
  assert.equal(validateContact({ name: " Ann Lee ", email: "a@b.co", phone: "123" }).name, "Ann Lee");
});

test("draft order input", () => {
  const quote = q({ date_id: 1, rows: [{ type: "adult", qty: 2 }], payment_type: "deposit" });
  const c = validateContact({ name: "Ann Lee", email: "a@b.co", phone: "123" });
  const input = buildDraftOrderInput(quote, c, "555");
  assert.equal(input.lineItems[0].originalUnitPriceWithCurrency.amount, "1000.00");
  assert.equal(input.lineItems[0].originalUnitPriceWithCurrency.currencyCode, "USD");
  assert.equal(input.email, "a@b.co");
  const get = (k) => input.customAttributes.find((a) => a.key === k)?.value;
  assert.equal(get("Balance due"), "3000.00 USD");
  assert.equal(get("Travelers"), "2");
  assert.equal(get("Departure"), "2027-03-01");
});
