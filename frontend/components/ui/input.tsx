import * as React from 'react';

import { cn } from '@/lib/utils';

const fieldClasses =
  'flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ' +
  'shadow-[inset_0_1px_2px_0_rgb(15_23_42/0.04)] ' +
  'transition-[border-color,box-shadow] duration-fast ease-out-quart ' +
  'placeholder:text-muted-foreground/70 hover:border-strong ' +
  'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60 ' +
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        fieldClasses,
        'h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input, fieldClasses };
