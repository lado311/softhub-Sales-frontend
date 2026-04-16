import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import KanbanPage from './pages/KanbanPage';
import FollowUpsPage from './pages/FollowUpsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LeadDetails from './components/leads/LeadDetails';
import Modal from './components/common/Modal';
import LeadForm from './components/leads/LeadForm';
import './styles/globals.css';
import { Menu, X } from 'lucide-react';

// ─── Loading spinner ──────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Loading SoftHub…</div>
      </div>
    </div>
  );
}

// ─── Main App (inside auth + CRM context) ────────────────
function AppInner() {
  const { addLead, updateLead, deleteLead, fetchLeads, fetchUsers, fetchFollowUps } = useCRM();
  const [page, setPage] = useState('dashboard');
  const [previousPage, setPreviousPage] = useState('leads');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initial data load
  useEffect(() => {
    fetchLeads();
    fetchUsers();
    fetchFollowUps();
    const interval = setInterval(fetchFollowUps, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLeads, fetchUsers, fetchFollowUps]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(p => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setShowAddModal(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);


  const handleSelectLead = useCallback((lead) => {
    setPreviousPage(page);
    setSelectedLeadId(lead.id ?? lead);
    setPage('lead-detail');
  }, [page]);

  const handleNavigate = useCallback((p) => {
    setSelectedLeadId(null);
    setPage(p);
    setSidebarOpen(false);  // ← დაამატე
  }, [page]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await deleteLead(id);
    setSelectedLeadId(null);
    setPage('leads');
  }, [deleteLead]);

  const currentPage = page === 'lead-detail' ? 'leads' : page;

  // Lazy-load command palette
  const [CommandPalette, setCP] = useState(null);
  useEffect(() => {
    import('./components/common/CommandPalette').then(m => setCP(() => m.default));
  }, []);

  return (
      <div className="app-layout">

        {/* Mobile top bar — პირველი უნდა იყოს */}
        <div className="mobile-topbar">
          <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-primary)', display: 'flex' }}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>SH</div>
            SoftHub
          </div>
          <div style={{ width: 34 }} />
        </div>

        <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onOpenPalette={() => setPaletteOpen(true)}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
        />

        <div className="main-content">
          <Header
              currentPage={page === 'lead-detail' ? 'leads' : page}
              onAction={a => { if (a === 'add') setShowAddModal(true); }}
          />
          <div className="page-content">
            {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} onSelectLead={handleSelectLead} />}
            {page === 'leads' && <LeadsPage onSelectLead={handleSelectLead} showAddModal={showAddModal} onCloseModal={() => setShowAddModal(false)} />}
            {page === 'kanban' && <KanbanPage onSelectLead={handleSelectLead} />}
            {page === 'followups' && <FollowUpsPage onSelectLead={handleSelectLead} />}
            {page === 'reports' && <ReportsPage />}
            {page === 'settings' && <SettingsPage />}
            {page === 'lead-detail' && selectedLeadId && (
                <LeadDetails
                    leadId={selectedLeadId}
                    onBack={() => { setSelectedLeadId(null); setPage(previousPage); }}
                    onEdit={(lead) => { }}
                    onDelete={handleDelete}
                />
            )}
          </div>
        </div>

        {CommandPalette && (
            <CommandPalette
                isOpen={paletteOpen}
                onClose={() => setPaletteOpen(false)}
                onNavigate={handleNavigate}
                onSelectLead={handleSelectLead}
            />
        )}

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lead" width={700}>
          <LeadForm
              onSubmit={async (data) => { await addLead(data); setShowAddModal(false); }}
              onCancel={() => setShowAddModal(false)}
          />
        </Modal>

        <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
      </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <LoginPage />;
  return (
    <CRMProvider>
      <AppInner />
    </CRMProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
