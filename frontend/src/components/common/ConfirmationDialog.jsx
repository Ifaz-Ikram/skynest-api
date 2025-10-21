import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ICON_VARIANTS = {
  danger: AlertTriangle,
  success: CheckCircle2,
  neutral: AlertTriangle,
};

const ConfirmationDialog = ({
  open,
  title = 'Confirm action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}) => {
  const confirmButtonRef = useRef(null);
  const previousFocus = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      window.setTimeout(() => confirmButtonRef.current?.focus(), 0);
    } else if (previousFocus.current) {
      previousFocus.current.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.();
      }
      if (event.key === 'Enter') {
        onConfirm?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const Icon = ICON_VARIANTS[variant] ?? ICON_VARIANTS.neutral;
  const highlightColor =
    variant === 'success'
      ? 'var(--success)'
      : variant === 'danger'
      ? 'var(--error)'
      : 'var(--accent-secondary)';

  const iconBackground =
    variant === 'success'
      ? theme === 'dark'
        ? 'rgba(52, 211, 153, 0.18)'
        : 'rgba(16, 185, 129, 0.14)'
      : variant === 'danger'
      ? theme === 'dark'
        ? 'rgba(248, 113, 113, 0.18)'
        : 'rgba(239, 68, 68, 0.14)'
      : theme === 'dark'
      ? 'rgba(96, 165, 250, 0.18)'
      : 'rgba(59, 130, 246, 0.14)';

  const panelBackground =
    theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.55)] backdrop-blur"
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface-primary p-6 shadow-2xl transition-transform duration-200 dark:bg-surface-secondary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        style={{ backgroundColor: panelBackground }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-text-tertiary transition-colors duration-150 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
          aria-label="Close dialog"
        >
          X
        </button>
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBackground, color: highlightColor }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 id="confirmation-dialog-title" className="text-lg font-semibold text-text-primary">
          {title}
        </h3>
        <p id="confirmation-dialog-message" className="mt-2 text-sm text-text-secondary">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-text-primary shadow-md transition-transform duration-150 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-75"
            style={{
              color: theme === 'dark' ? '#0F172A' : '#1F2937',
              backgroundColor: highlightColor,
            }}
          >
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-surface-primary border-t-transparent" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
