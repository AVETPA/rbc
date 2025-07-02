import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// === Square Credentials ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com'

// === Supabase Credentials ===
const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// === Fetch stock from Square for a single variation ID ===
async function fetchSquareInventory(variation_id) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/inventory/count/${variation_id}`, {
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();

  if (data.errors) {
    console.error(`❌ Square error for ${variation_id}:`, data.errors);
    return null;
  }

  const countEntry = data.counts?.find(c => c.state === 'IN_STOCK');
  return countEntry ? parseInt(countEntry.quantity, 10) : null;
}

// === Sync Logic with UPSERT ===
async function syncInventoryQuantitiesWithUpsert() {
  const { data: products, error } = await supabase
    .from('products')
    .select('variation_id, name, sku, internal_code, cost, track_inventory');

  if (error) {
    console.error('❌ Supabase fetch error:', error);
    return;
  }

  let updatedCount = 0;
  let skipped = 0;
  let errors = 0;

  const transformed = [];

  for (const product of products) {
    if (!product.variation_id) {
      console.warn(`⚠️ Skipping ${product.name} — no variation_id`);
      skipped++;
      continue;
    }

    const quantity = await fetchSquareInventory(product.variation_id);
    if (quantity === null || isNaN(quantity)) {
      console.warn(`⚠️ No inventory found for ${product.name}`);
      skipped++;
      continue;
    }

    transformed.push({
      variation_id: product.variation_id,
      name: product.name,
      sku: product.sku,
      internal_code: product.internal_code,
      cost: product.cost,
      track_inventory: product.track_inventory,
      quantity // ✅ Set latest Square quantity
    });

    updatedCount++;
    await new Promise(resolve => setTimeout(resolve, 150)); // throttle
  }

  if (transformed.length === 0) {
    console.log('⚠ No items to upsert.');
    return;
  }

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(transformed, { onConflict: ['variation_id'] });

  if (upsertError) {
    console.error('❌ Supabase upsert error:', upsertError);
  } else {
    console.log(`✅ Upserted ${updatedCount} products based on Square inventory.`);
  }

  console.log(`\n🔍 Sync Summary:
  ✔ Updated from Square: ${updatedCount}
  ⚠ Skipped: ${skipped}
  ❌ Errors: ${errors}`);
}

syncInventoryQuantitiesWithUpsert();
