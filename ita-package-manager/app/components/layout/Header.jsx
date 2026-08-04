export default function Header({ shop, onNewPackage }) {
  return (
    <header className="flex items-center justify-between px-8 py-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <p className="text-sm text-gray-500">
          Overview of all tour packages and payment status
        </p>
      </div>

      <button
        onClick={onNewPackage}
        className=" cursor-pointer rounded-lg border border-gray-300 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
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
        New Package
      </button>
    </header>
  );
}
