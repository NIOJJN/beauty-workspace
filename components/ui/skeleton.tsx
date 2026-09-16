import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse-soft rounded-xl bg-gradient-to-r from-primary/[0.08] via-accent/60 to-primary/[0.08]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
