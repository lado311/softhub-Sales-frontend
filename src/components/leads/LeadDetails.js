import React, { useState, useEffect } from 'react';
import { leadsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, InterestBadge, IndustryTag } from '../common/Badge';
import {
  formatCurrency, formatDate, formatRelativeDate,
  getInitials, computeLeadScore, getScoreLabel, PIPELINE_STAGES,
} from '../../utils/helpers';
import { Phone, Mail, MapPin, Building2, User, Send, Edit2, Trash2, ArrowLeft } from 'lucide-react';

export default function LeadDetails({ leadId, onBack, onEdit, onDelete }) {
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    leadsApi.get(leadId)
      .then(r => setLead(r.data))
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await leadsApi.move(leadId, newStatus);
      setLead(prev => ({ ...prev, ...data }));
    } catch {}
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await leadsApi.addNote(leadId, noteText.trim());
      setLead(prev => ({
        ...prev,
        notes: [...(prev.notes || []), data],
        lastContactedAt: new Date().toISOString(),
      }));
      setNoteText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    await leadsApi.deleteNote(leadId, noteId);
    setLead(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== noteId) }));
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      Loading lead details…
    </div>
  );
  if (!lead) return null;

  const score = computeLeadScore(lead);
  const { label: scoreLabel, color: scoreColor, bg: scoreBg } = getScoreLabel(score);

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back to Leads
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.iconBtn} onClick={() => onEdit(lead)}>
            <Edit2 size={15} /> Edit
          </button>
          <button style={{ ...styles.iconBtn, color: 'var(--danger)' }} onClick={() => onDelete(lead.id)}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={styles.avatar}>{getInitials(lead.companyName)}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}>
                  {lead.companyName}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <IndustryTag industry={lead.industry} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 20 }}>
                    {lead.companySize}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage switcher */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Pipeline Stage
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {PIPELINE_STAGES.map(stage => (
                  <button key={stage} onClick={() => handleStatusChange(stage)} style={{
                    padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
                    border: lead.status === stage ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: lead.status === stage ? 'var(--accent-light)' : 'transparent',
                    color: lead.status === stage ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <MetaTile label="Value">
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(lead.potentialValue)}
                </span>
              </MetaTile>
              <MetaTile label="Interest"><InterestBadge level={lead.interestLevel} /></MetaTile>
              <MetaTile label="Score">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor, background: scoreBg, padding: '2px 8px', borderRadius: 20 }}>
                  {score} · {scoreLabel}
                </span>
              </MetaTile>
              <MetaTile label="Source">
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{lead.source}</span>
              </MetaTile>
            </div>
          </div>

          <div style={styles.card}>
            <SectionTitle>Contact Information</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon={User} label="Contact">{lead.contactPersonName} · <span style={{ color: 'var(--text-muted)' }}>{lead.contactPersonPosition}</span></InfoRow>
              <InfoRow icon={Mail} label="Email"><a href={`mailto:${lead.email}`} style={{ color: 'var(--accent)' }}>{lead.email}</a></InfoRow>
              <InfoRow icon={Phone} label="Phone">{lead.phone || '—'}</InfoRow>
              <InfoRow icon={MapPin} label="Location">{lead.location || '—'}</InfoRow>
              <InfoRow icon={Building2} label="Assigned To">{lead.assignedTo?.fullName || 'Unassigned'}</InfoRow>
            </div>
          </div>

          <div style={styles.card}>
            <SectionTitle>Timeline</SectionTitle>
            <DateRow label="Created" value={formatDate(lead.createdAt)} />
            <DateRow label="Last Contacted" value={formatDate(lead.lastContactedAt)} />
            <DateRow label="Next Follow-up" value={formatDate(lead.nextFollowUpDate)}
              highlight={lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < new Date()} />
          </div>
        </div>

        {/* Right - Notes + Activity */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <SectionTitle>Notes & Activity</SectionTitle>

            {/* Add note */}
            <div style={styles.noteInput}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note, call summary, or update…"
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', minHeight: 68, fontSize: '0.86rem', color: 'var(--text-primary)', fontFamily: 'var(--font)', lineHeight: 1.5 }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>As: {user?.fullName}</span>
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || submitting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    background: noteText.trim() ? 'var(--accent)' : 'var(--bg-hover)',
                    color: noteText.trim() ? '#fff' : 'var(--text-muted)',
                    border: 'none', borderRadius: 8,
                    fontSize: '0.78rem', fontWeight: 600, cursor: noteText.trim() ? 'pointer' : 'default',
                    fontFamily: 'var(--font)',
                  }}
                >
                  <Send size={12} /> {submitting ? 'Adding…' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* Notes list */}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(!lead.notes || lead.notes.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No notes yet. Add the first one above.
                </div>
              ) : (
                [...lead.notes].reverse().map(note => (
                  <div key={note.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={styles.noteAvatar}>{getInitials(note.authorName)}</div>
                    <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{note.authorName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatRelativeDate(note.createdAt)}</span>
                          {(note.authorId === user?.id || user?.role === 'Admin') && (
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, fontSize: 12 }}
                            >✕</button>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{note.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Activity log */}
            {lead.activities && lead.activities.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <SectionTitle>Activity Log</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lead.activities.slice(0, 10).map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.8rem' }}>{a.description}</span>
                        {a.userName && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}> · {a.userName}</span>}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatRelativeDate(a.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>{children}</div>;
}

function MetaTile({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="var(--text-secondary)" />
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: '0.84rem' }}>{children}</div>
      </div>
    </div>
  );
}

function DateRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: highlight ? 'var(--danger)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: 'var(--bg-hover)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)' },
  iconBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg-hover)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)' },
  grid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  avatar: { width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', flexShrink: 0 },
  noteInput: { background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: 12 },
  noteAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: 2 },
};
