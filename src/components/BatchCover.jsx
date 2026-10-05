import { cn } from '../lib/utils'

const UNIT_EMOJI = { mugs: '☕', tumblers: '🥤', bowls: '🍜', plates: '🍽️', vases: '🏺' }

/** Generated glaze-like artwork, so batches look good before real product photos exist. */
export function BatchCover({ hue = 22, unitLabel, className, size = 'md' }) {
  const emoji = UNIT_EMOJI[unitLabel] ?? '🏺'
  return (
    <div
      className={cn('relative isolate overflow-hidden bg-muted', className)}
      style={{
        backgroundImage: [
          `radial-gradient(120% 90% at 15% 10%, hsl(${hue} 70% 78% / 0.95), transparent 55%)`,
          `radial-gradient(90% 80% at 90% 85%, hsl(${(hue + 35) % 360} 45% 38% / 0.9), transparent 60%)`,
          `radial-gradient(70% 60% at 70% 20%, hsl(${(hue + 340) % 360} 55% 60% / 0.7), transparent 60%)`,
          `linear-gradient(160deg, hsl(${hue} 40% 55%), hsl(${(hue + 20) % 360} 35% 30%))`,
        ].join(','),
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #fff 0.8px, transparent 1.2px), radial-gradient(circle at 70% 60%, #000 0.8px, transparent 1.2px)',
          backgroundSize: '9px 9px, 13px 13px',
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={cn(
            'drop-shadow-[0_12px_24px_rgb(0_0_0/0.35)] select-none',
            size === 'lg' ? 'text-8xl sm:text-9xl' : size === 'sm' ? 'text-3xl' : 'text-6xl',
          )}
        >
          {emoji}
        </span>
      </div>
    </div>
  )
}
