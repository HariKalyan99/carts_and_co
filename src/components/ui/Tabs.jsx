import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

export function Tabs({ tabs, value, onChange, className }) {
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === value)
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = tabs[(i + delta + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn('-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition-colors',
              selected ? 'text-fg' : 'text-muted-fg hover:text-fg',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                  selected ? 'bg-primary text-primary-fg' : 'bg-muted',
                )}
              >
                {tab.count}
              </span>
            )}
            {selected && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
