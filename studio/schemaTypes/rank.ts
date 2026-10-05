import {defineField, defineType} from 'sanity'

export const rank = defineType({
  name: 'rank',
  title: 'Rank',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Position in the hierarchy. 1 is the highest rank.',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description:
        'Shown as the map marker and in the pop-up for members with this rank. A square image works best.',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', order: 'order', media: 'icon'},
    prepare: ({title, order, media}) => ({
      title,
      subtitle: order ? `Rank ${order}` : undefined,
      media,
    }),
  },
})
