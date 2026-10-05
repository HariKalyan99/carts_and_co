import { useState } from 'react'
import { Link } from 'react-router'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addComment, deleteComment } from '../api/batches'
import { useMutation } from '../hooks/useQuery'
import { cn, formatDateTime, timeAgo } from '../lib/utils'
import { Button } from './ui/Button'

const PREVIEW_COUNT = 2

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function Composer({ batchId, updateKey, parentId, viewer, placeholder, autoFocus, onDone }) {
  const [body, setBody] = useState('')
  const [submit, pending] = useMutation(addComment)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    try {
      await submit(batchId, { updateKey, parentId, body, author: viewer })
      setBody('')
      onDone?.()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) onSubmit(e)
    if (e.key === 'Escape') onDone?.()
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <Avatar name={viewer.name} creator={viewer.role === 'creator'} small />
      <div className="flex min-w-0 flex-1 items-end gap-1 rounded-2xl border border-border bg-surface py-1 pr-1 pl-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={500}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          className="field-sizing-content max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted-fg/70 focus:outline-none"
        />
        <Button type="submit" size="icon" className="size-8 rounded-xl" loading={pending} disabled={!body.trim()} aria-label="Send comment">
          {!pending && <Send className="size-3.5" />}
        </Button>
      </div>
    </form>
  )
}

function Avatar({ name, creator, small }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold',
        small ? 'size-8 text-[11px]' : 'size-8 text-xs',
        creator ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg',
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

function Comment({ comment, viewer, onReply, onDelete }) {
  const { author } = comment
  const isCreator = author.role === 'creator'
  const isMine =
    viewer && (viewer.role === 'creator' ? isCreator : author.orderId === viewer.orderId)
  const canDelete = viewer && (viewer.role === 'creator' || isMine)

  return (
    <div className="group flex gap-2.5">
      <Avatar name={author.name} creator={isCreator} />
      <div className="min-w-0 flex-1">
        <div className={cn('inline-block max-w-full rounded-2xl rounded-tl-md px-3.5 py-2', isCreator ? 'bg-accent' : 'bg-muted')}>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
            <span className="font-semibold">{isMine ? 'You' : author.name}</span>
            {isCreator ? (
              <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-fg">Artist</span>
            ) : (
              <span className="text-muted-fg">Backer</span>
            )}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-line">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-2 text-xs text-muted-fg">
          <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </time>
          {viewer && (
            <button type="button" onClick={onReply} className="font-semibold hover:text-fg">
              Reply
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 font-semibold opacity-100 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              aria-label="Delete comment"
            >
              <Trash2 className="size-3" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Public conversation under one studio update. `viewer` decides who may post:
 * `{ role: 'buyer', orderId, name }`, `{ role: 'creator', name }`, or null (read-only).
 */
export function CommentThread({ batchId, updateKey, comments, viewer, joinHref }) {
  const [expanded, setExpanded] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [remove] = useMutation(deleteComment)

  const topLevel = comments.filter((c) => !c.parentId)
  const repliesOf = (id) => comments.filter((c) => c.parentId === id)
  const hidden = Math.max(0, topLevel.length - PREVIEW_COUNT)
  const visible = expanded ? topLevel : topLevel.slice(-PREVIEW_COUNT)

  const onDelete = async (comment) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await remove(comment.id, viewer)
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const renderComment = (c) => (
    <Comment
      key={c.id}
      comment={c}
      viewer={viewer}
      onReply={() => setReplyTo(c.parentId ?? c.id)}
      onDelete={() => onDelete(c)}
    />
  )

  if (topLevel.length === 0 && !viewer && !joinHref) return null

  return (
    <div className="mt-3 space-y-3">
      {topLevel.length === 0 && !composerOpen ? (
        viewer ? (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-fg hover:text-primary"
          >
            <MessageCircle className="size-3.5" /> Be the first to comment
          </button>
        ) : null
      ) : (
        <>
          {hidden > 0 && !expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">
              View {hidden} earlier comment{hidden > 1 ? 's' : ''}
            </button>
          )}
          {visible.map((c) => (
            <div key={c.id} className="space-y-2.5">
              {renderComment(c)}
              {(repliesOf(c.id).length > 0 || replyTo === c.id) && (
                <div className="ml-5 space-y-2.5 border-l-2 border-border pl-4">
                  {repliesOf(c.id).map(renderComment)}
                  {replyTo === c.id && viewer && (
                    <Composer
                      batchId={batchId}
                      updateKey={updateKey}
                      parentId={c.id}
                      viewer={viewer}
                      placeholder={`Reply to ${c.author.name.split(' ')[0]}…`}
                      autoFocus
                      onDone={() => setReplyTo(null)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {viewer && (topLevel.length > 0 || composerOpen) && (
        <Composer
          batchId={batchId}
          updateKey={updateKey}
          viewer={viewer}
          placeholder={viewer.role === 'creator' ? 'Reply to your backers…' : 'Ask a question or cheer the studio on…'}
          autoFocus={composerOpen && topLevel.length === 0}
        />
      )}

      {!viewer && joinHref && (
        <p className="text-xs text-muted-fg">
          <MessageCircle className="mr-1 inline size-3.5" />
          Backed this batch?{' '}
          <Link to={joinHref} className="font-semibold text-primary hover:underline">
            {joinHref === '/sign-in' ? 'Sign in with your order email to comment' : 'Open your order to comment'}
          </Link>
        </p>
      )}
    </div>
  )
}
