import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, BellRing, HandCoins, Hammer } from 'lucide-react'
import { listPublicBatches } from '../api/batches'
import { listStudios } from '../api/creators'
import { BatchCard } from '../components/BatchCard'
import { ButtonLink } from '../components/ui/Button'
import { Card, ErrorState, SectionHeading, Skeleton } from '../components/ui/primitives'
import { useQuery } from '../hooks/useQuery'
import { studioThemeProps } from '../lib/studioTheme'
import { cn, pluralize } from '../lib/utils'

const STEPS = [
  {
    icon: HandCoins,
    title: 'Pledge, don’t pay',
    text: 'Reserve a piece from an upcoming batch. Your card is only held — it’s charged when the batch hits its goal.',
  },
  {
    icon: Hammer,
    title: 'Watch it being made',
    text: 'Follow every studio milestone, from liquid clay in the mold to 1,200°C in the kiln, with photos from the artist.',
  },
  {
    icon: BellRing,
    title: 'Honest shipping updates',
    text: 'No fake “shipped” emails. You’ll know when it’s boxed, when the courier collects it, and when it’s on the way.',
  },
]

const DEMOS = [
  { token: 'demo-autumn', emoji: '🎯', label: 'Funding in progress' },
  { token: 'demo-kiln', emoji: '🔥', label: 'In the kiln' },
  { token: 'demo-packed', emoji: '📦', label: 'Awaiting courier pickup' },
]

function StudioCard({ studio }) {
  const theme = studioThemeProps(studio.accentHue)
  return (
    <Link
      to={`/s/${studio.slug}`}
      style={theme.style}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-stone-900/5',
        theme.className,
      )}
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-2xl">{studio.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-semibold">{studio.studioName}</p>
        <p className="truncate text-sm text-muted-fg">
          {studio.displayName} · {studio.city}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-primary">{pluralize(studio.batchCount, 'batch', 'batches')}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-fg transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

export function Storefront() {
  const { data: batches, loading, error } = useQuery('public-batches', listPublicBatches)
  const { data: studios } = useQuery('studios', listStudios)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash, loading])

  const open = batches?.filter((b) => b.stage === 'funding' && b.stats.daysLeft >= 0) ?? []
  const inProgress = batches?.filter((b) => !open.includes(b) && b.stage !== 'cancelled') ?? []

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 85% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%), radial-gradient(40% 40% at 0% 30%, color-mix(in oklab, #f59e0b 14%, transparent), transparent 70%)',
          }}
        />
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 sm:pt-20 sm:pb-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-semibold text-muted-fg backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              {open.length ? `${open.length} batch${open.length > 1 ? 'es' : ''} open for pre-order` : 'Handmade micro-batches'}
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Small batches. <span className="text-primary">Made by hand.</span> Funded by you.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-fg sm:text-lg">
              Pre-order ceramics before they exist, then follow your piece from wet clay to your doorstep. You’re only
              charged if the batch gets made.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={open[0] ? `/b/${open[0].id}` : '#batches'} size="lg">
                {open[0] ? 'See the open batch' : 'Browse batches'} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink to="/#how-it-works" variant="secondary" size="lg">
                How it works
              </ButtonLink>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 sm:px-6">
        <section id="batches" className="scroll-mt-24">
          <SectionHeading title="Open for pre-order" description="Help these batches reach their goal." />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading &&
              Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
            {error && <ErrorState error={error} />}
            {open.map((b) => (
              <BatchCard key={b.id} batch={b} to={`/b/${b.id}`} />
            ))}
            {!loading && !error && open.length === 0 && (
              <Card className="p-6 text-sm text-muted-fg sm:col-span-2 lg:col-span-3">
                No batches are open right now — check back soon.
              </Card>
            )}
          </div>
        </section>

        {inProgress.length > 0 && (
          <section>
            <SectionHeading title="In the studio" description="Funded batches currently being made or shipped." />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inProgress.map((b) => (
                <BatchCard key={b.id} batch={b} to={`/b/${b.id}`} />
              ))}
            </div>
          </section>
        )}

        {studios?.length > 0 && (
          <section id="makers" className="scroll-mt-24">
            <SectionHeading title="Meet the makers" description="Independent studios selling in small, honest batches." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {studios.map((s) => (
                <StudioCard key={s.id} studio={s} />
              ))}
            </div>
          </section>
        )}

        <section id="how-it-works" className="scroll-mt-24">
          <SectionHeading title="How it works" description="Built for makers, not warehouses." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Card key={title} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-sm font-semibold text-muted-fg">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="flex flex-col gap-5 bg-gradient-to-br from-accent to-surface p-6 sm:p-8 md:flex-row md:items-center">
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">See what buyers see</h2>
              <p className="mt-1 text-sm text-muted-fg">Open a sample tracking page at different points in the journey.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {DEMOS.map((d) => (
                <Link
                  key={d.token}
                  to={`/track/${d.token}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  <span>{d.emoji}</span> {d.label}
                </Link>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </>
  )
}
