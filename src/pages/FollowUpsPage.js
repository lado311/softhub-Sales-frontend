import React, { useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { formatDate, formatCurrency, isOverdue, isDueSoon } from '../utils/helpers';
import { StatusBadge } from '../components/common/Badge';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';

export default function FollowUpsPage({ onSelectLead }) {
  const { leads } = useCRM();

  const { overdue, dueSoon, upcoming, done } = useMemo(() => {
    const active = leads.filter(l => !['Won', 'Lost'].includes(l.status) && l.nextFollowUpDate);
    return {
      overdue: active.filter(l => isOverdue(l.nextFollowUpDate)),
      dueSoon: active.filter(l => isDueSoon(l.nextFollowUpDate)),
      upcoming: active.filter(l => {
        const d = new Date(l.nextFollowUpDate);
        const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
        return diff > 2 && diff <= 14;
      }),
      done: leads.filter(l => ['Won', 'Lost'].includes(l.status)),
    };
  }, [leads]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary cards */}
      <div style={{
        ...styles.summaryRow,
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
      }}>
        <SummaryCard icon={AlertTriangle} count={overdue.length} label="Overdue" color="var(--danger)" bg="var(--danger-bg)" />
        <SummaryCard icon={Clock} count={dueSoon.length} label="Due in 1–2 days" color="var(--warning)" bg="var(--warning-bg)" />
        <SummaryCard icon={Calendar} count={upcoming.length} label="Upcoming (14 days)" color="var(--accent)" bg="var(--accent-light)" />
        <SummaryCard icon={CheckCircle} count={done.length} label="Closed Deals" color="var(--success)" bg="var(--success-bg)" />
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section title="🔴 Overdue Follow-ups" accent="danger" leads={overdue} onSelectLead={onSelectLead} />
      )}

      {/* Due soon */}
      {dueSoon.length > 0 && (
        <Section title="🟡 Due Today / Tomorrow" accent="warning" leads={dueSoon} onSelectLead={onSelectLead} />
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section title="📅 Upcoming (next 14 days)" accent="accent" leads={upcoming} onSelectLead={onSelectLead} />
      )}

      {overdue.length === 0 && dueSoon.length === 0 && upcoming.length === 0 && (
        <div style={styles.allClear}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>All caught up!</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No follow-ups due in the next 14 days.</div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, count, label, color, bg }) {
  return (
    <div style={{ ...styles.summaryCard, background: bg, border: `1px solid ${color}20` }}>
      <Icon size={18} color={color} />
      <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px', color }}>{count}</div>
      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function Section({ title, accent, leads, onSelectLead }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={{
        ...styles.grid,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
      }}>
        {leads.map(lead => (
          <FollowUpCard key={lead.id} lead={lead} accent={accent} onClick={() => onSelectLead(lead)} />
        ))}
      </div>
    </div>
  );
}

function FollowUpCard({ lead, accent, onClick }) {
  const accentMap = {
    danger: 'var(--danger)',
    warning: 'var(--warning)',
    accent: 'var(--accent)',
    success: 'var(--success)',
  };
  const color = accentMap[accent] || 'var(--accent)';
  const daysLeft = Math.ceil((new Date(lead.nextFollowUpDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div onClick={onClick} style={styles.card}>
      <div style={styles.cardLeft}>
        <div style={{ width: 3, background: color, borderRadius: 3, alignSelf: 'stretch', minHeight: 50 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3 }}>{lead.companyName}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            {lead.contactPersonName} · {lead.contactPersonPosition}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={lead.status} size="sm" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lead.assignedTo}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', color, fontWeight: 700, marginBottom: 2 }}>
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(lead.nextFollowUpDate)}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)', marginTop: 4 }}>
          {formatCurrency(lead.potentialValue)}
        </div>
      </div>
    </div>
  );
}

const styles = {
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  summaryCard: { borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 },
  section: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, marginBottom: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 },
  card: { background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, transition: 'background 0.15s', border: '1px solid var(--border)' },
  cardLeft: { display: 'flex', gap: 10, flex: 1, alignItems: 'flex-start' },
  allClear: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '50px', textAlign: 'center', border: '1px solid var(--border)' },
};
