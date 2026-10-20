import {defineField, defineType, type NumberRule} from 'sanity'
import {connectionsField} from './connection'
import {detailsField} from './details'
import {API_VERSION, publishedId} from './ids'

// Optional, but X and Y go together.
const positionRule = (max: number, axis: 'x' | 'y') => (rule: NumberRule) =>
  rule
    .integer()
    .min(0)
    .max(max)
    .custom((value, context) => {
      const other = (context.document as {x?: number; y?: number} | undefined)?.[axis === 'x' ? 'y' : 'x']
      return value === undefined && other !== undefined ? 'Fill in both X and Y, or leave both empty.' : true
    })

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fieldsets: [
    {
      name: 'position',
      title: 'Map position',
      description:
        "Pins at this Location sit here unless they have their own position. Use Locate on the map to get the numbers. Leave empty for a region with no single spot; its pins then need their own.",
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
      name: 'x',
      title: 'X',
      type: 'number',
      fieldset: 'position',
      validation: positionRule(4763, 'x'),
    }),
    defineField({
      name: 'y',
      title: 'Y',
      type: 'number',
      fieldset: 'position',
      validation: positionRule(3185, 'y'),
    }),
    defineField({
      name: 'icon',
      title: 'Map icon',
      type: 'image',
      description:
        "Optional. Shown on the marker that groups this Location's pins (or on its own marker if nothing is here yet). Without one, a folder icon.",
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Notes about this place, shown in its panel on the map. Leave a blank line between paragraphs.',
    }),
    detailsField({
      description:
        'Short facts about the place, shown as rows in its panel, e.g. Restorative pool: heals once per long rest. Empty rows are left out.',
    }),
    // Lines from a Location start wherever its pins are drawn, or at its X/Y (no X/Y, no line).
    connectionsField(),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', x: 'x', media: 'icon'},
    prepare: ({title, x, media}) => ({
      title,
      subtitle: x === undefined ? 'No map position' : undefined,
      media,
    }),
  },
})
