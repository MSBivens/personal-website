import {defineField, defineType} from 'sanity'

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
        'Dimmed greys the pin out and Faded makes it lighter still. A member whose status isn\'t Normal gets a dashed network line.',
      options: {list: STYLES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'normal',
      validation: (rule) => rule.required(),
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
    select: {title: 'title', typeTitle: 'pinType.title', style: 'style', media: 'pinType.icon'},
    prepare: ({title, typeTitle, style, media}) => ({
      title,
      subtitle: [typeTitle, STYLES.find((s) => s.value === style)?.title].filter(Boolean).join(' · '),
      media,
    }),
  },
})
