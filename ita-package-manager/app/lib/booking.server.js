// Pure booking logic: price, seat and rule checks. No network, no Shopify.
// `data` is the JSON from the FastAPI route GET /store/package/{id}.

export class BookingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

export const ROW_TYPES = ["adult", "single", "couple", "child"];
const BOOKABLE_STATUSES = ["Available", "Guaranteed"];
const MAX_QTY_PER_ROW = 20;

const toCents = (v) => Math.round(Number(v || 0) * 100);
const fromCents = (c) => (c / 100).toFixed(2);

export function travelersInRow(row) {
  return row.type === "couple" ? row.qty * 2 : row.qty;
}

function cleanRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BookingError("Choose at least one traveler.");
  }
  const merged = new Map();
  for (const r of rows) {
    const type = String(r?.type || "");
    const qty = Number(r?.qty);
    if (!ROW_TYPES.includes(type)) {
      throw new BookingError(`Unknown traveler type: ${type}`);
    }
    if (!Number.isInteger(qty) || qty < 0 || qty > MAX_QTY_PER_ROW) {
      throw new BookingError("Traveler count is not valid.");
    }
    if (qty > 0) merged.set(type, (merged.get(type) || 0) + qty);
  }
  const out = [...merged].map(([type, qty]) => ({ type, qty }));
  if (out.length === 0) throw new BookingError("Choose at least one traveler.");
  return out;
}

export function computeBooking({ data, input, today }) {
  if (!data || !data.view) {
    throw new BookingError("This trip is not available for booking.", 404);
  }

  const todayStr = today || new Date().toISOString().slice(0, 10);
  const date = (data.dates || []).find(
    (d) => String(d.id) === String(input?.date_id),
  );
  if (!date) throw new BookingError("Please choose a departure date.");
  if (!BOOKABLE_STATUSES.includes(date.status)) {
    throw new BookingError("This departure is not open for booking.");
  }
  if (String(date.departure_date) <= todayStr) {
    throw new BookingError("This departure date has already passed.");
  }

  const rows = cleanRows(input?.rows);
  const travelers = rows.reduce((n, r) => n + travelersInRow(r), 0);

  const cap = data.capacity || {};
  if (cap.max_group_size > 0 && travelers > cap.max_group_size) {
    throw new BookingError(`Maximum ${cap.max_group_size} travelers per booking.`);
  }
  if (cap.min_group_size > 0 && travelers < cap.min_group_size) {
    throw new BookingError(`Minimum ${cap.min_group_size} travelers per booking.`);
  }
  if (cap.child_allowed === false && rows.some((r) => r.type === "child")) {
    throw new BookingError("Children are not allowed on this trip.");
  }

  // seats_total 0 means seats are not limited
  if (date.seats_total > 0 && travelers > date.seats_available) {
    throw new BookingError(
      date.seats_available > 0
        ? `Only ${date.seats_available} seat${date.seats_available === 1 ? "" : "s"} left on this date.`
        : "This date is sold out.",
      409,
    );
  }

  const adult = toCents(date.adult_price);
  const child = date.child_price ? toCents(date.child_price) : adult;
  const single = toCents(date.single_supplement);

  const lines = [];
  const add = (label, qty, unit) => {
    if (qty > 0) lines.push({ label, qty, unit, amount: unit * qty });
  };

  for (const r of rows) {
    if (r.type === "adult") add("Adult (double occupancy)", r.qty, adult);
    if (r.type === "couple") add("Couple room (2 travelers)", r.qty, adult * 2);
    if (r.type === "child") add("Child", r.qty, child);
    if (r.type === "single") {
      add("Adult (single room)", r.qty, adult);
      add("Single supplement", r.qty, single);
    }
  }

  const pickedAddons = [];
  for (const a of Array.isArray(input?.addons) ? input.addons : []) {
    const found = (data.addons || []).find((x) => String(x.id) === String(a?.id));
    const qty = Number(a?.qty ?? 1);
    if (!found) throw new BookingError("An extra you chose is no longer available.");
    // The admin can set a maximum per extra (0 = no limit, up to the safety cap)
    const maxQty = Number(found.max_qty) > 0 ? Number(found.max_qty) : MAX_QTY_PER_ROW;
    if (!Number.isInteger(qty) || qty < 0 || qty > maxQty) {
      throw new BookingError("Extra quantity is not valid.");
    }
    if (qty === 0) continue;
    add(found.addon_name, qty, toCents(found.price));
    pickedAddons.push({ id: found.id, name: found.addon_name, qty });
  }

  const total = lines.reduce((n, l) => n + l.amount, 0);
  if (total <= 0) throw new BookingError("The price for this trip is not set.");

  const paymentType = input?.payment_type === "full" ? "full" : "deposit";
  const depositPerPerson = toCents(data.payment?.deposit_amount);
  let dueNow = total;
  if (paymentType === "deposit") {
    // Without a deposit set up, the full amount is taken
    dueNow = depositPerPerson > 0 ? Math.min(depositPerPerson * travelers, total) : total;
  }

  return {
    currency: data.pricing?.currency || "USD",
    package_title: data.package?.title,
    date: {
      id: date.id,
      departure_date: date.departure_date,
      return_date: date.return_date,
    },
    rows,
    travelers,
    addons: pickedAddons,
    payment_type: dueNow === total ? "full" : "deposit",
    lines: lines.map((l) => ({
      label: l.label,
      qty: l.qty,
      unit: fromCents(l.unit),
      amount: fromCents(l.amount),
    })),
    total: fromCents(total),
    due_now: fromCents(dueNow),
    balance: fromCents(total - dueNow),
  };
}

