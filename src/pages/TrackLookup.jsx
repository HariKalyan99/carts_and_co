import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PackageSearch } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Card } from '../components/ui/primitives'

export function TrackLookup() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    const token = code.trim().split('/track/').pop()
    if (token) navigate(`/track/${encodeURIComponent(token)}`)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="mb-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <PackageSearch className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">Track your order</h1>
        <p className="mt-2 text-muted-fg">Paste the tracking link or code from your confirmation email.</p>
      </div>
      <Card className="p-5 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Tracking code or link">
            {(p) => (
              <Input {...p} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. demo-kiln" autoFocus />
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={!code.trim()}>
            Find my order
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-fg">
        Just exploring? Try{' '}
        <Link to="/track/demo-kiln" className="font-semibold text-primary hover:underline">
          a sample order
        </Link>
        .
      </p>
    </div>
  )
}
