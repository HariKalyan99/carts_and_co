import { Link } from 'react-router'
import { useUser } from '@clerk/react-router'
import { ArrowRight } from 'lucide-react'
import { listOrdersByEmail } from '../api/batches'
import { OrderStatusBadge } from '../components/badges'
import { BatchCover } from '../components/BatchCover'
import { ButtonLink } from '../components/ui/Button'
import { Card, EmptyState, ErrorState, Skeleton } from '../components/ui/primitives'
import { buyerHeadline } from '../domain/batchLogic'
import { useQuery } from '../hooks/useQuery'
import { userEmails } from '../lib/auth'
import { formatDate, formatINR } from '../lib/utils'

export function MyOrders() {
  const { user } = useUser()
  const emails = userEmails(user)
  const { data, loading, error } = useQuery(`my-orders:${emails.join(',')}`, () => listOrdersByEmail(emails))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-medium text-muted-fg">Hi {user.firstName ?? 'there'} 👋</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">My pre-orders</h1>
      <p className="mt-1 text-sm text-muted-fg">
        Orders placed with {emails.length ? emails.join(', ') : 'your verified email'}.
      </p>

      <div className="mt-8 space-y-3">
        {loading && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        {error && <ErrorState error={error} />}
        {data?.length === 0 && (
          <Card>
            <EmptyState
              emoji="🫙"
              title="No pre-orders yet"
              description="Orders you place with this email will show up here automatically."
              action={<ButtonLink to="/">Browse open batches</ButtonLink>}
            />
          </Card>
        )}
        {data?.map(({ order, batch }) => {
          const headline = buyerHeadline(batch, order, batch.stats)
          return (
            <Link
              key={order.id}
              to={`/track/${order.trackingToken}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 pr-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5 sm:p-4"
            >
              <BatchCover hue={batch.coverHue} unitLabel={batch.unitLabel} size="sm" className="size-16 shrink-0 rounded-xl sm:size-20" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{batch.title}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-fg">
                  {headline.emoji} {headline.title}
                </p>
                <p className="mt-1 text-xs text-muted-fg">
                  {order.number} · {order.quantity}× · {formatINR(order.quantity * batch.price)} · {formatDate(order.createdAt)}
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted-fg transition-transform group-hover:translate-x-0.5" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
