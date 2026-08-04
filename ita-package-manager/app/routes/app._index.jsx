import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect } from "react";

import { authenticate } from "../shopify.server";
import { getDashboard, createPackage, deletePackage } from "../lib/python.server";

import DashboardLayout from "../components/layout/DashboardLayout";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DashboardCards from "../components/layout/DashboardCards";
import RecentPackages from "../components/layout/RecentPackages";
import NewPackage from "../components/layout/NewPackage";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const dashboard = await getDashboard(session.shop);

  return {
    dashboard,
    shop: session.shop,
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete-package") {
    await deletePackage(formData.get("package_id"), session.shop);
    return { deleted: true };
  }

  const normalizeGid = (value) => {
    if (!value) return null;
    return value.includes("/") ? value.split("/").pop() : value;
  };

  const created = await createPackage(session.shop, {
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

  return { success: true, id: created.package?.id };
}

export default function Dashboard() {
  const { dashboard } = useLoaderData();
  const navigate = useNavigate();

  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (fetcher.data?.success) {
      setOpen(false);
      if (fetcher.data.id) {
        navigate(`/app/package/${fetcher.data.id}`);
      } else {
        window.location.reload();
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (deleteFetcher.data?.deleted) {
      window.location.reload();
    }
  }, [deleteFetcher.data]);

  function handleDelete(pkg) {
    if (!window.confirm(`Delete "${pkg.title}"? This cannot be undone.`)) {
      return;
    }
    deleteFetcher.submit(
      { intent: "delete-package", package_id: pkg.id },
      { method: "post" },
    );
  }

  return (
    <>
      <DashboardLayout
        sidebar={
          <Sidebar
            totalPackages={dashboard.totalPackages}
            onNewPackage={() => setOpen(true)}
          />
        }
        header={<Header onNewPackage={() => setOpen(true)} />}
      >
        <DashboardCards dashboard={dashboard} />
        <RecentPackages packages={dashboard.recentPackages} onDelete={handleDelete} />
      </DashboardLayout>

      <NewPackage
        open={open}
        onClose={() => setOpen(false)}
        fetcher={fetcher}
      />
    </>
  );
}