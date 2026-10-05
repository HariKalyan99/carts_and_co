import { NavLink, Outlet, useNavigate } from 'react-router'
import { SignOutButton, UserButton, useUser } from '@clerk/react-router'
import { Boxes, LogOut, Mail, PlusCircle, RotateCcw, Store } from 'lucide-react'
import { toast } from 'sonner'
import { resetDemo } from '../api/batches'
import { Logo, ThemeToggle } from '../components/common'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Batches', icon: Boxes, end: true },
  { to: '/dashboard/batches/new', label: 'New batch', icon: PlusCircle },
  { to: '/dashboard/outbox', label: 'Outbox', icon: Mail },
  { to: '/', label: 'Storefront', icon: Store, end: true },
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

export function DashboardLayout() {
  const navigate = useNavigate()
  const { user } = useUser()

  const onReset = async () => {
    if (!window.confirm('Reset all demo data to the original sample batches?')) return
    await resetDemo()
    toast.success('Demo data reset')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <Logo to="/dashboard" subtitle="Studio dashboard" />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Dashboard">
          {NAV.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.fullName || user.username || 'Studio owner'}</p>
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
            <RotateCcw className="size-3.5" /> Reset demo data
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/70 bg-bg/80 px-4 backdrop-blur-lg lg:hidden">
        <Logo to="/dashboard" subtitle="Studio dashboard" />
        <div className="flex items-center">
          <button
            type="button"
            onClick={onReset}
            className="grid size-10 place-items-center rounded-xl text-muted-fg hover:bg-muted"
            aria-label="Reset demo data"
          >
            <RotateCcw className="size-4.5" />
          </button>
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
    </div>
  )
}
