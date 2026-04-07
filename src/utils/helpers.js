export const PIPELINE_STAGES = [
  'New', 'Contacted', 'Demo Scheduled',
  'Proposal Sent', 'Negotiation', 'Won', 'Lost',
];

export const INDUSTRIES = [
  'Retail', 'Healthcare', 'Education', 'Finance', 'Technology',
  'Manufacturing', 'Real Estate', 'Hospitality', 'Logistics', 'Other',
];

export const SOURCES = [
  'Facebook', 'Website', 'Cold Call', 'Referral', 'Event', 'LinkedIn', 'Other',
];

export const COMPANY_SIZES = ['Small', 'Medium'];
export const INTEREST_LEVELS = ['Low', 'Medium', 'High'];

export const STAGE_COLORS = {
  'New': '#6B7FD7',
  'Contacted': '#7EC8C8',
  'Demo Scheduled': '#F5A623',
  'Proposal Sent': '#9B59B6',
  'Negotiation': '#E67E22',
  'Won': '#27AE60',
  'Lost': '#E74C3C',
};

export const STAGE_BG = {
  'New': '#EEF0FB',
  'Contacted': '#E8F8F8',
  'Demo Scheduled': '#FEF6E7',
  'Proposal Sent': '#F5EEF8',
  'Negotiation': '#FDF0E4',
  'Won': '#E9F7EF',
  'Lost': '#FDEDEC',
};

export function formatCurrency(value) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return formatDate(dateStr);
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  return diff >= 0 && diff <= 2;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function computeLeadScore(lead) {
  let score = 0;
  score += { High: 30, Medium: 18, Low: 6 }[lead.interestLevel] || 0;
  const v = lead.potentialValue || 0;
  score += v >= 50000 ? 25 : v >= 30000 ? 20 : v >= 15000 ? 14 : v >= 5000 ? 8 : 3;
  score += {
    New: 4, Contacted: 8, 'Demo Scheduled': 12,
    'Proposal Sent': 16, Negotiation: 20, Won: 20,
  }[lead.status] || 0;
  score += { Referral: 10, Event: 8, Website: 6, LinkedIn: 6, Facebook: 4, 'Cold Call': 3 }[lead.source] || 2;
  if (lead.lastContactedAt) {
    const d = Math.floor((Date.now() - new Date(lead.lastContactedAt)) / 86400000);
    score += d <= 3 ? 10 : d <= 7 ? 7 : d <= 14 ? 4 : d <= 30 ? 2 : 0;
  }
  score += lead.companySize === 'Medium' ? 5 : 2;
  return Math.min(100, score);
}

export function getScoreLabel(score) {
  if (score >= 75) return { label: 'Hot', color: '#E74C3C', bg: '#FDEDEC' };
  if (score >= 50) return { label: 'Warm', color: '#F5A623', bg: '#FEF6E7' };
  if (score >= 25) return { label: 'Cool', color: '#6B7FD7', bg: '#EEF0FB' };
  return { label: 'Cold', color: '#95A5A6', bg: '#F0F3F4' };
}

export function exportLeadsToCSV(leads) {
  const headers = [
    'Company', 'Industry', 'Contact', 'Position', 'Email', 'Phone',
    'Location', 'Size', 'Source', 'Status', 'Interest', 'Value',
    'Assigned To', 'Created', 'Last Contacted', 'Next Follow-up',
  ];
  const esc = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = leads.map(l => [
    l.companyName, l.industry, l.contactPersonName, l.contactPersonPosition,
    l.email, l.phone, l.location, l.companySize, l.source,
    l.status, l.interestLevel, l.potentialValue || 0,
    l.assignedToName || '', formatDate(l.createdAt),
    formatDate(l.lastContactedAt), formatDate(l.nextFollowUpDate),
  ]);
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = `softhub-leads-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export function getDashboardStats(leads) {
  const total = leads.length;
  const won = leads.filter(l => l.status === 'Won');
  const lost = leads.filter(l => l.status === 'Lost');
  const wonValue = won.reduce((s, l) => s + (l.potentialValue || 0), 0);
  const totalClosed = won.length + lost.length;
  const conversionRate = totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0;
  const byStage = {};
  leads.forEach(l => { byStage[l.status] = (byStage[l.status] || 0) + 1; });
  const pipelineValue = leads
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .reduce((s, l) => s + (l.potentialValue || 0), 0);
  return { total, wonValue, conversionRate, byStage, pipelineValue, wonCount: won.length };
}
