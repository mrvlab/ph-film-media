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
import { MarkExistingMemberAction } from './src/sanity/actions/markExistingMember';
import { lockAction } from './src/sanity/actions/lockActions';
import { isPastSeasonCode } from './src/sanity/schemaTypes/content/seasonAccessCode';
import { isPastScreening } from './src/lib/tickets/isPastScreening';

const LOCKS: Record<
  string,
  { isLocked: (doc: Record<string, unknown> | null) => boolean; reason: string }
> = {
  seasonAccessCode: {
    isLocked: isPastSeasonCode,
    reason: 'Past season codes are kept as history.',
  },
  ticket: {
    isLocked: isPastScreening,
    reason: 'Past screenings are kept as sales history.',
  },
};

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    // Add the "Mark as existing member" action to member documents only, and
    // keep past season access codes and past screenings from being deleted or
    // unpublished: they're the record of what was used and sold.
    actions: (prev, context) => {
      if (context.schemaType === 'member') {
        return [...prev, MarkExistingMemberAction];
      }
      const lock = LOCKS[context.schemaType];
      if (!lock) return prev;
      return prev.map((action) =>
        action.action === 'delete' || action.action === 'unpublish'
          ? lockAction(action, lock.isLocked, lock.reason)
          : action,
      );
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
