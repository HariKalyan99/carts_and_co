import { canPledge, computeStats, isActiveOrder } from '../domain/batchLogic'
import { nextStage } from '../domain/stages'
import { delay, read, resetDb, uid, write } from './mockDb'

const withStats = (db, batch) => {
  const orders = db.orders.filter((o) => o.batchId === batch.id)
  return { ...batch, stats: computeStats(batch, orders) }
}

function findBatch(db, id) {
  const batch = db.batches.find((b) => b.id === id)
  if (!batch) throw new Error('Batch not found')
  return batch
}

function sendEmail(db, { batch, kind, stage, subject, body, photoUrl, orders }) {
  const recipients = orders.map((o) => o.email)
  if (recipients.length === 0) return null
  const mail = {
    id: uid('mail-'),
    batchId: batch.id,
    kind,
    stage,
    subject,
    body,
    photoUrl,
    recipients,
    sentAt: new Date().toISOString(),
  }
  db.outbox.push(mail)
  return mail
}

// ---------- Queries ----------

export async function listBatches() {
  await delay()
  return read((db) =>
    db.batches
      .map((b) => withStats(db, b))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  )
}

/** Public-safe view: no buyer details. */
export async function getPublicBatch(id) {
  await delay()
  return read((db) => withStats(db, findBatch(db, id)))
}

export async function getBatchAdmin(id) {
  await delay()
  return read((db) => {
    const batch = findBatch(db, id)
    return {
      batch: withStats(db, batch),
      orders: db.orders
        .filter((o) => o.batchId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }
  })
}

export async function getTracking(token) {
  await delay()
  return read((db) => {
    const order = db.orders.find((o) => o.trackingToken === token.trim())
    if (!order) throw new Error('We couldn’t find an order with that tracking code.')
    return { order, batch: withStats(db, findBatch(db, order.batchId)) }
  })
}

/** Orders placed with any of the given (verified) emails, newest first, with their batch. */
export async function listOrdersByEmail(emails) {
  await delay()
  const wanted = emails.map((e) => e.toLowerCase())
  return read((db) =>
    db.orders
      .filter((o) => wanted.includes(o.email))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => ({ order: o, batch: withStats(db, findBatch(db, o.batchId)) })),
  )
}

export async function listOutbox() {
  await delay()
  return read((db) =>
    db.outbox
      .map((m) => ({ ...m, batchTitle: db.batches.find((b) => b.id === m.batchId)?.title }))
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)),
  )
}

// ---------- Mutations ----------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function createBatch(input) {
  await delay()
  return write((db) => {
    let id = slugify(input.title) || uid('batch-')
    if (db.batches.some((b) => b.id === id)) id = `${id}-${uid().slice(0, 4)}`
    const now = new Date().toISOString()
    const code = input.title
      .split(/\s+/)
      .filter((w) => /^[a-z]/i.test(w) && !/^(the|a|an|of)$/i.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
    const batch = {
      id,
      code: code || 'MB',
      title: input.title.trim(),
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      artist: input.artist?.trim() || 'Sarah Thomas',
      studio: 'Clay & Ember Studio, Bengaluru',
      unitLabel: input.unitLabel.trim() || 'pieces',
      price: Number(input.price),
      fundingGoal: Number(input.fundingGoal),
      maxQuantity: Number(input.maxQuantity),
      fundingDeadline: new Date(`${input.fundingDeadline}T23:59:59`).toISOString(),
      createdAt: now,
      coverHue: input.coverHue,
      stage: 'funding',
      stageHistory: [{ stage: 'funding', at: now, note: 'Pre-orders are open!' }],
    }
    db.batches.push(batch)
    return batch
  })
}

