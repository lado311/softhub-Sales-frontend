import React from 'react';
import { STAGE_COLORS, STAGE_BG } from '../../utils/helpers';

const INTEREST_COLORS = {
  High: { color: '#27AE60', bg: '#E9F7EF' },
  Medium: { color: '#F5A623', bg: '#FEF6E7' },
  Low: { color: '#95A5A6', bg: '#F0F3F4' },
};

const INTEREST_COLORS_DARK = {
  High: { color: '#2ECC71', bg: '#0D2818' },
  Medium: { color: '#F5A623', bg: '#2A1F0A' },
  Low: { color: '#95A5A6', bg: '#22263A' },
};

export function StatusBadge({ status, size = 'md' }) {
  const color = STAGE_COLORS[status] || '#6B7280';
  const bg = STAGE_BG[status] || '#F3F4F6';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: size === 'sm' ? '2px 7px' : '3px 10px',
      borderRadius: 20,
      fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
      fontWeight: 600,
      color,
      background: bg,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {status}
    </span>
  );
}

export function InterestBadge({ level, darkMode }) {
  const c = darkMode ? INTEREST_COLORS_DARK[level] : INTEREST_COLORS[level];
  if (!c) return null;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: '0.72rem',
      fontWeight: 600,
      color: c.color,
      background: c.bg,
    }}>
      {level}
    </span>
  );
}

export function IndustryTag({ industry }) {
  return (
    <span style={{
      padding: '3px 9px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: 'var(--text-secondary)',
      background: 'var(--bg-hover)',
      border: '1px solid var(--border)',
    }}>
      {industry}
    </span>
  );
}
