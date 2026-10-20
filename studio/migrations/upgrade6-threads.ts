/**
 * Upgrade phase 6: marks the starter statuses that count as open threads (things the party
 * could still pursue), and sets "Open thread" off on every other status that doesn't have it
 * yet. Statuses are matched by Pin Type and name; ones already set are left alone.
 *
 * Dry run:  npx sanity exec migrations/upgrade6-threads.ts --with-user-token -- --dataset development
 * Apply:    npx sanity exec migrations/upgrade6-threads.ts --with-user-token -- --dataset development --apply
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

// Pin Type → status names (lower case) that are open threads.
const OPEN: Record<string, string[]> = {
  [TYPE_IDS.quest]: ['available', 'active'],
  [TYPE_IDS.rumor]: ['unverified'],
  [TYPE_IDS.soulItem]: ['rumored', 'located'],
  [TYPE_IDS.dungeon]: ['unexplored', 'partly explored'],
  [TYPE_IDS.worldEvent]: ['upcoming', 'ongoing'],
}

type Status = {_id: string; _rev: string; title?: string; typeId?: string; typeTitle?: string}

async function main() {
  console.log(`Dataset: ${client.config().dataset}  ·  ${apply ? 'APPLYING' : 'DRY RUN (add --apply to write)'}\n`)
  const statuses = await client.fetch<Status[]>(
    '*[_type == "pinStatus" && !defined(openThread)] | order(pinType->legendOrder asc, order asc){_id, _rev, title, "typeId": pinType._ref, "typeTitle": pinType->title}',
  )
  if (!statuses.length) return console.log('Nothing to do: every status has "Open thread" set.')

  const tx = client.transaction()
  for (const status of statuses) {
    const open = (OPEN[status.typeId ?? ''] ?? []).includes((status.title ?? '').trim().toLowerCase())
    tx.patch(status._id, (p) => p.ifRevisionId(status._rev).set({openThread: open}))
    const draft = status._id.startsWith('drafts.') ? '(draft) ' : ''
    console.log(`~ ${draft}${status.typeTitle ?? '?'} · ${status.title}: open thread ${open ? 'YES' : 'no'}`)
  }
  if (!apply) return console.log(`\n${statuses.length} changes planned. Nothing was written.`)
  await tx.commit({visibility: 'sync'})
  console.log(`\nDone: ${statuses.length} changes written in one transaction.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