export async function pledge(batchId, buyer) {
  await delay(600)
  return write((db) => {
    const batch = findBatch(db, batchId)
    const stats = computeStats(batch, db.orders.filter((o) => o.batchId === batchId))
    if (!canPledge(batch, stats)) throw new Error('This batch is no longer accepting pre-orders.')
    const quantity = Number(buyer.quantity)
    if (quantity > stats.remainingCapacity) {
      throw new Error(`Only ${stats.remainingCapacity} left in this batch.`)
    }
    const n = db.orders.filter((o) => o.batchId === batchId).length + 1
    const order = {
      id: uid('o-'),
      number: `${batch.code}-${String(n).padStart(3, '0')}`,
      batchId,
      buyerName: buyer.name.trim(),
      email: buyer.email.trim().toLowerCase(),
      quantity,
      address: buyer.address.trim(),
      city: buyer.city.trim(),
      pincode: buyer.pincode.trim(),
      status: 'pledged',
      trackingToken: uid('trk-'),
      createdAt: new Date().toISOString(),
    }
    db.orders.push(order)
    return order
  })
}

export async function advanceStage(batchId, { note = '', photoUrl = null } = {}) {
  await delay(500)
  return write((db) => {
    const batch = findBatch(db, batchId)
    const orders = db.orders.filter((o) => o.batchId === batchId && isActiveOrder(o))
    const stats = computeStats(batch, orders)
    const next = nextStage(batch.stage)
    if (!next) throw new Error('This batch is already complete.')

    if (batch.stage === 'funding') {
      if (!stats.funded) throw new Error(`Need ${stats.remainingToGoal} more pre-orders before production can start.`)
      for (const o of orders) o.status = 'charged'
    }
    if (next.id === 'complete' && orders.some((o) => o.status !== 'shipped')) {
      throw new Error('Ship every order before completing the batch.')
    }

    const at = new Date().toISOString()
    const message = note.trim() || next.buyerMsg(batch.unitLabel)
    batch.stage = next.id
    batch.stageHistory.push({ stage: next.id, at, note: note.trim(), photoUrl })

    const mail = sendEmail(db, {
      batch,
      kind: 'stage',
      stage: next.id,
      subject:
        next.id === 'mold'
          ? `${batch.title} is funded! Production has started ${next.emoji}`
          : `${batch.title}: ${next.label} ${next.emoji}`,
      body: message,
      photoUrl,
      orders,
    })
    return {
      stage: { id: next.id, label: next.label, emoji: next.emoji },
      notified: mail?.recipients.length ?? 0,
    }
  })
}

export async function cancelBatch(batchId) {
  await delay(500)
  return write((db) => {
    const batch = findBatch(db, batchId)
    if (batch.stage !== 'funding') throw new Error('Only batches still in funding can be cancelled.')
    const orders = db.orders.filter((o) => o.batchId === batchId && isActiveOrder(o))
    for (const o of orders) o.status = 'refunded'
    batch.stage = 'cancelled'
    batch.stageHistory.push({ stage: 'cancelled', at: new Date().toISOString(), note: '' })
    sendEmail(db, {
      batch,
      kind: 'cancelled',
      subject: `${batch.title} didn't reach its goal — you won't be charged`,
      body: `Thank you for backing this batch. It didn't reach its goal of ${batch.fundingGoal} pre-orders, so your card hold has been released and you haven't been charged anything.`,
      orders,
    })
    return { released: orders.length }
  })
}

export async function markPackaged(batchId, orderIds) {
  await delay(400)
  return write((db) => {
    const batch = findBatch(db, batchId)
    if (batch.stage !== 'fulfillment') throw new Error('Packing opens once the batch reaches fulfillment.')
    const orders = db.orders.filter((o) => orderIds.includes(o.id) && o.status === 'charged')
    const tier = Math.max(0, ...db.orders.filter((o) => o.batchId === batchId).map((o) => o.tier ?? 0)) + 1
    const at = new Date().toISOString()
    for (const o of orders) Object.assign(o, { status: 'packaged', tier, packagedAt: at })
    sendEmail(db, {
      batch,
      kind: 'packaged',
      subject: `${batch.title}: Packaged & awaiting courier pickup 📦`,
      body: `Your ${batch.unitLabel} are boxed and padded in packing tier ${tier}. The courier collects them from the studio soon — we'll email again the moment it's on its way.`,
      orders,
    })
    return { tier, count: orders.length }
  })
}

