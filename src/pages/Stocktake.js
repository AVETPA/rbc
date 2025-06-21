import React, { useState } from "react";
import { Button } from "../components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const mockData = [
  {
    category: "Spirits",
    products: [
      { name: "Vodka", cartons: 1, singles: 4 },
      { name: "Gin", cartons: 0, singles: 10 },
    ],
  },
  {
    category: "Beers",
    products: [
      { name: "Lager", cartons: 2, singles: 6 },
      { name: "Stout", cartons: 1, singles: 2 },
    ],
  },
];

export default function Stocktake() {
  const [data, setData] = useState(mockData);
  const [stocktakeDate, setStocktakeDate] = useState("");

  const updateQty = (catIndex, prodIndex, field, value) => {
    const updated = [...data];
    updated[catIndex].products[prodIndex][field] = Number(value);
    setData(updated);
  };

  const getTotal = (product) => {
    return product.cartons * 24 + product.singles;
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Redlands Boat Club", 14, 20);
    doc.setFontSize(14);
    doc.text(`Stocktake Report – ${stocktakeDate}`, 14, 30);

    data.forEach((cat, i) => {
      autoTable(doc, {
        startY: doc.autoTable.previous.finalY + (i === 0 ? 10 : 20),
        head: [["Product", "Cartons", "Singles", "Total"]],
        body: cat.products.map((prod) => [
          prod.name,
          prod.cartons,
          prod.singles,
          getTotal(prod),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [10, 10, 35] },
        margin: { top: 10, left: 14, right: 14 },
        didDrawPage: (data) => {
          if (data.pageCount === 1) {
            doc.text(cat.category, 14, data.settings.startY - 6);
          } else {
            doc.setFontSize(10);
            doc.text(cat.category, 14, 10);
          }
        }
      });
    });

    doc.setFontSize(10);
    doc.text("CONFIDENTIAL – INTERNAL USE ONLY – REDLANDS BOAT CLUB", 14, doc.internal.pageSize.height - 10);

    doc.save(`Stocktake_${stocktakeDate}.pdf`);
  };

  const handleSave = () => {
    // TODO: Save to Supabase if needed
    generatePDF();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
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

        {data.map((cat, catIndex) => (
          <div key={cat.category} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{cat.category}</h2>
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
                {cat.products.map((prod, prodIndex) => (
                  <tr key={prod.name} className="border-t">
                    <td className="p-2 font-medium">{prod.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-20 border rounded p-1"
                        value={prod.cartons}
                        onChange={(e) =>
                          updateQty(catIndex, prodIndex, "cartons", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-20 border rounded p-1"
                        value={prod.singles}
                        onChange={(e) =>
                          updateQty(catIndex, prodIndex, "singles", e.target.value)
                        }
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
