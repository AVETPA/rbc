// src/pages/SyncSquare.jsx
import React from 'react'
import { supabase } from '../supabaseClient.js'
function SyncSquare() {
  const handleSync = async () => {
    const res = await fetch('/square-sync.js')
    alert('Manual Square sync triggered. Check logs for output.')
  }

  return (
    <div>
      <h1>🔄 Manual Square Sync</h1>
      <p>Use this button to manually trigger Square catalog + sales sync with Supabase.</p>
      <button onClick={handleSync}>🔁 Sync Now</button>
    </div>
  )
}

export default SyncSquare
