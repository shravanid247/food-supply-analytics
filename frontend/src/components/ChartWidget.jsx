import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const tooltipStyle = {
  background: 'rgba(18,24,38,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: 'white', fontSize: '12px'
};

const ChartWidget = ({ data, type = 'line', dataKey = 'value', xKey = 'name', color = '#00f0ff', height = 200, title, anomalies = [] }) => {
  if (!data) return (
    <div>
      {title && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title}</p>}
      <div style={{ height, background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
    </div>
  );

  return (
    <div>
      {title && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            {anomalies.map((x, i) => <ReferenceLine key={i} x={x} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '⚠', fill: '#ef4444', fontSize: 12 }} />)}
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color}20`} strokeWidth={2} dot={false} />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={xKey} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            {anomalies.map((x, i) => <ReferenceLine key={i} x={x} stroke="#ef4444" strokeDasharray="4 4" />)}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartWidget;