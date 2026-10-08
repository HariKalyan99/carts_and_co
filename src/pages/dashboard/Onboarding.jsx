import { useState } from 'react'
import { useNavigate } from 'react-router'
import { SignOutButton } from '@clerk/react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { loadSampleBatches, saveCreatorProfile } from '../../api/creators'
import { Logo, ThemeToggle } from '../../components/common'
import { StudioProfileForm } from '../../components/StudioProfileForm'
import { Card } from '../../components/ui/primitives'
import { useCreator } from '../../lib/creatorContext'
import { slugFrom } from '../../lib/utils'

export function Onboarding() {
  const { user } = useCreator()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [withSamples, setWithSamples] = useState(true)

  const name = user.fullName || user.firstName || ''
  const initial = {
    displayName: name,
    studioName: name ? `${user.firstName ?? name}'s Studio` : '',
    slug: name ? slugFrom(`${user.firstName ?? name} studio`) : '',
    city: '',
    bio: '',
    accentHue: 18,
    emoji: '🏺',
  }

  const onSubmit = async (values) => {
    setPending(true)
    try {
      await saveCreatorProfile(values)
      if (withSamples) await loadSampleBatches()
      toast.success('Your studio is ready 🎉')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message)
      setPending(false)
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="flex h-16 items-center justify-between border-b border-border/70 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton>
            <button type="button" className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-fg hover:bg-muted hover:text-fg">
              <LogOut className="size-4" /> Sign out
            </button>
          </SignOutButton>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-semibold text-primary">Step 1 of 1</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Set up your studio</h1>
        <p className="mt-2 max-w-xl text-muted-fg">
          This is how buyers will see you. You get your own studio page, branded batch pages, and a dashboard that only
          shows your batches and backers.
        </p>
        <div className="mt-8">
          <StudioProfileForm
            initial={initial}
            onSubmit={onSubmit}
            pending={pending}
            submitLabel="Open my studio"
            footer={
              <Card className="p-5 sm:p-6">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={withSamples}
                    onChange={(e) => setWithSamples(e.target.checked)}
                    className="mt-0.5 size-4.5 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Add sample batches to explore</span>
                    <span className="block text-sm text-muted-fg">
                      Three demo batches (funding, in the kiln, and shipping) with sample backers, so you can try every
                      step. You can cancel them any time.
                    </span>
                  </span>
                </label>
              </Card>
            }
          />
        </div>
      </main>
    </div>
  )
}
