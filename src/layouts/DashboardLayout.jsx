import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { SignOutButton, UserButton } from '@clerk/react-router'
import { Boxes, ExternalLink, LogOut, Mail, PlusCircle, RotateCcw, Settings, Store } from 'lucide-react'
import { toast } from 'sonner'
import { resetStudio } from '../api/batches'
import { ThemeToggle } from '../components/common'
import { StudioTheme } from '../components/StudioTheme'
import { useCreator } from '../lib/creatorContext'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Batches', icon: Boxes, end: true },
  { to: '/dashboard/batches/new', label: 'New batch', icon: PlusCircle },
  { to: '/dashboard/outbox', label: 'Outbox', icon: Mail },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
          isActive ? 'bg-accent text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg',
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}

function StudioBadge({ creator }) {
  return (
    <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-lg">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-lg text-primary-fg shadow-sm shadow-primary/30">
        {creator.emoji}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-base font-semibold tracking-tight">{creator.studioName}</span>
        <span className="block text-[11px] font-medium text-muted-fg">Studio dashboard</span>
      </span>
    </Link>
  )
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const { creator, user } = useCreator()

  const onReset = async () => {
    if (!window.confirm('Delete every batch in your studio, with its orders, comments and emails? Your studio profile stays.')) return
    try {
      await resetStudio()
      toast.success('Studio cleared')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <StudioTheme hue={creator.accentHue} className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <StudioBadge creator={creator} />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Dashboard">
          {NAV.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-1 border-t border-border pt-4">
          <Link
            to={`/s/${creator.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-fg hover:bg-muted hover:text-fg"
          >
            <ExternalLink className="size-4" /> View studio page
          </Link>
          <Link to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-fg hover:bg-muted hover:text-fg">
            <Store className="size-4" /> Marketplace
          </Link>
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{creator.displayName}</p>
              <p className="truncate text-xs text-muted-fg">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <ThemeToggle />
          </div>
          <SignOutButton>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-fg hover:bg-muted hover:text-fg"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </SignOutButton>
          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-fg hover:bg-muted hover:text-fg"
          >
            <RotateCcw className="size-3.5" /> Clear all batches
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-bg/80 px-4 backdrop-blur-lg lg:hidden">
        <StudioBadge creator={creator} />
        <div className="flex shrink-0 items-center">
          <Link
            to={`/s/${creator.slug}`}
            className="grid size-10 place-items-center rounded-xl text-muted-fg hover:bg-muted"
            aria-label="View studio page"
          >
            <ExternalLink className="size-4.5" />
          </Link>
          <ThemeToggle />
          <div className="ml-1 flex">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Dashboard"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface/95 pt-1.5 backdrop-blur-lg lg:hidden"
      >
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold',
                isActive ? 'text-primary' : 'text-muted-fg',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </StudioTheme>
  )
}
