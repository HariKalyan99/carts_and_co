import { useUser } from '@clerk/react-router'
import { Boxes, IndianRupee, PackageOpen, Plus, Users } from 'lucide-react'
import { listBatches } from '../../api/batches'
import { BatchCard } from '../../components/BatchCard'
import { StatCard } from '../../components/common'
import { ButtonLink } from '../../components/ui/Button'
import { Card, EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { batchPhase } from '../../domain/batchLogic'
import { nextStage } from '../../domain/stages'
import { useQuery } from '../../hooks/useQuery'
import { formatINR } from '../../lib/utils'

function nextActionHint(batch) {
  const phase = batchPhase(batch, batch.stats)
  switch (phase) {
    case 'funding':
      return `${batch.stats.remainingToGoal} more pre-orders needed`
    case 'funded':
      return 'Ready to start production'
    case 'expired':
      return 'Goal missed — release holds'
    case 'production':
      return `Next: ${nextStage(batch.stage).label}`
    case 'fulfillment':
      return `${batch.stats.awaitingPacking} to pack · ${batch.stats.packagedOrders} awaiting pickup`
    default:
      return null
  }
}

export function Dashboard() {
  const { data: batches, loading, error } = useQuery('batches', listBatches)
  const { user } = useUser()

  const live = batches?.filter((b) => !['complete', 'cancelled'].includes(b.stage)) ?? []
  const totals = live.reduce(
    (acc, b) => ({
      backers: acc.backers + b.stats.orderCount,
      revenue: acc.revenue + b.stats.revenue,
      toPack: acc.toPack + (b.stage === 'fulfillment' ? b.stats.awaitingPacking : 0),
    }),
    { backers: 0, revenue: 0, toPack: 0 },
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-fg">Good to see you, {user?.firstName ?? 'maker'} 👋</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Your batches</h1>
        </div>
        <ButtonLink to="/dashboard/batches/new" className="hidden sm:inline-flex">
          <Plus className="size-4" /> New batch
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Active batches" value={live.length} icon={Boxes} />
            <StatCard label="Backers" value={totals.backers} icon={Users} hint="Across active batches" />
            <StatCard label="Pledged value" value={formatINR(totals.revenue)} icon={IndianRupee} tone="success" />
            <StatCard label="To pack" value={totals.toPack} icon={PackageOpen} hint="Orders ready for packing" />
          </>
        )}
      </div>

      {error && <ErrorState error={error} />}

      {!loading && batches?.length === 0 && (
        <Card>
          <EmptyState
            emoji="🏺"
            title="No batches yet"
            description="Create your first micro-batch and share the link with your audience."
            action={<ButtonLink to="/dashboard/batches/new">Create a batch</ButtonLink>}
          />
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        {batches?.map((b) => {
          const hint = nextActionHint(b)
          return (
            <BatchCard
              key={b.id}
              batch={b}
              to={`/dashboard/batches/${b.id}`}
              footer={
                hint && (
                  <p className="mt-3 border-t border-border pt-3 text-xs font-semibold text-primary">→ {hint}</p>
                )
              }
            />
          )
        })}
      </div>
    </div>
  )
}
