import { forwardRef } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ErrorState = forwardRef(
  (
    {
      title = 'Something went wrong',
      message = 'An unexpected error prevented the data from loading.',
      onRetry,
      retryLabel = 'Try again',
      details,
      icon: Icon = AlertTriangle,
      className = '',
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const iconBackground =
      theme === 'dark' ? 'rgba(248, 113, 113, 0.16)' : 'rgba(239, 68, 68, 0.12)';

    return (
      <section
        ref={ref}
        role="alert"
        className={`flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-surface-primary px-6 py-12 text-center shadow-sm transition-colors duration-300 dark:bg-surface-secondary ${className}`}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBackground }}
        >
          <Icon className="h-8 w-8 text-state-error" strokeWidth={1.4} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        {details && <p className="mt-2 text-xs text-slate-400">{details}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </button>
        )}
      </section>
    );
  },
);

ErrorState.displayName = 'ErrorState';

export default ErrorState;

