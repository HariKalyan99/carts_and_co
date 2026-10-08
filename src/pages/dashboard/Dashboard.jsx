import { Boxes, Check, IndianRupee, PackageOpen, Plus, Sparkles, Users } from 'lucide-react'
import { toast } from 'sonner'
import { listCreatorBatches } from '../../api/batches'
import { loadSampleBatches } from '../../api/creators'
import { BatchCard } from '../../components/BatchCard'
import { CopyButton, StatCard } from '../../components/common'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, ErrorState, Skeleton } from '../../components/ui/primitives'
import { batchPhase } from '../../domain/batchLogic'
import { nextStage } from '../../domain/stages'
import { useMutation, useQuery } from '../../hooks/useQuery'
import { useCreator } from '../../lib/creatorContext'
import { absoluteUrl, cn, formatINR } from '../../lib/utils'

function GettingStarted({ creator }) {
  const [loadSamples, loading] = useMutation(loadSampleBatches)
  const steps = [
    { done: true, title: 'Set up your studio', text: 'Name, URL and branding are saved.' },
    { done: false, title: 'Create your first batch', text: 'Set a funding goal that covers clay, glaze and kiln time.' },
    { done: false, title: 'Share your studio link', text: 'Post it on Instagram or in your newsletter.' },
  ]

  const onSamples = async () => {
    try {
      const res = await loadSamples()
      toast.success(`${res.count} sample batches added`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-accent to-surface p-5 sm:p-7">
        <h2 className="font-display text-2xl font-semibold">Welcome to your studio, {creator.displayName.split(' ')[0]}</h2>
        <p className="mt-1 text-sm text-muted-fg">Three steps to your first funded batch.</p>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-4 p-5 sm:px-7">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold',
                s.done ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg',
              )}
            >
              {s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted-fg">{s.text}</p>
              {i === 2 && <CopyButton text={absoluteUrl(`/s/${creator.slug}`)} label="Copy studio link" className="mt-3" />}
            </div>
            {i === 1 && (
              <ButtonLink to="/dashboard/batches/new" size="sm">
                <Plus className="size-4" /> Create
              </ButtonLink>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:px-7">
        <p className="flex-1 text-sm text-muted-fg">Just exploring? Add three sample batches with demo backers.</p>
        <Button variant="secondary" size="sm" onClick={onSamples} loading={loading}>
          <Sparkles className="size-4" /> Add sample batches
        </Button>
      </div>
    </Card>
  )
}

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
  const { creator } = useCreator()
  const { data: batches, loading, error } = useQuery(`batches:${creator.id}`, listCreatorBatches)

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
          <p className="text-sm font-medium text-muted-fg">Good to see you, {creator.displayName.split(' ')[0]} 👋</p>
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

      {!loading && batches?.length === 0 && <GettingStarted creator={creator} />}

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
