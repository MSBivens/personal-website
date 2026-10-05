import {defineField, defineType, type ConditionalPropertyCallback} from 'sanity'

// Values must match PIN_TYPES in personal_site/one-for-all/map.js.
export const PIN_TYPES = [
  {title: 'Member', plural: 'Members', value: 'member'},
  {title: 'Enemy', plural: 'Enemies', value: 'enemy'},
  {title: 'Resource', plural: 'Resources', value: 'resource'},
  {title: 'Safe House', plural: 'Safe Houses', value: 'safehouse'},
  {title: 'Landmark', plural: 'Landmarks', value: 'landmark'},
]

const PLACEMENT_URL = 'https://www.msbivens.com/one-for-all?place'

const notMember: ConditionalPropertyCallback = ({document}) => document?.type !== 'member'

export const pin = defineType({
  name: 'pin',
  title: 'Pin',
  type: 'document',
  fieldsets: [
    {
      name: 'position',
      title: 'Map position',
      description: `Open ${PLACEMENT_URL}, click the spot, and copy the numbers here.`,
      options: {columns: 2},
    },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: PIN_TYPES.map(({title, value}) => ({title, value})),
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: "The town or region, e.g. Baldur's Gate.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rank',
      title: 'Rank',
      type: 'reference',
      to: [{type: 'rank'}],
      hidden: notMember,
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.type === 'member' && !value ? 'Members need a rank.' : true,
        ),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      description: 'Compromised and dead members are greyed out on the map.',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Compromised', value: 'compromised'},
          {title: 'Dead', value: 'dead'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'active',
      hidden: notMember,
    }),
    defineField({
      name: 'reportsTo',
      title: 'Reports to',
      type: 'reference',
      to: [{type: 'pin'}],
      description: 'The member or safe house this member reports to. Draws a network line on the map.',
      hidden: notMember,
      options: {
        filter: ({document}) => {
          const id = document._id.replace(/^drafts\./, '')
          return {
            filter: 'type in ["member", "safehouse"] && !(_id in [$id, $draftId])',
            params: {id, draftId: `drafts.${id}`},
          }
        },
      },
    }),
    defineField({
      name: 'x',
      title: 'X',
      type: 'number',
      fieldset: 'position',
      validation: (rule) => rule.required().integer().min(0).max(8192),
    }),
    defineField({
      name: 'y',
      title: 'Y',
      type: 'number',
      fieldset: 'position',
      validation: (rule) => rule.required().integer().min(0).max(5837),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 6,
      description: 'Leave a blank line between paragraphs.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      type: 'type',
      location: 'location',
      rankTitle: 'rank.title',
      rankIcon: 'rank.icon',
    },
    prepare({title, type, location, rankTitle, rankIcon}) {
      const typeTitle = PIN_TYPES.find((t) => t.value === type)?.title
      const label = type === 'member' && rankTitle ? `${typeTitle} (${rankTitle})` : typeTitle
      return {
        title,
        subtitle: [label, location].filter(Boolean).join(' · '),
        media: type === 'member' ? rankIcon : undefined,
      }
    },
  },
})
