import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // checking session on mount

  // On mount: restore session if tokens exist
  useEffect(() => {
    const token = localStorage.getItem('sh_access_token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('sh_access_token');
        localStorage.removeItem('sh_refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('sh_access_token', data.accessToken);
    localStorage.setItem('sh_refresh_token', data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('sh_refresh_token');
    try { if (refreshToken) await authApi.logout(refreshToken); } catch {}
    localStorage.removeItem('sh_access_token');
    localStorage.removeItem('sh_refresh_token');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
