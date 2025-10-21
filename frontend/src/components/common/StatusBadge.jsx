import { useTheme } from '../../context/ThemeContext';

const combine = (...parts) => parts.filter(Boolean).join(' ');

const STATUS_TOKENS = {
  success: {
    label: 'Success',
    tone: {
      background: { light: 'rgba(16, 185, 129, 0.12)', dark: 'rgba(52, 211, 153, 0.16)' },
      border: { light: 'rgba(16, 185, 129, 0.25)', dark: 'rgba(52, 211, 153, 0.3)' },
      text: 'var(--success)',
    },
  },
  warning: {
    label: 'Warning',
    tone: {
      background: { light: 'rgba(245, 158, 11, 0.12)', dark: 'rgba(251, 191, 36, 0.16)' },
      border: { light: 'rgba(245, 158, 11, 0.25)', dark: 'rgba(251, 191, 36, 0.3)' },
      text: 'var(--warning)',
    },
  },
  error: {
    label: 'Error',
    tone: {
      background: { light: 'rgba(239, 68, 68, 0.12)', dark: 'rgba(248, 113, 113, 0.16)' },
      border: { light: 'rgba(239, 68, 68, 0.25)', dark: 'rgba(248, 113, 113, 0.3)' },
      text: 'var(--error)',
    },
  },
  info: {
    label: 'Information',
    tone: {
      background: { light: 'rgba(59, 130, 246, 0.12)', dark: 'rgba(96, 165, 250, 0.16)' },
      border: { light: 'rgba(59, 130, 246, 0.25)', dark: 'rgba(96, 165, 250, 0.3)' },
      text: 'var(--accent-secondary)',
    },
  },
  pending: {
    label: 'Pending',
    tone: {
      background: { light: 'rgba(107, 114, 128, 0.12)', dark: 'rgba(148, 163, 184, 0.16)' },
      border: { light: 'rgba(107, 114, 128, 0.25)', dark: 'rgba(148, 163, 184, 0.35)' },
      text: 'var(--text-secondary)',
    },
  },
  cancelled: {
    label: 'Cancelled',
    tone: {
      background: { light: 'rgba(148, 163, 184, 0.14)', dark: 'rgba(148, 163, 184, 0.22)' },
      border: { light: 'rgba(148, 163, 184, 0.3)', dark: 'rgba(148, 163, 184, 0.35)' },
      text: 'var(--text-tertiary)',
    },
  },
};

const SIZE_CLASSES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const DOT_SIZE = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

const StatusBadge = ({
  status = 'info',
  label,
  size = 'md',
  variant = 'solid',
  icon: Icon,
  className = '',
  toneOverride,
  ...props
}) => {
  const { theme } = useTheme();
  const normalizedStatus = STATUS_TOKENS[status?.toLowerCase?.()] ? status?.toLowerCase?.() : 'info';
  const tokens = STATUS_TOKENS[normalizedStatus];

  const tone = toneOverride ?? tokens.tone;
  const resolvedLabel = label ?? tokens.label;
  const isDarkTheme = theme === 'dark';
  const backgroundColor = isDarkTheme ? tone.background.dark : tone.background.light;
  const borderColor = isDarkTheme ? tone.border.dark : tone.border.light;

  return (
    <span
      className={combine(
        'inline-flex items-center rounded-full font-medium tracking-wide transition-transform duration-150',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        variant === 'outline' ? 'bg-transparent' : 'shadow-sm',
        className,
      )}
      style={{
        backgroundColor: variant === 'outline' ? 'transparent' : backgroundColor,
        color: tone.text,
        border: `1px solid ${borderColor}`,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        className={combine('inline-flex rounded-full transition-transform duration-200', DOT_SIZE[size])}
        style={{ backgroundColor: tone.text }}
      />
      {Icon && <Icon className={combine('h-3.5 w-3.5', size === 'lg' ? 'h-4 w-4' : '')} />}
      <span className="uppercase">
        {resolvedLabel}
        <span className="sr-only"> status</span>
      </span>
    </span>
  );
};

export default StatusBadge;
