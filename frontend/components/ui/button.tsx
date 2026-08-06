import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // A shared press affordance (subtle scale-down) and one easing curve give every
  // button in the product the same physical feel.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ' +
    'transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-out-quart ' +
    'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The inset highlight is what separates a "flat coloured rectangle" from
        // a button that looks like a real surface.
        default:
          'bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),0_1px_2px_0_rgb(15_23_42/0.16)] hover:bg-primary-dark',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),0_1px_2px_0_rgb(15_23_42/0.16)] hover:bg-destructive/90',
        outline:
          'border border-border bg-card text-foreground shadow-card hover:border-strong hover:bg-surface-raised',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'text-accent-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-[13px]',
        lg: 'h-11 px-6 text-[15px]',
        xl: 'h-12 px-7 text-[15px]',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
