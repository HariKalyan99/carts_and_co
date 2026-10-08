import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { saveCreatorProfile } from '../../api/creators'
import { CopyButton } from '../../components/common'
import { StudioProfileForm } from '../../components/StudioProfileForm'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/primitives'
import { useMutation } from '../../hooks/useQuery'
import { useCreator } from '../../lib/creatorContext'
import { absoluteUrl } from '../../lib/utils'

export function Settings() {
  const { creator } = useCreator()
  const [save, pending] = useMutation(saveCreatorProfile)
  const studioUrl = absoluteUrl(`/s/${creator.slug}`)

  const onSubmit = async (values) => {
    try {
      await save(values)
      toast.success('Studio updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Studio settings</h1>
        <p className="mt-1 text-muted-fg">Your profile and branding, shown to buyers across your pages.</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Your studio page</p>
          <p className="truncate font-mono text-xs text-muted-fg">{studioUrl}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={studioUrl} />
          <ButtonLink to={`/s/${creator.slug}`} variant="secondary" size="sm" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Open
          </ButtonLink>
        </div>
      </Card>

      <StudioProfileForm key={creator.id} initial={creator} onSubmit={onSubmit} pending={pending} submitLabel="Save changes" />
    </div>
  )
}
