/**
 * Theme handling, without a dependency.
 *
 * Three states are stored: 'light', 'dark', and 'system' (the default, which
 * follows `prefers-color-scheme`). The resolved theme is applied as a `dark`
 * class on `<html>`, which is where `globals.css` expects it.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bp-theme';

/**
 * The inline script that runs before first paint.
 *
 * This has to be a string injected into <head>: resolving the theme in React
 * would mean the light theme paints first and then flips, which is the flash
 * every themed site is judged by. Kept dependency-free and wrapped in
 * try/catch, since localStorage throws in private mode and on blocked storage.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var k='${THEME_STORAGE_KEY}',p=localStorage.getItem(k);
var d=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',d);
}catch(e){}})();`;

export function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage blocked — fall through to the system preference.
  }
  return 'system';
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/** Applies the theme to the document and persists the preference. */
export function applyPreference(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A theme that cannot be remembered still applies for this page view.
  }
  return resolved;
}
