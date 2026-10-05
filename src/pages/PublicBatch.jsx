import { useState } from 'react'
import { useParams } from 'react-router'
import { CalendarClock, ChevronDown, Lock, MapPin, ShieldCheck, Users } from 'lucide-react'
import { useUser } from '@clerk/react-router'
import { getPublicBatch, listOrdersByEmail } from '../api/batches'
import { userEmails } from '../lib/auth'
import { BatchCover } from '../components/BatchCover'
import { CopyButton } from '../components/common'
import { FundingProgress } from '../components/FundingProgress'
import { PhaseBadge } from '../components/badges'
import { PledgeSheet } from '../components/PledgeSheet'
import { StageTimeline } from '../components/StageTimeline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card, EmptyState, Skeleton } from '../components/ui/primitives'
import { UpdatesFeed } from '../components/UpdatesFeed'
import { batchPhase, batchSteps, canPledge } from '../domain/batchLogic'
import { useQuery } from '../hooks/useQuery'
import { absoluteUrl, formatDate, formatINR, pluralize } from '../lib/utils'

function faqs(batch) {
  return [
    {
      q: `What happens if the batch doesn't reach ${batch.fundingGoal} pre-orders?`,
      a: 'Your card hold is released automatically on the deadline. You are never charged for a batch that doesn’t get made.',
    },
    {
      q: 'When will I be charged?',
      a: 'Only when the artist starts production, which can happen as soon as the goal is reached.',
    },
    {
      q: 'When will it ship?',
      a: `Production usually takes 2–3 weeks after funding. Orders are packed in small tiers by postal zone, and you'll get an update when yours is boxed and again when the courier collects it.`,
    },
    {
      q: 'Will mine look exactly like the photos?',
      a: 'Every piece is made and glazed by hand, so colour and glaze flow vary slightly. That’s the point!',
    },
  ]
}

function PurchasePanel({ batch, phase, onPledge }) {
  const { stats } = batch
  const pledgeable = canPledge(batch, stats)

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{formatINR(batch.price)}</p>
          <p className="text-sm text-muted-fg">per piece · free shipping in India</p>
        </div>
        <PhaseBadge phase={phase} />
      </div>

      {batch.stage === 'funding' || batch.stage === 'cancelled' ? (
        <>
          <FundingProgress pledged={stats.pledgedUnits} goal={batch.fundingGoal} max={batch.maxQuantity} size="lg" className="mt-6" />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted p-3">
              <p className="flex items-center gap-1.5 text-muted-fg">
                <Users className="size-4" /> Backers
              </p>
              <p className="mt-0.5 font-semibold">{stats.orderCount}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="flex items-center gap-1.5 text-muted-fg">
                <CalendarClock className="size-4" /> {stats.daysLeft >= 0 ? 'Time left' : 'Ended'}
              </p>
              <p className="mt-0.5 font-semibold">
                {stats.daysLeft > 0 ? pluralize(stats.daysLeft, 'day') : stats.daysLeft === 0 ? 'Last day' : formatDate(batch.fundingDeadline)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-muted p-4 text-sm">
          <p className="font-semibold">This batch is fully funded 🎉</p>
          <p className="mt-1 text-muted-fg">
            {stats.pledgedUnits} pieces are being made for {pluralize(stats.orderCount, 'backer')}. Follow along below.
          </p>
        </div>
      )}

      <div className="mt-6 hidden lg:block">
        {pledgeable ? (
          <Button size="lg" className="w-full" onClick={onPledge}>
            <Lock className="size-4" /> Pre-order now
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled>
            {batch.stage === 'cancelled' ? 'Batch cancelled' : 'Pre-orders closed'}
          </Button>
        )}
      </div>

      {pledgeable && (
        <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted-fg">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          You’re only charged if {batch.fundingGoal} pre-orders are reached by {formatDate(batch.fundingDeadline, { day: 'numeric', month: 'long' })}.
        </p>
      )}
    </Card>
  )
}

