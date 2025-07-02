// square-to-supabase-normalized-sync.js
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// === Config ===
// === Square Sandbox Credentials ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com'

// === Supabase Credentials ===
const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTcwNiwiZXhwIjoyMDY1MjU1NzA2fQ.AHs3ZNIx9nAW429Uq_P3SwuVKzEQJptLUz1slhKMZXk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const LOCATION_ID = '31EHNHYRDFDDF';

// === Utility: Guess carton size from name ===
function guessSizeFromName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  const sizePatterns = [
    { regex: /24[\s\-]?pack|24pk|case[\s\-]?of[\s\-]?24/, size: 24 },
    { regex: /30[\s\-]?pack|30pk|case[\s\-]?of[\s\-]?30/, size: 30 },
    { regex: /20[\s\-]?pack|20pk/, size: 20 },
    { regex: /12[\s\-]?pack|12pk/, size: 12 },
    { regex: /10[\s\-]?pack|10pk/, size: 10 },
    { regex: /6[\s\-]?pack|6pk/, size: 6 },
    { regex: /4[\s\-]?pack|4pk/, size: 4 },
    { regex: /2[\s\-]?pack|2pk/, size: 2 },
    { regex: /single|solo|unit/, size: 1 }
  ];
  for (const pattern of sizePatterns) {
    if (pattern.regex.test(lower)) return pattern.size;
  }
  return null;
}

async function fetchSquareCatalog() {
  const res = await fetch(`${SQUARE_API_BASE}/v2/catalog/list?types=ITEM,CATEGORY,ITEM_VARIATION`, {
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (data.errors) {
    console.error('Square API error:', data.errors);
    return { items: [], variations: [], categories: [] };
  }
  return {
    items: data.objects.filter(obj => obj.type === 'ITEM'),
    variations: data.objects.filter(obj => obj.type === 'ITEM_VARIATION'),
    categories: data.objects.filter(obj => obj.type === 'CATEGORY')
  };
}

async function fetchSquareInventory(variationIds) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/inventory/batch-retrieve-counts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ catalog_object_ids: variationIds, location_ids: [LOCATION_ID] })
  });
  const data = await res.json();
  const result = {};
  for (const count of data.counts || []) {
    if (count.state === 'IN_STOCK') {
      result[count.catalog_object_id] = parseFloat(count.quantity);
    }
  }
  return result;
}

async function getOrCreateCategory(name) {
  if (!name) return null;
  const { data } = await supabase.from('categories').select('id').eq('name', name).single();
  if (data) return data.id;
  const insert = await supabase.from('categories').insert({ name }).select().single();
  return insert.data?.id || null;
}

async function getOrCreateSubcategory(category_id, name) {
  if (!name || !category_id) return null;
  const { data } = await supabase.from('subcategories')
    .select('id')
    .eq('name', name)
    .eq('category_id', category_id)
    .single();
  if (data) return data.id;
  const insert = await supabase.from('subcategories')
    .insert({ category_id, name })
    .select()
    .single();
  return insert.data?.id || null;
}

async function syncProducts() {
  const { items, variations, categories } = await fetchSquareCatalog();
  const variationMap = Object.fromEntries(variations.map(v => [v.id, v]));
  const variationIds = variations.map(v => v.id);
  const inventoryMap = await fetchSquareInventory(variationIds);

  for (const item of items) {
    const name = item.item_data?.name;
    const squareCategory = categories.find(c => c.id === item.item_data?.category_id);
    const category_id = await getOrCreateCategory(squareCategory?.category_data?.name);
    const subcategoryName = item.item_data?.description || null; // using description as subcategory
    const subcategory_id = await getOrCreateSubcategory(category_id, subcategoryName);

    const { data: product, error: productError } = await supabase.from('products')
      .insert({
        name,
        category: squareCategory?.category_data?.name || null,
        subcategory: subcategoryName,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (productError || !product) {
      console.error(`❌ Could not insert product: ${name}`, productError);
      continue;
    }

    const product_id = product.id;
    for (const variationRef of item.item_data?.variations || []) {
      const v = variationMap[variationRef.id];
if (!v || !v.item_variation_data) {
  console.warn(`⚠️ Skipping invalid variation for product ${name}:`, variationRef.id);
  continue;
}
const size = guessSizeFromName(v.item_variation_data.name || name);

      const quantity = inventoryMap[v.id] ?? 0;

      const result = await supabase.from('product_variations').upsert({
        id: v.id,
        product_id,
        name: v.item_variation_data?.name || 'Default',
        sku: v.item_variation_data?.sku || null,
        size_ml: null,
        price_cents: v.item_variation_data?.price_money?.amount || 0,
        unit_type: 'each',
        quantity_available: quantity,
        created_at: new Date().toISOString()
      });

      if (result.error) {
        console.error(`❌ Failed variation: ${v.id}`, result.error);
      } else {
        console.log(`✅ Synced ${name} – ${v.item_variation_data?.name}`);
      }
    }
  }
}

syncProducts();
