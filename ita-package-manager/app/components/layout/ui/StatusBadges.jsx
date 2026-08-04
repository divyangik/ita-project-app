const PAYMENT_STYLES = {
  Unpaid: "bg-red-50 text-red-700",
  "Deposit paid": "bg-purple-50 text-purple-700",
  "Partial payment": "bg-amber-50 text-amber-700",
  "Fully paid": "bg-blue-50 text-blue-700",
};

const PAYMENT_BAR_COLOR = {
  Unpaid: "bg-red-400",
  "Deposit paid": "bg-purple-500",
  "Partial payment": "bg-amber-500",
  "Fully paid": "bg-green-500",
};

function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-3 w-3"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function CheckCircleIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-3 w-3"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function WalletIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-3 w-3"
      {...props}
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M16 14h2" />
    </svg>
  );
}
function ClockIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-3 w-3"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

const PAYMENT_ICONS = {
  Unpaid: XIcon,
  "Deposit paid": WalletIcon,
  "Partial payment": ClockIcon,
  "Fully paid": CheckCircleIcon,
};

export function PaymentStatusBadge({ status }) {
  const style = PAYMENT_STYLES[status] || "bg-gray-100 text-gray-700";
  const Icon = PAYMENT_ICONS[status] || ClockIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <Icon />
      {status}
    </span>
  );
}

export function PaymentProgressBar({ status, amountPaid, totalAmount }) {
  const pct =
    totalAmount > 0
      ? Math.min(100, Math.round((amountPaid / totalAmount) * 100))
      : 0;
  const barColor = PAYMENT_BAR_COLOR[status] || "bg-gray-400";

  return (
    <>
      <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-400">
        ${Number(amountPaid).toLocaleString()} of $
        {Number(totalAmount).toLocaleString()}
      </div>
    </>
  );
}

const PACKAGE_STATUS_STYLES = {
  Draft: "bg-amber-50 text-amber-700",
  Published: "bg-green-50 text-green-700",
  Archived: "bg-gray-100 text-gray-600",
};

const PACKAGE_STATUS_LABELS = {
  Draft: "Draft",
  Published: "Live",
  Archived: "Archived",
};

const PACKAGE_STATUS_ICONS = {
  Draft: ClockIcon,
  Published: CheckCircleIcon,
  Archived: XIcon,
};

export function PackageStatusBadge({ status }) {
  const style = PACKAGE_STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  const label = PACKAGE_STATUS_LABELS[status] || status;
  const Icon = PACKAGE_STATUS_ICONS[status] || ClockIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <Icon />
      {label}
    </span>
  );
}
