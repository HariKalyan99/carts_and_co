import { useState } from 'react'
import { Link } from 'react-router'
import { Lock, Minus, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { pledge } from '../api/batches'
import { useMutation } from '../hooks/useQuery'
import { absoluteUrl, formatINR } from '../lib/utils'
import { CopyButton } from './common'
import { Button, ButtonLink } from './ui/Button'
import { Field, Input } from './ui/Field'
import { Sheet } from './ui/Sheet'

const EMPTY = { name: '', email: '', address: '', city: '', pincode: '', quantity: 1 }

function validate(v) {
  const errors = {}
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name'
  if (!/^\S+@\S+\.\S+$/.test(v.email)) errors.email = 'Enter a valid email so we can send updates'
  if (v.address.trim().length < 5) errors.address = 'Enter your street address'
  if (v.city.trim().length < 2) errors.city = 'Enter your city'
  if (!/^[1-9]\d{5}$/.test(v.pincode)) errors.pincode = 'Enter a 6-digit PIN code'
  return errors
}

/** `defaults` prefills name/email for signed-in buyers; remount (via `key`) when they change. */
export function PledgeSheet({ batch, open, onClose, defaults }) {
  const initial = { ...EMPTY, ...defaults }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [submit, pending] = useMutation(pledge)

  const maxQty = Math.min(4, batch.stats.remainingCapacity)
  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }
  const setQty = (q) => setValues((v) => ({ ...v, quantity: Math.max(1, Math.min(maxQty, q)) }))

  const close = () => {
    onClose()
    if (order) {
      setOrder(null)
      setValues(initial)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      setOrder(await submit(batch.id, values))
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (order) {
    const trackUrl = `/track/${order.trackingToken}`
    return (
      <Sheet open={open} onClose={close} title="You're in! 🎉">
        <div className="space-y-5">
          <p className="text-[15px] leading-relaxed text-muted-fg">
            Your pre-order <strong className="text-fg">{order.number}</strong> for {order.quantity} ×{' '}
            {batch.title} is secured. Your card is <strong className="text-fg">held, not charged</strong> — you'll only
            pay once the batch reaches {batch.fundingGoal} pre-orders.
          </p>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-fg uppercase">Your tracking link</p>
            <p className="mt-1 font-mono text-sm break-all">{absoluteUrl(trackUrl)}</p>
            <p className="mt-2 text-xs text-muted-fg">
              We'll also email every studio milestone to <strong>{order.email}</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink to={trackUrl} size="lg" className="flex-1">
              Follow my batch
            </ButtonLink>
            <CopyButton text={absoluteUrl(trackUrl)} size="lg" className="flex-1" />
          </div>
        </div>
      </Sheet>
    )
  }

  const total = values.quantity * batch.price

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Reserve your piece"
      description={batch.title}
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-fg">Held today, charged only if funded</span>
            <span className="text-lg font-semibold tabular-nums">{formatINR(total)}</span>
          </div>
          <Button type="submit" form="pledge-form" size="lg" className="w-full" loading={pending}>
            <Lock className="size-4" />
            Pre-order {values.quantity > 1 ? `${values.quantity} ${batch.unitLabel}` : 'now'}
          </Button>
        </div>
      }
    >
      <form id="pledge-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-border p-3 pl-4">
          <div>
            <p className="text-sm font-semibold">Quantity</p>
            <p className="text-xs text-muted-fg">
              {formatINR(batch.price)} each · max {maxQty}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => setQty(values.quantity - 1)} disabled={values.quantity <= 1} aria-label="Decrease quantity">
              <Minus className="size-4" />
            </Button>
            <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite">
              {values.quantity}
            </span>
            <Button variant="secondary" size="icon" onClick={() => setQty(values.quantity + 1)} disabled={values.quantity >= maxQty} aria-label="Increase quantity">
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <Field label="Full name" error={errors.name}>
          {(p) => <Input {...p} value={values.name} onChange={set('name')} autoComplete="name" placeholder="Ananya Iyer" />}
        </Field>
        <Field label="Email" error={errors.email} hint="Studio updates and your tracking link go here.">
          {(p) => <Input {...p} type="email" inputMode="email" value={values.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />}
        </Field>
        <Field label="Street address" error={errors.address}>
          {(p) => <Input {...p} value={values.address} onChange={set('address')} autoComplete="street-address" placeholder="Flat, building, street" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" error={errors.city}>
            {(p) => <Input {...p} value={values.city} onChange={set('city')} autoComplete="address-level2" />}
          </Field>
          <Field label="PIN code" error={errors.pincode}>
            {(p) => (
              <Input
                {...p}
                value={values.pincode}
                onChange={set('pincode')}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                placeholder="560034"
              />
            )}
          </Field>
        </div>

        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Funding protection:</strong> if this batch doesn't reach {batch.fundingGoal} pre-orders, the hold is
            released automatically and you pay nothing.{' '}
            <Link to="/#how-it-works" onClick={close} className="underline underline-offset-2">
              How it works
            </Link>
          </p>
        </div>
        <p className="text-center text-xs text-muted-fg">Demo mode — no real payment is taken.</p>
      </form>
    </Sheet>
  )
}
