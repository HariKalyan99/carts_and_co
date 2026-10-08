import { createContext, useContext } from 'react'

/** Accent hue of the studio whose pages are being shown; portaled UI (sheets) reads it. */
export const StudioHueContext = createContext(null)

export const useStudioHue = () => useContext(StudioHueContext)

export const studioThemeProps = (hue) =>
  hue == null ? {} : { className: 'studio-theme', style: { '--studio-hue': hue } }

export const ACCENT_HUES = [18, 35, 95, 150, 185, 215, 255, 290, 335]

export const STUDIO_EMOJIS = ['☕', '🏺', '🍶', '🥣', '🌿', '🔥', '🎨', '🪴', '🧶', '🕯️']
