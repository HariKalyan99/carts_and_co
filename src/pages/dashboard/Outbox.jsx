import { ChevronDown, Mail, Users } from 'lucide-react'
import { listOutbox } from '../../api/batches'
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives'
import { useQuery } from '../../hooks/useQuery'
import { useCreator } from '../../lib/creatorContext'
import { formatDateTime, pluralize, timeAgo } from '../../lib/utils'

const KIND = {
  stage: { label: 'Milestone', tone: 'primary' },
  packaged: { label: 'Packaged', tone: 'warning' },
  shipped: { label: 'Shipped', tone: 'success' },
  cancelled: { label: 'Refund', tone: 'danger' },
  reply: { label: 'Reply', tone: 'info' },
}

export function Outbox() {
  const { creator } = useCreator()
  const { data: mails, loading, error } = useQuery(`outbox:${creator.id}`, listOutbox)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Outbox</h1>
        <p className="mt-1 text-muted-fg">
          Every automated email buyers received. In demo mode nothing is actually sent.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}
      {error && <ErrorState error={error} />}
      {mails?.length === 0 && (
        <Card>
          <EmptyState emoji="📭" title="No emails yet" description="Advance a batch stage or pack some orders to see emails appear here." />
        </Card>
      )}

      <ul className="space-y-3">
        {mails?.map((m) => {
          const kind = KIND[m.kind] ?? KIND.stage
          return (
            <li key={m.id}>
              <details className="group overflow-hidden rounded-2xl border border-border bg-surface">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:items-center">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                    <Mail className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.subject}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-fg">
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {pluralize(m.recipients.length, 'recipient')}
                      </span>
                      <time dateTime={m.sentAt} title={formatDateTime(m.sentAt)}>
                        {timeAgo(m.sentAt)}
                      </time>
                    </div>
                  </div>
                  <ChevronDown className="mt-2 size-4 shrink-0 text-muted-fg transition-transform group-open:rotate-180 sm:mt-0" />
                </summary>
                <div className="border-t border-border bg-bg p-4 sm:p-6">
                  <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="bg-primary px-5 py-4 text-primary-fg">
                      <p className="text-xs opacity-80">{m.batchTitle}</p>
                      <p className="font-display text-lg font-semibold">{m.subject}</p>
                    </div>
                    <div className="space-y-4 p-5">
                      {m.photoUrl && <img src={m.photoUrl} alt="" className="max-h-60 w-full rounded-xl object-cover" />}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.body}</p>
                      <span className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
                        Track your order →
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs break-words text-muted-fg">To: {m.recipients.join(', ')}</p>
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
