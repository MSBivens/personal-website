export const API_VERSION = '2025-02-19'

// Pin Types the code depends on. migrations/phase2-foundation.ts creates them with these
// fixed IDs, and Studio won't let them be deleted (see sanity.config.ts). Hyphens, not
// dots: Sanity treats IDs containing a dot as private, so the public map couldn't read them.
// The map uses the same IDs (personal_site/one-for-all/data.js).
export const TYPE_IDS = {
  member: 'pinType-member',
  enemy: 'pinType-enemy',
  resource: 'pinType-resource',
  safehouse: 'pinType-safehouse',
  landmark: 'pinType-landmark',
  npc: 'pinType-npc',
  soulItem: 'pinType-soulItem',
  rumor: 'pinType-rumor',
  worldEvent: 'pinType-worldEvent',
  dungeon: 'pinType-dungeon',
  quest: 'pinType-quest',
  postOffice: 'pinType-postOffice',
} as const

export const FIXED_TYPE_IDS: string[] = Object.values(TYPE_IDS)

/** The Pin Type a pin (or draft) currently points at, if any. */
export const typeIdOf = (document: unknown) =>
  (document as {type?: {_ref?: string}} | undefined)?.type?._ref

/** A document's published ID, whether it's open as a draft or not. */
export const publishedId = (id: string) => id.replace(/^drafts\./, '')
