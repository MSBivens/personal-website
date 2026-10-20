import {defineArrayMember, defineField, defineType, type NumberRule} from 'sanity'
import {MapPicker} from '../components/MapPicker'

// One record (ID `campaign`, see ids.ts) for map-wide settings: the last session, which pin is
// the party, and where the party has been. Opened from Settings → Campaign Settings.

type StopDoc = {location?: {_ref?: string}; x?: number; y?: number}

// A stop sits at its own X/Y, or at its Location's. X and Y go together.
const stopPositionRule = (max: number, axis: 'x' | 'y') => (rule: NumberRule) =>
  rule
    .integer()
    .min(0)
    .max(max)
    .custom((value, context) => {
      const stop = context.parent as StopDoc | undefined
      const other = stop?.[axis === 'x' ? 'y' : 'x']
      if (value === undefined && other !== undefined) return 'Fill in both X and Y, or leave both empty.'
      if (axis === 'x' && value === undefined && !stop?.location?._ref) {
        return 'Pick a Location or fill in X and Y.'
      }
      return true
    })

export const campaign = defineType({
  name: 'campaign',
  title: 'Campaign Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'lastSession',
      title: 'Last session',
      type: 'date',
      description:
        "The date of the last session. Pins and Locations created on or after it are tagged New on the map and listed under What's new. Leave empty to turn this off.",
      options: {dateFormat: 'D MMM YYYY'},
    }),
    defineField({
      name: 'partyPin',
      title: 'Party pin',
      type: 'reference',
      to: [{type: 'pin'}],
      description:
        "The pin that marks where the party is. The map opens on it, and when you move it and publish, its old spot is added to the end of the Trail.",
      options: {disableNew: true},
    }),
    defineField({
      name: 'trail',
      title: 'Trail',
      type: 'array',
      description:
        'Where the party has been, oldest first. The map draws a dotted line through these to the party pin. Add past stops by hand, or let moving the party pin add them. Drag to reorder.',
      of: [
        defineArrayMember({
          name: 'trailStop',
          title: 'Stop',
          type: 'object',
          fieldsets: [{name: 'position', title: 'Own position', options: {columns: 2}}],
          fields: [
            defineField({
              name: 'location',
              title: 'Location',
              type: 'reference',
              to: [{type: 'location'}],
              description: "The stop sits at this Location's position unless you fill in X and Y.",
              options: {disableNew: true},
            }),
            defineField({name: 'x', title: 'X', type: 'number', fieldset: 'position', validation: stopPositionRule(4763, 'x')}),
            defineField({name: 'y', title: 'Y', type: 'number', fieldset: 'position', validation: stopPositionRule(3185, 'y')}),
            defineField({
              name: 'mapPicker',
              title: 'Place on map',
              type: 'string',
              components: {input: MapPicker},
            }),
            defineField({
              name: 'date',
              title: 'Date',
              type: 'string',
              description: 'Free text, e.g. "Session 4" or "14 Sep".',
            }),
            defineField({name: 'note', title: 'Note', type: 'string', description: 'Optional. Shown when hovering the stop.'}),
          ],
          preview: {
            select: {location: 'location.name', x: 'x', y: 'y', date: 'date', note: 'note'},
            prepare: ({location, x, y, date, note}) => ({
              title: [date, location ?? (x !== undefined ? `X ${x}, Y ${y}` : 'No position')].filter(Boolean).join(' · '),
              subtitle: note,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Campaign Settings'})},
})
