import React, { useState, useEffect, useMemo } from 'react';
import { leadsApi } from '../api/client';
import { useCRM } from '../context/CRMContext';
import { useDebounce, useToast } from '../hooks/useApi';
import {
  formatCurrency, formatDate, isOverdue,
  computeLeadScore, getScoreLabel, exportLeadsToCSV,
  PIPELINE_STAGES, INDUSTRIES,
} from '../utils/helpers';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LeadForm from '../components/leads/LeadForm';
import {
  Search, SlidersHorizontal, X, ChevronUp, ChevronDown,
  Download, Trash2, UserCheck, CheckSquare, Square, RefreshCw,
} from 'lucide-react';

export default function LeadsPage({ onSelectLead, showAddModal, onCloseModal }) {
  const { leads, fetchLeads, addLead, updateLead, deleteLead, users, loading } = useCRM();
  const { show, ToastComponent } = useToast();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'All', industry: 'All', assignedToId: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [editLead, setEditLead] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkAssign, setBulkAssign] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  // Fetch with server-side filters
  useEffect(() => {
    fetchLeads({
      search: debouncedSearch || undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      industry: filters.industry !== 'All' ? filters.industry : undefined,
      assignedToId: filters.assignedToId || undefined,
      sortBy: sort.key,
      sortDir: sort.dir,
    });
  }, [debouncedSearch, filters, sort, fetchLeads]);

  const leadsWithScore = useMemo(() =>
    leads.map(l => ({ ...l, score: computeLeadScore(l) })),
    [leads]
  );

  const toggleSort = (key) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const toggleSelect = id =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === leadsWithScore.length ? new Set() : new Set(leadsWithScore.map(l => l.id)));

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} lead(s)?`)) return;
    await Promise.all([...selected].map(id => deleteLead(id)));
    setSelected(new Set());
    show(`Deleted ${selected.size} leads`);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssign) return;
    const { bulkUpdate } = await import('../context/CRMContext').then(m => ({ bulkUpdate: null }));
    await leadsApi.bulk({ leadIds: [...selected], assignedToId: parseInt(bulkAssign) });
    await fetchLeads();
    show(`Reassigned ${selected.size} leads`);
    setSelected(new Set()); setBulkAssign('');
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    await leadsApi.bulk({ leadIds: [...selected], status: bulkStatus });
    await fetchLeads();
    show(`Updated status for ${selected.size} leads`);
    setSelected(new Set()); setBulkStatus('');
  };

  const handleAdd = async (data) => {
    await addLead(data);
    onCloseModal();
    show('Lead created');
  };

  const handleEdit = async (data) => {
    await updateLead(editLead.id, data);
    setEditLead(null);
    show('Lead updated');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await deleteLead(id);
    show('Lead deleted');
  };

  const filterCount = [
    filters.status !== 'All', filters.industry !== 'All', filters.assignedToId !== '',
  ].filter(Boolean).length;

  const allSel = leadsWithScore.length > 0 && selected.size === leadsWithScore.length;

  return (
    <div className="fade-in">
      {ToastComponent}

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search companies, contacts, email…" style={S.searchInput} />
          {search && <button onClick={() => setSearch('')} style={S.clearBtn}><X size={13} /></button>}
        </div>
        <button onClick={() => setShowFilters(f => !f)} style={{ ...S.toolBtn, background: showFilters || filterCount > 0 ? 'var(--accent-light)' : 'var(--bg-card)', color: showFilters || filterCount > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>
          <SlidersHorizontal size={14} /> Filters
          {filterCount > 0 && <span style={S.filterBadge}>{filterCount}</span>}
        </button>
        <button onClick={() => exportLeadsToCSV(leadsWithScore)} style={S.toolBtn}>
          <Download size={14} /> Export
        </button>
        <button onClick={() => fetchLeads()} style={S.toolBtn} title="Refresh">
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <span style={S.countLabel}>{leadsWithScore.length} leads</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={S.filterBar} className="fade-in">
          <FilterSelect label="Status" value={filters.status} options={['All', ...PIPELINE_STAGES]}
            onChange={v => setFilters(f => ({ ...f, status: v }))} />
          <FilterSelect label="Industry" value={filters.industry} options={['All', ...INDUSTRIES]}
            onChange={v => setFilters(f => ({ ...f, industry: v }))} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Assigned:</span>
            <select value={filters.assignedToId} onChange={e => setFilters(f => ({ ...f, assignedToId: e.target.value }))}
              style={{ fontSize: '0.8rem', padding: '5px 10px', border: '1.5px solid var(--border)', borderRadius: 7, background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <option value="">All</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          {filterCount > 0 && (
            <button onClick={() => setFilters({ status: 'All', industry: 'All', assignedToId: '' })}
              style={{ fontSize: '0.78rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div style={S.bulkBar} className="fade-in">
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={S.bulkSelect}>
            <option value="">Change status…</option>
            {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={handleBulkStatus} disabled={!bulkStatus} style={{ ...S.bulkBtn, opacity: bulkStatus ? 1 : 0.4 }}>Apply</button>
          <select value={bulkAssign} onChange={e => setBulkAssign(e.target.value)} style={S.bulkSelect}>
            <option value="">Reassign to…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <button onClick={handleBulkAssign} disabled={!bulkAssign} style={{ ...S.bulkBtn, opacity: bulkAssign ? 1 : 0.4 }}>
            <UserCheck size={13} /> Assign
          </button>
          <button onClick={handleBulkDelete} style={{ ...S.bulkBtn, color: 'var(--danger)', border: '1px solid var(--danger)', background: 'var(--danger-bg)', marginLeft: 'auto' }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} style={S.bulkBtn}><X size={13} /></button>
        </div>
      )}

      {/* Table */}
      <div style={S.tableWrap}>
        {loading && leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading leads…</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 40 }}>
                  <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: allSel ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}>
                    {allSel ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                </th>
                {COLS.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} style={S.th}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {sort.key === col.key
                        ? sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <span style={{ opacity: 0.2 }}><ChevronDown size={12} /></span>}
                    </span>
                  </th>
                ))}
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {leadsWithScore.map(lead => (
                <TR key={lead.id} lead={lead}
                  selected={selected.has(lead.id)}
                  onToggle={() => toggleSelect(lead.id)}
                  onClick={() => onSelectLead(lead)}
                  onEdit={() => setEditLead(lead)}
                  onDelete={() => handleDelete(lead.id, lead.companyName)}
                />
              ))}
              {leadsWithScore.length === 0 && (
                <tr><td colSpan={COLS.length + 2} style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No leads found</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Try adjusting your search or filters</div>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={onCloseModal} title="Add New Lead" width={700}>
        <LeadForm onSubmit={handleAdd} onCancel={onCloseModal} />
      </Modal>
      <Modal isOpen={!!editLead} onClose={() => setEditLead(null)} title="Edit Lead" width={700}>
        {editLead && <LeadForm initial={editLead} onSubmit={handleEdit} onCancel={() => setEditLead(null)} />}
      </Modal>
    </div>
  );
}

const COLS = [
  { key: 'companyName', label: 'Company' },
  { key: 'contactPersonName', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'score', label: 'Score' },
  { key: 'potentialValue', label: 'Value' },
  { key: 'assignedToName', label: 'Assigned' },
  { key: 'nextFollowUpDate', label: 'Follow-up' },
];

function TR({ lead, selected, onToggle, onClick, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const overdue = lead.nextFollowUpDate && isOverdue(lead.nextFollowUpDate) && !['Won', 'Lost'].includes(lead.status);
  const { label, color, bg } = getScoreLabel(lead.score);
  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: selected ? 'var(--accent-light)' : hovered ? 'var(--bg-hover)' : 'transparent', transition: 'background 0.12s' }}>
      <td style={{ padding: '10px 8px 10px 14px' }}>
        <button onClick={e => { e.stopPropagation(); onToggle(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: selected ? 'var(--accent)' : 'var(--text-muted)' }}>
          {selected ? <CheckSquare size={15} /> : <Square size={15} />}
        </button>
      </td>
      <td style={S.td} onClick={onClick}>
        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{lead.companyName}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{lead.industry} · {lead.location}</div>
      </td>
      <td style={S.td} onClick={onClick}>
        <div style={{ fontSize: '0.84rem' }}>{lead.contactPersonName}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lead.contactPersonPosition}</div>
      </td>
      <td style={S.td} onClick={onClick}><StatusBadge status={lead.status} size="sm" /></td>
      <td style={S.td} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 40, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${lead.score}%`, height: '100%', background: color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: bg, padding: '2px 6px', borderRadius: 20 }}>{label}</span>
        </div>
      </td>
      <td style={{ ...S.td, fontWeight: 700, color: 'var(--success)' }} onClick={onClick}>{formatCurrency(lead.potentialValue)}</td>
      <td style={S.td} onClick={onClick}><span style={{ fontSize: '0.82rem' }}>{lead.assignedToName || '—'}</span></td>
      <td style={{ ...S.td, color: overdue ? 'var(--danger)' : 'var(--text-primary)', fontWeight: overdue ? 600 : 400, fontSize: '0.82rem' }} onClick={onClick}>
        {overdue && '⚠ '}{formatDate(lead.nextFollowUpDate)}
      </td>
      <td style={S.td}>
        <div style={{ display: 'flex', gap: 5, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button style={S.rowBtn} onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</button>
          <button style={{ ...S.rowBtn, color: 'var(--danger)' }} onClick={e => { e.stopPropagation(); onDelete(); }}>Del</button>
        </div>
      </td>
    </tr>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: '0.8rem', padding: '5px 10px', border: '1.5px solid var(--border)', borderRadius: 7, background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}


const S = {
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 380, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px' },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.86rem', color: 'var(--text-primary)', fontFamily: 'var(--font)' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
  toolBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', transition: 'all 0.15s' },
  filterBadge: { background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 20 },
  countLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' },
  filterBar: { display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 12, flexWrap: 'wrap' },
  bulkBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--accent)', marginBottom: 12, flexWrap: 'wrap' },
  bulkSelect: { fontSize: '0.78rem', padding: '5px 9px', border: '1.5px solid var(--border)', borderRadius: 7, background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' },
  bulkBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)' },
  tableWrap: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '11px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer' },
  td: { padding: '11px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.84rem', verticalAlign: 'middle', cursor: 'pointer' },
  rowBtn: { padding: '3px 8px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 5, fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font)' },
};
