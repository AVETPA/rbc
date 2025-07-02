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
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("product_variations").select("*").eq("product_id", productId),
        supabase.from("inventory").select("*").eq("product_id", productId),
        supabase.from("products").select("category"),
        supabase.from("products").select("subcategory")
      ]);

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
    try {
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: product.name ?? "",
          internal_code: product.internal_code ?? "",
          brand: product.brand ?? "",
          category: product.category ?? "",
          subcategory: product.subcategory ?? "",
          pack_type: product.pack_type ?? "",
          unit_type: product.unit_type ?? "",
          size: product.size ?? 0,
          ml_per_unit: product.ml_per_unit ?? 0,
          units_per_carton: product.units_per_carton ?? 0,
          cost_price: product.cost_price ?? 0
        })
        .eq("id", product.id);

      if (productError) {
        console.error("Product update error:", productError);
        alert("Failed to save product: " + productError.message);
        return;
      }

      for (const v of variations) {
        const payload = {
          name: v.name ?? "",
          sku: v.sku ?? "",
          size_ml: v.size_ml ?? 0,
          price_cents: v.price_cents ?? 0,
          unit_type: v.unit_type ?? "",
          track_inventory: !!v.track_inventory
        };

        if (v.is_new) {
          const { error: insertError } = await supabase
            .from("product_variations")
            .insert({
              ...payload,
              id: v.id,
              product_id: product.id
            });

          if (insertError) {
            console.error("Insert variation error:", insertError);
            alert("Failed to add variation: " + insertError.message);
          }
        } else {
          const { error: updateError } = await supabase
            .from("product_variations")
            .update(payload)
            .eq("id", v.id);

          if (updateError) {
            console.error("Update variation error:", updateError);
            alert("Failed to update variation: " + updateError.message);
          }
        }
      }

      alert("Product and variations saved successfully.");
      setShowModal(false);
    } catch (err) {
      console.error("Unhandled save error:", err);
      alert("Save failed: " + err.message);
    }
  };

  if (!showModal || !productId) return null;

  // The rendering and form layout remains unchanged...

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl">
        {/* ... unchanged modal rendering ... */}
        <div className="flex justify-between mt-6">
          <Button onClick={() => setShowModal(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save All Changes</Button>
        </div>
      </div>
    </div>
  );
}
