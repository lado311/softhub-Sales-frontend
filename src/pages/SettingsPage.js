import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { usersApi, authApi } from '../api/client';
import { useToast } from '../hooks/useApi';
import { PIPELINE_STAGES, STAGE_COLORS } from '../utils/helpers';
import { User, Tag, Bell, Shield, Plus, Trash2, Save } from 'lucide-react';

const TABS = [
  { key: 'account', label: 'My Account', icon: User },
  { key: 'team', label: 'Team', icon: Shield },
  { key: 'pipeline', label: 'Pipeline', icon: Tag },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const { show, ToastComponent } = useToast();
  const tabs = TABS.filter(t => t.key !== 'team' || isAdmin);

  return (
    <div className="fade-in">
      {ToastComponent}
      <div style={{
        ...S.layout,
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'
      }}>
        <div style={S.tabSidebar}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...S.tabBtn, background: activeTab === key ? 'var(--accent-light)' : 'transparent', color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: activeTab === key ? 600 : 400 }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
        <div style={S.tabContent}>
          {activeTab === 'account' && <AccountTab onSave={show} />}
          {activeTab === 'team' && isAdmin && <TeamTab onSave={show} />}
          {activeTab === 'pipeline' && <PipelineTab />}
          {activeTab === 'notifications' && <NotificationsTab onSave={show} />}
        </div>
      </div>
    </div>
  );
}

function AccountTab({ onSave }) {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await usersApi.update(user.id, form);
      setUser(data);
      onSave('Profile updated');
    } catch (e) {
      onSave(e.response?.data?.message || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { onSave('Passwords do not match', 'error'); return; }
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      onSave('Password changed');
    } catch (e) {
      onSave(e.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div>
      <Heading title="My Account" sub="Update your profile and password" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <FieldRow label="Full Name">
          <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={S.input} />
        </FieldRow>
        <FieldRow label="Email">
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" style={S.input} />
        </FieldRow>
      </div>
      <SaveRow onSave={saveProfile} loading={saving} />

      <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <Heading title="Change Password" sub="Choose a strong password" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <FieldRow label="Current Password">
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} style={S.input} />
          </FieldRow>
          <FieldRow label="New Password">
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} style={S.input} />
          </FieldRow>
          <FieldRow label="Confirm Password">
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} style={S.input} />
          </FieldRow>
        </div>
        <SaveRow onSave={changePassword} label="Change Password" />
      </div>
    </div>
  );
}

function TeamTab({ onSave }) {
  const { users, fetchUsers } = useCRM();
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'Manager' });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) return;
    setAdding(true);
    try {
      await authApi.register(newUser);
      await fetchUsers();
      setNewUser({ fullName: '', email: '', password: '', role: 'Manager' });
      onSave('User added');
    } catch (e) {
      onSave(e.response?.data?.message || 'Failed to add user', 'error');
    } finally { setAdding(false); }
  };

  const handleToggleActive = async (u) => {
    await usersApi.update(u.id, { isActive: !u.isActive });
    await fetchUsers();
    onSave(`${u.fullName} ${u.isActive ? 'deactivated' : 'activated'}`);
  };

  return (
    <div>
      <Heading title="Sales Team" sub="Manage users who can access the CRM" />
      <div style={S.list}>
        {users.map(u => (
          <div key={u.id} style={S.listItem}>
            <div style={S.memberAvatar}>{u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{u.fullName}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.email} · {u.role}</div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: u.isActive ? 'var(--success)' : 'var(--danger)', background: u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '2px 8px', borderRadius: 20 }}>
              {u.isActive ? 'Active' : 'Inactive'}
            </span>
            <button onClick={() => handleToggleActive(u)} style={{ ...S.smallBtn, fontSize: '0.72rem' }}>
              {u.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 12 }}>Add New User</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input value={newUser.fullName} onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))} placeholder="Full Name" style={S.input} />
          <input value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" style={S.input} />
          <input value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} placeholder="Password" type="password" style={S.input} />
          <select value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))} style={S.input}>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button onClick={handleAdd} disabled={adding} style={{ ...S.saveBtn, marginTop: 12 }}>
          <Plus size={14} /> {adding ? 'Adding…' : 'Add User'}
        </button>
      </div>
    </div>
  );
}

function PipelineTab() {
  return (
    <div>
      <Heading title="Pipeline Stages" sub="The 7 standard B2B sales pipeline stages" />
      <div style={S.list}>
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage} style={S.listItem}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{stage}</span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Stage {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab({ onSave }) {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sh_notif')) || { overdueAlerts: true, sidebarBadge: true, dueSoonDays: 2 }; } catch { return { overdueAlerts: true, sidebarBadge: true, dueSoonDays: 2 }; }
  });
  const save = () => { localStorage.setItem('sh_notif', JSON.stringify(prefs)); onSave('Preferences saved'); };
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <Heading title="Notification Preferences" sub="Control follow-up alerts" />
      <div style={S.list}>
        <PrefRow label="Overdue Follow-up Alerts" sub="Show alerts when follow-up is past due" checked={prefs.overdueAlerts} onToggle={() => toggle('overdueAlerts')} />
        <PrefRow label="Sidebar Badge" sub="Show overdue count badge on Follow-ups" checked={prefs.sidebarBadge} onToggle={() => toggle('sidebarBadge')} />
        <div style={{ ...S.listItem, cursor: 'default' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>Due-soon window</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Highlight follow-ups within N days</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" min={1} max={14} value={prefs.dueSoonDays}
              onChange={e => setPrefs(p => ({ ...p, dueSoonDays: +e.target.value }))}
              style={{ ...S.input, width: 64, textAlign: 'center' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
          </div>
        </div>
      </div>
      <SaveRow onSave={save} />
    </div>
  );
}

function Heading({ title, sub }) {
  return <div style={{ marginBottom: 18 }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h2>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</p>
  </div>;
}
function FieldRow({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    {children}
  </div>;
}
function SaveRow({ onSave, label = 'Save Changes', loading = false }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
    <button onClick={onSave} disabled={loading} style={S.saveBtn}><Save size={14} /> {loading ? 'Saving…' : label}</button>
  </div>;
}
function PrefRow({ label, sub, checked, onToggle }) {
  return <div style={{ ...S.listItem, cursor: 'pointer' }} onClick={onToggle}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  </div>;
}

const S = {
  layout: { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, alignItems: 'start' },
  tabSidebar: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.84rem', transition: 'all 0.15s', width: '100%', fontFamily: 'var(--font)' },
  tabContent: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 26px' },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-hover)', marginBottom: 2 },
  memberAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 },
  input: { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.86rem', outline: 'none', fontFamily: 'var(--font)', width: '100%' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font)' },
  smallBtn: { padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font)' },
};