export function PublicBatch() {
  const { batchId } = useParams()
  const { data: batch, loading, error } = useQuery(`batch:${batchId}`, () => getPublicBatch(batchId))
  const [pledgeOpen, setPledgeOpen] = useState(false)

  // Signed-in backers can join the conversation right here, matched by verified email.
  const { user } = useUser()
  const emails = userEmails(user)
  const { data: myOrders } = useQuery(`my-orders:${emails.join(',')}`, () =>
    emails.length ? listOrdersByEmail(emails) : Promise.resolve([]),
  )
  const myOrder = myOrders?.find((x) => x.order.batchId === batchId && x.order.status !== 'refunded')?.order
  const viewer = myOrder ? { role: 'buyer', orderId: myOrder.id, name: myOrder.buyerName } : null
  const pledgeDefaults = user ? { name: user.fullName ?? '', email: user.primaryEmailAddress?.emailAddress ?? '' } : undefined

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] rounded-3xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        emoji="🏺"
        title="Batch not found"
        description="This batch may have been removed, or the link is mistyped."
        action={<ButtonLink to="/">Browse batches</ButtonLink>}
        className="py-24"
      />
    )
  }

  const phase = batchPhase(batch, batch.stats)
  const pledgeable = canPledge(batch, batch.stats)

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          <div className="min-w-0 space-y-10">
            <div>
              <BatchCover hue={batch.coverHue} unitLabel={batch.unitLabel} size="lg" className="aspect-[4/3] rounded-3xl sm:aspect-[2/1] lg:aspect-[16/10]" />
              <div className="mt-6">
                <p className="flex items-center gap-1.5 text-sm text-muted-fg">
                  <MapPin className="size-4" /> {batch.studio}
                </p>
                <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                  {batch.title}
                </h1>
                <p className="mt-2 text-lg text-muted-fg">{batch.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton text={absoluteUrl(`/b/${batch.id}`)} label="Share" />
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <PurchasePanel batch={batch} phase={phase} onPledge={() => setPledgeOpen(true)} />
            </div>

            <section>
              <h2 className="font-display text-xl font-semibold">About this batch</h2>
              <p className="mt-3 leading-relaxed text-muted-fg">{batch.description}</p>
              <p className="mt-3 text-sm text-muted-fg">
                Only <strong className="text-fg">{batch.maxQuantity}</strong> will ever be made · by {batch.artist}
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">How your piece is made</h2>
              <p className="mt-1 text-sm text-muted-fg">Every backer gets an update as the batch moves through the studio.</p>
              <Card className="mt-4 p-5 sm:p-6">
                <StageTimeline steps={batchSteps(batch)} />
              </Card>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">Studio updates</h2>
              <p className="mt-1 text-sm text-muted-fg">Progress posts from the studio, and what backers are saying.</p>
              <Card className="mt-4 p-5 sm:p-6">
                <UpdatesFeed batch={batch} viewer={viewer} joinHref={user ? '/my-orders' : '/sign-in'} />
              </Card>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">Questions</h2>
              <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
                {faqs(batch).map(({ q, a }) => (
                  <details key={q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {q}
                      <ChevronDown className="size-4 shrink-0 text-muted-fg transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-fg">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <PurchasePanel batch={batch} phase={phase} onPledge={() => setPledgeOpen(true)} />
            </div>
          </aside>
        </div>
      </div>

      {pledgeable && (
        <div className="pb-safe sticky bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur-lg lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold tabular-nums">{formatINR(batch.price)}</p>
              <p className="truncate text-xs text-muted-fg">
                {batch.stats.funded ? 'Goal reached!' : `${batch.stats.remainingToGoal} more to start production`}
              </p>
            </div>
            <Button size="lg" onClick={() => setPledgeOpen(true)}>
              <Lock className="size-4" /> Pre-order
            </Button>
          </div>
        </div>
      )}

      <PledgeSheet
        key={user?.id ?? 'guest'}
        batch={batch}
        open={pledgeOpen}
        onClose={() => setPledgeOpen(false)}
        defaults={pledgeDefaults}
      />
    </>
  )
}
