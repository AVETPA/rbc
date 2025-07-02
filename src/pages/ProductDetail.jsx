import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";



export default function ProductDetailModal({ productId, productName, open, onClose }) {
  const [variations, setVariations] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [newVariation, setNewVariation] = useState({
    size_id: "",
    size_label: "",
    cost_price: "",
    retail_price: "",
    sku: "",
    active: true
  });

  useEffect(() => {
    if (open) {
      fetchVariations();
      fetchSizes();
    }
  }, [open]);

  const fetchVariations = async () => {
    const { data, error } = await supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", productId);
    if (!error) setVariations(data);
  };

  const fetchSizes = async () => {
    const { data } = await supabase.from("sizes").select("id, label");
    setSizes(data || []);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = field === "active" ? value : value;
    setVariations(updated);
  };

  const handleSaveChange = async (index) => {
    const variation = variations[index];
    await supabase
      .from("product_variations")
      .update({
        size_id: variation.size_id,
        size_label: variation.size_label,
        cost_price: variation.cost_price,
        retail_price: variation.retail_price,
        sku: variation.sku,
        active: variation.active
      })
      .eq("id", variation.id);
    fetchVariations();
  };

  const handleAddVariation = async () => {
    await supabase.from("product_variations").insert({
      product_id: productId,
      ...newVariation
    });
    setNewVariation({ size_id: "", size_label: "", cost_price: "", retail_price: "", sku: "", active: true });
    fetchVariations();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-6 w-full max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Manage Variations for {productName}</h2>
        <table className="w-full text-left border mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Size Label</th>
              <th className="p-2">Cost Price</th>
              <th className="p-2">Retail Price</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Active</th>
              <th className="p-2">Save</th>
            </tr>
          </thead>
          <tbody>
            {variations.map((v, index) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">
                  <input
                    value={v.size_label || ""}
                    onChange={(e) => handleInputChange(index, "size_label", e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={v.cost_price || ""}
                    onChange={(e) => handleInputChange(index, "cost_price", e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={v.retail_price || ""}
                    onChange={(e) => handleInputChange(index, "retail_price", e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    value={v.sku || ""}
                    onChange={(e) => handleInputChange(index, "sku", e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </td>
                <td className="p-2 text-center">
                  <Switch
                    checked={v.active}
                    onCheckedChange={(val) => handleInputChange(index, "active", val)}
                  />
                </td>
                <td className="p-2">
                  <Button size="sm" onClick={() => handleSaveChange(index)}>Save</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Add New Variation</h3>
          <div className="grid grid-cols-6 gap-2 mb-4">
            <select
              className="border p-2 rounded col-span-2"
              value={newVariation.size_id}
              onChange={(e) => setNewVariation({ ...newVariation, size_id: e.target.value })}
            >
              <option value="">Select Size</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <input
              placeholder="Label"
              value={newVariation.size_label}
              onChange={(e) => setNewVariation({ ...newVariation, size_label: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Cost"
              value={newVariation.cost_price}
              onChange={(e) => setNewVariation({ ...newVariation, cost_price: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Retail"
              value={newVariation.retail_price}
              onChange={(e) => setNewVariation({ ...newVariation, retail_price: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              placeholder="SKU"
              value={newVariation.sku}
              onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Switch
              checked={newVariation.active}
              onCheckedChange={(val) => setNewVariation({ ...newVariation, active: val })}
            />
            <span>Active</span>
          </div>
          <Button onClick={handleAddVariation}>+ Add Variation</Button>
        </div>
      </div>
    </Dialog>
  );
} 
