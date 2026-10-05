export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const CREATOR_EMAILS = (import.meta.env.VITE_CREATOR_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** Verified email addresses of a Clerk user, lowercased. */
export function userEmails(user) {
  if (!user) return []
  return user.emailAddresses
    .filter((e) => e.verification?.status === 'verified')
    .map((e) => e.emailAddress.toLowerCase())
}

/**
 * Creator access: a `role: "creator"` in Clerk public metadata, or an email in
 * VITE_CREATOR_EMAILS. With no allowlist configured, any signed-in user is let
 * in so the demo works out of the box. A real backend must re-check this server-side.
 */
export function isCreator(user) {
  if (!user) return false
  if (user.publicMetadata?.role === 'creator') return true
  if (CREATOR_EMAILS.length === 0) return true
  return userEmails(user).some((e) => CREATOR_EMAILS.includes(e))
}

export const clerkAppearance = {
  variables: {
    colorPrimary: '#b4532a',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    card: 'shadow-xl shadow-stone-900/5 border border-border',
    formButtonPrimary: 'normal-case text-sm font-semibold',
  },
}
