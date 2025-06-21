import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Inventory from './pages/Inventory.js'
import Products from './pages/Products.js'
import Reports from './pages/Reports.js'
import Stocktake from './pages/Stocktake.js'
import Downloads from './pages/Downloads.js'
import SyncSquare from './pages/SyncSquare.js'

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
        <nav style={{ marginBottom: '2rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Inventory</Link>
          <Link to="/products" style={{ marginRight: '1rem' }}>Products</Link>
          <Link to="/reports" style={{ marginRight: '1rem' }}>Reports</Link>
          <Link to="/stocktake" style={{ marginRight: '1rem' }}>Stocktake</Link>
          <Link to="/downloads" style={{ marginRight: '1rem' }}>Downloads</Link>
          <Link to="/sync">Sync Square</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/stocktake" element={<Stocktake />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/sync" element={<SyncSquare />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
