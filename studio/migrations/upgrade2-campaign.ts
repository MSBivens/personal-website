/**
 * Upgrade phase 2: creates Campaign Settings, pointing at the party pin, with an empty trail.
 * The party pin is the one published pin whose type is named "Party Location", or the one
 * given with --party <pin id>.
 *
 * Dry run:  npx sanity exec migrations/upgrade2-campaign.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/upgrade2-campaign.ts --with-user-token -- --dataset development --apply
 *
 * Safe to re-run: it never changes Campaign Settings once they exist.
 */
import {getCliClient} from 'sanity/cli'
import {CAMPAIGN_ID} from '../schemaTypes/campaign'
import {API_VERSION} from '../schemaTypes/ids'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const dataset = flag('--dataset')
const client = getCliClient({apiVersion: API_VERSION}).withConfig({
  perspective: 'raw',
  ...(dataset ? {dataset} : {}),
})

async function main() {
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  const existing = await client.fetch<string[]>('*[_id in [$id, "drafts." + $id]]._id', {id: CAMPAIGN_ID})
  if (existing.length) return console.log('Nothing to do: Campaign Settings already exist.')

  const given = flag('--party')
  const candidates = await client.fetch<{_id: string; name?: string}[]>(
    given
      ? '*[_type == "pin" && _id == $id]{_id, name}'
      : '*[_type == "pin" && !(_id in path("drafts.**")) && type->title == "Party Location"]{_id, name}',
    {id: given ?? ''},
  )
  if (candidates.length !== 1) {
    const found = candidates.map((pin) => `${pin.name} (${pin._id})`).join(', ') || 'none'
    throw new Error(`Expected exactly one party pin, found: ${found}. Pass --party <pin id>.`)
  }
  const party = candidates[0]
  console.log(`+ Campaign Settings: party pin → ${party.name ?? party._id}, empty trail`)
  if (!apply) return console.log('\n1 change planned. Nothing was written.')
  await client.createIfNotExists({
    _id: CAMPAIGN_ID,
    _type: 'campaign',
    partyPin: {_type: 'reference', _ref: party._id},
    trail: [],
  })
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
