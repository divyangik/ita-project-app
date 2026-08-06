export default function DashboardLayout({ sidebar, header, children }) {
  return (
    <div className="flex min-h-screen bg-[#f6f6f7]">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-[#f6f6f7]">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f6f6f7]">
        <header className="border-b border-gray-200 bg-[#f6f6f7]">
          {header}
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden bg-[#f6f6f7] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}