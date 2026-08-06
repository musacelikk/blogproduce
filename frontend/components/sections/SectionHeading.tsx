import * as React from 'react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  /** `lg` for top-level section titles, `md` for sub-sections. */
  size?: 'lg' | 'md';
  /** Optional trailing link/button, right-aligned on wide screens. */
  action?: React.ReactNode;
  as?: 'h1' | 'h2';
  className?: string;
}

/**
 * One heading block for every marketing section: eyebrow → display headline →
 * supporting sentence. Keeps the vertical rhythm identical across pages.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  size = 'lg',
  action,
  as: Tag = 'h2',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        centered ? 'items-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'text-center')}>
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <Tag
          className={cn(
            'text-balance text-foreground-strong',
            size === 'lg' ? 'text-display-lg' : 'text-display-md',
            eyebrow && 'mt-3',
          )}
        >
          {title}
        </Tag>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
