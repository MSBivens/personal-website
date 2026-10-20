import {defineField, defineType} from 'sanity'

// The small symbol drawn on the corner of the pin (the map draws them; see badges.js there).
export const BADGES = [
  {title: 'None', value: 'none'},
  {title: '✓ Done', value: 'done'},
  {title: '? Unconfirmed', value: 'unconfirmed'},
  {title: '! Lead', value: 'lead'},
  {title: '☠ Dead', value: 'dead'},
  {title: '✕ Failed', value: 'failed'},
]

const STYLES = [
  {title: 'Normal', value: 'normal'},
  {title: 'Dimmed', value: 'dimmed'},
  {title: 'Faded', value: 'faded'},
]

export const pinStatus = defineType({
  name: 'pinStatus',
  title: 'Status',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pinType',
      title: 'Pin Type',
      type: 'reference',
      to: [{type: 'pinType'}],
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'style',
      title: 'Map style',
      type: 'string',
      description:
        "Dimmed greys the pin out and Faded makes it lighter still: use them for finished things (dead, cleared, completed), not for things players should still chase. A member whose status isn't Normal gets a dashed network line.",
      options: {list: STYLES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'normal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      description: 'A small symbol on the corner of the pin, so its status shows at a glance.',
      options: {list: BADGES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'none',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers come first. The first one is the default for new pins.',
      validation: (rule) => rule.integer(),
    }),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', typeTitle: 'pinType.title', style: 'style', badge: 'badge', media: 'pinType.icon'},
    prepare: ({title, typeTitle, style, badge, media}) => ({
      title,
      subtitle: [
        typeTitle,
        STYLES.find((s) => s.value === style)?.title,
        badge && badge !== 'none' && BADGES.find((b) => b.value === badge)?.title,
      ]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})
