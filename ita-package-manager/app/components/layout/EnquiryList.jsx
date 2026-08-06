import { useFetcher } from "react-router";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ToggleCell({ enquiry }) {
  const fetcher = useFetcher();

  const optimistic = fetcher.formData
    ? fetcher.formData.get("lead_responded") === "true"
    : enquiry.lead_responded;

  function toggle() {
    fetcher.submit(
      {
        lead_responded: String(!optimistic),
      },
      {
        method: "post",
        action: `/app/enquiries/${enquiry.id}/respond`,
      },
    );
  }

  return (
    <button
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${
        optimistic ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
          optimistic ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function EnquiryList({ enquiries }) {
  const list = enquiries || [];
  const total = list.length;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customer Enquiries
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? "Enquiry" : "Enquiries"}
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Sr.
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Package
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Phone
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Message
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                Responded
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              list.map((e, idx) => (
                <tr
                  key={e.id}
                  className="transition duration-200 hover:bg-blue-50"
                >
                  <td className="px-3 py-4 align-top font-medium text-gray-500">
                    {total - idx}
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div className="truncate font-semibold text-gray-900">
                      {e.package_title || "-"}
                    </div>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div className="truncate font-semibold text-gray-900">
                      {e.name}
                    </div>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <a
                      href={`mailto:${e.email}`}
                      className="block truncate text-blue-600 hover:underline"
                      title={e.email}
                    >
                      {e.email}
                    </a>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <span className="inline-block truncate rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {e.phone}
                    </span>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div
                      className="truncate text-gray-600"
                      title={e.message || ""}
                    >
                      {e.message || "-"}
                    </div>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div className="flex items-center justify-center gap-2">
                      <ToggleCell enquiry={e} />
                      <span
                        className={`text-xs font-semibold ${
                          e.lead_responded ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {e.lead_responded ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-center align-top">
                    {e.responded_date ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        {formatDate(e.responded_date)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
