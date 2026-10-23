import {useEffect, useState} from 'react'
import {Box, Stack, Text} from '@sanity/ui'
import {useClient, useFormValue} from 'sanity'
import {IntentLink} from 'sanity/router'
import {API_VERSION, TYPE_IDS, publishedId} from '../schemaTypes/ids'

type Ship = {_id: string; name?: string; route?: string[]}

// Read-only, on a Port: every ship whose Route includes this port (drafts included), with where
// the port comes in the route, e.g. "stop 2 of 4". The route itself is set on the ship.
const QUERY = '*[_type == "pin" && type._ref == $ship && $id in route[]._ref] | order(name asc){_id, name, "route": route[]._ref}'

export function PortShipsField() {
  const id = useFormValue(['_id']) as string | undefined
  const client = useClient({apiVersion: API_VERSION})
  const [ships, setShips] = useState<Ship[] | null>(null)

  useEffect(() => {
    if (!id) return undefined
    const subscription = client
      .withConfig({perspective: 'raw'})
      .observable.fetch<Ship[]>(QUERY, {ship: TYPE_IDS.ship, id: publishedId(id)})
      .subscribe(setShips)
    return () => subscription.unsubscribe()
  }, [client, id])

  if (!id || ships === null) return <Text size={1} muted>Loading…</Text>
  const portId = publishedId(id)
  // A ship with unpublished changes shows up twice (draft and published); list it once.
  const unique = [...new Map(ships.map((ship) => [publishedId(ship._id), ship])).entries()]
  if (!unique.length) {
    return (
      <Text size={1} muted>
        No ships yet. Add this port to a ship&apos;s Route.
      </Text>
    )
  }
  return (
    <Stack gap={2}>
      {unique.map(([shipId, ship]) => {
        const route = ship.route ?? []
        const stops = route.flatMap((ref, i) => (ref === portId ? [i + 1] : []))
        return (
          <Text key={shipId} size={1}>
            <IntentLink intent="edit" params={{id: shipId, type: 'pin'}}>
              {ship.name || 'Untitled'}
            </IntentLink>
            <Box as="span" style={{opacity: 0.6}}>
              {` · stop ${stops.join(' & ')} of ${route.length}`}
            </Box>
          </Text>
        )
      })}
    </Stack>
  )
}
