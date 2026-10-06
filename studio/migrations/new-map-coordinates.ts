/**
 * Moves every pin and Location from the old map image (8192 × 5837) to the new one (4763 × 3185).
 * The two maps are drawn differently, so there's no single formula: each position below was
 * converted by matching towns that appear on both maps (Baldur's Gate, Elturel, Scornubel,
 * Berdusk, Crimmor, Velen, Murann…) and interpolating between them. Bear Trap was placed by
 * hand so it stays inside the Reaching Woods.
 *
 * A record is only moved if it's still at its old position, so records placed on the new map
 * (or moved since) are left alone, and re-running does nothing. Drafts are moved too.
 *
 * Dry run:  npx sanity exec migrations/new-map-coordinates.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/new-map-coordinates.ts --with-user-token -- --dataset development --apply
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION, publishedId} from '../schemaTypes/ids'

type Point = [number, number]

// [id, name, old position, new position]
const MOVES: [string, string, Point, Point][] = [
  ['0e3e1d65-bc34-4dbd-9171-e4c3826aae45', 'Jenna', [3503, 2618], [1490, 1196]],
  ['12c2d9f6-9ea0-4a3c-bf72-12430e33014c', 'Bear Trap', [3574, 2513], [1474, 1118]],
  ['161e4e90-ce05-4a75-bbd6-071fc0816eb1', 'DeThicks', [2817, 2444], [1034, 1157]],
  ['43db5ebd-1cf5-431d-b390-309ae45fef03', 'MacFrugalls', [3019, 3108], [1208, 1520]],
  ['591b123b-c875-494c-a01b-fa0d9318d699', 'Olmen Temple', [2565, 3427], [948, 1759]],
  ['6546f83a-b6a2-4de6-ac51-a3763cf63505', 'Hayknot', [3481, 2842], [1413, 1275]],
  ['93de48b9-e4ae-44fb-be38-fc69f7a05568', 'Bunnings', [3001, 3107], [1198, 1520]],
  ['f4eb13b0-eff3-42f1-88e4-f7b83c3ece1d', 'Frank', [2828, 2452], [1043, 1159]],
  ['location-baldurs-gate', "Baldur's Gate", [2821, 2447], [1037, 1158]],
  ['location-crimmor', 'Crimmor', [3007, 3113], [1202, 1525]],
  // Only in the development dataset:
  ['location-berdusk', 'Berdusk', [3503, 2650], [1477, 1207]],
  ['test-npc-grezzik', 'Old Grezzik', [3300, 2700], [1321, 1241]],
  ['test-po-elturel', 'Elturel Post', [3290, 2400], [1322, 1122]],
  ['test-po-scornubel', 'Scornubel Post', [3060, 2330], [1187, 1103]],
  ['test-quest-locket', 'Find the Locket', [3350, 2750], [1334, 1256]],
  ['test-soul-locket', "Caelmorn's Locket", [2600, 3300], [961, 1673]],
]
const moveFor = new Map(MOVES.map(([id, , from, to]) => [id, {from, to}]))

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

const same = (x: number, y: number, [px, py]: Point) => x === px && y === py

async function main() {
  const records = await client.fetch<{_id: string; _rev: string; name?: string; x: number; y: number}[]>(
    '*[_type in ["pin", "location"] && defined(x) && defined(y)]{_id, _rev, name, x, y}',
  )
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)

  const tx = client.transaction()
  let changes = 0
  for (const record of records) {
    const label = `${record.name ?? record._id}${record._id.startsWith('drafts.') ? ' (draft)' : ''}`
    const move = moveFor.get(publishedId(record._id))
    if (move && same(record.x, record.y, move.to)) {
      console.log(`= ${label}  already at ${move.to.join(', ')}`)
    } else if (move && same(record.x, record.y, move.from)) {
      tx.patch(record._id, (p) => p.ifRevisionId(record._rev).set({x: move.to[0], y: move.to[1]}))
      console.log(`~ ${label}  ${move.from.join(', ')} → ${move.to.join(', ')}`)
      changes++
    } else {
      console.log(`! ${label}  at ${record.x}, ${record.y}: not a known old position, left alone`)
    }
  }
  if (!changes) return console.log('\nNothing to do: every record is already on the new map.')
  if (!apply) return console.log(`\n${changes} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${changes} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
