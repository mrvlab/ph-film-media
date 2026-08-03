/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({
  api: { projectId, dataset },
  // The Studio is built with Vite, which would otherwise auto-discover the
  // root postcss.config.mjs (Tailwind v4) and fail to load it. The Studio has
  // its own styling and needs no PostCSS plugins, so pass an empty inline
  // config to stop Vite searching the filesystem.
  vite: (config) => ({
    ...config,
    css: { ...config.css, postcss: {} },
  }),
})
