import {useEffect, useRef, useState} from 'react'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {PatchEvent, set, unset, useClient, useFormValue, type StringInputProps} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {API_VERSION} from '../schemaTypes/ids'

// Same as the site's map (personal_site/one-for-all/view.js): the Faerûn image in pixels,
// cut into tiles by `npm run tiles`.
const MAP_IMAGE = {width: 4763, height: 3185, maxZoom: 5}
const TILE_URL = 'https://www.msbivens.com/one-for-all/tiles/{z}/{y}/{x}.webp'

type Spot = {x: number; y: number}
type Holder = {x?: number; y?: number; location?: {_ref?: string}}

/**
 * "Place on map": click the map to set the X and Y next to it, instead of copying numbers
 * from Locate on the site. Used on pins, Locations and party trail stops. It stores nothing
 * itself; it sets the X/Y fields on the same record (or trail stop).
 */
export function MapPicker(props: StringInputProps) {
  const holderPath = props.path.slice(0, -1)
  const holder = useFormValue(holderPath) as Holder | undefined
  const {onChange} = useDocumentPane()
  const client = useClient({apiVersion: API_VERSION})
  const [open, setOpen] = useState(false)
  const [inherited, setInherited] = useState<(Spot & {name?: string}) | null>(null)

  const own: Spot | null = holder?.x !== undefined && holder?.y !== undefined ? {x: holder.x, y: holder.y} : null
  const locationId = holder?.location?._ref

  // The Location's position, shown faintly: where the pin sits while it has no X/Y of its own.
  useEffect(() => {
    if (!locationId) return setInherited(null)
    let current = true
    client
      .withConfig({perspective: 'published'})
      .fetch<{name?: string; x?: number; y?: number} | null>('*[_id == $id][0]{name, x, y}', {id: locationId})
      .then((place) => {
        if (!current) return
        setInherited(place?.x !== undefined && place?.y !== undefined ? {x: place.x, y: place.y, name: place.name} : null)
      })
    return () => {
      current = false
    }
  }, [client, locationId])

  const place = (spot: Spot) =>
    onChange(PatchEvent.from([set(spot.x, [...holderPath, 'x']), set(spot.y, [...holderPath, 'y'])]))
  const clear = () => onChange(PatchEvent.from([unset([...holderPath, 'x']), unset([...holderPath, 'y'])]))

  return (
    <Stack gap={3}>
      <Flex gap={2} wrap="wrap" align="center">
        <Button
          mode="ghost"
          text={open ? 'Hide map' : 'Place on map'}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        />
        {own && locationId && (
          <Button mode="ghost" tone="caution" text="Clear (use the Location's position)" onClick={clear} />
        )}
        {own && !locationId && <Button mode="ghost" tone="caution" text="Clear X and Y" onClick={clear} />}
      </Flex>
      {open && <PickerMap own={own} inherited={inherited} onPick={place} />}
    </Stack>
  )
}

function PickerMap({
  own,
  inherited,
  onPick,
}: {
  own: Spot | null
  inherited: (Spot & {name?: string}) | null
  onPick: (spot: Spot) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layers = useRef<L.LayerGroup | null>(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  // The map itself, made once.
  useEffect(() => {
    if (!box.current) return undefined
    const map = L.map(box.current, {crs: L.CRS.Simple, zoomSnap: 0, zoomDelta: 0.5, attributionControl: false})
    const toLatLng = (x: number, y: number) => map.unproject([x, y], MAP_IMAGE.maxZoom)
    const bounds = L.latLngBounds(toLatLng(0, MAP_IMAGE.height), toLatLng(MAP_IMAGE.width, 0))
    L.tileLayer(TILE_URL, {bounds, maxNativeZoom: MAP_IMAGE.maxZoom, maxZoom: MAP_IMAGE.maxZoom + 1, noWrap: true}).addTo(map)
    map.setMaxBounds(bounds)
    map.fitBounds(bounds)
    map.setMinZoom(map.getBoundsZoom(bounds))
    map.setMaxZoom(MAP_IMAGE.maxZoom + 1)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const p = map.project(e.latlng, MAP_IMAGE.maxZoom)
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      if (x >= 0 && y >= 0 && x <= MAP_IMAGE.width && y <= MAP_IMAGE.height) pickRef.current({x, y})
    })
    layers.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Centre on the spot when the map first opens.
  const centred = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    const spot = own ?? inherited
    if (!map || !spot || centred.current) return
    centred.current = true
    map.setView(map.unproject([spot.x, spot.y], MAP_IMAGE.maxZoom), 3.5)
  }, [own, inherited])

  // The markers: the record's own spot (red), and its Location's (grey, dashed).
  useEffect(() => {
    const map = mapRef.current
    const group = layers.current
    if (!map || !group) return
    group.clearLayers()
    const at = (spot: Spot) => map.unproject([spot.x, spot.y], MAP_IMAGE.maxZoom)
    if (inherited) {
      group.addLayer(
        L.circleMarker(at(inherited), {radius: 9, color: '#555', weight: 2, dashArray: '3 3', fillOpacity: 0.15, interactive: false}),
      )
    }
    if (own) {
      group.addLayer(L.circleMarker(at(own), {radius: 7, color: '#fff', weight: 2, fillColor: '#c00000', fillOpacity: 1, interactive: false}))
    }
  }, [own, inherited])

  return (
    <Stack gap={2}>
      <Card border radius={2} overflow="hidden">
        <Box ref={box} style={{height: 340, background: '#c4deef', cursor: 'crosshair'}} />
      </Card>
      <Text size={1} muted>
        Click the map to set X and Y; zoom in for precision.
        {own ? ` Now at X ${own.x}, Y ${own.y} (red).` : ''}
        {inherited ? ` Grey dashed circle: ${inherited.name ?? 'its Location'}.` : ''}
      </Text>
    </Stack>
  )
}
