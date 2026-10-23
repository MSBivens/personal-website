/**
 * Ships, Ports and Death Sites: creates the three Pin Types (no icons; upload your own under
 * Settings → Pin Types) and their starter Statuses, and sets every Party Member without a
 * status to Alive. Records that already exist are left alone.
 *
 * Dry run:  npx sanity exec migrations/upgrade9-ships.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/upgrade9-ships.ts --with-user-token -- --dataset development --apply
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

type Status = {key: string; title: string; style: string; badge: string; openThread?: boolean}
type NewType = {id: string; title: string; plural: string; legendOrder: number; suggestedDetails: string[]; statuses: Status[]}

const TYPES: NewType[] = [
  {
    id: TYPE_IDS.deathSite,
    title: 'Death Site',
    plural: 'Death Sites',
    legendOrder: 75,
    suggestedDetails: ['When', 'Cause'],
    statuses: [{key: 'fallen', title: 'Fallen', style: 'normal', badge: 'dead'}],
  },
  {
    id: TYPE_IDS.ship,
    title: 'Ship',
    plural: 'Ships',
    legendOrder: 105,
    suggestedDetails: ['Cargo', 'Crew'],
    statuses: [
      {key: 'docked', title: 'Docked', style: 'normal', badge: 'none'},
      {key: 'at-sea', title: 'At sea', style: 'normal', badge: 'none'},
      {key: 'missing', title: 'Missing', style: 'normal', badge: 'unconfirmed', openThread: true},
      {key: 'sunk', title: 'Sunk', style: 'faded', badge: 'failed'},
    ],
  },
  {
    id: TYPE_IDS.port,
    title: 'Port',
    plural: 'Ports',
    legendOrder: 108,
    suggestedDetails: ['Harbourmaster', 'Fees'],
    statuses: [
      {key: 'open', title: 'Open', style: 'normal', badge: 'none'},
      {key: 'blockaded', title: 'Blockaded', style: 'dimmed', badge: 'lead'},
      {key: 'closed', title: 'Closed', style: 'faded', badge: 'failed'},
    ],
  },
]

const statusId = (typeId: string, key: string) => `pinStatus-${typeId.replace('pinType-', '')}-${key}`

async function main() {
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  const ids = TYPES.flatMap((type) => [type.id, ...type.statuses.map((status) => statusId(type.id, status.key))])
  const {existing, members} = await client.fetch<{existing: string[]; members: {_id: string; _rev: string; name?: string}[]}>(
    `{
      "existing": *[_id in $ids]._id,
      "members": *[_type == "partyMember" && !defined(status)]{_id, _rev, name}
    }`,
    {ids},
  )
  const have = new Set(existing)
  const tx = client.transaction()
  let changes = 0

  for (const type of TYPES) {
    if (!have.has(type.id)) {
      tx.createIfNotExists({
        _id: type.id,
        _type: 'pinType',
        title: type.title,
        plural: type.plural,
        legendOrder: type.legendOrder,
        suggestedDetails: type.suggestedDetails,
      })
      changes++
      console.log(`+ Pin Type  ${type.title} (legend order ${type.legendOrder}, suggested ${type.suggestedDetails.join(', ')})`)
    }
    type.statuses.forEach((status, i) => {
      const id = statusId(type.id, status.key)
      if (have.has(id)) return
      tx.createIfNotExists({
        _id: id,
        _type: 'pinStatus',
        title: status.title,
        pinType: {_type: 'reference', _ref: type.id},
        style: status.style,
        badge: status.badge,
        openThread: Boolean(status.openThread),
        order: i + 1,
      })
      changes++
      const notes = [status.style !== 'normal' && status.style, status.badge !== 'none' && `badge ${status.badge}`, status.openThread && 'open thread']
      console.log(`+ Status    ${type.title} · ${status.title}${notes.some(Boolean) ? ` (${notes.filter(Boolean).join(', ')})` : ''}`)
    })
  }

  for (const member of members) {
    tx.patch(member._id, (p) => p.ifRevisionId(member._rev).set({status: 'alive'}))
    changes++
    console.log(`~ Party     ${member._id.startsWith('drafts.') ? '(draft) ' : ''}${member.name ?? member._id}: status → Alive`)
  }

  if (!changes) return console.log('Nothing to do: already done.')
  if (!apply) return console.log(`\n${changes} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${changes} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
