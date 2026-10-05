import { MessageCircle } from 'lucide-react'
import { listComments } from '../api/batches'
import { updateKey } from '../domain/batchLogic'
import { stageById } from '../domain/stages'
import { useQuery } from '../hooks/useQuery'
import { formatDateTime, timeAgo } from '../lib/utils'
import { CommentThread } from './CommentThread'

/**
 * Studio updates with a public comment thread under each one.
 * `viewer` controls who can post (see CommentThread); `joinHref` invites readers to join.
 */
export function UpdatesFeed({ batch, viewer = null, joinHref }) {
  const { data: comments = [] } = useQuery(`comments:${batch.id}`, () => listComments(batch.id))

  const entries = batch.stageHistory
    .filter((h) => h.stage !== 'cancelled')
    .map((h) => {
      const stage = stageById(h.stage)
      const key = updateKey(h)
      return {
        ...h,
        key,
        emoji: stage.emoji,
        label: stage.label,
        text: h.note || (stage.buyerMsg ? stage.buyerMsg(batch.unitLabel) : stage.description),
        comments: comments.filter((c) => c.updateKey === key),
      }
    })
    .reverse()

  return (
    <ol className="space-y-5">
      {entries.map((e, i) => (
        <li key={e.key} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-base">{e.emoji}</span>
            {i < entries.length - 1 && <span className="mt-2 w-px flex-1 bg-border" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 pb-2">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-semibold">{e.label}</p>
              <time dateTime={e.at} title={formatDateTime(e.at)} className="text-xs text-muted-fg">
                {timeAgo(e.at)}
              </time>
              {e.comments.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-fg">
                  <MessageCircle className="size-3" /> {e.comments.length}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-fg">{e.text}</p>
            {e.photoUrl && (
              <img
                src={e.photoUrl}
                alt={`Studio photo: ${e.label}`}
                className="mt-3 max-h-72 w-full rounded-xl border border-border object-cover"
                loading="lazy"
              />
            )}
            <CommentThread
              batchId={batch.id}
              updateKey={e.key}
              comments={e.comments}
              viewer={viewer}
              joinHref={i === 0 ? joinHref : undefined}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
