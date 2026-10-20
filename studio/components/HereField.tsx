import {useEffect, useState} from 'react'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {useClient, useFormValue} from 'sanity'
import {IntentLink, useIntentLink} from 'sanity/router'
import {API_VERSION, TYPE_IDS, publishedId} from '../schemaTypes/ids'

type Pin = {_id: string; name?: string; typeTitle?: string}
type PinType = {_id: string; title?: string}

// Pins whose Location is this one (drafts included, each pin once), and the Pin Types for the
// "Add … here" buttons. Post Offices are left out of the buttons: they're added from the
// Post Offices list.
const QUERY = `{
  "pins": *[_type == "pin" && location._ref == $id] | order(type->legendOrder asc, name asc){
    _id, name, "typeTitle": type->title
  },
  "types": *[_type == "pinType" && !(_id in path("drafts.**")) && _id != $postOffice] | order(legendOrder asc){_id, title}
}`

/**
 * Read-only: lists the pins at this Location (click one to open it), with buttons that start
 * a new pin of a type with this Location already filled in. Nothing is stored here.
 */
export function HereField() {
  const id = useFormValue(['_id']) as string | undefined
  const client = useClient({apiVersion: API_VERSION})
  const [data, setData] = useState<{pins: Pin[]; types: PinType[]} | null>(null)

  useEffect(() => {
    if (!id) return undefined
    const subscription = client
      .withConfig({perspective: 'raw'})
      .observable.fetch<{pins: Pin[]; types: PinType[]}>(QUERY, {id: publishedId(id), postOffice: TYPE_IDS.postOffice})
      .subscribe(setData)
    return () => subscription.unsubscribe()
  }, [client, id])

  if (!id || !data) return <Text size={1} muted>Loading…</Text>
  const locationId = publishedId(id)
  // A pin with unpublished changes shows up twice (draft and published); list it once.
  const pins = [...new Map(data.pins.map((pin) => [publishedId(pin._id), pin])).entries()]

  return (
    <Stack gap={4}>
      {pins.length ? (
        <Stack gap={2}>
          {pins.map(([pinId, pin]) => (
            <Text key={pinId} size={1}>
              <IntentLink intent="edit" params={{id: pinId, type: 'pin'}}>
                {pin.name || 'Untitled'}
              </IntentLink>
              <Box as="span" style={{opacity: 0.6}}>
                {pin.typeTitle ? ` · ${pin.typeTitle}` : ''}
              </Box>
            </Text>
          ))}
        </Stack>
      ) : (
        <Text size={1} muted>
          Nothing here yet.
        </Text>
      )}
      <Flex gap={2} wrap="wrap">
        {data.types.map((type) => (
          <AddHereButton key={type._id} typeId={type._id} title={type.title ?? 'pin'} locationId={locationId} />
        ))}
      </Flex>
    </Stack>
  )
}

// A button that opens a new pin of this type with this Location filled in (the
// `pin-at-location` template in sanity.config.ts).
function AddHereButton({typeId, title, locationId}: {typeId: string; title: string; locationId: string}) {
  const {href, onClick} = useIntentLink({
    intent: 'create',
    params: [{type: 'pin', template: 'pin-at-location'}, {typeId, locationId}],
  })
  return <Button as="a" href={href} onClick={onClick} mode="ghost" fontSize={1} padding={2} text={`Add ${title} here`} />
}
