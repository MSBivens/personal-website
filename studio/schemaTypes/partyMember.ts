import {defineField, defineType} from 'sanity'
import {SoulItemField} from '../components/SoulItemField'

// The player characters. They don't have map pins; other records link to them
// (a Member's Recruited By, a Soul Item's Party member).
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
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', subtitle: 'playerName'},
  },
})
