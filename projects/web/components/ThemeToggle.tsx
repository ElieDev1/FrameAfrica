'use client';

/**
 * Light/dark switch. Stateless: the theme lives on <html data-theme> (set before
 * paint by the root-layout script), so this just flips that attribute and
 * persists the choice. Both icons are always rendered and CSS shows the right
 * one per theme (globals.css), which keeps SSR and client markup identical.
 */
export function ThemeToggle() {
  const toggle = () => {
    const el = document.documentElement;
    const next = el.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    el.setAttribute('data-theme', next);
    try {
      localStorage.setItem('fa-theme', next);
    } catch {
      // a blocked localStorage just means the choice isn't persisted
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch theme"
      className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
    >
      {/* Sun — shown in dark mode (tap → light) */}
      <svg
        className="theme-icon-dark"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Moon — shown in light mode (tap → dark) */}
      <svg
        className="theme-icon-light"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
