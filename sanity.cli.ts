/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

// Without these the hosted Studio builds fine but crashes on load, so stop
// the build instead.
if (!projectId || !dataset) {
  throw new Error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET before building the Studio',
  )
}

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'ph-film-media-2',
  deployment: { appId: 't4d8ivvbt1c2v8z09iebupyl' },
  // The Studio is built with Vite, which would otherwise auto-discover the
  // root postcss.config.mjs (Tailwind v4) and fail to load it. The Studio has
  // its own styling and needs no PostCSS plugins, so pass an empty inline
  // config to stop Vite searching the filesystem.
  //
  // The shared config in src/sanity/env.ts reads NEXT_PUBLIC_* variables, which
  // Vite doesn't expose (only SANITY_STUDIO_*), so inline them for the hosted
  // Studio build.
  vite: (config) => ({
    ...config,
    css: { ...config.css, postcss: {} },
    define: {
      ...config.define,
      ...Object.fromEntries(
        [
          'NEXT_PUBLIC_SANITY_PROJECT_ID',
          'NEXT_PUBLIC_SANITY_DATASET',
          'NEXT_PUBLIC_SANITY_API_VERSION',
          'NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_URL',
        ]
          .filter((name) => process.env[name] !== undefined)
          .map((name) => [
            `process.env.${name}`,
            JSON.stringify(process.env[name]),
          ]),
      ),
    },
  }),
})
