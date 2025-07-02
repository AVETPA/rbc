import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// === CONFIG ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com' // or live endpoint

const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTcwNiwiZXhwIjoyMDY1MjU1NzA2fQ.AHs3ZNIx9nAW429Uq_P3SwuVKzEQJptLUz1slhKMZXk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)


// === Category Parsing & Lookups ===
function parseCategoryLabel(label = '') {
  const parts = label.split(':').map(p => p.trim());
  return { category: parts[0] || null, subcategory: parts[1] || null };
}

async function getCategoryIds(label) {
  const { category, subcategory } = parseCategoryLabel(label);
  let category_id = null, subcategory_id = null;

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('name', category).maybeSingle();
    category_id = cat?.id || null;

    if (subcategory && category_id) {
      const { data: sub } = await supabase
        .from('subcategories')
        .select('id')
        .eq('name', subcategory)
        .eq('category_id', category_id)
        .maybeSingle();
      subcategory_id = sub?.id || null;
    }
  }

  return { category_id, subcategory_id };
}

// === Guess size in mL
function guessSizeFromName(name = '') {
  const lower = name.toLowerCase();
  const sizes = [
    { key: '1125ml', val: 1125 },
    { key: '750ml', val: 750 },
    { key: '700ml', val: 700 },
    { key: '375ml', val: 375 },
    { key: '355ml', val: 355 },
    { key: '335ml', val: 335 },
    { key: '330ml', val: 330 },
    { key: '250ml', val: 250 },
    { key: '187ml', val: 187 },
    { key: '100ml', val: 100 },
    { key: '60ml', val: 60 },
    { key: '30ml', val: 30 },
  ];

  for (const s of sizes) {
    if (lower.includes(s.key)) return s.val;
  }

  const match = lower.match(/(\d{2,4})\s?ml/);
  if (match) return parseInt(match[1]);
  return null;
}

// === Fetch Catalog
async function fetchCatalogItems() {
  const res = await fetch(`${SQUARE_API_BASE}/v2/catalog/list?types=ITEM`, {
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  if (data.errors) {
    console.error('❌ Catalog fetch error:', data.errors);
    return [];
  }

  return data.objects || [];
}

// === Fetch Inventory by variation_id
async function fetchSquareInventory(variation_id) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/inventory/count/${variation_id}`, {
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  if (data.errors) {
    console.warn(`⚠ Inventory not found for ${variation_id}:`, data.errors);
    return null;
  }

  const count = data.counts?.find(c => c.state === 'IN_STOCK');
  return count ? parseInt(count.quantity) : 0;
}

// === Main Sync Logic
async function syncCatalogToSupabase() {
  const items = await fetchCatalogItems();
  if (!items.length) {
    console.log('⚠ No catalog items found.');
    return;
  }

  for (const item of items) {
    const productName = item.item_data?.name;
    const description = item.item_data?.description || '';
    const variations = item.item_data?.variations || [];
    const categoryLabel = description || item.item_data?.category_id || '';

    const { category_id, subcategory_id } = await getCategoryIds(categoryLabel);

    // Insert/find product
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('name', productName)
      .maybeSingle();

    const product_id = existingProduct?.id || (
      await supabase
        .from('products')
        .insert([{ name: productName, internal_code: description, category_id, subcategory_id }])
        .select('id')
        .single()
    ).data.id;

    for (const variation of variations) {
      const v = variation.item_variation_data;

      const record = {
        id: variation.id,
        product_id,
        name: (v?.name?.trim() || productName).trim(),
        sku: v?.sku || null,
        size_ml: guessSizeFromName(v?.name),
        price_cents: v?.price_money?.amount || null,
        unit_type: 'each',
        track_inventory: v?.track_inventory ?? true
      };

      // Upsert variation
      await supabase.from('product_variations').upsert(record, { onConflict: ['id'] });

      // Fetch inventory
      const quantity = await fetchSquareInventory(variation.id);
      if (quantity !== null) {
        await supabase
          .from('inventory')
          .upsert({
            variation_id: variation.id,
            quantity_bottles: quantity,
            location: 'Default'
          }, { onConflict: ['variation_id', 'location'] });
      }

      console.log(`✅ Synced ${record.name} (${quantity ?? 'no qty'})`);
    }
  }

  console.log('🎉 Square catalog + inventory synced into Supabase.');
}

syncCatalogToSupabase();
