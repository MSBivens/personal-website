import {defineField, defineType} from 'sanity'

export const pinType = defineType({
  name: 'pinType',
  title: 'Pin Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'plural',
      title: 'Plural',
      type: 'string',
      description: 'Used for the Studio list and the map legend, e.g. "Safe Houses".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description:
        'The map marker for pins of this type. PNG or WebP with a transparent background works best; square is ideal.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legendOrder',
      title: 'Legend order',
      type: 'number',
      description: 'Lower numbers come first in the legend and the Studio list.',
      validation: (rule) => rule.required().integer(),
    }),
  ],
  orderings: [
    {title: 'Legend order', name: 'legendOrderAsc', by: [{field: 'legendOrder', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', plural: 'plural', media: 'icon'},
    prepare: ({title, plural, media}) => ({title, subtitle: plural, media}),
  },
})
