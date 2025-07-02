import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { Button } from "../components/ui/Button.jsx";
import { generateStocktakeReport } from "../utils/reports/generateStocktakeReport.js";

export default function Stocktake() {
  const [products, setProducts] = useState([]);
  const [stocktakeDate, setStocktakeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [completedBy, setCompletedBy] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          cartons,
          singles,
          bar,
          size,
          cost_price,
          categories ( name ),
          subcategories ( name )
        `)
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        // Flatten the joined category/subcategory names
        const flat = data.map((p) => ({
          ...p,
          category: p.categories?.name || "Uncategorised",
          subcategory: p.subcategories?.name || "",
        }));
        setProducts(flat);
      }
    };

    fetchProducts();
  }, []);

  const updateQty = (productId, field, value) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: Number(value) } : p))
    );
  };

  const getTotal = (product) => {
    const size = product.size || 24;
    return (product.cartons || 0) * size + (product.singles || 0) + (product.bar || 0);
  };

  const getValue = (product) => {
    return ((product.cost_price || 0) * getTotal(product)).toFixed(2);
  };

  const handleSave = async () => {
    for (const p of products) {
      await supabase
        .from("products")
        .update({ cartons: p.cartons, singles: p.singles, bar: p.bar })
        .eq("id", p.id);
    }

    const stockEntries = products.map((p) => ({
      name: p.name,
      coolroom_cartons: p.cartons || 0,
      coolroom_singles: p.singles || 0,
      bar_fridge: p.bar || 0,
      total_quantity: getTotal(p),
      value: getValue(p),
    }));

    const totalValue = stockEntries.reduce((sum, p) => sum + parseFloat(p.value), 0);

    const reportUrl = await generateStocktakeReport(
      {
        stockEntries,
        totalValue,
        notes: [],
      },
      completedBy,
      new Date(stocktakeDate).toLocaleString("en-AU", { month: "long", year: "numeric" })
    );

    alert(`Stocktake report saved and uploaded:\n${reportUrl}`);
  };

  const groupedProducts = products.reduce((acc, p) => {
    const key = p.category || "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const grandTotalValue = products.reduce(
    (sum, p) => sum + (p.cost_price || 0) * getTotal(p),
    0
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Monthly Stocktake</h1>

        <label className="block mb-4">
          <span className="font-semibold">Stocktake Date:</span>
          <input
            type="date"
            value={stocktakeDate}
            onChange={(e) => setStocktakeDate(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </label>

        <label className="block mb-6">
          <span className="font-semibold">Completed by:</span>
          <input
            type="text"
            value={completedBy}
            onChange={(e) => setCompletedBy(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            placeholder="Enter your name"
          />
        </label>

        {Object.entries(groupedProducts).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{group}</h2>
            <table className="w-full table-fixed text-left border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="w-1/4 p-2">Product</th>
                  <th className="w-1/12 p-2">Carton Size</th>
                  <th className="w-1/12 p-2">Coolroom Carton</th>
                  <th className="w-1/12 p-2">Coolroom Single</th>
                  <th className="w-1/12 p-2">Bar</th>
                  <th className="w-1/12 p-2">Total</th>
                  <th className="w-1/12 p-2">Value ($)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((prod) => (
                  <tr key={prod.id} className="border-t">
                    <td className="p-2 font-medium">{prod.name}</td>
                    <td className="p-2">{prod.size || 24}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full border rounded p-1"
                        value={prod.cartons || 0}
                        onChange={(e) => updateQty(prod.id, "cartons", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full border rounded p-1"
                        value={prod.singles || 0}
                        onChange={(e) => updateQty(prod.id, "singles", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full border rounded p-1"
                        value={prod.bar || 0}
                        onChange={(e) => updateQty(prod.id, "bar", e.target.value)}
                      />
                    </td>
                    <td className="p-2">{getTotal(prod)}</td>
                    <td className="p-2">{getValue(prod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-2 font-semibold">
              Subtotal Value for {group}: $
              {items.reduce((sum, prod) => {
                return sum + (prod.cost_price || 0) * getTotal(prod);
              }, 0).toFixed(2)}
            </div>
          </div>
        ))}

        <div className="text-right text-lg font-bold mt-8">
          Grand Total Value: ${grandTotalValue.toFixed(2)}
        </div>

        <Button onClick={handleSave} className="mt-6 w-full">
          Save Full Report
        </Button>
      </div>
    </div>
  );
}
