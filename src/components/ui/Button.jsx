import { Link } from 'react-router'
import { Loader2 } from 'lucide-react'
import { buttonClasses } from '../../lib/variants'

export function Button({ variant, size, className, loading, disabled, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, className, children, ...props }) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  )
}
