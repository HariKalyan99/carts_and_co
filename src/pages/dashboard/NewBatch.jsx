import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useUser } from '@clerk/react-router'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createBatch } from '../../api/batches'
import { BatchCard } from '../../components/BatchCard'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Card } from '../../components/ui/primitives'
import { COVER_HUES } from '../../domain/stages'
import { useMutation } from '../../hooks/useQuery'
import { cn, daysUntil } from '../../lib/utils'

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

const INITIAL = {
  title: '',
  tagline: '',
  description: '',
  unitLabel: 'mugs',
  price: '1800',
  fundingGoal: '30',
  maxQuantity: '50',
  fundingDeadline: inDays(21),
  coverHue: COVER_HUES[0],
}

function validate(v) {
  const e = {}
  if (v.title.trim().length < 3) e.title = 'Give your batch a name'
  if (v.tagline.trim().length < 5) e.tagline = 'Add a one-line description'
  if (!(Number(v.price) >= 50)) e.price = 'Minimum price is ₹50'
  if (!(Number(v.fundingGoal) >= 1)) e.fundingGoal = 'Goal must be at least 1'
  if (!(Number(v.maxQuantity) >= Number(v.fundingGoal))) e.maxQuantity = 'Batch size must be at least the goal'
  if (!v.fundingDeadline || daysUntil(`${v.fundingDeadline}T23:59:59`) < 2) e.fundingDeadline = 'Pick a date from tomorrow onwards'
  return e
}

export function NewBatch() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submit, pending] = useMutation(createBatch)

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    try {
      const batch = await submit({ ...values, artist: user?.fullName })
      toast.success('Batch created — pre-orders are open!')
      navigate(`/dashboard/batches/${batch.id}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const preview = {
    id: 'preview',
    title: values.title || 'Your batch name',
    tagline: values.tagline || 'A one-line description buyers will see.',
    unitLabel: values.unitLabel || 'pieces',
    price: Number(values.price) || 0,
    fundingGoal: Math.max(1, Number(values.fundingGoal) || 1),
    maxQuantity: Math.max(1, Number(values.maxQuantity) || 1),
    coverHue: values.coverHue,
    stage: 'funding',
    stats: {
      pledgedUnits: 0,
      funded: false,
      daysLeft: values.fundingDeadline ? Math.max(0, daysUntil(`${values.fundingDeadline}T23:59:59`)) : 0,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <ButtonLink to="/dashboard" variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft className="size-4" /> Batches
        </ButtonLink>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">New micro-batch</h1>
        <p className="mt-1 text-muted-fg">Set a funding goal that covers your clay, glaze and kiln time.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="font-semibold">The batch</h2>
            <Field label="Batch name" error={errors.title}>
              {(p) => <Input {...p} value={values.title} onChange={set('title')} placeholder="The Autumn Forest Mug Series" />}
            </Field>
            <Field label="Tagline" error={errors.tagline}>
              {(p) => <Input {...p} value={values.tagline} onChange={set('tagline')} placeholder="Speckled stoneware in moss and rust tones." />}
            </Field>
            <Field label="Story" optional hint="What makes this batch special? Materials, inspiration, size.">
              {(p) => <Textarea {...p} value={values.description} onChange={set('description')} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Cover colour</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cover colour">
                {COVER_HUES.map((hue) => (
                  <button
                    key={hue}
                    type="button"
                    role="radio"
                    aria-checked={values.coverHue === hue}
                    aria-label={`Hue ${hue}`}
                    onClick={() => setValues((v) => ({ ...v, coverHue: hue }))}
                    className={cn(
                      'grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow',
                      values.coverHue === hue && 'ring-2 ring-fg',
                    )}
                    style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 70%), hsl(${(hue + 25) % 360} 40% 35%))` }}
                  >
                    {values.coverHue === hue && <Check className="size-4 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold">Funding goal</h2>
              <p className="mt-0.5 text-sm text-muted-fg">Buyers are only charged once the goal is reached.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price per piece (₹)" error={errors.price}>
                {(p) => <Input {...p} type="number" inputMode="numeric" min={50} value={values.price} onChange={set('price')} />}
              </Field>
              <Field label="What are you making?" hint="Plural, e.g. mugs, bowls, vases">
                {(p) => <Input {...p} value={values.unitLabel} onChange={set('unitLabel')} />}
              </Field>
              <Field label="Pre-orders needed" error={errors.fundingGoal} hint="Minimum to start production">
                {(p) => <Input {...p} type="number" inputMode="numeric" min={1} value={values.fundingGoal} onChange={set('fundingGoal')} />}
              </Field>
              <Field label="Batch size" error={errors.maxQuantity} hint="Maximum you can make">
                {(p) => <Input {...p} type="number" inputMode="numeric" min={1} value={values.maxQuantity} onChange={set('maxQuantity')} />}
              </Field>
              <Field label="Funding deadline" error={errors.fundingDeadline} className="sm:col-span-2">
                {(p) => <Input {...p} type="date" min={inDays(1)} value={values.fundingDeadline} onChange={set('fundingDeadline')} />}
              </Field>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ButtonLink to="/dashboard" variant="ghost">
              Cancel
            </ButtonLink>
            <Button type="submit" size="lg" loading={pending}>
              <Sparkles className="size-4" /> Open pre-orders
            </Button>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-10 space-y-3">
            <p className="text-xs font-semibold tracking-wide text-muted-fg uppercase">Live preview</p>
            <div className="pointer-events-none">
              <BatchCard batch={preview} to="#" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
