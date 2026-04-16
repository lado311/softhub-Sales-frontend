import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { leadsApi, usersApi, dashboardApi } from '../api/client';

const CRMContext = createContext(null);
const THEME_KEY = 'sh_theme';

export function CRMProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ─── Fetch all leads ──────────────────────────────────
  const fetchLeads = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await leadsApi.list({ pageSize: 200, ...params });
      setLeads(data.items);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch users (managers) ───────────────────────────
  const fetchUsers = useCallback(async () => {
    const { data } = await usersApi.list();
    setUsers(data);
  }, []);

  // ─── Fetch dashboard stats ────────────────────────────
  const fetchDashboard = useCallback(async () => {
    const { data } = await dashboardApi.stats();
    setDashboardStats(data);
    return data;
  }, []);

  // ─── Follow-up notifications ──────────────────────────
  const fetchFollowUps = useCallback(async () => {
    try {
      const { data } = await dashboardApi.followups();
      const notifs = [
        ...(data.overdue || []).map(l => ({
          id: l.id, type: 'overdue', company: l.companyName,
          days: Math.abs(Math.ceil(
            (new Date(l.nextFollowUpDate) - new Date()) / 86400000))
        })),
        ...(data.dueSoon || []).map(l => ({
          id: l.id, type: 'due_soon', company: l.companyName, days: 0
        })),
      ];
      setNotifications(notifs);
    } catch {}
  }, []);

  // ─── Lead CRUD ────────────────────────────────────────
  const addLead = useCallback(async (leadData) => {
    const { data } = await leadsApi.create(leadData);
    setLeads(prev => [data, ...prev]);
    return data;
  }, []);

  const updateLead = useCallback(async (id, updates) => {
    const { data } = await leadsApi.update(id, updates);
    setLeads(prev => prev.map(l =>
        l.id === id
            ? {
              ...l,
              ...data,
              // ეს ხაზები დარწმუნდება რომ assignedToId სწორად განახლდება
              assignedToId: data.assignedToId ?? data.assignedTo?.id ?? updates.assignedToId ?? l.assignedToId,
              assignedToName: data.assignedToName ?? data.assignedTo?.fullName ?? l.assignedToName,
            }
            : l
    ));
    return data;
  }, []);

  const deleteLead = useCallback(async (id) => {
    await leadsApi.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const moveLeadStage = useCallback(async (id, status) => {
    const { data } = await leadsApi.move(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    return data;
  }, []);

  const addNote = useCallback(async (leadId, text) => {
    const { data } = await leadsApi.addNote(leadId, text);
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, notes: [...(l.notes || []), data], lastContactedAt: new Date().toISOString() }
        : l
    ));
    return data;
  }, []);

  const bulkUpdate = useCallback(async (leadIds, updates) => {
    await leadsApi.bulk({ leadIds, ...updates });
    await fetchLeads();
  }, [fetchLeads]);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  return (
    <CRMContext.Provider value={{
      leads, users, dashboardStats, notifications, loading, darkMode,
      fetchLeads, fetchUsers, fetchDashboard, fetchFollowUps,
      addLead, updateLead, deleteLead, moveLeadStage, addNote, bulkUpdate,
      toggleDarkMode, setLeads,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
