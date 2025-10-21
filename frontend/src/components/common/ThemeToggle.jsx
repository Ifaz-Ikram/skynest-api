import { useCallback, useMemo, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const animationClasses =
  'transition-all duration-200 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-secondary dark:focus-visible:ring-accent-primary focus-visible:ring-offset-2';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = useCallback(() => {
    setIsPressed(true);
    toggleTheme();
    window.setTimeout(() => setIsPressed(false), 300);
  }, [toggleTheme]);

  const icon = useMemo(
    () =>
      theme === 'dark' ? (
        <MoonStar className="h-4 w-4 text-accent-primary transition-transform duration-200 dark:text-accent-primary" />
      ) : (
        <SunMedium className="h-4 w-4 text-accent-secondary transition-transform duration-200" />
      ),
    [theme],
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={theme === 'dark'}
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface-primary px-3 py-1.5 shadow-sm hover:shadow-md dark:bg-surface-secondary ${animationClasses} ${className}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-transparent transition-transform duration-300 ${
          isPressed ? 'scale-90' : 'scale-100'
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-200">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
