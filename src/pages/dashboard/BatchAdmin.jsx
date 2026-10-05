import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ExternalLink, IndianRupee, Package, PlayCircle, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { advanceStage, cancelBatch, getBatchAdmin } from '../../api/batches'
import { AdvanceStageSheet } from '../../components/AdvanceStageSheet'
import { BatchCover } from '../../components/BatchCover'
import { CopyButton, StatCard } from '../../components/common'
import { FundingProgress } from '../../components/FundingProgress'
import { PhaseBadge } from '../../components/badges'
import { OrdersList } from '../../components/OrdersList'
import { PackingBoard } from '../../components/PackingBoard'
import { StageTimeline } from '../../components/StageTimeline'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, EmptyState, Skeleton } from '../../components/ui/primitives'
import { Tabs } from '../../components/ui/Tabs'
import { UpdatesFeed } from '../../components/UpdatesFeed'
import { batchPhase, batchSteps } from '../../domain/batchLogic'
import { nextStage } from '../../domain/stages'
import { useMutation, useQuery } from '../../hooks/useQuery'
import { absoluteUrl, formatDate, formatINR, pluralize } from '../../lib/utils'

function PrimaryAction({ batch, phase, onAdvance, onCancel, onComplete, onGoPacking, cancelling, completing }) {
  const next = nextStage(batch.stage)
  const { stats } = batch

  switch (phase) {
    case 'funding':
      return (
        <Button disabled title={`Need ${stats.remainingToGoal} more pre-orders`}>
          <PlayCircle className="size-4" /> {stats.remainingToGoal} more to start
        </Button>
      )
    case 'funded':
      return (
        <Button onClick={onAdvance}>
          <PlayCircle className="size-4" /> Start production
        </Button>
      )
    case 'expired':
      return (
        <Button variant="danger" onClick={onCancel} loading={cancelling}>
          <XCircle className="size-4" /> Release holds
        </Button>
      )
    case 'production':
      return (
        <Button onClick={onAdvance}>
          {next.emoji} Move to {next.label} <ArrowRight className="size-4" />
        </Button>
      )
    case 'fulfillment':
      return stats.shippedOrders === stats.orderCount ? (
        <Button onClick={onComplete} loading={completing}>
          <CheckCircle2 className="size-4" /> Complete batch
        </Button>
      ) : (
        <Button onClick={onGoPacking}>
          <Package className="size-4" /> Pack orders
        </Button>
      )
    default:
      return null
  }
}

