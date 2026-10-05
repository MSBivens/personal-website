/**
 * Sets Map Visibility to "Map Pin" on pins saved before the field existed, so Studio
 * shows the right option selected. (The map already treats a missing value as Map Pin.)
 *
 * Dry run:  npx sanity exec migrations/phase3-visibility.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/phase3-visibility.ts --with-user-token -- --dataset development --apply
 *
 * Safe to re-run.
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION} from '../schemaTypes/ids'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

async function main() {
  const pins = await client.fetch<{_id: string; _rev: string; name?: string}[]>(
    '*[_type == "pin" && !defined(visibility)]{_id, _rev, name}',
  )
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  if (!pins.length) return console.log('Nothing to do: every pin has a Map Visibility.')

  const tx = client.transaction()
  for (const pin of pins) {
    tx.patch(pin._id, (p) => p.ifRevisionId(pin._rev).set({visibility: 'pin'}))
    console.log(`~ Pin  ${pin.name ?? pin._id}  visibility → Map Pin`)
  }
  if (!apply) return console.log(`\n${pins.length} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${pins.length} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
