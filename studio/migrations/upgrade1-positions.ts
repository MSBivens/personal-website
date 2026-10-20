/**
 * Upgrade phase 1: pins take their Location's position, and Hubs/Map Visibility go away.
 *
 * - Map Visibility becomes "Show on map" (Hidden → off, anything else → on).
 * - Pins that were Attached lose their X/Y, so they sit at their Location.
 * - Pins whose X/Y is exactly their Location's lose it too (it's the same spot).
 * - Locations lose "Show as Hub".
 * Drafts are migrated along with published records.
 *
 * Dry run:  npx sanity exec migrations/upgrade1-positions.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/upgrade1-positions.ts --with-user-token -- --dataset development --apply
 *
 * Safe to re-run: a second run finds nothing to do.
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION, TYPE_IDS} from '../schemaTypes/ids'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

// GROQ returns null for missing fields.
const has = (value: unknown) => value !== null && value !== undefined

type Pin = {
  _id: string
  _rev: string
  name?: string
  typeId?: string
  visibility: string | null
  showOnMap: boolean | null
  x: number | null
  y: number | null
  place: {name: string | null; x: number | null; y: number | null} | null
}

async function main() {
  const {pins, hubs} = await client.fetch<{
    pins: Pin[]
    hubs: {_id: string; _rev: string; name?: string}[]
  }>(`{
    "pins": *[_type == "pin"]{
      _id, _rev, name, "typeId": type._ref, visibility, showOnMap, x, y,
      "place": *[_type == "location" && _id == ^.location._ref][0]{name, x, y}
    },
    "hubs": *[_type == "location" && defined(showAsHub)]{_id, _rev, name}
  }`)
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)

  const tx = client.transaction()
  let changes = 0
  const leftWithoutSpot: string[] = []

  for (const pin of pins) {
    const label = `${pin._id.startsWith('drafts.') ? '(draft) ' : ''}${pin.name ?? pin._id}`
    const set: Record<string, unknown> = {}
    const unset: string[] = []
    const notes: string[] = []

    if (has(pin.visibility)) {
      set.showOnMap = pin.visibility !== 'hidden'
      unset.push('visibility')
      notes.push(`Map Visibility "${pin.visibility}" → Show on map ${set.showOnMap ? 'on' : 'off'}`)
    } else if (!has(pin.showOnMap)) {
      set.showOnMap = true
      notes.push('Show on map → on')
    }

    const hasOwn = has(pin.x) || has(pin.y)
    const atPlace = pin.place && pin.x === pin.place.x && pin.y === pin.place.y
    if (hasOwn && pin.visibility === 'attached') {
      unset.push('x', 'y')
      notes.push(`was Attached: X/Y removed, sits at ${pin.place?.name ?? '?'}`)
    } else if (hasOwn && atPlace) {
      unset.push('x', 'y')
      notes.push(`X/Y was exactly ${pin.place?.name}'s: removed, sits at ${pin.place?.name}`)
    }

    // Would it still have somewhere to go?
    const onMap = (set.showOnMap ?? pin.showOnMap) !== false || pin.typeId === TYPE_IDS.postOffice
    const keepsOwn = hasOwn && !unset.includes('x')
    const placeHasSpot = has(pin.place?.x) && has(pin.place?.y)
    if (onMap && !keepsOwn && !placeHasSpot) leftWithoutSpot.push(label)

    if (!notes.length) continue
    tx.patch(pin._id, (p) => {
      let patch = p.ifRevisionId(pin._rev)
      if (Object.keys(set).length) patch = patch.set(set)
      if (unset.length) patch = patch.unset(unset)
      return patch
    })
    changes++
    console.log(`~ Pin       ${label}: ${notes.join('; ')}`)
  }

  for (const hub of hubs) {
    tx.patch(hub._id, (p) => p.ifRevisionId(hub._rev).unset(['showAsHub']))
    changes++
    console.log(`~ Location  ${hub.name ?? hub._id}: "Show as Hub" removed`)
  }

  if (leftWithoutSpot.length) {
    console.log(`\n! No position after this (they won't show until they get one):\n  ${leftWithoutSpot.join('\n  ')}`)
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
