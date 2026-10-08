import { cn } from '../lib/utils'
import { StudioHueContext } from '../lib/studioTheme'

/** Applies a studio's accent colour to everything inside, including sheets opened from it. */
export function StudioTheme({ hue, className, children }) {
  if (hue == null) return <div className={className}>{children}</div>
  return (
    <StudioHueContext.Provider value={hue}>
      <div className={cn('studio-theme', className)} style={{ '--studio-hue': hue }}>
        {children}
      </div>
    </StudioHueContext.Provider>
  )
}
