import {defineField, defineType, type ConditionalPropertyCallback, type NumberRule} from 'sanity'
import {connectionsField} from './connection'
import {MapPicker} from '../components/MapPicker'
import {detailsField} from './details'
import {mentionWarning, overlapWarning, routeWarning} from './warnings'
import {PortShipsField} from '../components/PortShipsField'
import {API_VERSION, TYPE_IDS, publishedId, typeIdOf} from './ids'

const MAP_URL = 'https://www.msbivens.com/one-for-all'

// Hides a field unless the pin is of the given type (for the type-specific fields).
const onlyFor =
  (typeId: string): ConditionalPropertyCallback =>
  ({document}) =>
    typeIdOf(document) !== typeId
const notMember = onlyFor(TYPE_IDS.member)
// Soul Items and Death Sites both belong to a party member.
const hasPartyMember = (document: unknown) =>
  typeIdOf(document) === TYPE_IDS.soulItem || typeIdOf(document) === TYPE_IDS.deathSite
// Post Offices are only waypoints for communication lines, so they just need a name and a spot.
const isPostOffice: ConditionalPropertyCallback = ({document}) =>
  typeIdOf(document) === TYPE_IDS.postOffice

const ATTITUDES = [
  {title: 'Friendly', value: 'friendly'},
  {title: 'Neutral', value: 'neutral'},
  {title: 'Hostile', value: 'hostile'},
  {title: 'Unknown', value: 'unknown'},
]

type PinDoc = {x?: number; y?: number; showOnMap?: boolean; location?: {_ref?: string}}

// Pins on the map (and every Post Office, since lines bend through them) need a spot: their
// own X/Y, or their Location's position when they have none.
const needsPosition = (document: unknown) =>
  typeIdOf(document) === TYPE_IDS.postOffice || (document as PinDoc | undefined)?.showOnMap !== false

// X and Y go together. The "needs a position" check only runs on X, so it's shown once.
const positionRule = (max: number, axis: 'x' | 'y') => (rule: NumberRule) =>
  rule
    .integer()
    .min(0)
    .max(max)
    .custom(async (value, context) => {
      const doc = context.document as PinDoc | undefined
      const other = doc?.[axis === 'x' ? 'y' : 'x']
      if (value === undefined && other !== undefined) return 'Fill in both X and Y, or leave both empty.'
      if (axis === 'y' || value !== undefined || !needsPosition(doc)) return true
      const locationId = doc?.location?._ref
      if (!locationId) return 'Needs a position: fill in X and Y, or pick a Location that has one.'
      // The map reads published data, so the published Location must have a position.
      const place = await context
        .getClient({apiVersion: API_VERSION})
        .withConfig({perspective: 'published'})
        .fetch<{name?: string; x?: number; y?: number} | null>('*[_id == $id][0]{name, x, y}', {id: locationId})
      const name = place?.name ?? 'This Location'
      return place && place.x !== undefined && place.y !== undefined
        ? true
        : `${name} has no map position (or isn't published). Fill in X and Y here, or give ${name} a position.`
    })

