// src/pages/Downloads.jsx
import React from 'react'
import { supabase } from '../supabaseClient.js'
function Downloads() {
  return (
    <div>
      <h1>📥 PDF & Print Tools</h1>
      <p>This page will offer options to download or print stocktake reports, product lists, and summary documents.</p>
      {/* Future: Button to generate PDF, print-friendly table view, export history */}
    </div>
  )
}

export default Downloads
