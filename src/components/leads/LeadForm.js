import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import {
  INDUSTRIES, SOURCES, COMPANY_SIZES,
  INTEREST_LEVELS, PIPELINE_STAGES,
} from '../../utils/helpers';

const FIELD_STYLE = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  fontSize: '0.86rem', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'var(--font)',
};

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...FIELD_STYLE, borderColor: focused ? 'var(--accent)' : 'var(--border)' }}
    />
  );
}

function Select({ value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
      <select
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          size={1}
          style={{
            ...FIELD_STYLE,
            borderColor: focused ? 'var(--accent)' : 'var(--border)',
            cursor: 'pointer',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
      >
      {options.map(o => (
        <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>
          {typeof o === 'object' ? o.label : o}
        </option>
      ))}
    </select>
  );
}

const EMPTY = {
  companyName: '', industry: 'Retail', contactPersonName: '',
  contactPersonPosition: 'Manager', phone: '', email: '',
  location: '', companySize: 'Small', source: 'Website',
  status: 'New', interestLevel: 'Medium', potentialValue: '',
  assignedToId: '', nextFollowUpDate: '', initialNote: '',
};

export default function LeadForm({ initial, onSubmit, onCancel }) {
  const { users } = useCRM();
  const { user } = useAuth();

  const [form, setForm] = useState(initial ? {
    ...EMPTY,
    ...initial,
    potentialValue: initial.potentialValue?.toString() || '',
    assignedToId: initial.assignedToId?.toString() || initial.assignedTo?.id?.toString() || '',
    nextFollowUpDate: initial.nextFollowUpDate ? initial.nextFollowUpDate.split('T')[0] : '',
    initialNote: '',
  } : {
    ...EMPTY,
    assignedToId: user?.id?.toString() || '',
  });
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.contactPersonName.trim()) e.contactPersonName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({
      ...form,
      potentialValue: parseFloat(form.potentialValue) || 0,
      assignedToId: form.assignedToId ? parseInt(form.assignedToId) : null,
      nextFollowUpDate: form.nextFollowUpDate || null,
    });
  };

  const userOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map(u => ({ value: u.id.toString(), label: u.fullName })),
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Company Name" required>
            <Input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Acme Corp" />
            {errors.companyName && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.companyName}</span>}
          </Field>
        </div>
        <Field label="Industry">
          <Select value={form.industry} onChange={set('industry')} options={INDUSTRIES} />
        </Field>
        <Field label="Company Size">
          <Select value={form.companySize} onChange={set('companySize')} options={COMPANY_SIZES} />
        </Field>
        <Field label="Contact Person" required>
          <Input value={form.contactPersonName} onChange={set('contactPersonName')} placeholder="Full name" />
          {errors.contactPersonName && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.contactPersonName}</span>}
        </Field>
        <Field label="Position">
          <Select value={form.contactPersonPosition} onChange={set('contactPersonPosition')}
            options={['Owner', 'Director', 'Manager', 'CEO', 'CTO', 'CFO', 'Other']} />
        </Field>
        <Field label="Email" required>
          <Input value={form.email} onChange={set('email')} placeholder="contact@company.com" type="email" />
          {errors.email && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.email}</span>}
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={set('location')} placeholder="City, Country" />
        </Field>
        <Field label="Source">
          <Select value={form.source} onChange={set('source')} options={SOURCES} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')} options={PIPELINE_STAGES} />
        </Field>
        <Field label="Interest Level">
          <Select value={form.interestLevel} onChange={set('interestLevel')} options={INTEREST_LEVELS} />
        </Field>
        <Field label="Potential Value ($)">
          <Input value={form.potentialValue} onChange={set('potentialValue')} placeholder="0" type="number" />
        </Field>
        <Field label="Assigned To">
          <Select value={form.assignedToId} onChange={set('assignedToId')} options={userOptions} />
        </Field>
        <Field label="Next Follow-up">
          <Input value={form.nextFollowUpDate} onChange={set('nextFollowUpDate')} type="date" />
        </Field>
        {!initial && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Initial Note">
              <textarea
                value={form.initialNote}
                onChange={e => set('initialNote')(e.target.value)}
                placeholder="Add an initial note about this lead..."
                style={{ ...FIELD_STYLE, minHeight: 80, resize: 'vertical' }}
              />
            </Field>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button onClick={onCancel} style={btn.secondary}>Cancel</button>
        <button onClick={handleSubmit} style={btn.primary}>
          {initial ? 'Save Changes' : 'Create Lead'}
        </button>
      </div>
    </div>
  );
}

const btn = {
  primary: { padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font)' },
  secondary: { padding: '9px 20px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font)' },
};
