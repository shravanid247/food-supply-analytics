import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CircleAlert, ShieldAlert, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const RightPanel = ({ countryData, onClose }) => {
  if (!countryData) return null;

  const { name, flag, status, historicalData, forecastData, insights } = countryData;

  const handleMouseMove = (e, cardId) => {
    const card = document.getElementById(cardId);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div 
      className="right-panel glass-panel"
      initial={{ x: 500, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 500, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="panel-header">
        <div className="country-title">
          <span className="flag">{flag}</span>
          <h2>{name.toUpperCase()}</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="risk-status">
        <span>RISK STATUS</span>
        <div className={`badge ${status.toLowerCase()}`}>
          {status.toUpperCase()} RISK <CircleAlert size={14}/>
        </div>
      </div>

      <div className="commodity-selector">
        <span>SELECT COMMODITY:</span>
        <div className="commodity-tabs">
          <button className="tab active">WHEAT</button>
          <button className="tab">RICE</button>
          <button className="tab">MAIZE</button>
          <button className="tab">OIL</button>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h4>FOOD PRICE TREND (HISTORICAL)</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="price" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r: 4, fill: "var(--bg-primary)", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-box">
          <h4>FOOD PRICE FORECAST (3-6 MONTHS)</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="price" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h4>KEY INSIGHTS & CAUSES</h4>
        <div className="insights-grid">
          {insights.map((insight, idx) => {
            const cardId = `insight-card-${idx}`;
            return (
              <div 
                className="insight-card spotlight-card" 
                key={idx}
                id={cardId}
                onMouseMove={(e) => handleMouseMove(e, cardId)}
              >
                <div className="spotlight-content">
                  <div className="insight-header">
                    {insight.type === 'conflict' ? <ShieldAlert size={16} color="var(--accent-cyan)"/> : <TrendingUp size={16} color="var(--accent-cyan)"/>}
                    <h5>{insight.title}</h5>
                  </div>
                  <p>{insight.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default RightPanel;
