import {defineConfig, type InitialValueResolverContext} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {withPartyTrail} from './actions/partyTrail'
import {schemaTypes} from './schemaTypes'
import {API_VERSION, FIXED_TYPE_IDS, randomKey} from './schemaTypes/ids'
import {structure} from './structure'

// Kept out of the global Create menu: the per-type lists in structure.ts and a Location's
// "Add … here" buttons pass their parameters, and Campaign Settings is a single record.
const HIDDEN_TEMPLATES = ['pin-by-type', 'pin-at-location', 'status-by-type', 'campaign']

// A new pin of a type starts with that type's first status, and a Details row for each of
// the type's suggested details.
async function newPinOfType(typeId: string, {getClient}: InitialValueResolverContext) {
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
    ...(suggested?.length ? {details: suggested.map((label) => ({_key: randomKey(), _type: 'detail', label}))} : {}),
  }
}

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
        value: ({typeId}: {typeId: string}, context: InitialValueResolverContext) => newPinOfType(typeId, context),
      },
      {
        // From a Location's "Add … here" buttons: the same, with the Location filled in.
        id: 'pin-at-location',
        title: 'Pin here',
        schemaType: 'pin',
        parameters: [
          {name: 'typeId', type: 'string'},
          {name: 'locationId', type: 'string'},
        ],
        value: async (
          {typeId, locationId}: {typeId: string; locationId: string},
          context: InitialValueResolverContext,
        ) => ({
          ...(await newPinOfType(typeId, context)),
          location: {_type: 'reference', _ref: locationId},
        }),
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
        ? prev.filter((item) => !HIDDEN_TEMPLATES.includes(item.templateId))
        : prev,
    actions: (prev, {schemaType, documentId, getClient}) => {
      // The map's code relies on these Pin Types, so they can be renamed but not removed.
      // Campaign Settings is a single fixed record.
      if (
        (schemaType === 'pinType' && documentId && FIXED_TYPE_IDS.includes(documentId)) ||
        schemaType === 'campaign'
      ) {
        return prev.filter(({action}) => action !== 'delete' && action !== 'unpublish' && action !== 'duplicate')
      }
      // Moving the party pin adds its old spot to the party's trail.
      if (schemaType === 'pin') {
        const client = getClient({apiVersion: API_VERSION})
        return prev.map((action) => (action.action === 'publish' ? withPartyTrail(action, client) : action))
      }
      return prev
    },
  },
})
