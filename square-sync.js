import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// === Square Sandbox Credentials ===
const SQUARE_ACCESS_TOKEN = 'EAAAl70J-b19JPgXnbdwbui-WzLIyDqzYQsDQ_SlC8tHJlxclKmbADUZrGQbq5vn'
const SQUARE_API_BASE = 'https://connect.squareupsandbox.com'
const SQUARE_LOCATION_ID = 'LYBH8VD3MRATJ'

// === Supabase Credentials ===
const SUPABASE_URL = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTcwNiwiZXhwIjoyMDY1MjU1NzA2fQ.AHs3ZNIx9nAW429Uq_P3SwuVKzEQJptLUz1slhKMZXk' // truncated for safety
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fetchSquareCatalog() {
  const res = await fetch(`${SQUARE_API_BASE}/v2/catalog/list?types=ITEM,ITEM_VARIATION&include_deleted=true`, {
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
  if (data.errors) {
    console.error('Error fetching catalog:', data.errors)
    return []
  }
  return data.objects || []
}

async function fetchSquareInventory(variationIds) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/inventory/batch-retrieve-counts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      catalog_object_ids: variationIds,
      location_ids: [SQUARE_LOCATION_ID]
    })
  })

  const data = await res.json()
  if (data.errors) {
    console.error('Error fetching inventory:', data.errors)
    return {}
  }

  const inventoryMap = {}
  for (const count of data.counts || []) {
    if (count.state === 'IN_STOCK') {
      inventoryMap[count.catalog_object_id] = parseFloat(count.quantity)
    }
  }

  return inventoryMap
}

function generateVariationName(variation, productName) {
  if (!variation || !variation.item_variation_data) return productName
  const name = variation.item_variation_data.name
  return name && name !== 'Regular' ? `${productName} – ${name}` : productName
}

async function syncSquareToSupabase() {
  const catalog = await fetchSquareCatalog()
  const items = catalog.filter(obj => obj.type === 'ITEM')
  const variations = catalog.filter(obj => obj.type === 'ITEM_VARIATION')

  const variationIds = variations.map(v => v.id)
  const inventoryMap = await fetchSquareInventory(variationIds)

  for (const item of items) {
    const parentName = item.item_data?.name
    const itemId = item.id
    const itemCategory = item.item_data?.category_id || null

    for (const variationRef of item.item_data?.variations || []) {
      const variationObj = variations.find(v => v.id === variationRef.id)

      if (!variationObj) {
        console.warn(`⚠ Variation object not found for ID: ${variationRef.id}`)
        continue
      }

      const sku = variationObj.item_variation_data?.sku || ''
      const variationName = generateVariationName(variationObj, parentName)
      const quantity = inventoryMap[variationRef.id] ?? 0

      const upsertData = {
        name: variationName,
        sku,
        square_variation_id: variationRef.id,
        quantity_available: quantity
      }

      const { error } = await supabase.from('products').upsert(upsertData, {
        onConflict: ['square_variation_id']
      })

      if (error) {
        console.error(`❌ Failed to update ${variationName}:`, error.message)
      } else {
        console.log(`✅ Updated Supabase: ${variationName} – Qty: ${quantity}`)
      }
    }
  }
}

async function createSquareItem(product) {
  const res = await fetch(`${SQUARE_API_BASE}/v2/catalog/object`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idempotency_key: product.id,
      object: {
        type: 'ITEM',
        id: `#${product.id}`,
        item_data: {
          name: product.name,
          description: product.internal_code || '',
          variations: [
            {
              id: `#${product.id}-var`,
              type: 'ITEM_VARIATION',
              item_variation_data: {
                name: 'Default',
                pricing_type: 'FIXED_PRICING',
                price_money: {
                  amount: Math.round((product.cost || 0) * 100),
                  currency: 'AUD'
                },
                sku: product.sku,
                track_inventory: true
              }
            }
          ]
        }
      }
    })
  })

  const data = await res.json()
  if (data.errors) {
    console.error(`❌ Error creating Square item for ${product.name}:`, data.errors)
  } else {
    console.log(`✅ Created Square item: ${product.name}`)
  }
}

async function reverseSyncSupabaseToSquare() {
  const squareCatalog = await fetchSquareCatalog()
  const existingSKUs = squareCatalog
    .flatMap(obj => obj.item_data?.variations || [])
    .map(variation => variation.item_variation_data?.sku)

  const { data: products, error } = await supabase.from('products').select('*')
  if (error) return console.error('Error loading products from Supabase:', error)

  for (const product of products) {
    if (!existingSKUs.includes(product.sku)) {
      await createSquareItem(product)
    } else {
      console.log(`✔ Square already has item with SKU: ${product.sku}`)
    }
  }
}

// === Run the sync ===
syncSquareToSupabase()
  .then(() => reverseSyncSupabaseToSquare())
  .then(() => console.log('✅ Full sync complete.'))
  .catch(console.error)
