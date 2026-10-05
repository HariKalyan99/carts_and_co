import { cn } from '../../lib/utils'
import { TONES } from '../../lib/variants'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]', className)}
      {...props}
    />
  )
}

export function Badge({ tone = 'neutral', className, children, dot }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} aria-hidden />
}

export function EmptyState({ emoji = '🫙', title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-accent text-3xl">{emoji}</div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-fg">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeading({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-fg">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error, action }) {
  return (
    <EmptyState
      emoji="🧯"
      title="Something went wrong"
      description={error?.message ?? 'Please try again.'}
      action={action}
    />
  )
}
