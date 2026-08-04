import StatCard from "./StatCard";

export default function DashboardCards({ dashboard }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total packages"
        value={dashboard.totalPackages}
        description="All tour products"
        color="blue"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M6 7h12l1 13H5L6 7z" />
            <path d="M9 7a3 3 0 016 0" />
          </svg>
        }
      />

      <StatCard
        title="Live"
        value={dashboard.activePackages}
        description="Published & active"
        color="green"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        }
      />

      <StatCard
        title="Drafts"
        value={dashboard.draftPackages}
        description="Not yet published"
        color="amber"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        }
      />

      <StatCard
        title="Total revenue"
        value={`$${Number(dashboard.totalRevenue).toLocaleString()}`}
        description="Sum of base prices"
        color="gray"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        }
      />
    </div>
  );
}
