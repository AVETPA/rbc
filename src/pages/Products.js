import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

function Products() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*')
    if (error) console.error(error)
    else setProducts(data)
  }

  const handleEdit = (product) => {
    setEditing(product.id)
    setForm(product)
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const { error } = await supabase.from('products').update(form).eq('id', editing)
    if (error) alert('Update failed: ' + error.message)
    else {
      alert('Product updated!')
      setEditing(null)
      fetchProducts()
    }
  }

  const handleImageUpload = async (event, productId) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      const filePath = `${productId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }))
      alert('Image uploaded successfully.')
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSyncToSquare = async () => {
    const res = await fetch('/square-sync.js') // This assumes the sync logic is callable
    alert('Sync triggered. Check logs for result.')
  }

  return (
    <div>
      <h1>🧾 Product List</h1>
      <button onClick={handleSyncToSquare} style={{ marginBottom: '1rem' }}>🔁 Sync All to Square</button>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Unit Type</th>
            <th>ML</th>
            <th>Units/Carton</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Internal Code</th>
            <th>Usage Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const isEditing = editing === product.id
            const current = isEditing ? form : product
            return (
              <tr key={product.id}>
                <td>
                  {current.image_url ? (
                    <img src={current.image_url} alt="" width="50" />
                  ) : (
                    'No image'
                  )}
                  {isEditing && (
                    <input type="file" onChange={(e) => handleImageUpload(e, product.id)} />
                  )}
                </td>
                {isEditing ? (
                  <>
                    <td><input value={form.name || ''} onChange={e => handleChange('name', e.target.value)} /></td>
                    <td><input value={form.sku || ''} onChange={e => handleChange('sku', e.target.value)} /></td>
                    <td><input value={form.unit_type || ''} onChange={e => handleChange('unit_type', e.target.value)} /></td>
                    <td><input value={form.ml_per_unit || ''} onChange={e => handleChange('ml_per_unit', e.target.value)} /></td>
                    <td><input value={form.units_per_carton || ''} onChange={e => handleChange('units_per_carton', e.target.value)} /></td>
                    <td><input value={form.category || ''} onChange={e => handleChange('category', e.target.value)} /></td>
                    <td><input type="number"value={form.quantity_available ?? ''}onChange={e => handleChange('quantity_available', e.target.value)} /></td>
                    <td><input value={form.internal_code || ''} onChange={e => handleChange('internal_code', e.target.value)} /></td>
                    <td><input value={form.usage_type || ''} onChange={e => handleChange('usage_type', e.target.value)} /></td>
                    <td>
                      <button onClick={handleSave}>💾 Save</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.unit_type}</td>
                    <td>{product.ml_per_unit}</td>
                    <td>{product.units_per_carton}</td>
                    <td>{product.category}</td>
                    <td>{product.quantity_available ?? 'N/A'}</td>
                    <td>{product.internal_code}</td>
                    <td>{product.usage_type}</td>
                    <td><button onClick={() => handleEdit(product)}>✏️ Edit</button></td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Products
