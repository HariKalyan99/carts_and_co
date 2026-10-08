import { useRef, useState } from 'react'
import { ImagePlus, Mail, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { advanceStage } from '../api/batches'
import { nextStage } from '../domain/stages'
import { useMutation } from '../hooks/useQuery'
import { readImageFile } from '../lib/image'
import { formatINR, pluralize } from '../lib/utils'
import { Button } from './ui/Button'
import { Field, Textarea } from './ui/Field'
import { Sheet } from './ui/Sheet'

export function AdvanceStageSheet({ batch, open, onClose }) {
  const next = nextStage(batch.stage)
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const fileRef = useRef(null)
  const [submit, pending] = useMutation(advanceStage)
  if (!next) return null

  const starting = batch.stage === 'funding'
  const recipients = batch.stats.orderCount
  const defaultMsg = next.buyerMsg(batch.unitLabel)

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPhotoUrl(await readImageFile(file))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onConfirm = async () => {
    try {
      const res = await submit(batch, { note, photoUrl })
      toast.success(`${res.stage.emoji} Moved to ${res.stage.label}`, {
        description: `${pluralize(res.notified, 'buyer')} notified by email.`,
      })
      setNote('')
      setPhotoUrl(null)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={starting ? 'Start production' : `Move to “${next.label}”`}
      description={
        starting
          ? `${pluralize(recipients, 'pledge')} will be charged (${formatINR(batch.stats.revenue)}) and production begins.`
          : `All ${pluralize(recipients, 'buyer')} get an email and their tracking page updates instantly.`
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={pending}>
            <Send className="size-4" />
            {starting ? 'Charge & start production' : `Update & notify ${recipients}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-accent p-3.5">
          <span className="text-3xl">{next.emoji}</span>
          <div>
            <p className="text-sm font-semibold">{next.label}</p>
            <p className="text-xs text-muted-fg">{next.description}</p>
          </div>
        </div>

        <Field label="Message to buyers" optional hint="Leave blank to use the default message shown in the preview.">
          {(p) => (
            <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder={defaultMsg} maxLength={500} />
          )}
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium">
            Studio photo <span className="font-normal text-muted-fg">(optional)</span>
          </p>
          {photoUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <img src={photoUrl} alt="Selected studio photo" className="max-h-60 w-full object-cover" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 bg-surface/90 backdrop-blur"
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-7 text-sm text-muted-fg transition-colors hover:border-primary hover:bg-accent hover:text-primary"
            >
              <ImagePlus className="size-6" />
              <span>
                <strong>Add a photo</strong> — clay in the molds, the kiln, fresh glaze…
              </span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-fg uppercase">
            <Mail className="size-3.5" /> Email preview
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-bg">
            <div className="border-b border-border px-4 py-2.5 text-xs text-muted-fg">
              <p>
                <span className="font-medium text-fg">From:</span> {batch.studio}
              </p>
              <p className="truncate">
                <span className="font-medium text-fg">Subject:</span>{' '}
                {starting ? `${batch.title} is funded! Production has started ${next.emoji}` : `${batch.title}: ${next.label} ${next.emoji}`}
              </p>
            </div>
            <div className="space-y-3 p-4">
              {photoUrl && <img src={photoUrl} alt="" className="max-h-40 w-full rounded-xl object-cover" />}
              <p className="text-sm leading-relaxed whitespace-pre-line">{note.trim() || defaultMsg}</p>
              <span className="inline-block rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg">
                Track your order →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
