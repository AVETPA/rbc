import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Stocktake() {
  const [products, setProducts] = useState([]);
  const [stocktakeDate, setStocktakeDate] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, subcategory, cartons, singles")
        .order("category")
        .order("subcategory")
        .order("name");

      if (error) console.error("Error fetching products:", error);
      else setProducts(data);
    };

    fetchProducts();
  }, []);

  const updateQty = (productId, field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, [field]: Number(value) } : p
      )
    );
  };

  const getTotal = (product) => product.cartons * 24 + product.singles;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Redlands Boat Club", 14, 20);
    doc.setFontSize(14);
    doc.text(`Stocktake Report – ${stocktakeDate}`, 14, 30);

    const grouped = {};
    products.forEach((p) => {
      const key = `${p.category} - ${p.subcategory || "Uncategorised"}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    let y = 40;
    Object.entries(grouped).forEach(([group, items]) => {
      autoTable(doc, {
        startY: y,
        head: [["Product", "Cartons", "Singles", "Total"]],
        body: items.map((prod) => [
          prod.name,
          prod.cartons,
          prod.singles,
          getTotal(prod),
        ]),
        theme: "striped",
        headStyles: { fillColor: [10, 10, 35] },
        margin: { top: 10, left: 14, right: 14 },
        didDrawPage: (data) => {
          doc.setFontSize(12);
          doc.text(group, 14, data.settings.startY - 6);
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    });

    doc.setFontSize(10);
    doc.text(
      "CONFIDENTIAL – INTERNAL USE ONLY – REDLANDS BOAT CLUB",
      14,
      doc.internal.pageSize.height - 10
    );

    doc.save(`Stocktake_${stocktakeDate}.pdf`);
  };

  const handleSave = async () => {
    for (const p of products) {
      await supabase
        .from("products")
        .update({ cartons: p.cartons, singles: p.singles })
        .eq("id", p.id);
    }
    generatePDF();
  };

  const groupedProducts = products.reduce((acc, p) => {
    const key = `${p.category} > ${p.subcategory || "Uncategorised"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

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

        {Object.entries(groupedProducts).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{group}</h2>
            <table className="w-full text-left border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Product</th>
                  <th className="p-2">Cartons</th>
                  <th className="p-2">Singles</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((prod) => (
                  <tr key={prod.id} className="border-t">
                    <td className="p-2 font-medium">{prod.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-20 border rounded p-1"
                        value={prod.cartons}
                        onChange={(e) => updateQty(prod.id, "cartons", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-20 border rounded p-1"
                        value={prod.singles}
                        onChange={(e) => updateQty(prod.id, "singles", e.target.value)}
                      />
                    </td>
                    <td className="p-2">{getTotal(prod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <Button onClick={handleSave} className="mt-4 w-full">
          Save Full Report
        </Button>
      </div>
    </div>
  );
}
