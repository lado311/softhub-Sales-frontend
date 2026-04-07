import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Kanban, Calendar,
  BarChart2, Settings, Sun, Moon, Bell, ChevronRight, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'kanban', label: 'Pipeline', icon: Kanban },
  { key: 'followups', label: 'Follow-ups', icon: Calendar },
  { key: 'reports', label: 'Reports', icon: BarChart2 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, onOpenPalette }) {
  const { darkMode, toggleDarkMode, notifications } = useCRM();
  const { user, logout, isAdmin } = useAuth();
  const overdueCount = notifications.filter(n => n.type === 'overdue').length;

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>SH</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>SoftHub</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>CRM Platform</div>
        </div>
      </div>

      {/* Search hint */}
      <button onClick={onOpenPalette} style={styles.searchHint}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🔍</span>
          <span>Search...</span>
        </span>
        <kbd style={styles.kbd}>⌘K</kbd>
      </button>

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          // Hide settings for non-admins
          if (key === 'settings' && !isAdmin) return null;
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              style={{
                ...styles.navItem,
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontWeight: active ? 600 : 400, flex: 1 }}>{label}</span>
              {key === 'followups' && overdueCount > 0 && (
                <span style={styles.badge}>{overdueCount}</span>
              )}
              {active && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </button>
          );
        })}
      </nav>

      {/* Follow-up alerts */}
      {notifications.length > 0 && (
        <div style={styles.notifCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Bell size={13} color="var(--warning)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--warning)' }}>
              {notifications.length} Follow-up{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          {notifications.slice(0, 2).map(n => (
            <div key={n.id} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3, lineHeight: 1.4 }}>
              <span style={{ color: n.type === 'overdue' ? 'var(--danger)' : 'var(--warning)', fontWeight: 500 }}>
                {n.type === 'overdue' ? `${n.days}d overdue` : 'Due soon'}:
              </span>{' '}{n.company}
            </div>
          ))}
        </div>
      )}

      {/* Bottom */}
      <div style={styles.bottom}>
        <button onClick={toggleDarkMode} style={styles.themeBtn}>
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div style={styles.userRow}>
          <div style={styles.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, bottom: 0,
    width: 'var(--sidebar-width)',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    padding: '20px 12px', zIndex: 100,
    transition: 'background var(--transition), border-color var(--transition)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '4px 8px 16px',
    borderBottom: '1px solid var(--border)', marginBottom: 10,
  },
  logoIcon: {
    width: 34, height: 34, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
    borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  searchHint: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-muted)', fontSize: '0.82rem',
    cursor: 'pointer', margin: '6px 0 10px', width: '100%',
    transition: 'border-color 0.15s',
  },
  kbd: {
    fontSize: '0.62rem', padding: '1px 5px',
    border: '1px solid var(--border)', borderRadius: 4,
    color: 'var(--text-muted)', background: 'var(--bg-card)',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 'var(--radius-md)',
    border: 'none', cursor: 'pointer',
    fontSize: '0.86rem', transition: 'all var(--transition)',
    width: '100%', textAlign: 'left',
  },
  badge: {
    background: 'var(--danger)', color: '#fff',
    fontSize: '0.65rem', fontWeight: 700,
    padding: '1px 6px', borderRadius: 20, minWidth: 18, textAlign: 'center',
  },
  notifCard: {
    margin: '10px 0', padding: '10px 12px',
    background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(245,166,35,0.2)',
  },
  bottom: {
    borderTop: '1px solid var(--border)', paddingTop: 12,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  themeBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--bg-hover)',
    color: 'var(--text-secondary)', fontSize: '0.82rem',
    cursor: 'pointer', transition: 'all var(--transition)',
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
  },
};
