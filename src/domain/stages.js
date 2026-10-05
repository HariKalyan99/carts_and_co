export const STAGES = [
  {
    id: 'funding',
    label: 'Funding',
    emoji: '🎯',
    description: 'Collecting pre-orders until the batch goal is met.',
  },
  {
    id: 'mold',
    label: 'In the Mold',
    emoji: '🥣',
    description: 'Liquid clay is poured into molds and left to set.',
    headline: (u) => `Funded! Your ${u} are in the mold`,
    buyerMsg: (u) =>
      `Great news — the batch hit its goal and production has started. Liquid clay has been poured into the molds and your ${u} are setting overnight.`,
  },
  {
    id: 'kiln',
    label: 'Kiln Firing',
    emoji: '🔥',
    description: 'Pieces are fired in the kiln at 1,200°C.',
    headline: (u) => `Your ${u} are in the kiln`,
    buyerMsg: (u) => `Your ${u} are currently baking at 1,200°C! Firing takes about two days, then they cool slowly overnight.`,
  },
  {
    id: 'glazing',
    label: 'Glazing & Curing',
    emoji: '🎨',
    description: 'Each piece is hand-glazed and cured.',
    headline: (u) => `Your ${u} are being glazed`,
    buyerMsg: (u) => `Every one of your ${u} is being hand-dipped in glaze and left to cure. No two will look exactly alike.`,
  },
  {
    id: 'fulfillment',
    label: 'Packing & Shipping',
    emoji: '📦',
    description: 'Packed in small tiers, grouped by postal zone.',
    headline: (u) => `Your ${u} are ready for packing`,
    buyerMsg: (u) =>
      `Your ${u} are finished! Orders are packed in small batches by postal zone over the next week — you'll get another update the moment yours is boxed.`,
  },
  {
    id: 'complete',
    label: 'Complete',
    emoji: '✅',
    description: 'Every order in the batch has shipped.',
    headline: () => 'Batch complete',
    buyerMsg: (u) => `Every order from this batch is on its way. Thank you for funding these ${u}!`,
  },
]

export const STAGE_IDS = STAGES.map((s) => s.id)

export const stageById = (id) => STAGES.find((s) => s.id === id)

export function nextStage(id) {
  const i = STAGE_IDS.indexOf(id)
  return i >= 0 && i < STAGE_IDS.length - 1 ? STAGES[i + 1] : null
}

export const ORDER_STATUS = {
  pledged: { label: 'Pledged', tone: 'neutral', hint: 'Card held — not charged yet' },
  charged: { label: 'Paid', tone: 'info', hint: 'Charged when production started' },
  packaged: { label: 'Awaiting pickup', tone: 'warning', hint: 'Packaged & awaiting courier pickup' },
  shipped: { label: 'Shipped', tone: 'success', hint: 'Handed to the courier' },
  refunded: { label: 'Released', tone: 'danger', hint: 'Batch cancelled — hold released' },
}

// Indian PIN codes: the first digit identifies the postal region.
export const POSTAL_ZONES = {
  1: 'North I — Delhi, Haryana, Punjab, HP, J&K',
  2: 'North II — Uttar Pradesh, Uttarakhand',
  3: 'West I — Rajasthan, Gujarat',
  4: 'West II — Maharashtra, MP, Chhattisgarh, Goa',
  5: 'South I — Karnataka, Telangana, Andhra Pradesh',
  6: 'South II — Tamil Nadu, Kerala',
  7: 'East I — West Bengal, Odisha, North East',
  8: 'East II — Bihar, Jharkhand',
}

export const zoneOf = (pincode) => String(pincode).charAt(0)

export const zoneLabel = (zone) => POSTAL_ZONES[zone] ?? 'Other'

export const COVER_HUES = [18, 32, 145, 200, 265, 340]
