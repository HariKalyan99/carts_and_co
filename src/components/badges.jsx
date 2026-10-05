import { PHASE_META } from '../domain/batchLogic'
import { ORDER_STATUS } from '../domain/stages'
import { Badge } from './ui/primitives'

export function PhaseBadge({ phase, className }) {
  const meta = PHASE_META[phase]
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

export function OrderStatusBadge({ status }) {
  const meta = ORDER_STATUS[status]
  return (
    <span title={meta.hint}>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </span>
  )
}
