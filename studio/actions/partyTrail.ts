import type {DocumentActionComponent, DocumentActionProps, SanityClient, SanityDocument} from 'sanity'
import {CAMPAIGN_ID} from '../schemaTypes/campaign'
import {randomKey} from '../schemaTypes/ids'

type PinPosition = {x?: number; y?: number; location?: {_ref?: string}}
type Spot = {x: number; y: number; locationId?: string}

// Where a pin sits: its own X/Y, else its Location's (read from the published Location, as
// the map does). Null if neither has one.
async function spotOf(client: SanityClient, pin: PinPosition | null): Promise<Spot | null> {
  if (!pin) return null
  if (pin.x !== undefined && pin.y !== undefined) return {x: pin.x, y: pin.y}
  const locationId = pin.location?._ref
  if (!locationId) return null
  const place = await client
    .withConfig({perspective: 'published'})
    .fetch<{x?: number; y?: number} | null>('*[_id == $id][0]{x, y}', {id: locationId})
  return place?.x !== undefined && place?.y !== undefined ? {x: place.x, y: place.y, locationId} : null
}

// If this is the party pin and publishing moves it, add its old spot to the end of the Trail
// (in Campaign Settings, and its unpublished draft too if there is one). A stop at a Location
// keeps the Location; otherwise it keeps the X/Y.
async function recordTrailStop(client: SanityClient, props: DocumentActionProps) {
  const {id, draft, published} = props
  if (!draft || !published) return
  const campaign = await client
    .withConfig({perspective: 'raw'})
    .fetch<{_id: string; partyId?: string}[]>('*[_id in [$id, "drafts." + $id]]{_id, "partyId": partyPin._ref}', {
      id: CAMPAIGN_ID,
    })
  if (!campaign.some((doc) => doc.partyId === id)) return

  const [before, after] = await Promise.all([
    spotOf(client, published as SanityDocument & PinPosition),
    spotOf(client, draft as SanityDocument & PinPosition),
  ])
  if (!before || (after && after.x === before.x && after.y === before.y)) return

  const stop = {
    _key: randomKey(),
    _type: 'trailStop',
    ...(before.locationId
      ? {location: {_type: 'reference', _ref: before.locationId}}
      : {x: before.x, y: before.y}),
    date: new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}),
  }
  const tx = client.transaction()
  for (const doc of campaign) tx.patch(doc._id, (p) => p.setIfMissing({trail: []}).append('trail', [stop]))
  await tx.commit()
}

/** Wraps the Publish action so moving the party pin records where it was. */
export function withPartyTrail(publish: DocumentActionComponent, client: SanityClient): DocumentActionComponent {
  const PublishWithTrail: DocumentActionComponent = (props) => {
    const result = publish(props)
    if (!result) return result
    return {
      ...result,
      onHandle: async () => {
        try {
          await recordTrailStop(client, props)
        } catch (err) {
          // Never block publishing; the stop can be added by hand.
          console.error('Could not add the party trail stop:', err)
        }
        result.onHandle?.()
      },
    }
  }
  PublishWithTrail.action = publish.action
  return PublishWithTrail
}
