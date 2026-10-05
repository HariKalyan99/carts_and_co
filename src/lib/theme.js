const KEY = 'mbi:theme'

export function isDark() {
  return document.documentElement.classList.contains('dark')
}

export function setTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#0f0d0b' : '#faf7f2',
  )
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Private mode: theme just won't persist.
  }
}
