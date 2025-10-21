import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRange = (range) => {
  const start = toDate(range?.startDate);
  const end = toDate(range?.endDate);
  if (!start && !end) return { startDate: null, endDate: null };

  if (start && end) {
    return isAfter(start, end)
      ? { startDate: endOfDay(end), endDate: startOfDay(start) }
      : { startDate: startOfDay(start), endDate: endOfDay(end) };
  }

  if (start) {
    return { startDate: startOfDay(start), endDate: null };
  }

  return { startDate: null, endDate: endOfDay(end) };
};

const defaultPresets = [
  {
    id: 'today',
    label: 'Today',
    resolve: () => {
      const today = startOfToday();
      return { startDate: startOfDay(today), endDate: endOfDay(today) };
    },
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    resolve: () => {
      const today = startOfToday();
      const start = subDays(today, 1);
      return { startDate: startOfDay(start), endDate: endOfDay(start) };
    },
  },
  {
    id: 'last7',
    label: 'Last 7 days',
    resolve: () => {
      const today = startOfToday();
      return { startDate: startOfDay(subDays(today, 6)), endDate: endOfDay(today) };
    },
  },
  {
    id: 'last30',
    label: 'Last 30 days',
    resolve: () => {
      const today = startOfToday();
      return { startDate: startOfDay(subDays(today, 29)), endDate: endOfDay(today) };
    },
  },
  {
    id: 'thisMonth',
    label: 'This month',
    resolve: () => {
      const today = startOfToday();
      return { startDate: startOfDay(startOfMonth(today)), endDate: endOfDay(endOfMonth(today)) };
    },
  },
  {
    id: 'lastMonth',
    label: 'Last month',
    resolve: () => {
      const today = startOfToday();
      const previous = subMonths(today, 1);
      return {
        startDate: startOfDay(startOfMonth(previous)),
        endDate: endOfDay(endOfMonth(previous)),
      };
    },
  },
];

const AdvancedDateRangePicker = ({
  value,
  onChange,
  presets = defaultPresets,
  displayFormat = 'MMM d, yyyy',
  placeholder = 'Select date range',
  disabled = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = useMemo(() => normalizeRange(value), [value]);
  const [draftRange, setDraftRange] = useState(normalizedValue);
  const [activeMonth, setActiveMonth] = useState(
    normalizedValue.startDate ?? startOfToday(),
  );
  const containerRef = useRef(null);
  const applyButtonRef = useRef(null);

  useEffect(() => {
    setDraftRange(normalizedValue);
    if (normalizedValue.startDate) {
      setActiveMonth(normalizedValue.startDate);
    }
  }, [normalizedValue.startDate, normalizedValue.endDate]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => applyButtonRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const monthLabel = format(activeMonth, 'MMMM yyyy');
  const startOfCalendar = startOfWeek(startOfMonth(activeMonth), { weekStartsOn: 1 });
  const endOfCalendar = endOfWeek(endOfMonth(activeMonth), { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });

  const isDayActive = (day) =>
    (draftRange.startDate && isSameDay(day, draftRange.startDate)) ||
    (draftRange.endDate && isSameDay(day, draftRange.endDate));

  const isDayInRange = (day) => {
    if (!draftRange.startDate || !draftRange.endDate) return false;
    const startDate = draftRange.startDate;
    const endDate = draftRange.endDate;
    return isWithinInterval(day, {
      start: startDate <= endDate ? startDate : endDate,
      end: endDate >= startDate ? endDate : startDate,
    });
  };

  const handleDayClick = (day) => {
    if (disabled) return;

    if (!draftRange.startDate || (draftRange.startDate && draftRange.endDate)) {
      setDraftRange({ startDate: day, endDate: null });
      return;
    }

    if (draftRange.startDate && !draftRange.endDate) {
      const isBeforeStart = isBefore(day, draftRange.startDate);
      setDraftRange({
        startDate: isBeforeStart ? day : draftRange.startDate,
        endDate: isBeforeStart ? draftRange.startDate : day,
      });
    }
  };

  const handlePresetClick = (preset) => {
    if (!preset?.resolve) return;
    const nextRange = normalizeRange(preset.resolve());
    setDraftRange(nextRange);
    onChange?.(nextRange);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange?.(normalizeRange(draftRange));
    setIsOpen(false);
  };

  const handleClear = () => {
    setDraftRange({ startDate: null, endDate: null });
    onChange?.({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const renderLabel = () => {
    const { startDate, endDate } = normalizedValue;
    if (!startDate || !endDate) {
      return placeholder;
    }
    return `${format(startDate, displayFormat)} - ${format(endDate, displayFormat)}`;
  };

  const weekDayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) }).map((day) =>
      format(day, 'EEE'),
    );
  }, []);

  const panelBackground =
    theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((open) => !open)}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-primary px-4 py-2 text-left text-sm font-medium text-text-primary shadow-sm transition-colors duration-200 hover:border-accent-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-secondary dark:bg-surface-secondary"
      >
        <span className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-text-tertiary" />
          <span className={normalizedValue.startDate && normalizedValue.endDate ? '' : 'text-text-tertiary'}>
            {renderLabel()}
          </span>
        </span>
        <ChevronRight className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
      </button>

      {isOpen && (
        <div
          ref={containerRef}
          className="absolute z-50 mt-2 flex w-full max-w-xl gap-4 rounded-2xl border border-border bg-surface-primary p-4 shadow-xl dark:bg-surface-secondary"
          style={{ backgroundColor: panelBackground }}
        >
          <aside className="hidden w-40 flex-shrink-0 flex-col space-y-2 rounded-xl border border-border bg-surface-secondary p-3 dark:bg-surface-tertiary sm:flex">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Quick ranges
            </h4>
            <div className="flex flex-col space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between pb-3">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                onClick={() => setActiveMonth((current) => subMonths(current, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-text-primary">{monthLabel}</p>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                onClick={() => setActiveMonth((current) => addMonths(current, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              {weekDayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const disabledDay = false;
                const isActive = isDayActive(day);
                const withinRange = isDayInRange(day);
                const isOutsideMonth = day.getMonth() !== activeMonth.getMonth();

                const backgroundColor = isActive
                  ? 'var(--accent-secondary)'
                  : withinRange
                  ? theme === 'dark'
                    ? 'rgba(96, 165, 250, 0.15)'
                    : 'rgba(59, 130, 246, 0.12)'
                  : 'transparent';

                const textColor = isActive ? '#FFFFFF' : 'var(--text-primary)';

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    disabled={disabledDay}
                    className="relative flex h-10 w-full items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-colors duration-150 hover:border-accent-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                    style={{
                      backgroundColor,
                      color: textColor,
                      opacity: isOutsideMonth && !isActive ? 0.6 : 1,
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary">
                {draftRange.startDate ? format(draftRange.startDate, displayFormat) : 'Start date'}
                <span className="text-text-tertiary">to</span>
                {draftRange.endDate ? format(draftRange.endDate, displayFormat) : 'End date'}
              </div>
              <div className="flex items-center gap-2">
                {(draftRange.startDate || draftRange.endDate) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  ref={applyButtonRef}
                  onClick={handleApply}
                  className="inline-flex items-center rounded-lg bg-accent-secondary px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-150 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-secondary"
                >
                  Apply range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDateRangePicker;
