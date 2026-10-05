import { useId } from 'react'
import { cn } from '../../lib/utils'

const control =
  'w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-muted-fg/70 ' +
  'transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 ' +
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/15'

export function Field({ label, hint, error, className, children, optional }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-fg">(optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-fg">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, 'min-h-28 resize-y py-3 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(control, 'h-11 appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
}
