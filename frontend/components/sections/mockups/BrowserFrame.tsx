import { cn } from '@/lib/utils';

/**
 * Chrome around a product mockup.
 *
 * The mockups replaced four PNG screenshots (~4.9MB in total) that could not
 * follow the theme and went stale every time the product's UI moved. Built from
 * design tokens instead, they are correct in both themes by construction.
 */
export function BrowserFrame({
  url,
  label,
  className,
  children,
}: {
  url: string;
  /** What the mockup depicts, for assistive technology. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-elevated',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="ml-3 truncate text-xs font-medium text-muted-foreground">{url}</span>
      </div>
      {/* The mockup's internals are decoration; the figure's label carries the meaning. */}
      <div aria-hidden className="bg-surface-sunken">
        {children}
      </div>
    </figure>
  );
}
