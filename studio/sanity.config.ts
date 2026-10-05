import {defineConfig, type InitialValueResolverContext} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {API_VERSION, FIXED_TYPE_IDS, randomKey} from './schemaTypes/ids'
import {structure} from './structure'

// Used by the per-type lists in structure.ts; they need a type, so they're kept out of
// the global Create menu.
const LIST_TEMPLATES = ['pin-by-type', 'status-by-type']

export default defineConfig({
  name: 'default',
  title: 'Personal Site',

  projectId: 'ohnkcmr7',
  // `npm run dev` uses the test copy (see .env.development); the hosted Studio uses production.
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'pin-by-type',
        title: 'Pin',
        schemaType: 'pin',
        parameters: [{name: 'typeId', type: 'string'}],
        // A new pin starts with the list's type, that type's first status, and a Details
        // row for each of the type's suggested details.
        value: async ({typeId}: {typeId: string}, {getClient}: InitialValueResolverContext) => {
          const {firstStatus, suggested} = await getClient({apiVersion: API_VERSION}).fetch<{
            firstStatus: string | null
            suggested: string[] | null
          }>(
            `{
              "firstStatus": *[_type == "pinStatus" && pinType._ref == $typeId] | order(order asc)[0]._id,
              "suggested": *[_id == $typeId][0].suggestedDetails
            }`,
            {typeId},
          )
          return {
            type: {_type: 'reference', _ref: typeId},
            ...(firstStatus ? {status: {_type: 'reference', _ref: firstStatus}} : {}),
            ...(suggested?.length
              ? {details: suggested.map((label) => ({_key: randomKey(), _type: 'detail', label}))}
              : {}),
          }
        },
      },
      {
        id: 'status-by-type',
        title: 'Status',
        schemaType: 'pinStatus',
        parameters: [{name: 'typeId', type: 'string'}],
        value: ({typeId}: {typeId: string}) => ({
          pinType: {_type: 'reference', _ref: typeId},
          style: 'normal',
        }),
      },
    ],
  },

  document: {
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !LIST_TEMPLATES.includes(item.templateId))
        : prev,
    // The map's code relies on these Pin Types, so they can be renamed but not removed.
    actions: (prev, {schemaType, documentId}) =>
      schemaType === 'pinType' && documentId && FIXED_TYPE_IDS.includes(documentId)
        ? prev.filter(({action}) => action !== 'delete' && action !== 'unpublish')
        : prev,
  },
})