export async function markShipped(batchId, orderIds, courier = 'India Post') {
  await delay(400)
  return write((db) => {
    const batch = findBatch(db, batchId)
    const orders = db.orders.filter((o) => orderIds.includes(o.id) && o.status === 'packaged')
    const at = new Date().toISOString()
    for (const o of orders) {
      Object.assign(o, {
        status: 'shipped',
        courier,
        awb: `AWB${Math.floor(1e6 + Math.random() * 9e6)}`,
        shippedAt: at,
      })
    }
    sendEmail(db, {
      batch,
      kind: 'shipped',
      subject: `${batch.title}: Your order is on its way 🚚`,
      body: `Your ${batch.unitLabel} have been handed to ${courier}. Tap below to follow the delivery.`,
      orders,
    })
    return { count: orders.length }
  })
}

// ---------- Comments ----------

/** Public: anyone can read the conversation on a batch's updates. Emails are never exposed. */
export async function listComments(batchId) {
  await delay(150)
  return read((db) =>
    db.comments
      .filter((c) => c.batchId === batchId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  )
}

/**
 * `author` is `{ role: 'creator' }` or `{ role: 'buyer', orderId }`. With a real
 * backend the identity would come from the session / tracking token, not the client.
 */
function resolveAuthor(db, batch, author) {
  if (author.role === 'creator') return { role: 'creator', name: batch.artist }
  const order = db.orders.find((o) => o.id === author.orderId && o.batchId === batch.id)
  if (!order) throw new Error('Only backers of this batch can comment.')
  return { role: 'buyer', name: order.buyerName, orderId: order.id, orderNumber: order.number }
}

export async function addComment(batchId, { updateKey, parentId = null, body, author }) {
  await delay(250)
  return write((db) => {
    const batch = findBatch(db, batchId)
    const text = body.trim()
    if (!text) throw new Error('Write something first.')
    if (text.length > 500) throw new Error('Comments are limited to 500 characters.')
    if (!batch.stageHistory.some((h) => `${h.stage}:${h.at}` === updateKey)) {
      throw new Error('That update no longer exists.')
    }
    const parent = parentId ? db.comments.find((c) => c.id === parentId) : null
    if (parentId && !parent) throw new Error('That comment was removed.')

    const comment = {
      id: uid('c-'),
      batchId,
      updateKey,
      // Replies stay one level deep: replying to a reply joins the same thread.
      parentId: parent ? (parent.parentId ?? parent.id) : null,
      author: resolveAuthor(db, batch, author),
      body: text,
      createdAt: new Date().toISOString(),
    }
    db.comments.push(comment)

    if (comment.author.role === 'creator' && parent?.author.role === 'buyer') {
      const order = db.orders.find((o) => o.id === parent.author.orderId)
      if (order) {
        sendEmail(db, {
          batch,
          kind: 'reply',
          subject: `${batch.artist} replied to your comment on ${batch.title}`,
          body: `“${text}”\n\nYou wrote: “${parent.body}”`,
          orders: [order],
        })
      }
    }
    return comment
  })
}

export async function deleteComment(commentId, author) {
  await delay(200)
  return write((db) => {
    const comment = db.comments.find((c) => c.id === commentId)
    if (!comment) return null
    const allowed =
      author.role === 'creator' || (author.role === 'buyer' && comment.author.orderId === author.orderId)
    if (!allowed) throw new Error('You can only delete your own comments.')
    db.comments = db.comments.filter((c) => c.id !== commentId && c.parentId !== commentId)
    return { id: commentId }
  })
}

export async function resetDemo() {
  await delay(200)
  resetDb()
}