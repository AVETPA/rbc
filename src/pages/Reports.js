// src/pages/Reports.jsx
import React from 'react'
import { supabase } from '../supabaseClient.js'
function Reports() {
  return (
    <div>
      <h1>📊 Reports</h1>
      <p>Here you'll be able to view and generate monthly stocktake reports, profit & loss summaries, and variance logs.</p>
      {/* Future: Add filter by date range, export buttons, charts */}
    </div>
  )
}

export default Reports
