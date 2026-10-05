import {defineField, defineType} from 'sanity'

// The player characters. They don't have map pins; other records link to them
// (a Member's Recruited By, a Soul Item's owner).
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
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', subtitle: 'playerName'},
  },
})
