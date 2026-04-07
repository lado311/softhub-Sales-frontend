import React from 'react';
import { useCRM } from '../context/CRMContext';
import { getDashboardStats, formatCurrency, formatDate, isOverdue, isDueSoon } from '../utils/helpers';
import { StatusBadge } from '../components/common/Badge';
import { STAGE_COLORS, PIPELINE_STAGES } from '../utils/helpers';
import { TrendingUp, DollarSign, Target, Users, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function Dashboard({ onNavigate, onSelectLead }) {
  const { leads, darkMode } = useCRM();
  const stats = getDashboardStats(leads);

  const stageData = PIPELINE_STAGES.map(s => ({
    name: s, value: stats.byStage[s] || 0, color: STAGE_COLORS[s],
  })).filter(d => d.value > 0);

  const barData = PIPELINE_STAGES.slice(0, 5).map(s => ({
    stage: s.length > 8 ? s.slice(0, 8) + '…' : s,
    leads: stats.byStage[s] || 0,
    color: STAGE_COLORS[s],
  }));

  const overdue = leads.filter(l => l.nextFollowUpDate && isOverdue(l.nextFollowUpDate) && !['Won', 'Lost'].includes(l.status));
  const upcoming = leads.filter(l => l.nextFollowUpDate && isDueSoon(l.nextFollowUpDate) && !['Won', 'Lost'].includes(l.status) && !isOverdue(l.nextFollowUpDate));
  const recentWins = leads.filter(l => l.status === 'Won').slice(0, 4);

  const textColor = darkMode ? '#9BA3B8' : '#6B7280';
  const gridColor = darkMode ? '#2A2E42' : '#E8EAF0';
  const bgColor = darkMode ? '#1A1D2E' : '#FFFFFF';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
      {/* KPI cards */}
      <div style={styles.kpiGrid}>
        <KpiCard icon={Users} label="Total Leads" value={stats.total} sub={`${stats.byStage['New'] || 0} new this period`} color="#6B7FD7" />
        <KpiCard icon={DollarSign} label="Won Revenue" value={formatCurrency(stats.wonValue)} sub={`${stats.wonCount} deals closed`} color="#27AE60" />
        <KpiCard icon={Target} label="Conversion Rate" value={`${stats.conversionRate}%`} sub="Won vs. closed deals" color="#F5A623" />
        <KpiCard icon={TrendingUp} label="Pipeline Value" value={formatCurrency(stats.pipelineValue)} sub="Active opportunities" color="#9B59B6" />
      </div>

      {/* Charts row */}
      <div style={styles.chartsRow}>
        {/* Bar chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.cardTitle}>Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="stage" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: bgColor, border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 }}
                cursor={{ fill: 'var(--bg-hover)' }}
              />
              <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.cardTitle}>Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="value" paddingAngle={3}>
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: bgColor, border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 12 }}
                formatter={(val, name) => [val, name]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={styles.bottomRow}>
        {/* Overdue follow-ups */}
        <div style={{ ...styles.listCard, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={styles.cardTitle}>
              <AlertCircle size={14} color="var(--danger)" style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Overdue Follow-ups
              {overdue.length > 0 && <span style={{ ...styles.badge, background: 'var(--danger)', marginLeft: 6 }}>{overdue.length}</span>}
            </h3>
            <button style={styles.linkBtn} onClick={() => onNavigate('followups')}>View all</button>
          </div>
          {overdue.length === 0 ? (
            <div style={styles.emptyState}>🎉 All caught up!</div>
          ) : (
            overdue.slice(0, 4).map(lead => (
              <LeadRow key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} accent="danger" />
            ))
          )}
          {upcoming.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)', marginTop: 12, marginBottom: 8 }}>
                Due Soon ({upcoming.length})
              </div>
              {upcoming.slice(0, 2).map(lead => (
                <LeadRow key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} accent="warning" />
              ))}
            </>
          )}
        </div>

        {/* Recent wins */}
        <div style={{ ...styles.listCard, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={styles.cardTitle}>🏆 Recent Wins</h3>
            <button style={styles.linkBtn} onClick={() => onNavigate('leads')}>View all</button>
          </div>
          {recentWins.length === 0 ? (
            <div style={styles.emptyState}>No won deals yet</div>
          ) : (
            recentWins.map(lead => (
              <WinRow key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, background: color + '18' }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

function LeadRow({ lead, onClick, accent }) {
  const accentColor = accent === 'danger' ? 'var(--danger)' : 'var(--warning)';
  return (
    <div onClick={onClick} style={styles.leadRow}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{lead.companyName}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{lead.contactPersonName} · {lead.assignedTo}</div>
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: accentColor, textAlign: 'right' }}>
        {formatDate(lead.nextFollowUpDate)}
        <div style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{lead.status}</div>
      </div>
    </div>
  );
}

function WinRow({ lead, onClick }) {
  return (
    <div onClick={onClick} style={styles.leadRow}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{lead.companyName}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{lead.industry} · {lead.assignedTo}</div>
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--success)' }}>
        {formatCurrency(lead.potentialValue)}
      </div>
    </div>
  );
}

const styles = {
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  kpiCard: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'flex-start' },
  kpiIcon: { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  chartCard: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  listCard: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  badge: { color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 20 },
  linkBtn: { fontSize: '0.78rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 },
  emptyState: { fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' },
  leadRow: { display: 'flex', alignItems: 'center', padding: '9px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background 0.15s', marginBottom: 2, gap: 10 },
};
