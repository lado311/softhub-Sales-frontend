import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const ToastComponent = toast ? (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: toast.type === 'success' ? '#27AE60' : '#E74C3C',
      color: '#fff', padding: '11px 20px', borderRadius: 10,
      fontSize: '0.86rem', fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
    </div>
  ) : null;
  return { show, ToastComponent };
}
