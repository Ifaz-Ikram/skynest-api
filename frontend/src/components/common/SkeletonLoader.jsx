import { memo } from 'react';
import { useTheme } from '../../context/ThemeContext';

const repeat = (count) => Array.from({ length: count }, (_, index) => index);

const CardSkeleton = ({ cardBackground }) => (
  <div
    className="skeleton flex flex-col space-y-4 rounded-xl px-5 py-6 shadow-sm"
    style={{ backgroundColor: cardBackground }}
  >
    <div className="h-4 w-1/3 rounded-full bg-white/40 dark:bg-white/20" />
    <div className="h-3 w-2/3 rounded-full bg-white/35 dark:bg-white/15" />
    <div className="h-32 w-full rounded-xl bg-white/25 dark:bg-white/10" />
  </div>
);

const ListSkeleton = ({ cardBackground }) => (
  <div
    className="flex w-full items-center justify-between rounded-lg border border-transparent px-4 py-3 shadow-sm"
    style={{ backgroundColor: cardBackground }}
  >
    <div className="flex flex-1 items-center gap-3">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="skeleton h-3 w-20 rounded-full" />
      </div>
    </div>
    <div className="skeleton h-8 w-14 rounded-full" />
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 5, cardBackground, headerBackground }) => (
  <div
    className="overflow-hidden rounded-xl border border-border shadow-sm"
    style={{ backgroundColor: cardBackground }}
  >
    <div
      className="grid grid-cols-12 border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300"
      style={{ backgroundColor: headerBackground }}
    >
      {repeat(columns).map((item) => (
        <div key={`head-${item}`} className="h-3 w-full rounded-full bg-surface-tertiary" />
      ))}
    </div>
    <div className="divide-y divide-border">
      {repeat(rows).map((row) => (
        <div key={`row-${row}`} className="grid grid-cols-12 gap-3 px-4 py-4">
          {repeat(columns).map((col) => (
            <div key={`cell-${row}-${col}`} className="skeleton h-3 w-full rounded-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SkeletonLoader = memo(
  ({ type = 'card', count = 1, className = '', tableConfig = { rows: 5, columns: 5 } }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const cardBackground = isDark ? 'rgba(30, 41, 59, 0.72)' : 'rgba(255, 255, 255, 0.9)';
    const headerBackground = isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(243, 244, 246, 0.85)';

    const items = repeat(count);

    if (type === 'table') {
      return (
        <div className={className}>
          <TableSkeleton
            rows={tableConfig.rows}
            columns={tableConfig.columns}
            cardBackground={cardBackground}
            headerBackground={headerBackground}
          />
        </div>
      );
    }

    const Renderer = type === 'list' ? ListSkeleton : CardSkeleton;

    return (
      <div className={`grid gap-4 ${className}`}>
        {items.map((item) => (
          <Renderer key={`skeleton-${type}-${item}`} cardBackground={cardBackground} />
        ))}
      </div>
    );
  },
);

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
