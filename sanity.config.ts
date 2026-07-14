'use client';

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { media } from 'sanity-plugin-media';

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId, studioUrl } from './src/sanity/env';
import { schema } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { resolve } from './src/sanity/presentation/resolve';
import { createResyncStockAction } from './src/sanity/actions/resyncStockAction';

// Created once so the action identity is stable across Studio renders.
const resyncTicketStock = createResyncStockAction('ticket');
const resyncProductStock = createResyncStockAction('product');

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    // Manual "Resync stock from Stripe" on tickets/products (stock also stays
    // current via the webhook + nightly cron).
    actions: (prev, context) => {
      if (context.schemaType === 'ticket') return [...prev, resyncTicketStock];
      if (context.schemaType === 'product') return [...prev, resyncProductStock];
      return prev;
    },
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      previewUrl: {
        origin: studioUrl || 'http://localhost:3000',
        preview: '/',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
    media(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
