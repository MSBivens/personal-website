import {useEffect, useState} from 'react'
import {Stack, Text} from '@sanity/ui'
import {useClient, useFormValue} from 'sanity'
import {IntentLink} from 'sanity/router'
import {API_VERSION, TYPE_IDS, publishedId} from '../schemaTypes/ids'

// Read-only: the Death Site pins that point at this Party Member (set on the Death Site, in its
// "Party member" field), drafts included, each a link to open it.
const QUERY = '*[_type == "pin" && type._ref == $type && partyMember._ref == $id] | order(_createdAt asc){_id, name}'

export function DeathSitesField() {
  const id = useFormValue(['_id']) as string | undefined
  const client = useClient({apiVersion: API_VERSION})
  const [sites, setSites] = useState<{_id: string; name?: string}[] | null>(null)

  useEffect(() => {
    if (!id) return undefined
    const subscription = client
      .withConfig({perspective: 'raw'})
      .observable.fetch<{_id: string; name?: string}[]>(QUERY, {type: TYPE_IDS.deathSite, id: publishedId(id)})
      .subscribe(setSites)
    return () => subscription.unsubscribe()
  }, [client, id])

  if (sites === null) return <Text size={1} muted>Loading…</Text>
  // A site with unpublished changes shows up twice (draft and published); list it once.
  const unique = [...new Map(sites.map((site) => [publishedId(site._id), site])).entries()]
  if (!unique.length) return <Text size={1} muted>None.</Text>
  return (
    <Stack gap={2}>
      {unique.map(([siteId, site]) => (
        <Text key={siteId} size={1}>
          <IntentLink intent="edit" params={{id: siteId, type: 'pin'}}>
            {site.name || 'Untitled'}
          </IntentLink>
        </Text>
      ))}
    </Stack>
  )
}
