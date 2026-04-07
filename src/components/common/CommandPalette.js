import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { computeLeadScore, getScoreLabel } from '../../utils/helpers';
import { formatCurrency } from '../../utils/helpers';
import { STAGE_COLORS } from '../../utils/helpers';
import { Search, LayoutDashboard, Users, Kanban, Calendar, BarChart2, Settings, ArrowRight } from 'lucide-react';

const NAV_COMMANDS = [
  { type: 'nav', label: 'Go to Dashboard', icon: LayoutDashboard, page: 'dashboard', keywords: 'home overview' },
  { type: 'nav', label: 'Go to Leads', icon: Users, page: 'leads', keywords: 'list table' },
  { type: 'nav', label: 'Go to Pipeline', icon: Kanban, page: 'kanban', keywords: 'board stages drag' },
  { type: 'nav', label: 'Go to Follow-ups', icon: Calendar, page: 'followups', keywords: 'schedule overdue' },
  { type: 'nav', label: 'Go to Reports', icon: BarChart2, page: 'reports', keywords: 'analytics charts' },
  { type: 'nav', label: 'Go to Settings', icon: Settings, page: 'settings', keywords: 'preferences team' },
];

export default function CommandPalette({ isOpen, onClose, onNavigate, onSelectLead }) {
  const { leads } = useCRM();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return NAV_COMMANDS.slice(0, 6);

    const navMatches = NAV_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.keywords.includes(q)
    );

    const leadMatches = leads
      .filter(l =>
        l.companyName?.toLowerCase().includes(q) ||
        l.contactPersonName?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.industry?.toLowerCase().includes(q) ||
        l.status?.toLowerCase().includes(q)
      )
      .slice(0, 7)
      .map(l => ({ type: 'lead', lead: l }));

    return [...navMatches, ...leadMatches].slice(0, 10);
  }, [query, leads]);

  useEffect(() => { setCursor(0); }, [results.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); selectItem(results[cursor]); }
    if (e.key === 'Escape') onClose();
  };

  const selectItem = (item) => {
    if (!item) return;
    if (item.type === 'nav') { onNavigate(item.page); }
    if (item.type === 'lead') { onSelectLead(item.lead); }
    onClose();
  };

  useEffect(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.palette} className="fade-in">
        {/* Input */}
        <div style={styles.inputRow}>
          <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search leads, navigate pages…"
            style={styles.input}
          />
          <kbd style={styles.kbd}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={styles.list}>
          {results.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              No results for "{query}"
            </div>
          )}

          {!query && (
            <div style={styles.groupLabel}>Navigation</div>
          )}

          {results.map((item, i) => (
            <div
              key={i}
              onClick={() => selectItem(item)}
              style={{
                ...styles.result,
                background: cursor === i ? 'var(--accent-light)' : 'transparent',
                color: cursor === i ? 'var(--accent)' : 'var(--text-primary)',
              }}
              onMouseEnter={() => setCursor(i)}
            >
              {item.type === 'nav' ? (
                <NavResult item={item} active={cursor === i} />
              ) : (
                <LeadResult lead={item.lead} active={cursor === i} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

function NavResult({ item, active }) {
  const Icon = item.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={active ? '#fff' : 'var(--text-secondary)'} />
      </div>
      <span style={{ fontSize: '0.88rem', flex: 1 }}>{item.label}</span>
      <ArrowRight size={13} style={{ opacity: 0.4 }} />
    </div>
  );
}

function LeadResult({ lead, active }) {
  const score = computeLeadScore(lead);
  const { color } = getScoreLabel(score);
  const stageColor = STAGE_COLORS[lead.status] || '#6B7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? 'var(--accent)' : stageColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: active ? '#fff' : stageColor, flexShrink: 0 }}>
        {lead.companyName?.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.companyName}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lead.status} · {lead.contactPersonName}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(lead.potentialValue)}</div>
        <div style={{ fontSize: '0.68rem', color, fontWeight: 600 }}>Score {score}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.5)',
    backdropFilter: 'blur(6px)', zIndex: 2000,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    paddingTop: '12vh',
  },
  palette: {
    width: '100%', maxWidth: 580,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
  },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '1rem', color: 'var(--text-primary)',
    fontFamily: 'var(--font)',
  },
  kbd: {
    fontSize: '0.68rem', padding: '2px 6px',
    border: '1px solid var(--border)', borderRadius: 4,
    color: 'var(--text-muted)', background: 'var(--bg-hover)',
  },
  list: { maxHeight: 380, overflowY: 'auto', padding: '6px' },
  groupLabel: {
    fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.6px',
    padding: '6px 10px 2px',
  },
  result: {
    padding: '9px 10px', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', transition: 'background 0.1s',
    marginBottom: 1,
  },
  footer: {
    display: 'flex', gap: 16, padding: '10px 16px',
    borderTop: '1px solid var(--border)',
    fontSize: '0.72rem', color: 'var(--text-muted)',
    background: 'var(--bg-hover)',
  },
};
