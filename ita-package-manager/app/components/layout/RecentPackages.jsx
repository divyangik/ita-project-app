import { useNavigate } from "react-router";
import {
  normalizeStatus,
  normalizePayment,
  STATUS_CONFIG,
  PAYMENT_CONFIG,
} from "./PackagesTable";

function PackageRow({ pkg, onDelete }) {
  const navigate = useNavigate();

  const price = Number(pkg.price ?? pkg.base_price ?? 0);
  const paymentKey = normalizePayment(pkg.payment_status);
  const statusKey = normalizeStatus(pkg.status);

  const payment = PAYMENT_CONFIG[paymentKey];
  const status = STATUS_CONFIG[statusKey];

  const totalAmount = price;
  const amountPaid = Math.round((payment.pct / 100) * price);

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4">
        <div className="font-medium text-gray-900">{pkg.title}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          {pkg.destination}
          {pkg.region && ` · ${pkg.region}`}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="font-medium text-gray-900">
          ${price.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">per person</div>
      </td>

      <td className="px-5 py-4">
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
              width: `${Math.max(
                payment.pct,
                payment.pct > 0 ? payment.pct : 2,
              )}%`,
            }}
          />
        </div>

        <div className="mt-1 text-xs text-gray-400">
          ${amountPaid.toLocaleString()} of ${totalAmount.toLocaleString()}
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
        >
          {status.label}
        </span>
      </td>

      <td className="px-5 py-4">
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

export default function RecentPackages({ packages = [], onDelete }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Recent packages
          </h2>
          <p className="text-sm text-gray-500">
            Latest tour products added to the system
          </p>
        </div>

        <a
          href="/app/packages"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Package</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Payment status</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-gray-400"
                >
                  No packages yet.
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
    </div>
  );
}
