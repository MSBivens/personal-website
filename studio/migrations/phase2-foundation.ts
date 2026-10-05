/**
 * Creates the Pin Type, Status and Location records and switches existing pins from
 * plain-text type / location / status to references.
 *
 * Dry run (prints what it would do, changes nothing):
 *   npx sanity exec migrations/phase2-foundation.ts --with-user-token -- --dataset development
 * Apply:
 *   npx sanity exec migrations/phase2-foundation.ts --with-user-token -- --dataset development --apply
 *
 * Safe to re-run: records are only created when missing, and pins that already use
 * references are left alone. Take a backup first (`npx sanity dataset export`).
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION, TYPE_IDS} from '../schemaTypes/ids'

type TypeKey = keyof typeof TYPE_IDS
type Style = 'normal' | 'dimmed' | 'faded'

const ICON_BASE = 'https://win98icons.alexmeub.com/icons/png/'

// Starting icons are Win98 placeholders; replace them in Studio any time.
const SEED: {key: TypeKey; title: string; plural: string; icon: string; statuses?: [string, Style][]}[] = [
  {key: 'member', title: 'Member', plural: 'Members', icon: 'msagent-2', statuses: [['Active', 'normal'], ['Compromised', 'dimmed'], ['Dead', 'faded']]},
  {key: 'enemy', title: 'Enemy', plural: 'Enemies', icon: 'msg_warning-0'},
  {key: 'resource', title: 'Resource', plural: 'Resources', icon: 'briefcase-0'},
  {key: 'safehouse', title: 'Safe House', plural: 'Safe Houses', icon: 'key_padlock-0'},
  {key: 'landmark', title: 'Landmark', plural: 'Landmarks', icon: 'world_star-0'},
  {key: 'npc', title: 'NPC', plural: 'NPCs', icon: 'users-0', statuses: [['Alive', 'normal'], ['Unknown', 'dimmed'], ['Dead', 'faded']]},
  {key: 'soulItem', title: 'Soul Item', plural: 'Soul Items', icon: 'key_world-0', statuses: [['Rumored', 'dimmed'], ['Located', 'normal'], ['Obtained', 'faded']]},
  {key: 'rumor', title: 'Rumor', plural: 'Rumors', icon: 'message_tack-0', statuses: [['Unverified', 'normal'], ['True', 'normal'], ['False', 'faded']]},
  {key: 'worldEvent', title: 'World Event', plural: 'World Events', icon: 'calendar-2', statuses: [['Upcoming', 'normal'], ['Ongoing', 'normal'], ['Past', 'faded']]},
  {key: 'dungeon', title: 'Dungeon', plural: 'Dungeons', icon: 'minesweeper-0', statuses: [['Unexplored', 'normal'], ['Partly explored', 'normal'], ['Cleared', 'faded']]},
  {key: 'quest', title: 'Quest', plural: 'Quests', icon: 'certificate_checklist-1', statuses: [['Available', 'normal'], ['Active', 'normal'], ['Completed', 'faded'], ['Failed', 'faded']]},
  {key: 'postOffice', title: 'Post Office', plural: 'Post Offices', icon: 'mailbox_world-0'},
]

const slug = (text: string) =>
  text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const statusId = (key: TypeKey, title: string) => `pinStatus-${key}-${slug(title)}`
const locationId = (name: string) => `location-${slug(name)}`
const ref = (_ref: string) => ({_type: 'reference', _ref})

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined

// Raw perspective, so drafts are migrated along with published pins.
const base = getCliClient({apiVersion: API_VERSION})
const client = base.withConfig({perspective: 'raw', ...(dataset ? {dataset} : {})})

type LegacyPin = {_id: string; _rev: string; name?: string; type?: unknown; location?: unknown; status?: unknown}

async function main() {
  const now = await client.fetch<{
    types: string[]
    statuses: string[]
    locations: {_id: string; name: string}[]
    pins: LegacyPin[]
    ranks: {_id: string; _rev: string; title: string; order: number}[]
  }>(`{
    "types": *[_type == "pinType"]._id,
    "statuses": *[_type == "pinStatus"]._id,
    "locations": *[_type == "location"]{_id, name},
    "pins": *[_type == "pin"]{_id, _rev, name, type, location, status},
    "ranks": *[_type == "rank" && title == "Hand" && order == 3]{_id, _rev, title, order}
  }`)

  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  const tx = client.transaction()
  let changes = 0

  // 1. Pin Types, with their Win98 icons uploaded to Sanity.
  for (const [i, seed] of SEED.entries()) {
    const _id = TYPE_IDS[seed.key]
    if (now.types.includes(_id)) continue
    let icon: object | undefined
    if (apply) {
      const res = await fetch(`${ICON_BASE}${seed.icon}.png`, {
        headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36'},
      })
      if (!res.ok) throw new Error(`Couldn't download ${seed.icon}.png (${res.status})`)
      const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {
        filename: `${seed.icon}.png`,
      })
      icon = {_type: 'image', asset: ref(asset._id)}
    }
    tx.createIfNotExists({_id, _type: 'pinType', title: seed.title, plural: seed.plural, legendOrder: (i + 1) * 10, ...(icon ? {icon} : {})})
    console.log(`+ Pin Type   ${seed.title.padEnd(12)} ${_id}  (icon ${seed.icon}.png)`)
    changes++
  }

  // 2. Statuses.
  for (const seed of SEED) {
    for (const [i, [title, style]] of (seed.statuses ?? []).entries()) {
      const _id = statusId(seed.key, title)
      if (now.statuses.includes(_id)) continue
      tx.createIfNotExists({_id, _type: 'pinStatus', title, style, order: i + 1, pinType: ref(TYPE_IDS[seed.key])})
      console.log(`+ Status     ${`${seed.title}: ${title}`.padEnd(26)} ${style}`)
      changes++
    }
  }

  // 3. Locations, one per distinct text value on the pins.
  const locations = new Map(now.locations.map((l) => [l.name.trim().toLowerCase(), l._id]))
  for (const pin of now.pins) {
    if (typeof pin.location !== 'string' || !pin.location.trim()) continue
    const name = pin.location.trim()
    if (locations.has(name.toLowerCase())) continue
    const _id = locationId(name)
    locations.set(name.toLowerCase(), _id)
    tx.createIfNotExists({_id, _type: 'location', name})
    console.log(`+ Location   ${name.padEnd(26)} ${_id}`)
    changes++
  }

  // 4. Pins: text → references.
  for (const pin of now.pins) {
    if (typeof pin.type !== 'string') continue // already migrated
    const key = pin.type as TypeKey
    if (!(key in TYPE_IDS)) throw new Error(`${pin.name} (${pin._id}) has unknown type "${pin.type}"`)

    const set: Record<string, unknown> = {type: ref(TYPE_IDS[key])}
    const unset: string[] = []
    if (typeof pin.location === 'string' && pin.location.trim()) {
      set.location = ref(locations.get(pin.location.trim().toLowerCase())!)
    } else if (pin.location !== undefined) {
      unset.push('location')
    }
    // Only members used status; everyone else just carried the old default.
    if (key === 'member' && typeof pin.status === 'string') {
      set.status = ref(statusId('member', pin.status))
    } else if (pin.status !== undefined) {
      unset.push('status')
    }
    // A stray quote at the end of a name, e.g. `Olmen Temple"`.
    const name = pin.name ?? ''
    if (/"$/.test(name) && (name.match(/"/g) ?? []).length % 2 === 1) set.name = name.slice(0, -1).trim()

    tx.patch(pin._id, (p) => p.ifRevisionId(pin._rev).set(set).unset(unset))
    const summary = [
      `type → ${TYPE_IDS[key]}`,
      set.location && `location → ${(set.location as {_ref: string})._ref}`,
      set.status && `status → ${(set.status as {_ref: string})._ref}`,
      unset.length && `remove ${unset.join(', ')}`,
      set.name && `name → "${set.name}"`,
    ].filter(Boolean)
    console.log(`~ Pin        ${(pin.name ?? pin._id).padEnd(26)} ${summary.join('; ')}`)
    changes++
  }

  // 5. Hand and Keeper were both rank 3; Hand belongs at 4.
  for (const rank of now.ranks) {
    tx.patch(rank._id, (p) => p.ifRevisionId(rank._rev).set({order: 4}))
    console.log(`~ Rank       ${rank.title.padEnd(26)} order 3 → 4`)
    changes++
  }

  if (!changes) return console.log('Nothing to do: already migrated.')
  if (!apply) return console.log(`\n${changes} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${changes} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
