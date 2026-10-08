import { withStats } from './batches'
import { mutate, rpc } from './client'

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

/** The signed-in user's studio profile, or null if they haven't set one up yet. */
export function getMyCreator() {
  return rpc('get_my_creator')
}

/** Public studio page: profile plus every batch that isn't cancelled. */
export async function getStudio(slug) {
  const { creator, batches } = await rpc('get_studio', { p_slug: slug })
  return { creator, batches: batches.map(withStats) }
}

/** Studios that have at least one live batch, for the storefront. */
export function listStudios() {
  return rpc('list_studios')
}

export function validateProfile(v) {
  const e = {}
  if (v.displayName.trim().length < 2) e.displayName = 'Tell buyers who you are'
  if (v.studioName.trim().length < 2) e.studioName = 'Give your studio a name'
  if (!SLUG_PATTERN.test(v.slug)) e.slug = '3–40 characters: lowercase letters, numbers and dashes'
  if (v.bio.length > 280) e.bio = 'Keep it under 280 characters'
  return e
}

/** Creates or updates the signed-in user's studio. */
export function saveCreatorProfile(input) {
  const errors = validateProfile(input)
  if (Object.keys(errors).length) return Promise.reject(new Error(Object.values(errors)[0]))
  return mutate('save_creator_profile', { p: { ...input, accentHue: Number(input.accentHue) } })
}

/** Copies the demo studio's batches (with demo backers) into the signed-in creator's studio. */
export function loadSampleBatches() {
  return mutate('load_sample_batches')
}
