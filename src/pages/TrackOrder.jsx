import { Link, useParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Package, Truck } from 'lucide-react'
import { getTracking } from '../api/batches'
import { BatchCover } from '../components/BatchCover'
import { CopyButton } from '../components/common'
import { FundingProgress } from '../components/FundingProgress'
import { OrderStatusBadge } from '../components/badges'
import { StageTimeline } from '../components/StageTimeline'
import { StudioTheme } from '../components/StudioTheme'
import { ButtonLink } from '../components/ui/Button'
import { Card, EmptyState, Skeleton } from '../components/ui/primitives'
import { UpdatesFeed } from '../components/UpdatesFeed'
import { buyerHeadline, buyerSteps } from '../domain/batchLogic'
import { useQuery } from '../hooks/useQuery'
import { absoluteUrl, formatDate, formatINR } from '../lib/utils'

function Detail({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

export function TrackOrder() {
  const { token } = useParams()
  const { data, loading, error } = useQuery(`track:${token}`, () => getTracking(token))

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        emoji="🔍"
        title="Order not found"
        description={error.message}
        action={<ButtonLink to="/track">Try another code</ButtonLink>}
        className="py-24"
      />
    )
  }

  const { order, batch } = data
  const headline = buyerHeadline(batch, order, batch.stats)
  const refunded = order.status === 'refunded'

  return (
    <StudioTheme hue={batch.creator?.accentHue} className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <ButtonLink to={`/b/${batch.id}`} variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft className="size-4" /> Batch page
        </ButtonLink>
        <CopyButton text={absoluteUrl(`/track/${order.trackingToken}`)} label="Copy link" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={headline.title}>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 border-b border-border bg-gradient-to-br from-accent to-surface p-5 sm:p-7">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-surface text-4xl shadow-sm sm:size-20 sm:text-5xl">
              {headline.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">Order {order.number}</p>
              <h1 className="mt-1 font-display text-2xl leading-tight font-semibold text-balance sm:text-3xl">{headline.title}</h1>
            </div>
          </div>
          <div className="space-y-4 p-5 sm:p-7">
            <p className="leading-relaxed text-muted-fg">{headline.message}</p>
            {headline.photoUrl && (
              <img src={headline.photoUrl} alt="Latest photo from the studio" className="max-h-80 w-full rounded-2xl object-cover" />
            )}
            {batch.stage === 'funding' && !refunded && (
              <FundingProgress pledged={batch.stats.pledgedUnits} goal={batch.fundingGoal} max={batch.maxQuantity} />
            )}
            {order.status === 'packaged' && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <Package className="size-5 shrink-0" />
                Packed {formatDate(order.packagedAt, { day: 'numeric', month: 'short' })} · waiting at the studio for courier collection
              </div>
            )}
            {order.status === 'shipped' && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Truck className="size-5 shrink-0" />
                {order.courier} · {order.awb}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {!refunded && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Your piece’s journey</h2>
          <Card className="p-5 sm:p-6">
            <StageTimeline steps={buyerSteps(batch, order)} />
          </Card>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Studio updates</h2>
          <p className="mb-3 text-sm text-muted-fg">Comments are public — chat with {batch.artist.split(' ')[0]} and other backers.</p>
          <Card className="p-5 sm:p-6">
            <UpdatesFeed
              batch={batch}
              viewer={refunded ? null : { role: 'buyer', orderId: order.id, token: order.trackingToken, name: order.buyerName }}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Order details</h2>
          <Card className="overflow-hidden">
            <BatchCover hue={batch.coverHue} unitLabel={batch.unitLabel} size="sm" className="h-24" />
            <div className="p-4">
              <p className="font-semibold leading-snug">{batch.title}</p>
              {batch.creator && (
                <Link to={`/s/${batch.creator.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {batch.creator.emoji} {batch.creator.studioName}
                </Link>
              )}
              <dl className="mt-2 divide-y divide-border">
                <Detail label="Status">
                  <OrderStatusBadge status={order.status} />
                </Detail>
                <Detail label="Quantity">{order.quantity}</Detail>
                <Detail label="Total">{formatINR(order.quantity * batch.price)}</Detail>
                <Detail label="Ordered">{formatDate(order.createdAt)}</Detail>
                <Detail label="Ship to">
                  {order.city} {order.pincode}
                </Detail>
              </dl>
            </div>
          </Card>
        </section>
      </div>
    </StudioTheme>
  )
}
