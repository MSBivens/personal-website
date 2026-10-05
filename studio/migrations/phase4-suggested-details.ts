/**
 * Gives the new Pin Types their starting "Suggested details" (the Details rows a new pin of
 * that type begins with). Types that already have suggestions are left alone.
 *
 * Dry run:  npx sanity exec migrations/phase4-suggested-details.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/phase4-suggested-details.ts --with-user-token -- --dataset development --apply
 *
 * Safe to re-run.
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION, TYPE_IDS} from '../schemaTypes/ids'

const SUGGESTED: Partial<Record<keyof typeof TYPE_IDS, string[]>> = {
  npc: ['Role', 'Affiliation'],
  soulItem: ['Clues'],
  rumor: ['Source', 'When heard'],
  worldEvent: ['When', 'Impact'],
  dungeon: ['Danger', 'Known threats', 'Known rewards'],
  quest: ['Reward', 'Objectives'],
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

async function main() {
  const types = await client.fetch<{_id: string; _rev: string; title: string}[]>(
    '*[_type == "pinType" && _id in $ids && !defined(suggestedDetails)]{_id, _rev, title}',
    {ids: Object.keys(SUGGESTED).map((key) => TYPE_IDS[key as keyof typeof TYPE_IDS])},
  )
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  if (!types.length) return console.log('Nothing to do: suggestions already set.')

  const tx = client.transaction()
  for (const type of types) {
    const key = (Object.keys(TYPE_IDS) as (keyof typeof TYPE_IDS)[]).find((k) => TYPE_IDS[k] === type._id)!
    const labels = SUGGESTED[key]!
    tx.patch(type._id, (p) => p.ifRevisionId(type._rev).set({suggestedDetails: labels}))
    console.log(`~ Pin Type  ${type.title.padEnd(12)} suggested details → ${labels.join(', ')}`)
  }
  if (!apply) return console.log(`\n${types.length} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${types.length} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
