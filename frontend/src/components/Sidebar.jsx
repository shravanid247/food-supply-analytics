import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, LayoutDashboard, TrendingUp, Bell, Settings, Wheat, History, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/map', label: 'Supply Chain Map', icon: Map },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alerts', label: 'Risk Alerts', icon: Bell },
    { path: '/predictions', label: 'Predictions', icon: TrendingUp },
    ...(isAuthenticated ? [
      { path: '/history', label: 'My History', icon: History },
      { path: '/admin', label: 'Admin Panel', icon: Settings },
    ] : []),
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <Wheat size={24} color="var(--accent-cyan)" />
        </div>
        <div className="logo-text">
          <span className="title">FOOD SUPPLY CHAIN</span>
          <span className="subtitle">DISRUPTION ANALYZER</span>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path + item.label}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--panel-border)' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            <button className="nav-item" onClick={() => { logout(); navigate('/'); }} style={{ color: 'var(--risk-high)' }}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button className="nav-item" onClick={() => navigate('/login')}>
            <LogIn size={20} />
            <span>Login</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;