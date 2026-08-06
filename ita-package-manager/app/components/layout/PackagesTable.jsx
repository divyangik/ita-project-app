import { useNavigate } from "react-router";

// --- Normalizers -----------------------------------------------------
// Package data can come through with slightly different casing/format
// depending on where it was created (e.g. "Draft" vs "draft",
// "Deposit paid" vs "deposit_paid"), so we normalize before matching.

function normalizeStatus(raw) {
  const v = String(raw || "").toLowerCase();
  if (v.includes("publish") || v.includes("live")) return "live";
  if (v.includes("archiv")) return "archived";
  return "draft";
}

function normalizePayment(raw) {
  const v = String(raw || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (v.includes("fully")) return "fully_paid";
  if (v.includes("partial")) return "partial_payment";
  if (v.includes("deposit")) return "deposit_paid";
  return "unpaid";
}

const STATUS_CONFIG = {
  live: { label: "Live", badge: "bg-green-50 text-green-700" },
  draft: { label: "Draft", badge: "bg-amber-50 text-amber-700" },
  archived: { label: "Archived", badge: "bg-gray-100 text-gray-600" },
};

const PAYMENT_CONFIG = {
  unpaid: {
    label: "Unpaid",
    badge: "bg-red-50 text-red-700",
    bar: "bg-red-400",
    pct: 0,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3 w-3"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
  },
  deposit_paid: {
    label: "Deposit paid",
    badge: "bg-purple-50 text-purple-700",
    bar: "bg-purple-500",
    pct: 16,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3 w-3"
      >
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  partial_payment: {
    label: "Partial payment",
    badge: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
    pct: 50,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3 w-3"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  fully_paid: {
    label: "Fully paid",
    badge: "bg-blue-50 text-blue-700",
    bar: "bg-green-500",
    pct: 100,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3 w-3"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
};

function formatDates(pkg) {
  const dates = pkg.tour_dates || [];
  if (dates.length === 0) return "No dates";

  const today = new Date().setHours(0, 0, 0, 0);
  const upcoming = dates
    .map((d) => ({ ...d, dt: new Date(d.departure_date) }))
    .filter((d) => !Number.isNaN(d.dt.getTime()) && d.dt.getTime() >= today)
    .sort((a, b) => a.dt - b.dt);

  const next = upcoming[0] || dates[0];
  if (!next?.departure_date) return "No dates";

  const label = new Date(next.departure_date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const extra = dates.length - 1;
  return extra > 0 ? `${label} +${extra} more` : label;
}

function PackageRow({ pkg, onDelete }) {
  const navigate = useNavigate();

  const price = Number(pkg.base_price ?? pkg.price ?? 0);
  const paymentKey = normalizePayment(pkg.payment_status);
  const statusKey = normalizeStatus(pkg.status);
  const payment = PAYMENT_CONFIG[paymentKey];
  const status = STATUS_CONFIG[statusKey];
  const totalAmount = price;
  const amountPaid = Math.round((payment.pct / 100) * price);

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4 align-top">
        <div className="font-medium text-gray-900">{pkg.title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3 w-3 flex-shrink-0"
          >
            <path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {pkg.destination}
          {pkg.region && ` \u00b7 ${pkg.region}`}
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <div className="font-medium text-gray-900">
          ${price.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">per person</div>
      </td>

      <td className="px-5 py-4 align-top">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${payment.badge}`}
        >
          {payment.icon}
          {payment.label}
        </span>
        <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${payment.bar}`}
            style={{
              width: `${Math.max(payment.pct, payment.pct > 0 ? payment.pct : 2)}%`,
            }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-400">
          ${amountPaid.toLocaleString()} of ${totalAmount.toLocaleString()}
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
        >
          {status.label}
        </span>
      </td>

      <td className="px-5 py-4 align-top text-sm text-gray-500">
        {formatDates(pkg)}
      </td>

      <td className="px-5 py-4 align-top">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/app/package/${pkg.id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(pkg)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
            </svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function PackagesTable({ packages = [], onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3">Package</th>
            <th className="px-5 py-3">Price</th>
            <th className="px-5 py-3">Payment status</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Dates</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                No packages found.
              </td>
            </tr>
          ) : (
            packages.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} onDelete={onDelete} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { normalizeStatus, normalizePayment, STATUS_CONFIG, PAYMENT_CONFIG };
