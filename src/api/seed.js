const DAY = 86_400_000

const BUYERS = [
  ['Aarav Mehta', 'Mumbai', '400050'],
  ['Priya Nair', 'Kochi', '682020'],
  ['Rohan Gupta', 'New Delhi', '110016'],
  ['Ananya Iyer', 'Chennai', '600040'],
  ['Kabir Singh', 'Chandigarh', '160017'],
  ['Meera Reddy', 'Hyderabad', '500032'],
  ['Ishaan Das', 'Kolkata', '700019'],
  ['Zara Khan', 'Lucknow', '226010'],
  ['Vikram Joshi', 'Pune', '411001'],
  ['Sneha Patel', 'Ahmedabad', '380009'],
  ['Arjun Rao', 'Bengaluru', '560034'],
  ['Diya Sharma', 'Jaipur', '302001'],
  ['Neel Banerjee', 'Bhubaneswar', '751007'],
  ['Tara Menon', 'Bengaluru', '560076'],
  ['Kunal Verma', 'Gurugram', '122002'],
  ['Riya Kapoor', 'Dehradun', '248001'],
  ['Aditya Kumar', 'Patna', '800001'],
  ['Nisha Pillai', 'Thiruvananthapuram', '695003'],
  ['Farhan Ali', 'Indore', '452001'],
  ['Kavya Hegde', 'Mysuru', '570001'],
  ['Siddharth Jain', 'Ranchi', '834001'],
  ['Pooja Desai', 'Surat', '395007'],
  ['Manav Chopra', 'Amritsar', '143001'],
  ['Leela Krishnan', 'Coimbatore', '641002'],
  ['Yash Agarwal', 'Noida', '201301'],
  ['Aisha Siddiqui', 'Bhopal', '462001'],
]

const COURIERS = ['India Post', 'Delhivery', 'Blue Dart']

function makeOrders({ batchId, code, quantities, start, status, tokenPrefix, packedTiers = [], shippedTiers = 0 }) {
  return quantities.map((quantity, i) => {
    const [buyerName, city, pincode] = BUYERS[(i + code.charCodeAt(0)) % BUYERS.length]
    const createdAt = new Date(start + i * 0.45 * DAY).toISOString()
    const order = {
      id: `${batchId}-o${i + 1}`,
      number: `${code}-${String(i + 1).padStart(3, '0')}`,
      batchId,
      buyerName,
      email: `${buyerName.split(' ')[0].toLowerCase()}@example.com`,
      quantity,
      address: `${12 + i}, Artisan Lane`,
      city,
      pincode,
      status,
      trackingToken: i === 0 ? tokenPrefix : `${tokenPrefix}-${i + 1}`,
      createdAt,
    }
    const tier = packedTiers.findIndex((ids) => ids.includes(i))
    if (tier >= 0) {
      order.tier = tier + 1
      order.status = 'packaged'
      order.packagedAt = new Date(Date.now() - (packedTiers.length - tier) * DAY).toISOString()
      if (tier < shippedTiers) {
        order.status = 'shipped'
        order.courier = COURIERS[i % COURIERS.length]
        order.awb = `AWB${(7310042 + i * 913).toString()}`
        order.shippedAt = new Date(Date.now() - (packedTiers.length - tier - 0.5) * DAY).toISOString()
      }
    }
    return order
  })
}

