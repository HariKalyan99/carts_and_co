import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, Search } from 'lucide-react'
import { ORDER_STATUS } from '../domain/stages'
import { formatDate, formatINR } from '../lib/utils'
import { OrderStatusBadge } from './badges'
import { Input, Select } from './ui/Field'
import { Card, EmptyState } from './ui/primitives'

export function OrdersList({ orders, price }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (status === 'all' || o.status === status) &&
        (!q || [o.buyerName, o.email, o.number, o.city, o.pincode].some((f) => f.toLowerCase().includes(q))),
    )
  }, [orders, query, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, order, PIN…"
            className="pl-10"
            aria-label="Search orders"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48" aria-label="Filter by status">
          <option value="all">All statuses</option>
          {Object.entries(ORDER_STATUS).map(([id, meta]) => (
            <option key={id} value={id}>
              {meta.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState emoji="🔍" title="No matching orders" description="Try a different search or status filter." />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((o) => (
              <li key={o.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.buyerName}</p>
                      <p className="truncate text-xs text-muted-fg">{o.email}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-fg">
                      {o.number} · {o.quantity}× · {o.city}
                    </span>
                    <Link to={`/track/${o.trackingToken}`} className="flex items-center gap-1 font-medium text-primary">
                      Track <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-fg">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Ship to</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.number}</p>
                      <p className="text-xs text-muted-fg">{formatDate(o.createdAt, { day: 'numeric', month: 'short' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.buyerName}</p>
                      <p className="text-xs text-muted-fg">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {o.city} · {o.pincode}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(o.quantity * price)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/track/${o.trackingToken}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Buyer view <ExternalLink className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
