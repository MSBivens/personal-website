import {defineField, defineType, type ConditionalPropertyCallback, type NumberRule} from 'sanity'
import {API_VERSION, TYPE_IDS, publishedId, typeIdOf} from './ids'

const MAP_URL = 'https://www.msbivens.com/one-for-all'

const notMember: ConditionalPropertyCallback = ({document}) => typeIdOf(document) !== TYPE_IDS.member
// Post Offices are only waypoints for communication lines, so they just need a name and a spot.
const isPostOffice: ConditionalPropertyCallback = ({document}) =>
  typeIdOf(document) === TYPE_IDS.postOffice

const VISIBILITY = [
  {title: 'Map Pin', value: 'pin'},
  {title: 'Attached to Location', value: 'attached'},
  {title: 'Hidden', value: 'hidden'},
]
// Pins saved before Map Visibility existed count as Map Pins.
const visibilityOf = (document: unknown) =>
  (document as {visibility?: string} | undefined)?.visibility ?? 'pin'
// X/Y are only used by Map Pins and Post Offices; Attached pins sit at their Hub.
const needsPosition = (document: unknown) =>
  typeIdOf(document) === TYPE_IDS.postOffice || visibilityOf(document) === 'pin'
const positionRule = (max: number) => (rule: NumberRule) =>
  rule
    .integer()
    .min(0)
    .max(max)
    .custom((value, context) =>
      value === undefined && needsPosition(context.document) ? 'Map Pins need a position.' : true,
    )

export const pin = defineType({
  name: 'pin',
  title: 'Pin',
  type: 'document',
  fieldsets: [
    {
      name: 'position',
      title: 'Map position',
      description: `Open ${MAP_URL}, click Locate, then click the spot and copy the numbers here. Not needed for pins attached to a Hub.`,
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
      type: 'reference',
      to: [{type: 'pinType'}],
      description: 'Add or rename types under Settings → Pin Types.',
      options: {disableNew: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'reference',
      to: [{type: 'location'}],
      description: 'The town or region. Optional. Add new ones under Locations.',
    }),
    defineField({
      name: 'visibility',
      title: 'Map Visibility',
      type: 'string',
      description:
        'Map Pin: its own marker. Attached to Location: shown only inside its Location\'s Hub. Hidden: kept off the map, but still public; keep secrets as unpublished drafts.',
      options: {list: VISIBILITY, layout: 'radio', direction: 'horizontal'},
      initialValue: 'pin',
      hidden: isPostOffice,
      validation: (rule) =>
        rule.custom(async (value, context) => {
          if (value !== 'attached') return true
          const locationId = (context.document?.location as {_ref?: string} | undefined)?._ref
          if (!locationId) return 'Attached pins need a Location: pick the Hub this belongs to.'
          // The map reads published data, so the published Location must be a Hub.
          const place = await context
            .getClient({apiVersion: API_VERSION})
            .withConfig({perspective: 'published'})
            .fetch<{name?: string; showAsHub?: boolean} | null>('*[_id == $id][0]{name, showAsHub}', {
              id: locationId,
            })
          return place?.showAsHub
            ? true
            : `${place?.name ?? 'This Location'} isn't a Hub yet. Turn on "Show as Hub" on it and publish it, or choose Map Pin.`
        }),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'reference',
      to: [{type: 'pinStatus'}],
      description: 'Only statuses for this pin\'s type are listed. Manage them under Settings → Statuses.',
      hidden: (context) => !typeIdOf(context.document) || Boolean(isPostOffice(context)),
      options: {
        disableNew: true,
        filter: ({document}) => ({
          filter: 'pinType._ref == $typeId',
          params: {typeId: typeIdOf(document) ?? ''},
        }),
      },
      validation: (rule) =>
        rule.custom(async (value, context) => {
          if (!value?._ref) return true
          const statusType = await context
            .getClient({apiVersion: API_VERSION})
            .withConfig({perspective: 'raw'})
            .fetch<string | null>(
              'coalesce(*[_id == "drafts." + $id][0], *[_id == $id][0]).pinType._ref',
              {id: value._ref},
            )
          return statusType === typeIdOf(context.document)
            ? true
            : 'This status belongs to a different type. Pick one of this type\'s statuses.'
        }),
    }),
    defineField({
      name: 'rank',
      title: 'Rank',
      type: 'reference',
      to: [{type: 'rank'}],
      hidden: notMember,
      validation: (rule) =>
        rule.custom((value, context) =>
          typeIdOf(context.document) === TYPE_IDS.member && !value ? 'Members need a rank.' : true,
        ),
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
          const id = publishedId(document._id)
          return {
            filter: 'type._ref in [$member, $safehouse] && !(_id in [$id, $draftId])',
            params: {
              member: TYPE_IDS.member,
              safehouse: TYPE_IDS.safehouse,
              id,
              draftId: `drafts.${id}`,
            },
          }
        },
      },
    }),
    defineField({
      name: 'x',
      title: 'X',
      type: 'number',
      fieldset: 'position',
      hidden: ({document}) => !needsPosition(document),
      validation: positionRule(8192),
    }),
    defineField({
      name: 'y',
      title: 'Y',
      type: 'number',
      fieldset: 'position',
      hidden: ({document}) => !needsPosition(document),
      validation: positionRule(5837),
    }),
    defineField({
      name: 'icon',
      title: 'Icon override',
      type: 'image',
      description: "Optional. Replaces the rank or type icon, for this pin only.",
      hidden: isPostOffice,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 6,
      description: 'Leave a blank line between paragraphs.',
      hidden: isPostOffice,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      typeId: 'type._ref',
      typeTitle: 'type.title',
      typeIcon: 'type.icon',
      location: 'location.name',
      statusTitle: 'status.title',
      statusStyle: 'status.style',
      rankTitle: 'rank.title',
      rankIcon: 'rank.icon',
      icon: 'icon',
      visibility: 'visibility',
    },
    prepare({title, typeId, typeTitle, typeIcon, location, statusTitle, statusStyle, rankTitle, rankIcon, icon, visibility}) {
      const isMember = typeId === TYPE_IDS.member
      const label = isMember && rankTitle ? `${typeTitle} (${rankTitle})` : typeTitle
      // Only call out statuses that change how the pin looks, e.g. "Compromised".
      const status = statusStyle && statusStyle !== 'normal' ? statusTitle : undefined
      const where = visibility === 'attached' ? `in ${location ?? '?'} hub` : location
      return {
        title,
        subtitle: [label, status, where, visibility === 'hidden' && 'Hidden'].filter(Boolean).join(' · '),
        media: icon?.asset ? icon : isMember && rankIcon?.asset ? rankIcon : typeIcon,
      }
    },
  },
})
