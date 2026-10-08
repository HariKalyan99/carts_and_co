import { computeStats } from '../domain/batchLogic'
import { nextStage } from '../domain/stages'
import { mutate, rpc } from './client'

// Every write is checked in Postgres: creators are identified by their Clerk session,
// buyers by their tracking token. See supabase/migrations for the rules.

/** Adds progress stats and display helpers to a batch returned by the database. */
export function withStats({ orderSummary = [], ...batch }) {
  const { creator } = batch
  return {
    ...batch,
    stats: computeStats(batch, orderSummary),
    artist: creator?.displayName ?? 'Independent maker',
    studio: creator ? [creator.studioName, creator.city].filter(Boolean).join(', ') : '',
  }
}

const withOrder = ({ order, batch }) => ({ order, batch: withStats(batch) })

// ---------- Public queries ----------

export async function listPublicBatches() {
  return (await rpc('list_public_batches')).map(withStats)
}

export async function getPublicBatch(id) {
  return withStats(await rpc('get_public_batch', { p_id: id }))
}

export async function getTracking(token) {
  return withOrder(await rpc('get_tracking', { p_token: token.trim() }))
}

/** Orders placed with the signed-in buyer's verified email, newest first. */
export async function listMyOrders() {
  return (await rpc('my_orders')).map(withOrder)
}

// ---------- Creator queries (scoped to the signed-in creator) ----------

export async function listCreatorBatches() {
  return (await rpc('list_creator_batches')).map(withStats)
}

export async function getBatchAdmin(id) {
  const { batch, orders } = await rpc('get_batch_admin', { p_id: id })
  return { batch: withStats(batch), orders }
}

export function listOutbox() {
  return rpc('list_outbox')
}

// ---------- Creator writes ----------

function batchCode(title) {
  const code = title
    .split(/\s+/)
    .filter((w) => /^[a-z]/i.test(w) && !/^(the|a|an|of)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return code || 'MB'
}

export async function createBatch(input) {
  const batch = await mutate('create_batch', {
    p: {
      title: input.title.trim(),
      code: batchCode(input.title),
      tagline: input.tagline,
      description: input.description,
      unitLabel: input.unitLabel,
      price: Number(input.price),
      fundingGoal: Number(input.fundingGoal),
      maxQuantity: Number(input.maxQuantity),
      fundingDeadline: new Date(`${input.fundingDeadline}T23:59:59`).toISOString(),
      coverHue: input.coverHue,
    },
  })
  return withStats(batch)
}

export async function advanceStage(batch, { note = '', photoUrl = null } = {}) {
  const next = nextStage(batch.stage)
  if (!next) throw new Error('This batch is already complete.')
  const res = await mutate('advance_stage', {
    p_batch_id: batch.id,
    p_expected: batch.stage,
    p_note: note.trim(),
    p_message: note.trim() || next.buyerMsg(batch.unitLabel),
    p_subject:
      next.id === 'mold'
        ? `${batch.title} is funded! Production has started ${next.emoji}`
        : `${batch.title}: ${next.label} ${next.emoji}`,
    p_photo_url: photoUrl,
  })
  return { stage: { id: next.id, label: next.label, emoji: next.emoji }, notified: res.notified }
}

export function cancelBatch(batchId) {
  return mutate('cancel_batch', { p_batch_id: batchId })
}

export function markPackaged(batchId, orderIds) {
  return mutate('mark_packaged', { p_batch_id: batchId, p_order_ids: orderIds })
}

export function markShipped(batchId, orderIds, courier = 'India Post') {
  return mutate('mark_shipped', { p_batch_id: batchId, p_order_ids: orderIds, p_courier: courier })
}

/** Deletes every batch in the signed-in creator's studio. */
export function resetStudio() {
  return mutate('reset_my_studio')
}

// ---------- Buyer writes ----------

export function pledge(batchId, buyer) {
  return mutate('pledge', { p_batch_id: batchId, p: buyer })
}

// ---------- Comments ----------

/** Public: anyone can read the conversation on a batch's updates. Emails are never exposed. */
export function listComments(batchId) {
  return rpc('list_comments', { p_batch_id: batchId })
}

/** `author` is the viewer: `{ role: 'creator' }` or `{ role: 'buyer', token }`. */
const tokenOf = (author) => (author.role === 'buyer' ? author.token : null)

export function addComment(batchId, { updateKey, parentId = null, body, author }) {
  return mutate('add_comment', {
    p_batch_id: batchId,
    p_update_key: updateKey,
    p_parent_id: parentId,
    p_body: body,
    p_token: tokenOf(author),
  })
}

export function deleteComment(commentId, author) {
  return mutate('delete_comment', { p_comment_id: commentId, p_token: tokenOf(author) })
}
