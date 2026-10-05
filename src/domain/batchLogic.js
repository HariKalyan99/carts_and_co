import { daysUntil } from '../lib/utils'
import { STAGES, STAGE_IDS, stageById, zoneOf } from './stages'

export const isActiveOrder = (o) => o.status !== 'refunded'

/** Stable id for a studio update (a stageHistory entry), used to attach comments. */
export const updateKey = (entry) => `${entry.stage}:${entry.at}`

export function computeStats(batch, orders) {
  const active = orders.filter(isActiveOrder)
  const pledgedUnits = active.reduce((sum, o) => sum + o.quantity, 0)
  const unitsWhere = (status) =>
    active.filter((o) => o.status === status).reduce((sum, o) => sum + o.quantity, 0)

  return {
    orderCount: active.length,
    pledgedUnits,
    remainingToGoal: Math.max(0, batch.fundingGoal - pledgedUnits),
    remainingCapacity: Math.max(0, batch.maxQuantity - pledgedUnits),
    revenue: pledgedUnits * batch.price,
    funded: pledgedUnits >= batch.fundingGoal,
    daysLeft: daysUntil(batch.fundingDeadline),
    awaitingPacking: active.filter((o) => o.status === 'charged').length,
    packagedUnits: unitsWhere('packaged'),
    shippedUnits: unitsWhere('shipped'),
    packagedOrders: active.filter((o) => o.status === 'packaged').length,
    shippedOrders: active.filter((o) => o.status === 'shipped').length,
  }
}

/**
 * A single label describing where the batch is, combining its stage with
 * funding progress (e.g. a batch still in "funding" may already be funded).
 */
export function batchPhase(batch, stats) {
  if (batch.stage === 'cancelled') return 'cancelled'
  if (batch.stage === 'funding') {
    if (stats.funded) return 'funded'
    if (stats.daysLeft < 0) return 'expired'
    return 'funding'
  }
  if (batch.stage === 'fulfillment') return 'fulfillment'
  if (batch.stage === 'complete') return 'complete'
  return 'production'
}

export const PHASE_META = {
  funding: { label: 'Funding', tone: 'primary' },
  funded: { label: 'Goal reached', tone: 'success' },
  expired: { label: 'Goal missed', tone: 'danger' },
  production: { label: 'In production', tone: 'info' },
  fulfillment: { label: 'Shipping', tone: 'warning' },
  complete: { label: 'Complete', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export function canPledge(batch, stats) {
  return batch.stage === 'funding' && stats.daysLeft >= 0 && stats.remainingCapacity > 0
}

/** Steps for the batch production timeline (creator + public batch page). */
export function batchSteps(batch) {
  const currentIdx = STAGE_IDS.indexOf(batch.stage)
  return STAGES.map((stage, i) => {
    const entry = batch.stageHistory.findLast((h) => h.stage === stage.id)
    let state = 'upcoming'
    if (batch.stage === 'complete' || (currentIdx >= 0 && i < currentIdx)) state = 'done'
    else if (i === currentIdx) state = 'active'
    return { id: stage.id, label: stage.label, emoji: stage.emoji, state, at: entry?.at }
  })
}

/** Steps for a single buyer's tracking page, mixing batch stages with order status. */
export function buyerSteps(batch, order) {
  const at = (stage) => batch.stageHistory.findLast((h) => h.stage === stage)?.at
  const reached = (stage) => STAGE_IDS.indexOf(batch.stage) >= STAGE_IDS.indexOf(stage)
  const packed = order.status === 'packaged' || order.status === 'shipped'

  const steps = [
    { id: 'pledged', label: 'Pre-order secured', emoji: '🤝', done: true, at: order.createdAt },
    { id: 'mold', label: 'In the Mold', emoji: '🥣', done: reached('mold'), at: at('mold') },
    { id: 'kiln', label: 'Kiln Firing', emoji: '🔥', done: reached('kiln'), at: at('kiln') },
    { id: 'glazing', label: 'Glazing & Curing', emoji: '🎨', done: reached('glazing'), at: at('glazing') },
    { id: 'packaged', label: 'Packaged', emoji: '📦', done: packed, at: order.packagedAt },
    { id: 'shipped', label: 'Shipped', emoji: '🚚', done: order.status === 'shipped', at: order.shippedAt },
  ]

  const current = steps.findLastIndex((s) => s.done)
  const allDone = current === steps.length - 1
  return steps.map((s, i) => ({
    ...s,
    state: i < current || allDone ? 'done' : i === current ? 'active' : 'upcoming',
  }))
}

/** What the buyer should read right now, based on batch stage and order status. */
export function buyerHeadline(batch, order, stats) {
  const u = batch.unitLabel
  if (order.status === 'refunded') {
    return {
      emoji: '💛',
      title: "This batch didn't reach its goal",
      message: "Your card hold has been released — you haven't been charged anything.",
    }
  }
  if (order.status === 'shipped') {
    return {
      emoji: '🚚',
      title: 'On its way!',
      message: `Your order was handed to ${order.courier ?? 'the courier'}${order.awb ? ` (AWB ${order.awb})` : ''}. It should arrive in 3–6 days.`,
    }
  }
  if (order.status === 'packaged') {
    return {
      emoji: '📦',
      title: 'Packaged & awaiting courier pickup',
      message: `Your ${u} are boxed and padded in packing tier ${order.tier}. The courier collects them from the studio soon.`,
    }
  }
  if (batch.stage === 'funding') {
    return stats.funded
      ? {
          emoji: '🎉',
          title: 'Goal reached!',
          message: `The batch is funded. Production starts soon — your card will be charged then.`,
        }
      : {
          emoji: '🎯',
          title: `${stats.pledgedUnits} / ${batch.fundingGoal} pre-orders secured`,
          message: `Production starts once ${stats.remainingToGoal} more ${stats.remainingToGoal === 1 ? 'pre-order is' : 'pre-orders are'} placed. Your card is only held, not charged.`,
        }
  }
  const stage = stageById(batch.stage)
  const latest = batch.stageHistory.at(-1)
  return {
    emoji: stage.emoji,
    title: stage.headline(u),
    message: latest?.note || stage.buyerMsg(u),
    photoUrl: latest?.photoUrl,
  }
}

export function groupByZone(orders) {
  const groups = {}
  for (const o of orders) (groups[zoneOf(o.pincode)] ??= []).push(o)
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}
