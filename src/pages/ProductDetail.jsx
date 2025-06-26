// ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { Button } from "../components/ui/button.jsx";
import { v4 as uuidv4 } from "uuid";

export default function ProductDetail() {
  const [params] = useSearchParams();
  const productId = params.get("id");
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [productRes, variationsRes, inventoryRes, categoryRes, subcategoryRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).maybeSingle(),
        supabase.from("product_variations").select("*").eq("product_id", productId),
        supabase.from("inventory").select("*").eq("product_id", productId),
        supabase.from("products").select("category"),
        supabase.from("products").select("subcategory")
      ]);

      console.log("✅ productRes:", productRes);
      console.log("✅ variationsRes:", variationsRes);
      console.log("✅ inventoryRes:", inventoryRes);

      if (!productRes?.data) {
        console.warn("⚠️ Product not found. productId:", productId);
      }

      setProduct(productRes.data);
      setVariations(variationsRes.data || []);
      setInventory(inventoryRes.data || []);
      setCategories([...new Set(categoryRes.data.map(d => d.category).filter(Boolean))]);
      setSubcategories([...new Set(subcategoryRes.data.map(d => d.subcategory).filter(Boolean))]);
      setLoading(false);
    };

    if (productId) fetchData();
  }, [productId]);

  const handleProductChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariationChange = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      {
        id: uuidv4(),
        product_id: product.id,
        name: "",
        sku: "",
        size_ml: 0,
        price_cents: 0,
        unit_type: "",
        track_inventory: false,
        is_new: true
      }
    ]);
  };

  const handleSave = async () => {
    // Save logic (unchanged)
    alert("Save logic called");
  };

  if (!showModal || !productId) return null;
if (error) {
  console.error('Update error:', error.message);
} else {
  console.log('Update success');
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl">
        <h2 className="text-xl font-bold mb-4">Edit Product Details</h2>
        {loading ? (
          <p>Loading...</p>
        ) : product ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["name", "internal_code", "brand", "pack_type", "unit_type", "size", "ml_per_unit", "units_per_carton", "cost_price"].map((field) => (
                <label key={field} className="block">
                  <span className="block font-semibold mb-1">{field.replace(/_/g, " ")}:</span>
                  <input
                    type="text"
                    value={product[field] ?? ""}
                    onChange={(e) => handleProductChange(field, e.target.value)}
                    className="w-full border rounded p-2"
                  />
                </label>
              ))}

              <label className="block">
                <span className="block font-semibold mb-1">Category:</span>
                <select
                  value={product.category || ""}
                  onChange={(e) => handleProductChange("category", e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block font-semibold mb-1">Subcategory:</span>
                <select
                  value={product.subcategory || ""}
                  onChange={(e) => handleProductChange("subcategory", e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select subcategory</option>
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-semibold">Variations</h3>
              <Button onClick={addVariation}>+ Add Variation</Button>
            </div>

            <pre className="text-xs bg-gray-100 p-2 overflow-x-auto">
              {JSON.stringify(product, null, 2)}
            </pre>

            <div className="flex justify-between mt-6">
              <Button onClick={() => setShowModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save All Changes</Button>
            </div>
          </>
        ) : (
          <p className="text-red-600">❌ Product not found or failed to load.</p>
        )}
      </div>
    </div>
  );
}
