import {useEffect, useState} from 'react'
import {Text} from '@sanity/ui'
import {useClient, useFormValue} from 'sanity'
import {API_VERSION, TYPE_IDS, publishedId} from '../schemaTypes/ids'

// Read-only: shows which Soul Item points at this Party Member. The link itself is set on
// the Soul Item (its "Party member" field), so this just looks it up, drafts included.
const QUERY = 'array::unique(*[_type == "pin" && type._ref == $type && partyMember._ref == $id].name)'

export function SoulItemField() {
  const id = useFormValue(['_id']) as string | undefined
  const client = useClient({apiVersion: API_VERSION})
  const [names, setNames] = useState<string[] | null>(null)

  useEffect(() => {
    if (!id) return undefined
    const subscription = client
      .withConfig({perspective: 'raw'})
      .observable.fetch<string[]>(QUERY, {type: TYPE_IDS.soulItem, id: publishedId(id)})
      .subscribe(setNames)
    return () => subscription.unsubscribe()
  }, [client, id])

  return (
    <Text size={1} muted={!names?.length}>
      {names === null
        ? 'Loading…'
        : names.length
          ? names.join(', ')
          : 'None yet. Create a Soul Item and choose this party member on it.'}
    </Text>
  )
}
