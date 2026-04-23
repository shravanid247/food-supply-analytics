import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import RiskAlerts from './pages/RiskAlerts';
import Predictions from './pages/Predictions';
import PredictionHistory from './pages/PredictionHistory';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
      Loading...
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('Cereals');
  const [searchedCountry, setSearchedCountry] = useState(null);

  const Layout = ({ children, showTopbar = true }) => (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {showTopbar && (
          <Topbar
            selectedCommodity={selectedCommodity}
            setSelectedCommodity={setSelectedCommodity}
            onCountrySelect={setSearchedCountry}
          />
        )}
        <div className="view-container">{children}</div>
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<Layout showTopbar={false}><Dashboard selectedYear={selectedYear} setSelectedYear={setSelectedYear} /></Layout>} />
      <Route path="/map" element={<Layout showTopbar={true}><MapView selectedYear={selectedYear} setSelectedYear={setSelectedYear} selectedCommodity={selectedCommodity} searchedCountry={searchedCountry} /></Layout>} />
      <Route path="/alerts" element={<Layout showTopbar={false}><RiskAlerts /></Layout>} />
      <Route path="/predictions" element={<Layout showTopbar={false}><Predictions /></Layout>} />
      <Route path="/history" element={<Layout showTopbar={false}><ProtectedRoute><PredictionHistory /></ProtectedRoute></Layout>} />
      <Route path="/admin" element={<Layout showTopbar={false}><ProtectedRoute><AdminPanel /></ProtectedRoute></Layout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;