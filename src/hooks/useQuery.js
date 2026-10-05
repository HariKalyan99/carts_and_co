import { useCallback, useEffect, useState } from 'react'
import { subscribe } from '../api/mockDb'

/**
 * Minimal data-fetching hook. Re-runs when `key` changes and whenever the
 * mock DB changes (including from another tab), without flashing loading
 * states on background refreshes.
 */
export function useQuery(key, fetcher) {
  const [result, setResult] = useState({ key: null, data: undefined, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), [])

  useEffect(() => {
    let alive = true
    fetcher().then(
      (data) => alive && setResult({ key, data, error: null }),
      (error) => alive && setResult({ key, data: undefined, error }),
    )
    return () => {
      alive = false
    }
    // `fetcher` is recreated every render; `key` is what identifies the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version])

  const loading = result.key !== key
  return {
    data: loading ? undefined : result.data,
    error: loading ? null : result.error,
    loading,
  }
}

/** Wraps an async action with pending state. Errors are re-thrown for the caller. */
export function useMutation(action) {
  const [pending, setPending] = useState(false)
  const run = useCallback(
    async (...args) => {
      setPending(true)
      try {
        return await action(...args)
      } finally {
        setPending(false)
      }
    },
    [action],
  )
  return [run, pending]
}
