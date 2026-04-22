import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wheat } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    setLoading(true);
    const result = isLogin
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message || 'Something went wrong');
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.04) 0%, transparent 60%)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '48px 40px', margin: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div style={{ background: 'rgba(0,240,255,0.1)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Wheat size={32} color="var(--accent-cyan)" />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px' }}>FOOD SUPPLY CHAIN</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Disruption Analyzer</p>
        </div>

        <div style={{ display: 'flex', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px' }}>
          {['Login', 'Register'].map((tab) => (
            <button key={tab} onClick={() => { setIsLogin(tab === 'Login'); setError(''); }} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: (isLogin && tab === 'Login') || (!isLogin && tab === 'Register') ? 'rgba(0,240,255,0.1)' : 'transparent',
              color: (isLogin && tab === 'Login') || (!isLogin && tab === 'Register') ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s'
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <input placeholder="Full Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'white', fontFamily: 'inherit', fontSize: '0.9rem' }}
            />
          )}
          <input placeholder="Email" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'white', fontFamily: 'inherit', fontSize: '0.9rem' }}
          />
          <input placeholder="Password" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'white', fontFamily: 'inherit', fontSize: '0.9rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '13px', marginTop: '4px',
            background: 'rgba(0,240,255,0.1)', border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600,
            transition: 'all 0.2s', opacity: loading ? 0.6 : 1, letterSpacing: '1px'
          }}>
            {loading ? 'PLEASE WAIT...' : isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>
          <button onClick={() => navigate('/')} style={{
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', marginTop: '4px'
          }}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default Login;