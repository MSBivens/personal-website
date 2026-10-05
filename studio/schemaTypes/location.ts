import {defineField, defineType} from 'sanity'
import {API_VERSION, publishedId} from './ids'

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: "A town or region, e.g. Baldur's Gate.",
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true
          const id = publishedId(context.document?._id ?? '')
          const taken = await context
            .getClient({apiVersion: API_VERSION})
            .fetch<number>(
              'count(*[_type == "location" && lower(name) == lower($name) && !(_id in [$id, $draftId])])',
              {name: value, id, draftId: `drafts.${id}`},
            )
          return taken ? 'Another Location already has this name.' : true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Notes about this place. Leave a blank line between paragraphs.',
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {select: {title: 'name'}},
})
