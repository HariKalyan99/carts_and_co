import { Link } from 'react-router'
import { ArrowRight, CalendarClock } from 'lucide-react'
import { batchPhase } from '../domain/batchLogic'
import { stageById } from '../domain/stages'
import { formatINR, pluralize } from '../lib/utils'
import { BatchCover } from './BatchCover'
import { FundingProgress } from './FundingProgress'
import { PhaseBadge } from './badges'

export function BatchCard({ batch, to, footer }) {
  const { stats } = batch
  const phase = batchPhase(batch, stats)
  const stage = stageById(batch.stage)

  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-900/5"
    >
      <div className="relative">
        <BatchCover hue={batch.coverHue} unitLabel={batch.unitLabel} className="aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.03]" />
        <PhaseBadge phase={phase} className="absolute top-3 left-3 bg-surface/90 backdrop-blur" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug font-semibold">{batch.title}</h3>
          <p className="shrink-0 font-semibold tabular-nums">{formatINR(batch.price)}</p>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-fg">{batch.tagline}</p>

        <div className="mt-auto pt-4">
          {batch.stage === 'funding' ? (
            <>
              <FundingProgress pledged={stats.pledgedUnits} goal={batch.fundingGoal} max={batch.maxQuantity} size="sm" />
              {stats.daysLeft >= 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-fg">
                  <CalendarClock className="size-3.5" />
                  {stats.daysLeft === 0 ? 'Last day to pre-order' : `${pluralize(stats.daysLeft, 'day')} left`}
                </p>
              )}
            </>
          ) : stage ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
              <span className="text-xl">{stage.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{stage.label}</p>
                <p className="truncate text-xs text-muted-fg">{stage.description}</p>
              </div>
              <ArrowRight className="size-4 text-muted-fg transition-transform group-hover:translate-x-0.5" />
            </div>
          ) : (
            <p className="text-sm text-muted-fg">This batch was cancelled.</p>
          )}
          {footer}
        </div>
      </div>
    </Link>
  )
}
