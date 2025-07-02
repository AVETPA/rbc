import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// === CONFIG ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com' // or live endpoint

const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTcwNiwiZXhwIjoyMDY1MjU1NzA2fQ.AHs3ZNIx9nAW429Uq_P3SwuVKzEQJptLUz1slhKMZXk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// === Fetch Square Inventory Count for a Variation
async function fetchSquareInventory(variation_id) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/inventory/count/${variation_id}`, {
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();

  if (data.errors) {
    console.error(`❌ Error for ${variation_id}:`, data.errors);
    return null;
  }

  const countEntry = data.counts?.find(c => c.state === 'IN_STOCK');
  return countEntry ? parseInt(countEntry.quantity, 10) : null;
}

// === Main Sync Logic
async function syncInventoryQuantities() {
  const { data: variations, error } = await supabase
    .from('product_variations')
    .select('id, product_id, name, variation_id');

  if (error) {
    console.error('❌ Supabase fetch error:', error);
    return;
  }

  const updates = [];

  for (const variation of variations) {
    const { variation_id, product_id } = variation;
    if (!variation_id) continue;

    const quantity = await fetchSquareInventory(variation_id);
    if (quantity === null || isNaN(quantity)) continue;

    // Add to updates array (can batch this later)
    updates.push({
      product_id,
      location: 'Default', // or 'Bar', 'Coolroom', etc.
      quantity_ml: null,
      quantity_bottles: null,
      last_updated: new Date().toISOString()
    });

    console.log(`✅ Fetched ${quantity} for ${variation.name}`);
  }

  // Optional: Wipe & replace all current inventory
  await supabase.from('inventory').delete().neq('id', '');

  const { error: insertError } = await supabase.from('inventory').insert(updates);

  if (insertError) {
    console.error('❌ Insert error:', insertError);
  } else {
    console.log(`✅ Inventory updated for ${updates.length} items.`);
  }
}

syncInventoryQuantities();
