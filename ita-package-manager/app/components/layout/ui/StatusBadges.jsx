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