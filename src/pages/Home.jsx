import React from "react";
import { Button } from "../components/ui/button.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="bg-blue-950 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Redlands Boat Club Bar Inventory</h1>
        <p className="text-lg md:text-2xl max-w-2xl mx-auto mb-8">
          Simplify your bar stocktaking, sales tracking, and monthly reporting — all in one place.
        </p>
        <Button className="text-lg px-8 py-4">Launch Dashboard</Button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-2">Live Inventory</h3>
            <p>Track products across the coolroom, fridge, and bar with auto-sync from Square.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-2">Stocktake Reports</h3>
            <p>Editable stocktake interface with auto totals, PDF generation, and historical archive.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-2">Profit & Loss</h3>
            <p>Monthly P&L calculation based on purchases, stock levels, and Square sales data.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">How It Works</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            "Add & Sync Products",
            "Perform Monthly Stocktake",
            "Enter Purchases",
            "Generate Reports",
          ].map((step, i) => (
            <div key={i} className="p-4">
              <div className="text-4xl font-bold text-blue-700 mb-2">{i + 1}</div>
              <p className="text-lg font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-blue-950 text-white text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Ready to simplify your bar management?</h2>
        <Button className="text-lg px-8 py-4">Launch Dashboard</Button>
        <p className="mt-4 text-sm text-gray-300">© 2025 Redlands Boat Club</p>
      </footer>
    </div>
  );
}
