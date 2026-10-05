import type {StructureResolver} from 'sanity/structure'
import {API_VERSION} from './schemaTypes/ids'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // One list per Pin Type, read from the Pin Type records, so a type added in Studio
      // shows up here without code. "Create" inside a list starts a pin of that type.
      S.listItem()
        .id('pins')
        .title('Pins')
        .schemaType('pin')
        .child(async () => {
          const types = await context
            .getClient({apiVersion: API_VERSION})
            .fetch<{_id: string; plural: string}[]>(
              '*[_type == "pinType" && !(_id in path("drafts.**"))] | order(legendOrder asc){_id, plural}',
            )
          return S.list()
            .id('pins')
            .title('Pins')
            .items([
              S.documentTypeListItem('pin').title('All pins'),
              S.divider(),
              ...types.map(({_id, plural}) =>
                S.listItem()
                  .id(_id)
                  .title(plural)
                  .schemaType('pin')
                  .child(
                    S.documentList()
                      .id(_id)
                      .title(plural)
                      .schemaType('pin')
                      .apiVersion(API_VERSION)
                      .filter('_type == "pin" && type._ref == $typeId')
                      .params({typeId: _id})
                      .defaultOrdering([{field: 'name', direction: 'asc'}])
                      .initialValueTemplates([
                        S.initialValueTemplateItem('pin-by-type', {typeId: _id}),
                      ]),
                  ),
              ),
            ])
        }),
      S.documentTypeListItem('location').title('Locations'),
      S.documentTypeListItem('partyMember').title('Party Members'),
      S.divider(),
      S.listItem()
        .id('settings')
        .title('Settings')
        .child(
          S.list()
            .id('settings')
            .title('Settings')
            .items([
              S.documentTypeListItem('pinType').title('Pin Types'),
              S.listItem()
                .id('statuses')
                .title('Statuses')
                .schemaType('pinStatus')
                .child(
                  S.documentTypeList('pinType')
                    .title('Statuses by type')
                    .child((typeId) =>
                      S.documentList()
                        .id(`statuses-${typeId}`)
                        .title('Statuses')
                        .schemaType('pinStatus')
                        .apiVersion(API_VERSION)
                        .filter('_type == "pinStatus" && pinType._ref == $typeId')
                        .params({typeId})
                        .defaultOrdering([{field: 'order', direction: 'asc'}])
                        .initialValueTemplates([
                          S.initialValueTemplateItem('status-by-type', {typeId}),
                        ]),
                    ),
                ),
              S.documentTypeListItem('rank').title('Ranks'),
              S.documentTypeListItem('relationshipType').title('Relationship Types'),
            ]),
        ),
    ])
