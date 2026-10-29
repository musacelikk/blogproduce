'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  applyPreference,
  readPreference,
  resolveTheme,
  type ThemePreference,
} from '@/lib/theme';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

const META: Record<ThemePreference, { icon: typeof Sun; label: string }> = {
  system: { icon: Monitor, label: 'Tema: sistem' },
  light: { icon: Sun, label: 'Tema: açık' },
  dark: { icon: Moon, label: 'Tema: koyu' },
};

/**
 * Cycles system → light → dark.
 *
 * Renders a stable placeholder until mounted: the server cannot know the
 * viewer's stored preference, so rendering an icon during SSR would guarantee a
 * hydration mismatch on every themed page.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setPreference(readPreference());
  }, []);

  // While following the system, track changes to it live.
  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyPreference('system');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference]);

  if (!preference) {
    return <div className={cn('h-9 w-9', className)} aria-hidden />;
  }

  const { icon: Icon, label } = META[preference];
  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => {
        applyPreference(next);
        setPreference(next);
      }}
      title={label}
      aria-label={`${label}. Değiştirmek için tıklayın (${META[next].label.toLowerCase()}).`}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
        'transition-colors duration-fast ease-out-quart hover:bg-secondary hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