export function BatchAdmin() {
  const { batchId } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'overview'
  const setTab = (id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })

  const { data, loading, error } = useQuery(`admin:${batchId}`, () => getBatchAdmin(batchId))
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [cancel, cancelling] = useMutation(cancelBatch)
  const [complete, completing] = useMutation(advanceStage)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        emoji="🏺"
        title="Batch not found"
        description={error.message}
        action={<ButtonLink to="/dashboard">Back to batches</ButtonLink>}
      />
    )
  }

  const { batch, orders } = data
  const { stats } = batch
  const phase = batchPhase(batch, stats)
  const publicUrl = absoluteUrl(`/b/${batch.id}`)

  const onCancel = async () => {
    if (!window.confirm(`Cancel "${batch.title}" and release ${pluralize(stats.orderCount, 'card hold')}? Buyers will be emailed.`)) return
    try {
      const res = await cancel(batch.id)
      toast.success('Batch cancelled', { description: `${pluralize(res.released, 'hold')} released.` })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onComplete = async () => {
    try {
      await complete(batch.id)
      toast.success('Batch complete 🎉', { description: 'Every buyer got a thank-you email.' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', count: stats.orderCount },
    { id: 'packing', label: 'Packing', count: batch.stage === 'fulfillment' ? stats.awaitingPacking + stats.packagedOrders : undefined },
  ]

  return (
    <div className="space-y-6">
      <ButtonLink to="/dashboard" variant="ghost" size="sm" className="-ml-3">
        <ArrowLeft className="size-4" /> Batches
      </ButtonLink>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <BatchCover hue={batch.coverHue} unitLabel={batch.unitLabel} size="sm" className="size-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{batch.title}</h1>
            <PhaseBadge phase={phase} />
          </div>
          <p className="mt-1 text-sm text-muted-fg">
            {formatINR(batch.price)} · {batch.fundingGoal} goal · {batch.maxQuantity} max · created {formatDate(batch.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/b/${batch.id}`} variant="secondary" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Public page
          </ButtonLink>
          <PrimaryAction
            batch={batch}
            phase={phase}
            onAdvance={() => setAdvanceOpen(true)}
            onCancel={onCancel}
            onComplete={onComplete}
            onGoPacking={() => setTab('packing')}
            cancelling={cancelling}
            completing={completing}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Pre-orders" value={`${stats.pledgedUnits}/${batch.fundingGoal}`} icon={Users} hint={pluralize(stats.orderCount, 'backer')} />
        <StatCard
          label={batch.stage === 'funding' ? 'Held (not charged)' : 'Revenue'}
          value={formatINR(stats.revenue)}
          icon={IndianRupee}
          tone="success"
        />
        <StatCard
          label="Deadline"
          value={batch.stage === 'funding' ? (stats.daysLeft >= 0 ? pluralize(stats.daysLeft, 'day') : 'Passed') : '—'}
          icon={CalendarClock}
          hint={formatDate(batch.fundingDeadline)}
        />
        <StatCard
          label="Shipped"
          value={`${stats.shippedUnits}/${stats.pledgedUnits}`}
          icon={Package}
          hint={stats.packagedUnits ? `${stats.packagedUnits} awaiting pickup` : 'pieces'}
        />
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-6">
              <Card className="p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Production timeline</h2>
                  {(phase === 'production' || phase === 'funded') && (
                    <Button size="sm" variant="soft" onClick={() => setAdvanceOpen(true)}>
                      Advance stage <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
                <StageTimeline steps={batchSteps(batch)} />
              </Card>
              <Card className="p-5 sm:p-6">
                <h2 className="font-semibold">Updates &amp; conversation</h2>
                <p className="mt-0.5 mb-5 text-sm text-muted-fg">
                  Replies show an Artist badge and email the backer you’re replying to.
                </p>
                <UpdatesFeed batch={batch} viewer={{ role: 'creator', name: batch.artist }} />
              </Card>
            </div>

            <div className="space-y-6">
              {(batch.stage === 'funding' || batch.stage === 'cancelled') && (
                <Card className="p-5">
                  <h2 className="mb-4 font-semibold">Funding</h2>
                  <FundingProgress pledged={stats.pledgedUnits} goal={batch.fundingGoal} max={batch.maxQuantity} />
                  {batch.stage === 'funding' && phase !== 'expired' && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="mt-4 text-xs font-medium text-muted-fg underline-offset-2 hover:text-red-600 hover:underline"
                    >
                      Cancel batch & release holds
                    </button>
                  )}
                </Card>
              )}
              <Card className="p-5">
                <h2 className="font-semibold">Share with buyers</h2>
                <p className="mt-1 text-sm text-muted-fg">Post this link on Instagram or your newsletter.</p>
                <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 font-mono text-xs break-all">{publicUrl}</p>
                <CopyButton text={publicUrl} className="mt-3 w-full" />
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Latest backers</h2>
                  <button type="button" onClick={() => setTab('orders')} className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </button>
                </div>
                <ul className="mt-3 space-y-3">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id} className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                        {o.buyerName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{o.buyerName}</p>
                        <p className="text-xs text-muted-fg">
                          {o.quantity}× · {o.city}
                        </p>
                      </div>
                    </li>
                  ))}
                  {orders.length === 0 && <li className="text-sm text-muted-fg">No pre-orders yet — share your link!</li>}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {tab === 'orders' && <OrdersList orders={orders} price={batch.price} />}
        {tab === 'packing' && <PackingBoard batch={batch} orders={orders} />}
      </div>

      <AdvanceStageSheet batch={batch} open={advanceOpen} onClose={() => setAdvanceOpen(false)} />
    </div>
  )
}
