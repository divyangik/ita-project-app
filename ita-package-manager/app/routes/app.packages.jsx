import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useMemo, useState, useEffect } from "react";

import { authenticate } from "../shopify.server";
import {
  getPackages,
  createPackage,
  deletePackage,
} from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import NewPackage from "../components/layout/Newpackage";
import PackagesTable, {
  normalizeStatus,
} from "../components/layout/PackagesTable";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let packages = [];
  try {
    packages = await getPackages(session.shop);
  } catch (err) {
    console.error("Failed to fetch packages:", err);
  }

  return { packages, totalPackages: packages.length };
}
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete-package") {
    await deletePackage(formData.get("package_id"), session.shop);
    return { deleted: true };
  }

  // Strip Shopify GID prefixes (e.g. "gid://shopify/Product/123" -> "123")
  // so stored IDs match what the storefront theme sends via {{ product.id }}
  const normalizeGid = (value) => {
    if (!value) return null;
    return value.includes("/") ? value.split("/").pop() : value;
  };

  const result = await createPackage(session.shop, {
    title: formData.get("title"),
    destination: formData.get("destination"),
    region: formData.get("region"),
    base_price: Number(formData.get("base_price")),
    payment_status: formData.get("payment_status"),
    duration: formData.get("duration"),
    status: formData.get("status"),
    shopify_product_id: normalizeGid(formData.get("shopify_product_id")),
    shopify_variant_id: normalizeGid(formData.get("shopify_variant_id")),
    shopify_collection_id: normalizeGid(formData.get("shopify_collection_id")),
  });

  return { success: true, newPackageId: result.package.id };
}
const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export default function PackagesPage() {
  const { packages, totalPackages } = useLoaderData();
  const navigate = useNavigate();

  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.newPackageId) {
      setOpen(false);
      navigate(`/app/package/${fetcher.data.newPackageId}`);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (deleteFetcher.data?.deleted) {
      window.location.reload();
    }
  }, [deleteFetcher.data]);

  function handleDelete(pkg) {
    if (!confirm(`Delete "${pkg.title}"? This can't be undone.`)) return;
    deleteFetcher.submit(
      { intent: "delete-package", package_id: pkg.id },
      { method: "post" },
    );
  }

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return packages.filter((pkg) => {
      const matchesTab =
        activeTab === "all" || normalizeStatus(pkg.status) === activeTab;

      const matchesSearch =
        !query ||
        pkg.title?.toLowerCase().includes(query) ||
        pkg.destination?.toLowerCase().includes(query) ||
        pkg.region?.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [packages, activeTab, search]);

  return (
    <>
      <DashboardLayout
        sidebar={
          <Sidebar
            totalPackages={totalPackages}
            onNewPackage={() => setOpen(true)}
          />
        }
        header={
          <div className="flex items-center justify-between px-8 py-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All packages</h1>
              <p className="text-sm text-gray-500">
                Manage and edit your tour products
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
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
          </div>
        }
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <PackagesTable packages={filteredPackages} onDelete={handleDelete} />
      </DashboardLayout>

      <NewPackage
        open={open}
        onClose={() => setOpen(false)}
        fetcher={fetcher}
      />
    </>
  );
}
