import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { formatCurrency, STAGE_COLORS, PIPELINE_STAGES, INDUSTRIES } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function ReportsPage() {
  const { leads, users, darkMode } = useCRM();

  const textColor = darkMode ? '#9BA3B8' : '#6B7280';
  const gridColor = darkMode ? '#2A2E42' : '#E8EAF0';
  const bgColor = darkMode ? '#1A1D2E' : '#FFFFFF';

  const tip = {
    contentStyle: { background: bgColor, border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 },
    cursor: { fill: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
  };

  const managerData = useMemo(() => {
    return users.map(u => {
      const ml = leads.filter(l => l.assignedToId === u.id || l.assignedTo?.id === u.id);
      const won = ml.filter(l => l.status === 'Won');
      return { name: u.fullName.split(' ')[0], leads: ml.length, won: won.length, value: won.reduce((s, l) => s + (l.potentialValue || 0), 0) };
    }).filter(m => m.leads > 0);
  }, [leads, users]);

  const industryData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.industry] = (counts[l.industry] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [leads]);

  const valueByStage = useMemo(() => {
    return PIPELINE_STAGES.slice(0, 6).map(stage => ({
      stage: stage.length > 9 ? stage.slice(0, 9) + '…' : stage,
      value: leads.filter(l => l.status === stage).reduce((s, l) => s + (l.potentialValue || 0), 0) / 1000,
      color: STAGE_COLORS[stage],
    })).filter(d => d.value > 0);
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const won = leads.filter(l => l.status === 'Won');
  const lost = leads.filter(l => l.status === 'Lost');
  const wonRevenue = won.reduce((s, l) => s + (l.potentialValue || 0), 0);
  const pipelineValue = leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + (l.potentialValue || 0), 0);
  const avgDeal = leads.length ? leads.reduce((s, l) => s + (l.potentialValue || 0), 0) / leads.length : 0;
  const winRate = (won.length + lost.length) > 0 ? Math.round(won.length / (won.length + lost.length) * 100) : 0;
  const PIE = ['#6B7FD7', '#7EC8C8', '#F5A623', '#9B59B6', '#E67E22', '#27AE60'];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <Tile label="Pipeline Value" value={formatCurrency(pipelineValue)} color="#6B7FD7" />
        <Tile label="Avg Deal Size" value={formatCurrency(avgDeal)} color="#F5A623" />
        <Tile label="Win Rate" value={`${winRate}%`} color="#27AE60" sub={`${won.length} won · ${lost.length} lost`} />
        <Tile label="Won Revenue" value={formatCurrency(wonRevenue)} color="#E74C3C" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Chart title="Manager Performance">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={managerData} barSize={18} barGap={4}>
              <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tip} />
              <Bar dataKey="leads" name="Leads" fill="#6B7FD7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="Won" fill="#27AE60" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="Value by Stage ($K)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={valueByStage} barSize={26}>
              <XAxis dataKey="stage" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tip} formatter={(v) => [`$${v.toFixed(0)}K`, 'Value']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {valueByStage.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Chart title="Leads by Industry">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={industryData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={2}>
                {industryData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
              </Pie>
              <Tooltip {...tip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </Chart>

        <Chart title="Lead Sources">
          <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sourceData.map((s, i) => {
              const pct = leads.length ? Math.round(s.value / leads.length * 100) : 0;
              return (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: PIE[i % PIE.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                  <div style={{ flex: 2, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PIE[i % PIE.length], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, width: 20, textAlign: 'right' }}>{s.value}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 32 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </Chart>
      </div>

      {/* Manager table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Manager Revenue Breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr>{['Manager', 'Leads', 'Won', 'Lost', 'Active', 'Revenue', 'Win Rate'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {users.map(u => {
              const ml = leads.filter(l => l.assignedToId === u.id || l.assignedTo?.id === u.id);
              if (!ml.length) return null;
              const mwon = ml.filter(l => l.status === 'Won');
              const mlost = ml.filter(l => l.status === 'Lost');
              const mactive = ml.filter(l => !['Won', 'Lost'].includes(l.status));
              const rev = mwon.reduce((s, l) => s + (l.potentialValue || 0), 0);
              const wr = (mwon.length + mlost.length) > 0 ? Math.round(mwon.length / (mwon.length + mlost.length) * 100) : 0;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ padding: '10px 12px' }}>{ml.length}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--success)' }}>{mwon.length}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--danger)' }}>{mlost.length}</td>
                  <td style={{ padding: '10px 12px' }}>{mactive.length}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(rev)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ width: `${wr}%`, height: '100%', background: wr > 50 ? 'var(--success)' : wr > 25 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{wr}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, color, sub }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Chart({ title, children }) {
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

const S = {
  card: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 },
};
