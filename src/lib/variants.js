import { cn } from './utils'

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm shadow-primary/20',
  secondary: 'bg-surface text-fg border border-border hover:bg-muted',
  ghost: 'text-fg hover:bg-muted',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  soft: 'bg-accent text-primary hover:bg-primary/15',
}

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
}

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  )
}

export const TONES = {
  neutral: 'bg-muted text-muted-fg',
  primary: 'bg-accent text-primary',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}
