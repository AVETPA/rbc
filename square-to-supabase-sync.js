// square-to-supabase-sync.js
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// === Square Sandbox Credentials ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com'

// === Supabase Credentials ===
const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTcwNiwiZXhwIjoyMDY1MjU1NzA2fQ.AHs3ZNIx9nAW429Uq_P3SwuVKzEQJptLUz1slhKMZXk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// === Fetch products from Square ===
async function fetchSquareCatalogItems() {
  const res = await fetch(`${SQUARE_API_BASE}/v2/catalog/list?types=ITEM`, {
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
  if (data.errors) {
    console.error('❌ Error fetching Square catalog:', data.errors)
    return []
  }
  return data.objects || []
}

// === Extract and transform for Supabase ===
function transformToSupabaseProducts(items) {
  return items.flatMap(item => {
    const itemName = item.item_data?.name
    const variations = item.item_data?.variations || []
    return variations.map(variation => {
      const variationData = variation.item_variation_data
      return {
        name: itemName,
        sku: variationData?.sku || '',
        internal_code: item.item_data?.description || '',
        cost: (variationData?.price_money?.amount || 0) / 100,
        track_inventory: variationData?.track_inventory || false
      }
    })
  })
}

// === Push to Supabase ===
async function syncSquareToSupabase() {
  const catalogItems = await fetchSquareCatalogItems()
  const transformed = transformToSupabaseProducts(catalogItems)

  if (transformed.length === 0) {
    console.log('⚠ No items to sync.')
    return
  }

  const { data, error } = await supabase.from('products').upsert(transformed, {
    onConflict: ['sku']
  })

  if (error) {
    console.error('❌ Supabase insert error:', error)
  } else {
    console.log(`✅ Synced ${transformed.length} products from Square to Supabase.`)
  }
}

syncSquareToSupabase()
