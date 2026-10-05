import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Package, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { markPackaged, markShipped } from '../api/batches'
import { groupByZone, isActiveOrder } from '../domain/batchLogic'
import { zoneLabel } from '../domain/stages'
import { useMutation } from '../hooks/useQuery'
import { cn, pluralize } from '../lib/utils'
import { OrderStatusBadge } from './badges'
import { Button } from './ui/Button'
import { Select } from './ui/Field'
import { Badge, Card, EmptyState } from './ui/primitives'

const COURIERS = ['India Post', 'Delhivery', 'Blue Dart', 'DTDC']

function OrderRow({ order, checked, onToggle, selectable }) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        selectable ? 'cursor-pointer hover:bg-muted' : 'opacity-80',
        checked && 'bg-accent hover:bg-accent',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={!selectable}
        className="size-4.5 shrink-0 rounded accent-[var(--primary)]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {order.buyerName} <span className="text-muted-fg">· {order.quantity}×</span>
        </p>
        <p className="truncate text-xs text-muted-fg">
          {order.number} · {order.city} {order.pincode}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <OrderStatusBadge status={order.status} />
        {order.tier && <span className="text-[11px] text-muted-fg">Tier {order.tier}</span>}
      </div>
    </label>
  )
}

export function PackingBoard({ batch, orders }) {
  const [selected, setSelected] = useState(() => new Set())
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [courier, setCourier] = useState(COURIERS[0])
  const [pack, packing] = useMutation(markPackaged)
  const [ship, shipping] = useMutation(markShipped)

  const active = useMemo(() => orders.filter(isActiveOrder), [orders])
  const zones = useMemo(() => groupByZone(active), [active])
  const selectedOrders = active.filter((o) => selected.has(o.id))
  const selectedStatus = selectedOrders[0]?.status

  if (batch.stage !== 'fulfillment' && batch.stage !== 'complete') {
    return (
      <Card>
        <EmptyState
          emoji="📦"
          title="Packing opens after production"
          description="Once the batch reaches “Packing & Shipping”, orders appear here grouped by postal zone so you can pack a few zones at a time."
        />
      </Card>
    )
  }

  const toggle = (order) => {
    setSelected((prev) => {
      const next = new Set(prev)
      // Keep selections homogeneous so the action bar has one clear action.
      if (next.size && !next.has(order.id) && selectedStatus !== order.status) next.clear()
      next.has(order.id) ? next.delete(order.id) : next.add(order.id)
      return next
    })
  }

  const selectZone = (zoneOrders, status) => {
    const ids = zoneOrders.filter((o) => o.status === status).map((o) => o.id)
    const allIn = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(selectedStatus === status ? prev : [])
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const toggleCollapse = (zone) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(zone) ? next.delete(zone) : next.add(zone)
      return next
    })

  const onPack = async () => {
    try {
      const res = await pack(batch.id, [...selected])
      toast.success(`Tier ${res.tier} packaged`, {
        description: `${pluralize(res.count, 'buyer')} told “Packaged & awaiting courier pickup”.`,
      })
      setSelected(new Set())
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onShip = async () => {
    try {
      const res = await ship(batch.id, [...selected], courier)
      toast.success(`${pluralize(res.count, 'order')} handed to ${courier}`)
      setSelected(new Set())
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map(([zone, zoneOrders]) => {
          const toPack = zoneOrders.filter((o) => o.status === 'charged')
          const toShip = zoneOrders.filter((o) => o.status === 'packaged')
          const units = zoneOrders.reduce((s, o) => s + o.quantity, 0)
          const isCollapsed = collapsed.has(zone)
          const doneAll = toPack.length === 0 && toShip.length === 0
          return (
            <Card key={zone} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleCollapse(zone)}
                className="flex items-start gap-3 p-4 text-left"
                aria-expanded={!isCollapsed}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent font-display text-lg font-semibold text-primary">
                  {zone}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{zoneLabel(zone).split(' — ')[0]}</p>
                  <p className="truncate text-xs text-muted-fg">{zoneLabel(zone).split(' — ')[1]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>{pluralize(units, 'piece')}</Badge>
                    {toPack.length > 0 && <Badge tone="info">{toPack.length} to pack</Badge>}
                    {toShip.length > 0 && <Badge tone="warning">{toShip.length} awaiting pickup</Badge>}
                    {doneAll && <Badge tone="success">All shipped</Badge>}
                  </div>
                </div>
                <ChevronDown className={cn('mt-1 size-5 text-muted-fg transition-transform', isCollapsed && '-rotate-90')} />
              </button>

              {!isCollapsed && (
                <div className="border-t border-border p-2">
                  {(toPack.length > 0 || toShip.length > 0) && (
                    <div className="flex gap-2 px-2 pt-1 pb-2">
                      {toPack.length > 0 && (
                        <button type="button" onClick={() => selectZone(zoneOrders, 'charged')} className="text-xs font-semibold text-primary hover:underline">
                          Select all to pack
                        </button>
                      )}
                      {toShip.length > 0 && (
                        <button type="button" onClick={() => selectZone(zoneOrders, 'packaged')} className="text-xs font-semibold text-primary hover:underline">
                          Select all awaiting pickup
                        </button>
                      )}
                    </div>
                  )}
                  {zoneOrders.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      checked={selected.has(o.id)}
                      onToggle={() => toggle(o)}
                      selectable={o.status === 'charged' || o.status === 'packaged'}
                    />
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-3 bottom-20 z-30 mx-auto max-w-2xl lg:bottom-6 lg:left-72"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-2xl backdrop-blur">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="grid size-9 place-items-center rounded-full text-muted-fg hover:bg-muted"
                aria-label="Clear selection"
              >
                <X className="size-4" />
              </button>
              <p className="flex-1 text-sm font-semibold">
                {selected.size} selected
                <span className="block text-xs font-normal text-muted-fg">
                  {selectedOrders.reduce((s, o) => s + o.quantity, 0)} pieces
                </span>
              </p>
              {selectedStatus === 'charged' ? (
                <Button onClick={onPack} loading={packing}>
                  <Package className="size-4" /> Mark as packaged
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Select value={courier} onChange={(e) => setCourier(e.target.value)} className="h-11 w-auto" aria-label="Courier">
                    {COURIERS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                  <Button onClick={onShip} loading={shipping}>
                    <Truck className="size-4" /> Shipped
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