export const pin = defineType({
  name: 'pin',
  title: 'Pin',
  type: 'document',
  fieldsets: [
    {
      name: 'position',
      title: 'Own position',
      description: `Leave empty to use the Location's position. Fill in for a spot outside town, e.g. a dungeon in the hills: open ${MAP_URL}, click Locate, then click the spot and copy the numbers here.`,
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
      description:
        "The town, region or place it's at. The pin sits at the Location's position unless it has its own. Add new ones under Locations.",
    }),
    defineField({
      name: 'showOnMap',
      title: 'Show on map',
      type: 'boolean',
      description:
        "Untick to keep it off the map. It's still public, so keep secrets as unpublished drafts instead.",
      initialValue: true,
      hidden: isPostOffice,
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
      name: 'recruitedBy',
      title: 'Recruited By',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'partyMember'}], options: {disableNew: true}}],
      description: 'The party members who brought them into the OFA. Add them under Party Members.',
      hidden: notMember,
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'partyMember',
      title: 'Party member',
      type: 'reference',
      to: [{type: 'partyMember'}],
      description: 'Whose Soul Item this is (each party member has one), or who died here.',
      hidden: ({document}) => !hasPartyMember(document),
      options: {disableNew: true},
      validation: (rule) =>
        rule.custom(async (value, context) => {
          if (!hasPartyMember(context.document)) return true
          if (!value?._ref) return 'Pick the party member.'
          // A character can die (and be raised) more than once, so only Soul Items are one each.
          if (typeIdOf(context.document) !== TYPE_IDS.soulItem) return true
          const id = publishedId(context.document?._id ?? '')
          const other = await context
            .getClient({apiVersion: API_VERSION})
            .withConfig({perspective: 'raw'})
            .fetch<string | null>(
              '*[_type == "pin" && type._ref == $type && partyMember._ref == $member && !(_id in [$id, $draftId])][0].name',
              {type: TYPE_IDS.soulItem, member: value._ref, id, draftId: `drafts.${id}`},
            )
          return other ? `This party member already has a Soul Item: ${other}.` : true
        }),
    }),
    defineField({
      name: 'attitude',
      title: 'Attitude',
      type: 'string',
      description: 'How they feel about the party.',
      options: {list: ATTITUDES, layout: 'radio', direction: 'horizontal'},
      hidden: onlyFor(TYPE_IDS.npc),
    }),
    defineField({
      name: 'questGiver',
      title: 'Quest giver',
      type: 'reference',
      to: [{type: 'pin'}],
      description: 'The NPC or member who gave this quest.',
      hidden: onlyFor(TYPE_IDS.quest),
      options: {
        filter: 'type._ref in [$npc, $member]',
        filterParams: {npc: TYPE_IDS.npc, member: TYPE_IDS.member},
      },
    }),
    defineField({
      name: 'captain',
      title: 'Captain',
      type: 'reference',
      to: [{type: 'pin'}],
      description: 'The NPC, member or enemy who commands this ship. Optional.',
      hidden: onlyFor(TYPE_IDS.ship),
      options: {
        disableNew: true,
        filter: 'type._ref in [$npc, $member, $enemy]',
        filterParams: {npc: TYPE_IDS.npc, member: TYPE_IDS.member, enemy: TYPE_IDS.enemy},
      },
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'array',
      description:
        'The ports this ship usually calls at, in order. Drag to reorder. A port can appear more than once. Add ports under Pins → Ports.',
      hidden: onlyFor(TYPE_IDS.ship),
      of: [
        {
          type: 'reference',
          to: [{type: 'pin'}],
          options: {disableNew: true, filter: 'type._ref == $port', filterParams: {port: TYPE_IDS.port}},
        },
      ],
      validation: routeWarning,
    }),
    defineField({
      name: 'roundTrip',
      title: 'Returns to the first port',
      type: 'boolean',
      description: 'Tick if the ship sails back to its first port and starts the route again.',
      hidden: ({document}) =>
        typeIdOf(document) !== TYPE_IDS.ship || ((document as {route?: unknown[]})?.route?.length ?? 0) < 2,
    }),
    // Nothing is stored here; the field lists the ships whose route includes this port.
    defineField({
      name: 'shipsHere',
      title: 'Ships calling here',
      type: 'string',
      readOnly: true,
      hidden: onlyFor(TYPE_IDS.port),
      components: {input: PortShipsField},
    }),
    defineField({
      name: 'x',
      title: 'X',
      type: 'number',
      fieldset: 'position',
      validation: (rule) => [positionRule(4763, 'x')(rule), overlapWarning(rule)],
    }),
    defineField({
      name: 'y',
      title: 'Y',
      type: 'number',
      fieldset: 'position',
      validation: positionRule(3185, 'y'),
    }),
    defineField({
      name: 'mapPicker',
      title: 'Place on map',
      type: 'string',
      description: 'Click the map to fill in X and Y.',
      components: {input: MapPicker},
    }),
    defineField({
      name: 'icon',
      title: 'Icon override',
      type: 'image',
      description: "Optional. Replaces the rank or type icon, for this pin only.",
      hidden: isPostOffice,
    }),
    detailsField({
      description:
        "Short facts shown as rows in the pop-up, e.g. Reward: 500 gp. New pins start with their type's suggested rows; empty rows are left out.",
      hidden: isPostOffice,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 6,
      description: 'Leave a blank line between paragraphs.',
      hidden: isPostOffice,
      validation: mentionWarning,
    }),
    connectionsField(isPostOffice),
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
      showOnMap: 'showOnMap',
      owner: 'partyMember.name',
      attitude: 'attitude',
      captain: 'captain.name',
    },
    prepare({title, typeId, typeTitle, typeIcon, location, statusTitle, statusStyle, rankTitle, rankIcon, icon, showOnMap, owner, attitude, captain}) {
      const isMember = typeId === TYPE_IDS.member
      // e.g. "Member (Hand)", "Soul Item (Caelmorn)", "NPC (Hostile)", "Ship (Captain Vex)"
      const extra =
        (isMember && rankTitle) ||
        ((typeId === TYPE_IDS.soulItem || typeId === TYPE_IDS.deathSite) && owner) ||
        (typeId === TYPE_IDS.ship && captain) ||
        (typeId === TYPE_IDS.npc && ATTITUDES.find((a) => a.value === attitude)?.title)
      const label = extra ? `${typeTitle} (${extra})` : typeTitle
      // Only call out statuses that change how the pin looks, e.g. "Compromised".
      const status = statusStyle && statusStyle !== 'normal' ? statusTitle : undefined
      const offMap = showOnMap === false && typeId !== TYPE_IDS.postOffice
      return {
        title,
        subtitle: [label, status, location, offMap && 'Off map'].filter(Boolean).join(' · '),
        media: icon?.asset ? icon : isMember && rankIcon?.asset ? rankIcon : typeIcon,
      }
    },
  },
})
