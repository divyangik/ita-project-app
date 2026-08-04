import { NavLink } from "react-router";

export default function Sidebar({
  totalPackages,
  totalEnquiries,
  onNewPackage,
  currentPackage,
}) {
  return (
    <div className="flex h-full flex-col bg-[#f6f6f7]">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-[#f6f6f7] p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">ITA Global</h2>
          <p className="text-xs text-gray-500">Tour Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto bg-[#f6f6f7] p-4">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Main
        </p>

        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink
          to="/app/packages"
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M6 7h12l1 13H5L6 7z" />
            <path d="M9 7a3 3 0 016 0" />
          </svg>
          <span className="flex-1">All packages</span>
          {typeof totalPackages === "number" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {totalPackages}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/app/enquiries"
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="flex-1">All enquiries</span>
          {typeof totalEnquiries === "number" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {totalEnquiries}
            </span>
          )}
        </NavLink>

        <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Manage
        </p>

        {currentPackage && (
          <NavLink
            to={`/app/package/${currentPackage.id}`}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 flex-shrink-0"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="truncate">{currentPackage.title}</span>
          </NavLink>
        )}

        <button
          type="button"
          onClick={onNewPackage}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New package
        </button>
        
      </nav>

      <div className="border-t border-gray-200 bg-[#f6f6f7] p-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
          </svg>
          Pavan Bhandari
        </div>
      </div>
    </div>
  );
}