export function validateContact(c) {
  const name = String(c?.name || "").trim();
  const email = String(c?.email || "").trim();
  const phone = String(c?.phone || "").trim();
  if (!name) throw new BookingError("Name is required.");
  if (!/^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new BookingError("A valid email is required.");
  }
  if (!phone) throw new BookingError("Phone is required.");
  return { name: name.slice(0, 120), email, phone: phone.slice(0, 40) };
}

// Input for the Shopify Admin API draftOrderCreate mutation
export function buildDraftOrderInput(quote, contact, productId) {
  const attrs = (pairs) =>
    pairs
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([key, value]) => ({ key, value: String(value) }));

  const paying = quote.payment_type === "deposit" ? "Deposit" : "Full payment";
  return {
    email: contact.email,
    note: `Online booking: ${quote.package_title}, ${quote.date.departure_date} to ${quote.date.return_date}`,
    tags: ["online-booking", "ita-booking"],
    customAttributes: attrs([
      ["Trip", quote.package_title],
      ["Shopify product", productId],
      ["Departure", quote.date.departure_date],
      ["Return", quote.date.return_date],
      ["Travelers", quote.travelers],
      [
        "Rooms",
        quote.rows.map((r) => `${r.qty} x ${r.type}`).join(", "),
      ],
      [
        "Extras",
        quote.addons.map((a) => `${a.qty} x ${a.name}`).join(", "),
      ],
      ["Trip total", `${quote.total} ${quote.currency}`],
      ["Paying now", `${quote.due_now} ${quote.currency} (${paying})`],
      ["Balance due", `${quote.balance} ${quote.currency}`],
      ["Lead traveler", contact.name],
      ["Phone", contact.phone],
      ["Departure ID", quote.date.id],
    ]),
    lineItems: [
      {
        title: `${quote.package_title}: ${paying} (${quote.travelers} traveler${quote.travelers === 1 ? "" : "s"})`,
        quantity: 1,
        requiresShipping: false,
        taxable: false,
        originalUnitPriceWithCurrency: {
          amount: quote.due_now,
          currencyCode: quote.currency,
        },
        customAttributes: attrs([
          ["Departure", quote.date.departure_date],
          ["Balance due", `${quote.balance} ${quote.currency}`],
        ]),
      },
    ],
  };
}