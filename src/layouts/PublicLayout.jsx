import { Link, NavLink, Outlet } from 'react-router'
import { UserButton, useUser } from '@clerk/react-router'
import { LayoutDashboard, LogIn, PackageSearch, ShoppingBag } from 'lucide-react'
import { Logo, ThemeToggle } from '../components/common'
import { ButtonLink } from '../components/ui/Button'
import { getMyCreator } from '../api/creators'
import { useQuery } from '../hooks/useQuery'
import { isCreator } from '../lib/auth'
import { cn } from '../lib/utils'

const navLink = ({ isActive }) =>
  cn(
    'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-fg hover:bg-muted hover:text-fg',
    isActive && 'text-fg',
  )

function AccountNav() {
  const { isLoaded, isSignedIn, user } = useUser()
  const allowed = isSignedIn && isCreator(user)
  const { data: studio } = useQuery(`creator:${allowed ? user.id : 'none'}`, () =>
    allowed ? getMyCreator() : Promise.resolve(null),
  )

  if (!isLoaded) return <span className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />

  if (!isSignedIn) {
    return (
      <ButtonLink to="/sign-in" variant="secondary" size="sm" className="ml-1">
        <LogIn className="size-4" /> Sign in
      </ButtonLink>
    )
  }

  return (
    <>
      <NavLink to="/my-orders" className={navLink} aria-label="My orders">
        <ShoppingBag className="size-4" />
        <span className="hidden md:inline">My orders</span>
      </NavLink>
      {studio && (
        <ButtonLink to="/dashboard" variant="secondary" size="sm" className="ml-1" title={studio.studioName}>
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">My studio</span>
        </ButtonLink>
      )}
      <div className="ml-2 flex">
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link label="My orders" labelIcon={<ShoppingBag className="size-4" />} href="/my-orders" />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </>
  )
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/track" end className={navLink} aria-label="Track order">
              <PackageSearch className="size-4" />
              <span className="hidden md:inline">Track order</span>
            </NavLink>
            <ThemeToggle />
            <AccountNav />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-fg sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Handmade in small batches. Funded by people who care.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/#how-it-works" className="hover:text-fg">
              How it works
            </Link>
            <Link to="/track" className="hover:text-fg">
              Track an order
            </Link>
            <Link to="/#makers" className="hover:text-fg">
              Makers
            </Link>
            <Link to="/dashboard" className="hover:text-fg">
              Open a studio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
