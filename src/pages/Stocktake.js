import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function Stocktake() {
  const [products, setProducts] = useState([]);
  const [stocktakeDate, setStocktakeDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [completedBy, setCompletedBy] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, carton, singles, bar, size, cost_price,
          category_name, subcategory_name
        `)
        .order("name");

      if (error) {
        console.error("❌ Error fetching products:", error);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  const updateQty = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: Number(value) } : p))
    );
  };

  const getTotal = (p) => {
    const cartonSize = parseInt(p.size) || 24;
    return (p.carton || 0) * cartonSize + (p.singles || 0) + (p.bar || 0);
  };

  const getValue = (p) => {
    return ((p.cost_price || 0) * getTotal(p)).toFixed(2);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monthly Stocktake</h1>

      <div className="mb-4">
        <label className="block font-semibold">Stocktake Date</label>
        <input
          type="date"
          value={stocktakeDate}
          onChange={(e) => setStocktakeDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="mb-6">
        <label className="block font-semibold">Completed By</label>
        <input
          type="text"
          value={completedBy}
          onChange={(e) => setCompletedBy(e.target.value)}
          placeholder="Enter your name"
          className="border p-2 rounded w-full"
        />
      </div>

      <table className="w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Category</th>
            <th className="p-2">Subcategory</th>
            <th className="p-2">Size</th>
            <th className="p-2">Carton</th>
            <th className="p-2">Singles</th>
            <th className="p-2">Bar</th>
            <th className="p-2">Total</th>
            <th className="p-2">Value ($)</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.category_name || "—"}</td>
              <td className="p-2">{p.subcategory_name || "—"}</td>
              <td className="p-2">{p.size}</td>
              <td className="p-2">
                <input
                  type="number"
                  className="border p-1 rounded w-full"
                  value={p.carton || 0}
                  onChange={(e) => updateQty(p.id, "carton", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  className="border p-1 rounded w-full"
                  value={p.singles || 0}
                  onChange={(e) => updateQty(p.id, "singles", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  className="border p-1 rounded w-full"
                  value={p.bar || 0}
                  onChange={(e) => updateQty(p.id, "bar", e.target.value)}
                />
              </td>
              <td className="p-2">{getTotal(p)}</td>
              <td className="p-2">${getValue(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right font-bold mt-6">
        Grand Total Value: $
        {products.reduce((sum, p) => sum + parseFloat(getValue(p)), 0).toFixed(2)}
      </div>
    </div>
  );
}