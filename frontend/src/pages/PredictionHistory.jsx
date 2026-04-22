import React, { useState, useRef } from 'react';
import { getPredictionHistory } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PredictionHistory = ({ inline = false }) => {
  const { isAuthenticated } = useAuth();
  const { data, loading } = useFetch(getPredictionHistory);
  const [expanded, setExpanded] = useState(null);
  const reportRef = useRef();

  const generatePDF = async (item) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Food Supply Chain — Prediction Report', 20, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 32);
    doc.text(`Requested At: ${new Date(item.requested_at).toLocaleString()}`, 20, 42);
    doc.text(`Current Food Price Index: ${item.current_price}`, 20, 52);
    doc.setFontSize(13);
    doc.text('6-Month Price Forecast:', 20, 66);
    doc.setFontSize(11);
    item.predictions?.forEach((p, i) => {
      doc.text(`${p.month}: ${p.predicted_price}`, 28, 78 + i * 10);
    });
    doc.save(`prediction-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!isAuthenticated && !inline) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <h2 style={{ color: 'var(--text-primary)' }}>Login Required</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Please login to view your prediction history.</p>
    </div>
  );

  if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '16px' }}>Loading history...</div>;

  if (!data || data.length === 0) return (
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: inline ? '8px' : '40px', textAlign: 'center' }}>
      No prediction history yet.
    </div>
  );

  return (
    <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...(inline ? {} : { height: '100%', overflowY: 'auto' }) }}>
      {(data || []).map((item, idx) => (
        <div key={idx} className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === idx ? null : idx)}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Requested</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date(item.requested_at).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Price Index</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent-cyan)' }}>{item.current_price}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Months</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.predictions?.length || 0}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={(e) => { e.stopPropagation(); generatePDF(item); }} style={{
                background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
                color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '6px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.75rem', fontFamily: 'inherit'
              }}>
                <Download size={12} /> PDF
              </button>
              {expanded === idx ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
            </div>
          </div>

          {expanded === idx && (
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--panel-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
                <thead>
                  <tr>{['Month', 'Predicted Price'].map(h => <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(item.predictions || []).map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem' }}>{p.month}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{p.predicted_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PredictionHistory;