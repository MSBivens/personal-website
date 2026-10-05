import type {StructureResolver} from 'sanity/structure'
import {PIN_TYPES} from './schemaTypes/pin'

// One list per pin type, so "Create" inside Members starts a pin that's already a Member.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('One For All')
    .items([
      ...PIN_TYPES.map(({plural, value}) =>
        S.listItem()
          .id(value)
          .title(plural)
          .schemaType('pin')
          .child(
            S.documentList()
              .id(value)
              .title(plural)
              .schemaType('pin')
              .apiVersion('2025-02-19')
              .filter('_type == "pin" && type == $pinType')
              .params({pinType: value})
              .defaultOrdering([{field: 'name', direction: 'asc'}])
              .initialValueTemplates([S.initialValueTemplateItem(`pin-${value}`)]),
          ),
      ),
      S.documentTypeListItem('pin').title('All pins'),
      S.divider(),
      S.documentTypeListItem('rank').title('Ranks'),
    ])
