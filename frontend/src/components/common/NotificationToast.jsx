import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: ShieldAlert,
  info: Info,
};

const NotificationToast = ({ toast, onDismiss }) => {
  const { theme } = useTheme();
  const { title, message, variant = 'info', id } = toast;

  const palette = useMemo(() => {
    const base = {
      success: {
        color: 'var(--success)',
        background: theme === 'dark' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.12)',
        border: theme === 'dark' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.25)',
      },
      error: {
        color: 'var(--error)',
        background: theme === 'dark' ? 'rgba(248, 113, 113, 0.18)' : 'rgba(239, 68, 68, 0.12)',
        border: theme === 'dark' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(239, 68, 68, 0.25)',
      },
      warning: {
        color: 'var(--warning)',
        background: theme === 'dark' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(245, 158, 11, 0.12)',
        border: theme === 'dark' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(245, 158, 11, 0.25)',
      },
      info: {
        color: 'var(--accent-secondary)',
        background: theme === 'dark' ? 'rgba(96, 165, 250, 0.18)' : 'rgba(59, 130, 246, 0.12)',
        border: theme === 'dark' ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.25)',
      },
    };
    return base[variant] ?? base.info;
  }, [variant, theme]);

  const Icon = ICONS[variant] ?? ICONS.info;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 overflow-hidden rounded-xl border bg-surface-primary p-4 shadow-lg transition-transform duration-300"
      style={{
        borderColor: palette.border,
        backgroundColor: palette.background,
      }}
      data-toast-id={id}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: palette.border, color: palette.color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {message && <p className="mt-1 text-sm text-text-secondary">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="rounded-full p-1 text-text-tertiary transition-colors duration-150 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-secondary"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationToast;

