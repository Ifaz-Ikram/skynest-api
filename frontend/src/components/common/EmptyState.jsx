import { forwardRef } from 'react';
import { FileQuestion } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const EmptyState = forwardRef(
  (
    {
      icon: Icon = FileQuestion,
      title = 'Nothing to display yet',
      message = 'We could not find any records matching this view.',
      action,
      horizontal = false,
      className = '',
      children,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const iconBackground =
      theme === 'dark' ? 'rgba(96, 165, 250, 0.12)' : 'rgba(59, 130, 246, 0.12)';

    return (
      <section
        ref={ref}
        aria-live="polite"
        className={`flex w-full items-center justify-center rounded-2xl border border-border bg-surface-primary px-6 py-12 text-center shadow-sm transition-colors duration-300 dark:bg-surface-secondary ${
          horizontal ? 'sm:flex-row sm:text-left' : 'sm:flex-col'
        } ${className}`}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full`}
          style={{ backgroundColor: iconBackground }}
        >
          <Icon className="h-7 w-7 text-accent-secondary" strokeWidth={1.4} />
        </div>
        <div className={`${horizontal ? 'sm:ml-6 sm:flex-1' : 'mt-5 w-full space-y-2'}`}>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{message}</p>
          {children}
          {action && <div className="mt-6 flex justify-center sm:justify-start">{action}</div>}
        </div>
      </section>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;

