import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 4;

  const addToast = useCallback((message: string, type: ToastType) => {
    setToasts((prev) => {
      const newToast = { id: Math.random().toString(36).substr(2, 9), message, type };
      const next = [...prev, newToast];
      if (next.length > MAX_TOASTS) {
        return next.slice(1); // Remove oldest
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (msg: string) => addToast(msg, 'success');
  const error = (msg: string) => addToast(msg, 'error');
  const info = (msg: string) => addToast(msg, 'info');

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .toast-container {
            right: 16px;
            left: 16px;
            bottom: 16px;
            align-items: center;
          }
        }

        .toast-item {
          pointer-events: auto;
          min-width: 280px;
          max-width: 400px;
          min-height: 48px;
          background: var(--c-surface);
          color: var(--c-ink);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          animation: toast-in 300ms ease forwards;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast-item.exiting {
          animation: toast-out 300ms ease forwards;
        }

        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }

        .toast-content {
          padding: 12px 16px;
          flex: 1;
          display: flex;
          align-items: center;
          border-left: 4px solid transparent;
        }

        .toast-success .toast-content { border-left-color: var(--c-accent); }
        .toast-error .toast-content { border-left-color: #ef4444; } /* Red */
        .toast-info .toast-content { border-left-color: var(--c-muted); }

        .toast-progress-container {
          height: 3px;
          background: rgba(255,255,255,0.05);
          width: 100%;
        }

        .toast-progress-bar {
          height: 100%;
          background: currentColor;
          opacity: 0.3;
          width: 100%;
          transform-origin: left;
          animation: toast-progress 3500ms linear forwards;
        }

        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }

        .toast-success { color: var(--c-accent); }
        .toast-error { color: #ef4444; }
        .toast-info { color: var(--c-muted); }
        
        /* Ensure text is ink color regardless of border color */
        .toast-message {
          color: var(--c-ink);
          font-weight: 500;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 300);
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onRemove]);

  return (
    <div className={`toast-item toast-${toast.type} ${isExiting ? 'exiting' : ''}`}>
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
      </div>
      <div className="toast-progress-container">
        <div className="toast-progress-bar" />
      </div>
    </div>
  );
};
