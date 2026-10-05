import { Navigate, useLocation } from 'react-router'
import { SignIn, SignOutButton, SignUp, useAuth, useUser } from '@clerk/react-router'
import { Loader2, ShieldAlert } from 'lucide-react'
import { clerkAppearance, isCreator } from '../lib/auth'
import { Button, ButtonLink } from './ui/Button'
import { EmptyState } from './ui/primitives'

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-fg">
        <Loader2 className="size-6 animate-spin text-primary" />
        {label}
      </div>
    </div>
  )
}

function useSignInRedirect() {
  const { pathname, search } = useLocation()
  return `/sign-in?redirect_url=${encodeURIComponent(pathname + search)}`
}

/** Any signed-in user (buyers included). */
export function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  const signIn = useSignInRedirect()
  if (!isLoaded) return <FullPageLoader />
  if (!isSignedIn) return <Navigate to={signIn} replace />
  return children
}

/** Signed in *and* allowed into the studio dashboard. */
export function RequireCreator({ children }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const signIn = useSignInRedirect()

  if (!isLoaded) return <FullPageLoader label="Checking your studio access…" />
  if (!isSignedIn) return <Navigate to={signIn} replace />
  if (!isCreator(user)) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <EmptyState
          emoji={<ShieldAlert className="size-8 text-primary" />}
          title="This area is for studio owners"
          description={`You're signed in as ${user.primaryEmailAddress?.emailAddress}, which doesn't have creator access.`}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink to="/my-orders" variant="secondary">
                View my orders
              </ButtonLink>
              <SignOutButton>
                <Button>Switch account</Button>
              </SignOutButton>
            </div>
          }
        />
      </div>
    )
  }
  return children
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-2 mb-8 text-center text-muted-fg">{subtitle}</p>
      {children}
    </div>
  )
}

export function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your studio or see your pre-orders.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/my-orders" appearance={clerkAppearance} />
    </AuthShell>
  )
}

export function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Follow your pre-orders and chat with the studio.">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/my-orders" appearance={clerkAppearance} />
    </AuthShell>
  )
}
