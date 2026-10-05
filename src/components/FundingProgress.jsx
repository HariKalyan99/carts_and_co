import { motion } from 'motion/react'
import { cn } from '../lib/utils'

/**
 * The bar spans the full batch capacity, with a marker at the funding goal,
 * so buyers can see both "how close to production" and "how many are left".
 */
export function FundingProgress({ pledged, goal, max, size = 'md', className }) {
  const fill = Math.min(100, (pledged / max) * 100)
  const goalAt = (goal / max) * 100
  const funded = pledged >= goal
  const pct = Math.round((pledged / goal) * 100)

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('font-semibold tabular-nums', size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-base')}>
          {pledged}
          <span className="text-muted-fg"> / {goal}</span>
        </p>
        <p className={cn('text-sm font-semibold tabular-nums', funded ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>
          {pct}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={pledged}
        aria-label="Pre-orders toward funding goal"
        className={cn('relative mt-2 rounded-full bg-muted', size === 'lg' ? 'h-3.5' : 'h-2.5')}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            funded
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-primary to-orange-400',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {goal < max && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-fg/60"
            style={{ left: `${goalAt}%` }}
            title={`Goal: ${goal}`}
          />
        )}
      </div>

      <p className={cn('mt-2 text-muted-fg', size === 'lg' ? 'text-sm' : 'text-xs')}>
        {funded
          ? `Goal reached — production unlocked · ${Math.max(0, max - pledged)} of ${max} left`
          : `pre-orders secured to trigger production`}
      </p>
    </div>
  )
}
