import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const Inventory = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase
  .from('product_variations')
  .select(`
    id,
    name,
    sku,
    size_ml,
    unit_type,
    track_inventory,
    product_id,
    products:products!product_variations_product_id_fkey (
      name
    ),
    inventory:inventory!fk_inventory_variation (
      quantity_ml,
      quantity_bottles,
      location
    )
  `);

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        return;
      }
console.log('🧪 Raw Supabase response:', data);
      const flattened = data.map(variation => {
        const inv = variation.inventory?.[0] || {};
        return {
          product_name: variation.products?.name ?? '—',
          variation_name: variation.variation_name ?? '—',
          sku: variation.sku || '—',
          size_ml: variation.size_ml ?? '—',
          unit_type: variation.unit_type || '—',
          track_inventory: variation.track_inventory ? '✅' : '❌',
          quantity_bottles: inv.quantity_bottles ?? 0,
          quantity_ml: inv.quantity_ml ?? 0,
          location: inv.location || '—'
        };
      });

      setRows(flattened);
    };

    fetchInventory();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Inventory Overview</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Variation</th>
              <th className="p-2 border">SKU</th>
              <th className="p-2 border">Size (ml)</th>
              <th className="p-2 border">Unit Type</th>
              <th className="p-2 border">Track?</th>
              <th className="p-2 border">Bottles</th>
              <th className="p-2 border">ML in Stock</th>
              <th className="p-2 border">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 border">{row.product_name}</td>
                <td className="p-2 border">{row.variation_name}</td>
                <td className="p-2 border">{row.sku}</td>
                <td className="p-2 border">{row.size_ml}</td>
                <td className="p-2 border">{row.unit_type}</td>
                <td className="p-2 border">{row.track_inventory}</td>
                <td className="p-2 border">{row.quantity_bottles}</td>
                <td className="p-2 border">{row.quantity_ml}</td>
                <td className="p-2 border">{row.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
