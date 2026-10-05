import { useState } from 'react'
import { Link } from 'react-router'
import { Check, Copy, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { isDark, setTheme } from '../lib/theme'
import { cn, copyToClipboard } from '../lib/utils'
import { Button } from './ui/Button'
import { Card } from './ui/primitives'

export function Logo({ to = '/', subtitle }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-fg shadow-sm shadow-primary/30">
        ☕
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight">Kiln &amp; Co.</span>
        {subtitle && <span className="block text-[11px] font-medium text-muted-fg">{subtitle}</span>}
      </span>
    </Link>
  )
}

export function ThemeToggle({ className }) {
  const [dark, setDark] = useState(isDark)
  const toggle = () => {
    setTheme(dark ? 'light' : 'dark')
    setDark(!dark)
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

export function CopyButton({ text, label = 'Copy link', variant = 'secondary', size = 'sm', className }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 1800)
    } else {
      toast.error('Could not copy — select the link manually')
    }
  }
  return (
    <Button variant={variant} size={size} onClick={onCopy} className={className}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label}
    </Button>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-fg sm:text-sm">{label}</p>
        {Icon && (
          <span
            className={cn(
              'grid size-8 place-items-center rounded-lg',
              tone === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-accent text-primary',
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-fg">{hint}</p>}
    </Card>
  )
}
