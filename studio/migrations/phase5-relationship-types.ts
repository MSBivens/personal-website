/**
 * Creates two starter Relationship Types, matching the examples the map was planned around:
 * "Communication" (letter routes, flowing toward the recipient) and "Significant tie".
 * Only runs if there are no Relationship Types yet; edit or delete them freely in Studio.
 *
 * Dry run:  npx sanity exec migrations/phase5-relationship-types.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/phase5-relationship-types.ts --with-user-token -- --dataset development --apply
 */
import {getCliClient} from 'sanity/cli'
import {API_VERSION} from '../schemaTypes/ids'

const STARTERS = [
  {
    _id: 'relationshipType-communication',
    title: 'Communication',
    color: '#1e88e5',
    pattern: 'dashed',
    width: 'normal',
    direction: 'flow',
    shape: 'straight',
    shownByDefault: true,
    legendOrder: 10,
  },
  {
    _id: 'relationshipType-tie',
    title: 'Significant tie',
    color: '#7e3fbf',
    pattern: 'dotted',
    width: 'normal',
    direction: 'none',
    shape: 'curved',
    shownByDefault: true,
    legendOrder: 20,
  },
]

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const datasetFlag = args.indexOf('--dataset')
const dataset = datasetFlag >= 0 ? args[datasetFlag + 1] : undefined
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

async function main() {
  const existing = await client.fetch<number>('count(*[_type == "relationshipType"])')
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  if (existing) return console.log(`Nothing to do: ${existing} Relationship Type(s) already exist.`)

  const tx = client.transaction()
  for (const type of STARTERS) {
    tx.createIfNotExists({_type: 'relationshipType', ...type})
    console.log(`+ Relationship Type  ${type.title}`)
  }
  if (!apply) return console.log(`\n${STARTERS.length} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${STARTERS.length} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
