import { useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { validateProfile } from '../api/creators'
import { ACCENT_HUES, STUDIO_EMOJIS } from '../lib/studioTheme'
import { cn, slugFrom } from '../lib/utils'
import { StudioTheme } from './StudioTheme'
import { Button } from './ui/Button'
import { Field, Input, Textarea } from './ui/Field'
import { Card } from './ui/primitives'

export function StudioHeader({ profile, compact }) {
  return (
    <StudioTheme hue={profile.accentHue}>
      <div className={cn('flex items-center gap-4', compact ? '' : 'sm:gap-5')}>
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/25',
            compact ? 'size-12 text-2xl' : 'size-16 text-3xl sm:size-20 sm:text-4xl',
          )}
        >
          {profile.emoji}
        </span>
        <div className="min-w-0">
          <p className={cn('truncate font-display font-semibold tracking-tight', compact ? 'text-lg' : 'text-2xl sm:text-3xl')}>
            {profile.studioName || 'Your studio'}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-fg">
            <span>by {profile.displayName || 'you'}</span>
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {profile.city}
              </span>
            )}
          </p>
        </div>
      </div>
    </StudioTheme>
  )
}

/**
 * Studio name, URL, bio and branding. `initial` seeds the form; the slug follows
 * the studio name until the creator edits it by hand.
 */
export function StudioProfileForm({ initial, onSubmit, submitLabel, pending, footer }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))

  const set = (key) => (e) => {
    const value = e.target.value
    setValues((v) => {
      const next = { ...v, [key]: value }
      if (key === 'studioName' && !slugTouched) next.slug = slugFrom(value)
      return next
    })
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const clean = { ...values, slug: values.slug.replace(/-+$/, '') }
    setValues(clean)
    const errs = validateProfile(clean)
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSubmit(clean)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} noValidate className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="font-semibold">Studio</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" error={errors.displayName}>
              {(p) => <Input {...p} value={values.displayName} onChange={set('displayName')} autoComplete="name" />}
            </Field>
            <Field label="Studio name" error={errors.studioName}>
              {(p) => <Input {...p} value={values.studioName} onChange={set('studioName')} placeholder="Clay & Ember Studio" />}
            </Field>
            <Field label="City" optional>
              {(p) => <Input {...p} value={values.city} onChange={set('city')} placeholder="Bengaluru" />}
            </Field>
            <Field label="Studio URL" error={errors.slug} hint={`${window.location.host}/s/${values.slug || 'your-studio'}`}>
              {(p) => (
                <Input
                  {...p}
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug')({ target: { value: slugFrom(e.target.value) } })
                  }}
                  autoCapitalize="off"
                  spellCheck={false}
                />
              )}
            </Field>
          </div>
          <Field label="About your studio" optional error={errors.bio} hint={`${values.bio.length}/280 · shown on your studio page`}>
            {(p) => <Textarea {...p} value={values.bio} onChange={set('bio')} maxLength={280} placeholder="What do you make, and how?" />}
          </Field>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Branding</h2>
            <p className="mt-0.5 text-sm text-muted-fg">Used on your studio page, batch pages, buyer tracking and your dashboard.</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Accent colour</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
              {ACCENT_HUES.map((hue) => (
                <button
                  key={hue}
                  type="button"
                  role="radio"
                  aria-checked={values.accentHue === hue}
                  aria-label={`Hue ${hue}`}
                  onClick={() => setValues((v) => ({ ...v, accentHue: hue }))}
                  className={cn(
                    'grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow',
                    values.accentHue === hue && 'ring-2 ring-fg',
                  )}
                  style={{ background: `hsl(${hue} 62% 46%)` }}
                >
                  {values.accentHue === hue && <Check className="size-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Studio icon</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Studio icon">
              {STUDIO_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="radio"
                  aria-checked={values.emoji === emoji}
                  onClick={() => setValues((v) => ({ ...v, emoji }))}
                  className={cn(
                    'grid size-11 place-items-center rounded-xl border text-xl transition-colors',
                    values.emoji === emoji ? 'border-fg bg-muted' : 'border-border hover:bg-muted',
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {footer}

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-10 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-muted-fg uppercase">Preview</p>
          <Card className="overflow-hidden">
            <StudioTheme hue={values.accentHue}>
              <div className="h-16 bg-gradient-to-br from-primary to-primary/40" />
            </StudioTheme>
            <div className="space-y-3 p-5">
              <StudioHeader profile={values} compact />
              {values.bio && <p className="text-sm leading-relaxed text-muted-fg">{values.bio}</p>}
              <StudioTheme hue={values.accentHue}>
                <span className="inline-block rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg">
                  Pre-order now
                </span>
              </StudioTheme>
            </div>
          </Card>
        </div>
      </aside>
    </div>
  )
}
