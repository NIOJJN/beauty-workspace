import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold leading-none tracking-tight transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-soft',
        soft: 'border-primary/15 bg-primary/10 text-primary',
        secondary: 'border-border/70 bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border bg-card/70 text-foreground backdrop-blur',
        success: 'border-success/20 bg-success/12 text-success',
        warning: 'border-warning/25 bg-warning/15 text-warning-foreground',
        info: 'border-info/20 bg-info/12 text-info',
        accent: 'border-accent-foreground/10 bg-accent text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
