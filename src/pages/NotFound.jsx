import { ButtonLink } from '../components/ui/Button'
import { EmptyState } from '../components/ui/primitives'

export function NotFound() {
  return (
    <EmptyState
      emoji="🫖"
      title="Page not found"
      description="That page cracked in the kiln. Let’s get you back to the studio."
      action={<ButtonLink to="/">Go home</ButtonLink>}
      className="py-28"
    />
  )
}
