import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ohnkcmr7',
    dataset: 'production'
  },
  deployment: {
    // Hosted at https://mikeybivs.sanity.studio
    appId: 'xifyhtq5dp2c3rin2kh8hty2',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
