import {defineField, defineType, type NumberRule} from 'sanity'
import {API_VERSION, publishedId} from './ids'

const isHub = (document: unknown) => Boolean((document as {showAsHub?: boolean} | undefined)?.showAsHub)
const positionRule = (max: number) => (rule: NumberRule) =>
  rule
    .integer()
    .min(0)
    .max(max)
    .custom((value, context) =>
      value === undefined && isHub(context.document) ? 'Hubs need a position.' : true,
    )

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fieldsets: [
    {
      name: 'position',
      title: 'Map position',
      description:
        'Where the Hub marker goes. Use Locate on the map to get the numbers. Optional unless this is a Hub.',
      options: {columns: 2},
    },
  ],
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
      name: 'showAsHub',
      title: 'Show as Hub',
      type: 'boolean',
      description:
        'Shows this Location on the map as one marker that opens a list of everything here. Use it where pins are too close together to read.',
      initialValue: false,
      validation: (rule) =>
        rule
          .custom(async (value, context) => {
            if (value) return true
            const attached = await context
              .getClient({apiVersion: API_VERSION})
              .withConfig({perspective: 'published'})
              .fetch<string[]>('*[_type == "pin" && location._ref == $id && visibility == "attached"].name', {
                id: publishedId(context.document?._id ?? ''),
              })
            return attached.length
              ? `Attached to this Location, so hidden from the map while it isn't a Hub: ${attached.join(', ')}.`
              : true
          })
          .warning(),
    }),
    defineField({
      name: 'x',
      title: 'X',
      type: 'number',
      fieldset: 'position',
      validation: positionRule(8192),
    }),
    defineField({
      name: 'y',
      title: 'Y',
      type: 'number',
      fieldset: 'position',
      validation: positionRule(5837),
    }),
    defineField({
      name: 'icon',
      title: 'Hub icon',
      type: 'image',
      description: 'Optional. Without one, the Hub shows a folder icon.',
      hidden: ({document}) => !isHub(document),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Notes about this place, shown in its panel on the map. Leave a blank line between paragraphs.',
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', showAsHub: 'showAsHub', media: 'icon'},
    prepare: ({title, showAsHub, media}) => ({
      title,
      subtitle: showAsHub ? 'Hub' : undefined,
      media: showAsHub ? media : undefined,
    }),
  },
})
