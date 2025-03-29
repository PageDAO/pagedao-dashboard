// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeTracking } from './services/api';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import TokenDetails from './pages/TokenDetails';
import TVLAnalytics from './pages/TVLAnalytics';
import NetworkComparison from './pages/NetworkComparison';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';

function App() {
  useEffect(() => {
    // Initialize contract tracking when app loads
    const setupTracking = async () => {
      try {
        await initializeTracking();
      } catch (error) {
        console.error('Failed to initialize contract tracking:', error);
      }
    };
    
    setupTracking();
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/token/:chain" element={<TokenDetails />} />
              <Route path="/networks" element={<NetworkComparison />} />
              <Route path="/tvl" element={<TVLAnalytics />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:address" element={<CollectionDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;