import { useParams } from 'react-router'
import { getStudio } from '../api/creators'
import { BatchCard } from '../components/BatchCard'
import { CopyButton } from '../components/common'
import { StudioHeader } from '../components/StudioProfileForm'
import { StudioTheme } from '../components/StudioTheme'
import { ButtonLink } from '../components/ui/Button'
import { Card, EmptyState, SectionHeading, Skeleton } from '../components/ui/primitives'
import { useQuery } from '../hooks/useQuery'
import { absoluteUrl } from '../lib/utils'

export function StudioPage() {
  const { slug } = useParams()
  const { data, loading, error } = useQuery(`studio:${slug}`, () => getStudio(slug))

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        emoji="🏺"
        title="Studio not found"
        description="This studio may have changed its link."
        action={<ButtonLink to="/">Browse all batches</ButtonLink>}
        className="py-24"
      />
    )
  }

  const { creator, batches } = data
  const open = batches.filter((b) => b.stage === 'funding' && b.stats.daysLeft >= 0)
  const rest = batches.filter((b) => !open.includes(b))

  return (
    <StudioTheme hue={creator.accentHue}>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-accent via-bg to-bg" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <StudioHeader profile={creator} />
            {creator.bio && <p className="mt-5 text-base leading-relaxed text-muted-fg sm:text-lg">{creator.bio}</p>}
          </div>
          <CopyButton text={absoluteUrl(`/s/${creator.slug}`)} label="Share studio" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        <section>
          <SectionHeading title="Open for pre-order" description={`Back a batch from ${creator.studioName} before it's made.`} />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((b) => (
              <BatchCard key={b.id} batch={b} to={`/b/${b.id}`} hideStudio />
            ))}
            {open.length === 0 && (
              <Card className="p-6 text-sm text-muted-fg sm:col-span-2 lg:col-span-3">
                No batches are open right now — check back soon.
              </Card>
            )}
          </div>
        </section>

        {rest.length > 0 && (
          <section>
            <SectionHeading title="In the studio & past batches" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((b) => (
                <BatchCard key={b.id} batch={b} to={`/b/${b.id}`} hideStudio />
              ))}
            </div>
          </section>
        )}
      </div>
    </StudioTheme>
  )
}
