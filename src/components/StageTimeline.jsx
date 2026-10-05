import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'

/**
 * Vertical list on mobile, horizontal stepper from `md` up (unless `vertical`).
 * Each step: { id, label, emoji, state: 'done' | 'active' | 'upcoming', at? }
 */
export function StageTimeline({ steps, vertical = false, className }) {
  return (
    <ol className={cn('flex flex-col', !vertical && 'md:flex-row', className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li
            key={step.id}
            className={cn('relative flex gap-4 pb-6 last:pb-0', !vertical && 'md:flex-1 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center')}
            aria-current={step.state === 'active' ? 'step' : undefined}
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-11 bottom-1 left-[21px] w-0.5 rounded-full',
                  !vertical && 'md:top-[21px] md:right-[calc(-50%+28px)] md:bottom-auto md:left-[calc(50%+28px)] md:h-0.5 md:w-auto',
                  step.state === 'done' ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <div className="relative shrink-0">
              {step.state === 'active' && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <span
                className={cn(
                  'relative grid size-11 place-items-center rounded-full border-2 text-lg transition-colors',
                  step.state === 'done' && 'border-primary bg-primary text-primary-fg',
                  step.state === 'active' && 'border-primary bg-accent',
                  step.state === 'upcoming' && 'border-border bg-surface grayscale opacity-60',
                )}
              >
                {step.state === 'done' ? <Check className="size-5" strokeWidth={3} /> : step.emoji}
              </span>
            </div>
            <div className={cn('min-w-0 pt-1.5', !vertical && 'md:pt-0')}>
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.state === 'upcoming' && 'text-muted-fg',
                  step.state === 'active' && 'text-primary',
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-fg">
                {step.state === 'active' ? 'In progress' : step.at && step.state === 'done' ? formatDate(step.at, { day: 'numeric', month: 'short' }) : step.state === 'upcoming' ? 'Up next' : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
