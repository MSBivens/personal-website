import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {PIN_TYPES} from './schemaTypes/pin'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Personal Site',

  projectId: 'ohnkcmr7',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    // "New Member", "New Enemy", ... with the type already filled in.
    templates: (prev) => [
      ...prev,
      ...PIN_TYPES.map(({title, value}) => ({
        id: `pin-${value}`,
        title,
        schemaType: 'pin',
        value: value === 'member' ? {type: value, status: 'active'} : {type: value},
      })),
    ],
  },
})
