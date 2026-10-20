import {defineArrayMember, defineField, type ConditionalProperty} from 'sanity'

// Short label/value facts shown as rows in a pop-up or Location panel. Shared by pins and
// Locations; empty rows are left out on the map.
export const detailsField = ({description, hidden}: {description: string; hidden?: ConditionalProperty}) =>
  defineField({
    name: 'details',
    title: 'Details',
    type: 'array',
    description,
    hidden,
    of: [
      defineArrayMember({
        name: 'detail',
        title: 'Detail',
        type: 'object',
        fields: [
          defineField({
            name: 'label',
            title: 'Label',
            type: 'string',
            validation: (rule) => rule.required(),
          }),
          defineField({name: 'value', title: 'Value', type: 'text', rows: 2}),
        ],
        preview: {select: {title: 'label', subtitle: 'value'}},
      }),
    ],
  })
