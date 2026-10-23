import {defineField, defineType} from 'sanity'
import {DeathSitesField} from '../components/DeathSitesField'
import {SoulItemField} from '../components/SoulItemField'

export const PARTY_STATUSES = [
  {title: 'Alive', value: 'alive'},
  {title: 'Away', value: 'away'},
  {title: 'Dead', value: 'dead'},
]

// The player characters. They don't have map pins; other records link to them (a Member's
// Recruited By, a Soul Item's or Death Site's Party member). The map lists them on the party
// pin's panel, by status.
export const partyMember = defineType({
  name: 'partyMember',
  title: 'Party Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      description: 'Away: not with the party right now. Dead: add a Death Site pin where they fell.',
      options: {list: PARTY_STATUSES, layout: 'radio', direction: 'horizontal'},
      initialValue: 'alive',
    }),
    defineField({
      name: 'playerName',
      title: 'Player name',
      type: 'string',
      description: 'Who plays this character. Optional.',
    }),
    // Nothing is stored here; the field just displays the Soul Item that links to this character.
    defineField({
      name: 'soulItem',
      title: 'Soul Item',
      type: 'string',
      description: 'Set on the Soul Item itself, in its Party member field.',
      readOnly: true,
      components: {input: SoulItemField},
    }),
    // Nothing is stored here either; it lists the Death Site pins that point at this character.
    defineField({
      name: 'deathSites',
      title: 'Death sites',
      type: 'string',
      description: 'Add one with a Death Site pin, choosing this party member.',
      readOnly: true,
      components: {input: DeathSitesField},
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', playerName: 'playerName', status: 'status'},
    prepare: ({title, playerName, status}) => ({
      title,
      // "Player · Away"; Alive isn't worth saying.
      subtitle: [playerName, status && status !== 'alive' && PARTY_STATUSES.find((s) => s.value === status)?.title]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
