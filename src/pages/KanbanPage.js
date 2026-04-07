import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { PIPELINE_STAGES, STAGE_COLORS, STAGE_BG } from '../utils/helpers';
import { formatCurrency, getInitials } from '../utils/helpers';
import Modal from '../components/common/Modal';
import LeadForm from '../components/leads/LeadForm';
import { Plus } from 'lucide-react';

export default function KanbanPage({ onSelectLead }) {
  const { leads, moveLeadStage, addLead } = useCRM();
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [quickAddStage, setQuickAddStage] = useState(null);

  const byStage = {};
  PIPELINE_STAGES.forEach(s => {
    byStage[s] = leads.filter(l => l.status === s);
  });

  const handleDragStart = (e, lead) => {
    setDragging(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('leadId', lead.id);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stage);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId && dragging?.status !== stage) {
      moveLeadStage(leadId, stage);
    }
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const handleQuickAdd = (data) => {
    addLead({ ...data, status: quickAddStage });
    setQuickAddStage(null);
  };

  const totalValue = (stage) =>
    byStage[stage].reduce((s, l) => s + (l.potentialValue || 0), 0);

  return (
    <div className="fade-in">
      <div style={styles.board}>
        {PIPELINE_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={byStage[stage]}
            isDragOver={dragOver === stage}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onSelectLead={onSelectLead}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            dragging={dragging}
            totalValue={totalValue(stage)}
            onQuickAdd={() => setQuickAddStage(stage)}
          />
        ))}
      </div>

      <Modal isOpen={!!quickAddStage} onClose={() => setQuickAddStage(null)} title={`Add Lead → ${quickAddStage}`} width={680}>
        <LeadForm
          initial={{ status: quickAddStage }}
          onSubmit={handleQuickAdd}
          onCancel={() => setQuickAddStage(null)}
        />
      </Modal>
    </div>
  );
}

function KanbanColumn({ stage, leads, isDragOver, onDragOver, onDrop, onSelectLead, onDragStart, onDragEnd, dragging, totalValue, onQuickAdd }) {
  const color = STAGE_COLORS[stage];
  const bg = STAGE_BG[stage];

  return (
    <div
      style={{
        ...styles.column,
        border: isDragOver ? `2px solid ${color}` : '1.5px solid var(--border)',
        background: isDragOver ? bg : 'var(--bg-card)',
        transition: 'all 0.15s',
      }}
      onDragOver={(e) => onDragOver(e, stage)}
      onDrop={(e) => onDrop(e, stage)}
    >
      {/* Column header */}
      <div style={styles.colHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{stage}</span>
          <span style={{ ...styles.count, background: color + '20', color }}>{leads.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {totalValue > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {formatCurrency(totalValue)}
            </span>
          )}
          <button
            onClick={onQuickAdd}
            title={`Add lead to ${stage}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', borderRadius: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = color}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={styles.cardList}>
        {leads.map(lead => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            isDragging={dragging?.id === lead.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onSelectLead(lead)}
          />
        ))}
        {leads.length === 0 && (
          <div style={{
            ...styles.emptyCol,
            border: isDragOver ? `2px dashed ${color}` : '2px dashed var(--border)',
            color: isDragOver ? color : 'var(--text-muted)',
          }}>
            {isDragOver ? 'Drop here' : 'No leads'}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ lead, isDragging, onDragStart, onDragEnd, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        opacity: isDragging ? 0.4 : 1,
        transform: hovered && !isDragging ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderColor: hovered ? 'var(--border-focus)' : 'var(--border)',
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '0.84rem', flex: 1, lineHeight: 1.3 }}>{lead.companyName}</div>
        <InterestDot level={lead.interestLevel} />
      </div>

      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 8 }}>
        {lead.contactPersonName} · {lead.industry}
      </div>

      {lead.potentialValue > 0 && (
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
          {formatCurrency(lead.potentialValue)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          📍 {lead.location?.split(',')[0] || '—'}
        </div>
        <div style={styles.assigneeChip}>
          <div style={styles.miniAvatar}>{getInitials(lead.assignedTo)}</div>
          <span>{lead.assignedTo?.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}

function InterestDot({ level }) {
  const colors = { High: '#27AE60', Medium: '#F5A623', Low: '#95A5A6' };
  return (
    <div title={`Interest: ${level}`} style={{
      width: 8, height: 8, borderRadius: '50%',
      background: colors[level] || '#ccc',
      flexShrink: 0, marginTop: 2, marginLeft: 6,
    }} />
  );
}

const styles = {
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 10,
    overflowX: 'auto',
    minHeight: 'calc(100vh - 140px)',
    alignItems: 'start',
  },
  column: {
    borderRadius: 'var(--radius-lg)',
    padding: '12px 10px',
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: '0 2px',
  },
  count: {
    padding: '1px 6px',
    borderRadius: 20,
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  emptyCol: {
    padding: '20px 10px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  assigneeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.55rem',
    fontWeight: 700,
  },
};
