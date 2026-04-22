import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Globe, TrendingUp, AlertTriangle } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '32px',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.05) 0%, transparent 60%)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(0,240,255,0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,240,255,0.2)' }}>
          <Wheat size={48} color="var(--accent-cyan)" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', letterSpacing: '2px' }}>
          FOOD SUPPLY CHAIN
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--accent-cyan)', letterSpacing: '4px' }}>
          DISRUPTION ANALYZER
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', maxWidth: '500px', lineHeight: 1.6 }}>
          Analyze how global conflicts disrupt food supply chains using AI-powered forecasting and real-time risk assessment.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px' }}>
        {[
          { icon: Globe, label: '224 Countries Monitored' },
          { icon: TrendingUp, label: 'LSTM Price Forecasting' },
          { icon: AlertTriangle, label: 'Real-time Risk Alerts' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Icon size={20} color="var(--accent-cyan)" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button onClick={() => navigate('/dashboard')} style={{
          padding: '14px 32px', background: 'rgba(0,240,255,0.1)',
          border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
          borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s',
          letterSpacing: '1px'
        }}>
          VIEW DASHBOARD
        </button>
        <button onClick={() => navigate('/login')} style={{
          padding: '14px 32px', background: 'transparent',
          border: '1px solid var(--panel-border)', color: 'var(--text-secondary)',
          borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s',
          letterSpacing: '1px'
        }}>
          LOGIN
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
        SDG 2: Zero Hunger · SDG 12: Responsible Consumption
      </p>
    </div>
  );
};

export default Landing;