export function createSeed() {
  const now = Date.now()
  const iso = (offsetDays) => new Date(now + offsetDays * DAY).toISOString()

  const batches = [
    {
      id: 'autumn-forest',
      code: 'AF',
      title: 'The Autumn Forest Mug Series',
      tagline: 'Speckled stoneware in moss, rust and bark tones.',
      description:
        'Fifty wheel-thrown mugs inspired by October walks through the Nilgiri forests. Each one is dipped in a layered glaze that pools into deep rust at the rim and fades to moss green at the base. Holds 350 ml, dishwasher safe, and no two are the same.',
      artist: 'Sarah Thomas',
      studio: 'Clay & Ember Studio, Bengaluru',
      unitLabel: 'mugs',
      price: 1800,
      fundingGoal: 30,
      maxQuantity: 50,
      fundingDeadline: iso(12),
      createdAt: iso(-9),
      coverHue: 22,
      stage: 'funding',
      stageHistory: [{ stage: 'funding', at: iso(-9), note: 'Pre-orders are open!' }],
    },
    {
      id: 'midnight-tide',
      code: 'MT',
      title: 'Midnight Tide Tumblers',
      tagline: 'Deep cobalt tumblers with a ripple-carved base.',
      description:
        'Hand-carved ripples run around the base of every tumbler, glazed in a cobalt blue that breaks to white on the ridges. Sized for cold brew or a long nimbu pani.',
      artist: 'Sarah Thomas',
      studio: 'Clay & Ember Studio, Bengaluru',
      unitLabel: 'tumblers',
      price: 2200,
      fundingGoal: 20,
      maxQuantity: 40,
      fundingDeadline: iso(-10),
      createdAt: iso(-30),
      coverHue: 215,
      stage: 'kiln',
      stageHistory: [
        { stage: 'funding', at: iso(-30), note: 'Pre-orders are open!' },
        {
          stage: 'mold',
          at: iso(-6),
          note: 'We hit 32 pre-orders! 🎉 All 32 tumblers were thrown this morning and are drying on the shelves.',
        },
        { stage: 'kiln', at: iso(-1.5), note: 'Your tumblers are currently baking at 1,200°C! Kiln opens Thursday.' },
      ],
    },
    {
      id: 'sunrise-bowls',
      code: 'SB',
      title: 'Sunrise Ramen Bowls',
      tagline: 'Generous bowls with a saffron-to-blush gradient.',
      description:
        'Big, deep bowls for ramen, khichdi and everything in between. The glaze is sprayed by hand to fade from saffron at the rim to a soft blush inside.',
      artist: 'Sarah Thomas',
      studio: 'Clay & Ember Studio, Bengaluru',
      unitLabel: 'bowls',
      price: 2600,
      fundingGoal: 15,
      maxQuantity: 30,
      fundingDeadline: iso(-40),
      createdAt: iso(-60),
      coverHue: 38,
      stage: 'fulfillment',
      stageHistory: [
        { stage: 'funding', at: iso(-60), note: 'Pre-orders are open!' },
        { stage: 'mold', at: iso(-30), note: '' },
        { stage: 'kiln', at: iso(-20), note: '' },
        { stage: 'glazing', at: iso(-12), note: '' },
        {
          stage: 'fulfillment',
          at: iso(-3),
          note: 'Every bowl survived the kiln! Packing starts today, a few postal zones at a time.',
        },
      ],
    },
  ]

  const orders = [
    ...makeOrders({
      batchId: 'autumn-forest',
      code: 'AF',
      quantities: [2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1],
      start: now - 9 * DAY,
      status: 'pledged',
      tokenPrefix: 'demo-autumn',
    }),
    ...makeOrders({
      batchId: 'midnight-tide',
      code: 'MT',
      quantities: [2, 1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 2],
      start: now - 30 * DAY,
      status: 'charged',
      tokenPrefix: 'demo-kiln',
    }),
    ...makeOrders({
      batchId: 'sunrise-bowls',
      code: 'SB',
      quantities: [2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2],
      start: now - 60 * DAY,
      status: 'charged',
      tokenPrefix: 'demo-packed',
      packedTiers: [
        [1, 2, 3, 4, 5],
        [0, 6, 7, 8],
      ],
      shippedTiers: 1,
    }),
  ]

  const outbox = [
    {
      id: 'mail-seed-1',
      batchId: 'midnight-tide',
      kind: 'stage',
      stage: 'kiln',
      subject: 'Midnight Tide Tumblers: Kiln Firing 🔥',
      body: batches[1].stageHistory[2].note,
      recipients: orders.filter((o) => o.batchId === 'midnight-tide').map((o) => o.email),
      sentAt: iso(-1.5),
    },
    {
      id: 'mail-seed-2',
      batchId: 'sunrise-bowls',
      kind: 'packaged',
      subject: 'Sunrise Ramen Bowls: Packaged & awaiting courier pickup 📦',
      body: 'Your bowls are boxed and padded in packing tier 2. The courier collects them from the studio soon.',
      recipients: orders.filter((o) => o.batchId === 'sunrise-bowls' && o.tier === 2).map((o) => o.email),
      sentAt: iso(-1),
    },
  ]

  const keyOf = (batch, stage) => {
    const h = batch.stageHistory.findLast((e) => e.stage === stage)
    return `${h.stage}:${h.at}`
  }
  const buyer = (orderId) => {
    const o = orders.find((x) => x.id === orderId)
    return { role: 'buyer', name: o.buyerName, orderId: o.id, orderNumber: o.number }
  }
  const creator = { role: 'creator', name: 'Sarah Thomas' }
  const comment = (id, batch, stage, author, body, hoursAgo, parentId = null) => ({
    id,
    batchId: batch.id,
    updateKey: keyOf(batch, stage),
    parentId,
    author,
    body,
    createdAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
  })

  const [autumn, tide, sunrise] = batches
  const comments = [
    comment('c-seed-1', tide, 'kiln', buyer('midnight-tide-o2'), 'Is it nerve-wracking opening the kiln? 😄 Can’t wait to see the blue!', 30),
    comment('c-seed-2', tide, 'kiln', creator, 'Every single time! I’ll post a photo the moment the kiln cools.', 28, 'c-seed-1'),
    comment('c-seed-3', tide, 'kiln', buyer('midnight-tide-o5'), 'Will the ripple base be glazed too, or left raw?', 20),
    comment('c-seed-4', tide, 'kiln', creator, 'The ripples stay raw clay so they grip the table — the cobalt stops just above them.', 18, 'c-seed-3'),
    comment('c-seed-5', tide, 'mold', buyer('midnight-tide-o1'), 'So happy this got funded! Ordered two for my parents.', 140),
    comment('c-seed-6', sunrise, 'fulfillment', buyer('sunrise-bowls-o3'), 'Mine says awaiting pickup — any idea when the courier comes?', 10),
    comment('c-seed-7', sunrise, 'fulfillment', creator, 'Delhivery collects every Tuesday and Friday, so it’ll be on its way by Friday evening.', 8, 'c-seed-6'),
    comment('c-seed-8', autumn, 'funding', buyer('autumn-forest-o1'), 'Shared this with my book club — hope we hit 30! 🍂', 50),
  ]

  return { batches, orders, outbox, comments }
}
