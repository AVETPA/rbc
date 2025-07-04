// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard.js';
import Inventory from './pages/Inventory.js';
import Products from './pages/Products.js';
import ProductDetail from './pages/ProductDetail.jsx';
import Purchases from './pages/Purchases.jsx';
import SalesReport from './pages/SalesReport.jsx';
import Reports from './pages/Reports.js';
import Stocktake from './pages/Stocktake.js';
import Downloads from './pages/Downloads.js';
import SyncSquare from './pages/SyncSquare.js';
import Login from './Login.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import BarReportForm from './components/BarReportForm';

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
        <nav style={{ marginBottom: '2rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Dashboard</Link>
          <Link to="/inventory" style={{ marginRight: '1rem' }}>Inventory</Link>
          <Link to="/products" style={{ marginRight: '1rem' }}>Products</Link>
          <Link to="/reports" style={{ marginRight: '1rem' }}>Reports</Link>
          <Link to="/stocktake" style={{ marginRight: '1rem' }}>Stocktake</Link>
          <Link to="/downloads" style={{ marginRight: '1rem' }}>Downloads</Link>
          <Link to="/sync" style={{ marginRight: '1rem' }}>Sync Square</Link>
        </nav>

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-detail"
            element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <Purchases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-report"
            element={
              <ProtectedRoute>
                <SalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocktake"
            element={
              <ProtectedRoute>
                <Stocktake />
              </ProtectedRoute>
            }
          />
          <Route
            path="/downloads"
            element={
              <ProtectedRoute>
                <Downloads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sync"
            element={
              <ProtectedRoute>
                <SyncSquare />
              </ProtectedRoute>
            }
          />
          <Route path="/bar-report" element={<BarReportForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
