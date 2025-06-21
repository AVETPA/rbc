import React from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a23] text-white">
      <header className="flex items-center justify-between px-6 py-4 bg-[#0a0a23] border-b border-gray-700">
        <div className="flex items-center gap-4">
          <img
            src="/rbc_logo_clean.png"
            alt="RBC Logo"
            className="w-16 h-16"
          />
          <h1 className="text-2xl font-bold">Redlands Boat Club Inventory</h1>
        </div>
        <nav className="flex gap-6 text-gray-300">
          <a href="#" className="hover:text-white">Stocktake</a>
          <a href="#" className="hover:text-white">Profit & Loss</a>
          <a href="#" className="hover:text-white">History</a>
        </nav>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white text-black rounded-2xl p-6 shadow">
            <h2 className="text-xl font-bold mb-2">Live Stock Levels</h2>
            <p>View current inventory across all locations.</p>
          </div>

          <div className="bg-white text-black rounded-2xl p-6 shadow">
            <h2 className="text-xl font-bold mb-2">Run Stocktake</h2>
            <p>Enter new stocktake data and generate reports.</p>
          </div>

          <div className="bg-white text-black rounded-2xl p-6 shadow">
            <h2 className="text-xl font-bold mb-2">Profit & Loss</h2>
            <p>Track sales vs stock usage with financial insights.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
