import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NotificationToast from '../components/common/NotificationToast';

const ToastContext = createContext({
  addToast: () => {},
  removeToast: () => {},
  clearToasts: () => {},
});

let toastCounter = 0;

const generateId = () => {
  toastCounter += 1;
  const random = Math.random().toString(16).slice(2, 6);
  return `toast-${toastCounter}-${random}`;
};

export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleRemoval = useCallback(
    (id, duration) => {
      if (!duration) return;
      const timer = window.setTimeout(() => {
        removeToast(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [removeToast],
  );

  const addToast = useCallback(
    ({ title, message = '', variant = 'info', duration = 4500 }) => {
      const id = generateId();
      setToasts((current) => {
        const nextToasts = [{ id, title, message, variant, duration }, ...current];
        return nextToasts.slice(0, maxToasts);
      });
      scheduleRemoval(id, duration);
      return id;
    },
    [maxToasts, scheduleRemoval],
  );

  const clearToasts = useCallback(() => {
    timers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => clearToasts, [clearToasts]);

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
      clearToasts,
    }),
    [addToast, removeToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 flex justify-end px-4 sm:top-6 sm:px-6 lg:px-8" style={{ zIndex: 'var(--z-toast)' }}>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <NotificationToast key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

