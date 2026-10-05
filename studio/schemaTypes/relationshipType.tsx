import {defineField, defineType} from 'sanity'
import {LineSample} from '../components/LineSample'
import {COLOURS, DIRECTIONS, PATTERNS, SHAPES, WIDTHS, titleOf} from './lineStyle'

const radio = (list: {title: string; value: string}[]) => ({
  list,
  layout: 'radio' as const,
  direction: 'horizontal' as const,
})

export const relationshipType = defineType({
  name: 'relationshipType',
  title: 'Relationship Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'e.g. "Communication" or "Significant tie". Shown in the legend and on hover.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Colour',
      type: 'string',
      options: {list: COLOURS},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pattern',
      title: 'Pattern',
      type: 'string',
      options: radio(PATTERNS),
      initialValue: 'solid',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      options: radio(WIDTHS),
      initialValue: 'normal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'direction',
      title: 'Direction',
      type: 'string',
      description:
        'Arrow puts an arrowhead at the far end. Flowing animates the line toward the far end (good for letters on their way).',
      options: radio(DIRECTIONS),
      initialValue: 'none',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shape',
      title: 'Shape',
      type: 'string',
      description: 'Lines that share both ends are bowed apart automatically either way.',
      options: radio(SHAPES),
      initialValue: 'straight',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shownByDefault',
      title: 'Shown by default',
      type: 'boolean',
      description: 'Whether these lines are ticked in the legend the first time someone opens the map.',
      initialValue: true,
    }),
    defineField({
      name: 'legendOrder',
      title: 'Legend order',
      type: 'number',
      description: 'Lower numbers come first in the legend.',
      validation: (rule) => rule.integer(),
    }),
  ],
  orderings: [
    {title: 'Legend order', name: 'legendOrderAsc', by: [{field: 'legendOrder', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', color: 'color', pattern: 'pattern', width: 'width', direction: 'direction', shape: 'shape'},
    prepare: ({title, color, pattern, width, direction, shape}) => ({
      title,
      subtitle: [
        titleOf(COLOURS, color),
        titleOf(PATTERNS, pattern),
        titleOf(WIDTHS, width),
        direction !== 'none' && titleOf(DIRECTIONS, direction),
        shape === 'curved' && 'Curved',
      ]
        .filter(Boolean)
        .join(' · '),
      media: <LineSample color={color} pattern={pattern} width={width} direction={direction} />,
    }),
  },
})
