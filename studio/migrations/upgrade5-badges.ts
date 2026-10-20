/**
 * Upgrade phase 5: gives each starter Status a badge, and stops fading things players should
 * still chase (e.g. a Rumored Soul Item). Statuses are matched by Pin Type and name; ones
 * that already have a badge, or aren't in the table below, are left alone. Every status
 * without a badge gets "None", so Studio shows the field filled in.
 *
 * Dry run:  npx sanity exec migrations/upgrade5-badges.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/upgrade5-badges.ts --with-user-token -- --dataset development --apply
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

type Default = {badge: string; style?: string}
// Pin Type → status name (lower case) → badge, and map style where it should change.
const DEFAULTS: Record<string, Record<string, Default>> = {
  [TYPE_IDS.member]: {active: {badge: 'none'}, compromised: {badge: 'lead', style: 'dimmed'}, dead: {badge: 'dead', style: 'faded'}},
  [TYPE_IDS.npc]: {alive: {badge: 'none'}, unknown: {badge: 'unconfirmed', style: 'normal'}, dead: {badge: 'dead', style: 'faded'}},
  [TYPE_IDS.soulItem]: {
    rumored: {badge: 'unconfirmed', style: 'normal'},
    located: {badge: 'lead', style: 'normal'},
    obtained: {badge: 'done'},
  },
  [TYPE_IDS.rumor]: {unverified: {badge: 'unconfirmed'}, true: {badge: 'done'}, false: {badge: 'failed', style: 'faded'}},
  [TYPE_IDS.worldEvent]: {upcoming: {badge: 'none'}, ongoing: {badge: 'lead'}, past: {badge: 'none', style: 'faded'}},
  [TYPE_IDS.dungeon]: {
    unexplored: {badge: 'unconfirmed'},
    'partly explored': {badge: 'none'},
    cleared: {badge: 'done', style: 'faded'},
  },
  [TYPE_IDS.quest]: {
    available: {badge: 'lead'},
    active: {badge: 'none'},
    completed: {badge: 'done', style: 'faded'},
    failed: {badge: 'failed', style: 'faded'},
  },
}

type Status = {_id: string; _rev: string; title?: string; typeId?: string; typeTitle?: string; style?: string}

async function main() {
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  const statuses = await client.fetch<Status[]>(
    '*[_type == "pinStatus" && !defined(badge)] | order(pinType->legendOrder asc, order asc){_id, _rev, title, "typeId": pinType._ref, "typeTitle": pinType->title, style}',
  )
  if (!statuses.length) return console.log('Nothing to do: every status has a badge.')

  const tx = client.transaction()
  for (const status of statuses) {
    const wanted = DEFAULTS[status.typeId ?? '']?.[(status.title ?? '').trim().toLowerCase()] ?? {badge: 'none'}
    const set: Record<string, string> = {badge: wanted.badge}
    if (wanted.style && wanted.style !== status.style) set.style = wanted.style
    tx.patch(status._id, (p) => p.ifRevisionId(status._rev).set(set))
    const styleNote = set.style ? `, map style ${status.style} → ${set.style}` : ''
    const draft = status._id.startsWith('drafts.') ? '(draft) ' : ''
    console.log(`~ ${draft}${status.typeTitle ?? '?'} · ${status.title}: badge ${wanted.badge}${styleNote}`)
  }
  if (!apply) return console.log(`\n${statuses.length} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${statuses.length} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
