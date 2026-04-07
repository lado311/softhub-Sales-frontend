import React from 'react';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your sales pipeline' },
  leads: { title: 'Leads', sub: 'Manage and track all your business leads' },
  kanban: { title: 'Pipeline Board', sub: 'Drag and drop leads across stages' },
  followups: { title: 'Follow-ups', sub: 'Stay on top of your scheduled follow-ups' },
  reports: { title: 'Reports', sub: 'Analytics and performance breakdown' },
  settings: { title: 'Settings', sub: 'Configure your CRM workspace' },
};

export default function Header({ currentPage, onAction }) {
  const info = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;
  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>{info.title}</h1>
        <p style={styles.sub}>{info.sub}</p>
      </div>
      {currentPage === 'leads' && (
        <button style={styles.addBtn} onClick={() => onAction('add')}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span>Add Lead</span>
        </button>
      )}
    </header>
  );
}

const styles = {
  header: {
    padding: '20px 32px 0',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' },
  sub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 18px', background: 'var(--accent)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(107,127,215,0.3)',
  },
};
