const COLOR_STYLES = {
  blue: "text-blue-600",
  green: "text-green-600",
  amber: "text-amber-600",
  gray: "text-gray-500",
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  color = "gray",
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${COLOR_STYLES[color]}`}
      >
        {icon}
        {title}
      </div>

      <p className="!mt-3 !text-3xl !font-bold !text-gray-900">{value}</p>

      {description && (
        <p className="!mt-1 !text-sm !text-gray-500">{description}</p>
      )}
    </div>
  );
}
