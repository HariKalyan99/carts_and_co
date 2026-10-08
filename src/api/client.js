import { supabase } from '../lib/supabase'

const EVENT = 'mbi:data-change'
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('mbi:data')

export async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message || 'Something went wrong — please try again.')
  return data
}

/** Runs a write and tells every open query (in this tab and others) to refetch. */
export async function mutate(fn, args) {
  const data = await rpc(fn, args)
  window.dispatchEvent(new Event(EVENT))
  channel?.postMessage(EVENT)
  return data
}

export function subscribe(callback) {
  const onChange = () => callback()
  window.addEventListener(EVENT, onChange)
  channel?.addEventListener('message', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    channel?.removeEventListener('message', onChange)
  }
}
