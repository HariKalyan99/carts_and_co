import { createContext, useContext } from 'react'

/** `{ creator, user }` for the signed-in studio owner; provided by RequireCreator. */
export const CreatorContext = createContext(null)

export function useCreator() {
  const value = useContext(CreatorContext)
  if (!value) throw new Error('useCreator must be used inside the creator dashboard')
  return value
}
