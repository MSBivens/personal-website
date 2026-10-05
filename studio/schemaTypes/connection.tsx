import {defineField, defineType, type ConditionalProperty} from 'sanity'
import {LineSample} from '../components/LineSample'
import {TYPE_IDS, publishedId} from './ids'

// One relationship from the record it's on to another record or Location, drawn as a line
// on the map. Used in the Connections list of pins and Locations.
export const connection = defineType({
  name: 'connection',
  title: 'Connection',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Relationship',
      type: 'reference',
      to: [{type: 'relationshipType'}],
      description: 'Add or restyle relationships under Settings → Relationship Types.',
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'to',
      title: 'To',
      type: 'reference',
      to: [{type: 'pin'}, {type: 'location'}],
      description: 'Any pin or Location (not this record, and not a Post Office).',
      options: {
        disableNew: true,
        filter: ({document}) => {
          const id = publishedId(document._id)
          return {
            filter: '!(_id in [$id, $draftId]) && !(_type == "pin" && type._ref == $postOffice)',
            params: {id, draftId: `drafts.${id}`, postOffice: TYPE_IDS.postOffice},
          }
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'via',
      title: 'Via',
      type: 'array',
      description: 'Post Offices the line passes through, in order. Leave empty for a direct line.',
      of: [
        {
          type: 'reference',
          to: [{type: 'pin'}],
          options: {
            disableNew: true,
            filter: 'type._ref == $postOffice',
            filterParams: {postOffice: TYPE_IDS.postOffice},
          },
        },
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Optional. Shown when hovering the line, e.g. "Weekly report".',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Optional. Shown with the connection in pop-ups.',
    }),
  ],
  preview: {
    select: {
      to: 'to.name',
      relationship: 'type.title',
      color: 'type.color',
      pattern: 'type.pattern',
      width: 'type.width',
      direction: 'type.direction',
      via: 'via',
      label: 'label',
    },
    prepare: ({to, relationship, color, pattern, width, direction, via, label}) => ({
      title: `→ ${to ?? '(choose a record)'}`,
      subtitle: [
        relationship,
        via?.length && `via ${via.length} ${via.length === 1 ? 'stop' : 'stops'}`,
        label,
      ]
        .filter(Boolean)
        .join(' · '),
      media: <LineSample color={color} pattern={pattern} width={width} direction={direction} />,
    }),
  },
})

// The Connections list, shared by pins and Locations.
export const connectionsField = (hidden?: ConditionalProperty) =>
  defineField({
    name: 'connections',
    title: 'Connections',
    type: 'array',
    description:
      "Relationships from this record to other records or Locations. Each one is drawn as a line on the map and listed in both ends' pop-ups.",
    of: [{type: 'connection'}],
    hidden,
  })
