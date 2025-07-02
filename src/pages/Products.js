// Products.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { Link } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, subcategory, size, cost_price")
        .order("category")
        .order("subcategory")
        .order("name");

      if (error) console.error("Error fetching products:", error);
      else setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Product List</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Subcategory</th>
              <th className="py-2 px-4 text-left">Size</th>
              <th className="py-2 px-4 text-left">Cost Price</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="py-2 px-4">{product.name}</td>
                <td className="py-2 px-4">{product.category}</td>
                <td className="py-2 px-4">{product.subcategory}</td>
                <td className="py-2 px-4">{product.size}</td>
                <td className="py-2 px-4">${product.cost_price?.toFixed(2) || "0.00"}</td>
                <td className="py-2 px-4">
                  <Link to={`/product-detail?id=${product.id}`}>View / Edit</Link>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
