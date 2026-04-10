import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ── Config per type ────────────────────────────────────────────────────────────
const CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: {
    icon: '✓',
    color: '#15803d',
    bg: 'rgba(220, 252, 231, 0.92)',
    border: '#86efac',
  },
  error: {
    icon: '✕',
    color: '#b91c1c',
    bg: 'rgba(254, 226, 226, 0.92)',
    border: '#fca5a5',
  },
  warning: {
    icon: '⚠',
    color: '#b45309',
    bg: 'rgba(254, 243, 199, 0.92)',
    border: '#fcd34d',
  },
  info: {
    icon: 'ℹ',
    color: '#1d4ed8',
    bg: 'rgba(219, 234, 254, 0.92)',
    border: '#93c5fd',
  },
};

const DARK_CONFIG: Record<ToastType, { color: string; bg: string; border: string }> = {
  success: { color: '#4ade80', bg: 'rgba(20, 83, 45, 0.92)', border: '#166534' },
  error:   { color: '#f87171', bg: 'rgba(69, 10, 10, 0.92)',  border: '#7f1d1d' },
  warning: { color: '#fbbf24', bg: 'rgba(78, 46, 2, 0.92)',   border: '#92400e' },
  info:    { color: '#60a5fa', bg: 'rgba(23, 37, 84, 0.92)',   border: '#1e3a8a' },
};

// ── Single Toast Item ──────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const cfg = CONFIG[toast.type];
  const dCfg = DARK_CONFIG[toast.type];

  const color  = isDark ? dCfg.color  : cfg.color;
  const bg     = isDark ? dCfg.bg     : cfg.bg;
  const border = isDark ? dCfg.border : cfg.border;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1.125rem',
        borderRadius: '12px',
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        minWidth: '280px',
        maxWidth: '420px',
        animation: toast.exiting
          ? 'toast-exit 0.3s cubic-bezier(0.4,0,0.2,1) forwards'
          : 'toast-enter 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => onRemove(toast.id)}
      role="alert"
      aria-live="polite"
    >
      {/* Icon bubble */}
      <div
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginTop: '1px',
        }}
      >
        {cfg.icon}
      </div>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: '0.9rem',
          fontWeight: 500,
          color: color,
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
          paddingTop: '3px',
        }}
      >
        {toast.message}
      </span>

      {/* Close × */}
      <div
        style={{
          flexShrink: 0,
          fontSize: '1rem',
          color: color,
          opacity: 0.6,
          lineHeight: 1,
          marginTop: '3px',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        ×
      </div>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────
let nextId = 0;
const DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    // Mark as exiting first for exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    const exitTimer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
    }, 300);
    timers.current.set(id, exitTimer);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    const timer = setTimeout(() => removeToast(id), DURATION);
    timers.current.set(id, timer);
  }, [removeToast]);

  // Cleanup on unmount
  useEffect(() => {
    const t = timers.current;
    return () => { t.forEach(clearTimeout); t.clear(); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes toast-exit {
          from { opacity: 1; transform: translateX(0)   scale(1); }
          to   { opacity: 0; transform: translateX(60px) scale(0.92); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
