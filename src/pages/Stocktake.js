// src/pages/Stocktake.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function Stocktake() {
  const [products, setProducts] = useState([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [preparedBy, setPreparedBy] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*')
    if (error) console.error('Error loading products:', error)
    else {
      const enriched = data.map(p => ({
        ...p,
        cldrm_carton: 0,
        cldrm_single: 0,
        bar_single: 0,
      }))
      setProducts(enriched)
    }
  }

  const handleChange = (index, field, value) => {
    const updated = [...products]
    updated[index][field] = parseInt(value) || 0
    setProducts(updated)
  }

  const calculateTotal = (p) => {
    const cartons = parseInt(p.cldrm_carton) || 0
    const singles = parseInt(p.cldrm_single) || 0
    const bar = parseInt(p.bar_single) || 0
    const units = parseInt(p.units_per_carton) || 0
    return (cartons * units) + singles + bar
  }

  const saveFullStocktake = async () => {
    let discrepancyCount = 0
    const doc = new jsPDF()
    autoTable(doc, {
      head: [['Name', 'Cartons', 'Singles', 'Bar', 'Total', 'Prev Qty', 'Variance']],
      body: products.map(p => {
        const total = calculateTotal(p)
        const variance = total - (p.quantity_available || 0)
        if (variance !== 0) discrepancyCount++
        return [p.name, p.cldrm_carton, p.cldrm_single, p.bar_single, total, p.quantity_available ?? 0, variance]
      })
    })
    const filename = `Stocktake-${date}.pdf`
    doc.save(filename)

    // Update all product quantities
    for (const p of products) {
      const newQty = calculateTotal(p)
      await supabase.from('products').update({ quantity_available: newQty }).eq('id', p.id)
    }

    // Save metadata to stocktakes table
    const { error } = await supabase.from('stocktakes').insert({
      stocktake_date: date,
      prepared_by: preparedBy,
      total_discrepancies: discrepancyCount,
      pdf_url: filename // Optional: save only filename if using local download
    })

    if (error) alert('Failed to log stocktake')
    else alert('Stocktake saved and PDF downloaded.')
  }

  return (
    <div>
      <h1>📦 Stocktake</h1>
      <label>
        Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </label>
      <label style={{ marginLeft: '1rem' }}>
        Prepared by: <input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} />
      </label>
      <table border="1" cellPadding="6" style={{ marginTop: '1rem', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Cartons</th>
            <th>Singles</th>
            <th>Bar</th>
            <th>Total</th>
            <th>Current Qty</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const total = calculateTotal(p)
            const variance = total - (p.quantity_available || 0)
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><input type="number" value={p.cldrm_carton} onChange={e => handleChange(i, 'cldrm_carton', e.target.value)} /></td>
                <td><input type="number" value={p.cldrm_single} onChange={e => handleChange(i, 'cldrm_single', e.target.value)} /></td>
                <td><input type="number" value={p.bar_single} onChange={e => handleChange(i, 'bar_single', e.target.value)} /></td>
                <td>{total}</td>
                <td>{p.quantity_available ?? '—'}</td>
                <td style={{ color: variance !== 0 ? 'red' : 'black' }}>{variance}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button onClick={saveFullStocktake} style={{ marginTop: '1rem', padding: '8px 16px' }}>📥 Save Full Report</button>
    </div>
  )
}

export default Stocktake;
