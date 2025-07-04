import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { useSearchParams } from "react-router-dom";

export default function ProductEditor() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    category_id: "",
    category_name: "",
    subcategory_id: "",
    subcategory_name: "",
    cost_price: "",
    size: "",
  });

  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");

  useEffect(() => {
    const fetchInitial = async () => {
      const [{ data: cats }, { data: subs }, { data: product }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("subcategories").select("*").order("name"),
        productId
          ? supabase.from("products").select("*").eq("id", productId).single()
          : Promise.resolve({ data: null }),
      ]);

      setCategories(cats || []);
      setSubcategories(subs || []);

      if (product) {
        setFormData(product);
        setFilteredSubcategories(
          subs.filter((s) => s.category_id === product.category_id)
        );
      }
    };

    fetchInitial();
  }, [productId]);

  const handleChange = (field, value) => {
    let updates = { [field]: value };

    if (field === "category_id") {
      const selectedCategory = categories.find((c) => c.id === value);
      updates.category_name = selectedCategory?.name || "";
      updates.subcategory_id = "";
      updates.subcategory_name = "";
      setFilteredSubcategories(
        subcategories.filter((s) => s.category_id === value)
      );
    }

    if (field === "subcategory_id") {
      const selectedSub = subcategories.find((s) => s.id === value);
      updates.subcategory_name = selectedSub?.name || "";
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    const fieldsToSave = {
      name: formData.name,
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id,
      category_name: formData.category_name,
      subcategory_name: formData.subcategory_name,
      cost_price: Number(formData.cost_price),
      size: Number(formData.size),
    };

    let result;
    if (formData.id) {
      result = await supabase.from("products").update(fieldsToSave).eq("id", formData.id);
    } else {
      result = await supabase.from("products").insert(fieldsToSave);
    }

    if (result.error) {
      alert("Failed to save: " + result.error.message);
    } else {
      alert("Product saved successfully.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Edit Product</h2>

      <label className="block mb-2 font-medium">Name</label>
      <input
        type="text"
        className="border p-2 rounded w-full mb-4"
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <label className="block mb-2 font-medium">Category</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={formData.category_id}
        onChange={(e) => handleChange("category_id", e.target.value)}
      >
        <option value="">Select a category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <label className="block mb-2 font-medium">Subcategory</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={formData.subcategory_id}
        onChange={(e) => handleChange("subcategory_id", e.target.value)}
        disabled={!formData.category_id}
      >
        <option value="">Select a subcategory</option>
        {filteredSubcategories.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.name}
          </option>
        ))}
      </select>

      <label className="block mb-2 font-medium">Cost Price ($)</label>
      <input
        type="number"
        className="border p-2 rounded w-full mb-4"
        value={formData.cost_price}
        onChange={(e) => handleChange("cost_price", e.target.value)}
      />

      <label className="block mb-2 font-medium">Carton Size (units)</label>
      <input
        type="number"
        className="border p-2 rounded w-full mb-4"
        value={formData.size}
        onChange={(e) => handleChange("size", e.target.value)}
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Product
      </button>
    </div>
  );
}