import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { studioThemeProps, useStudioHue } from '../../lib/studioTheme'
import { cn } from '../../lib/utils'

/**
 * Bottom sheet on small screens, centered dialog from `sm` up.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const theme = studioThemeProps(useStudioHue())

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('input, textarea, select, button:not([data-close]):not(:disabled)')?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn('fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6', theme.className)}
          style={theme.style}
        >
          <motion.div
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl',
              'sm:max-w-lg sm:rounded-3xl',
              className,
            )}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
            <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:px-6 sm:pt-6">
              <div>
                <h2 id={titleId} className="font-display text-xl font-semibold">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted-fg">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-fg hover:bg-muted hover:text-fg"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
            {footer && (
              <footer className="pb-safe border-t border-border bg-surface px-5 pt-3 sm:px-6 sm:pb-5">{footer}</footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
