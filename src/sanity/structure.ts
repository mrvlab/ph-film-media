import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import { BasketIcon, UsersIcon } from '@sanity/icons';

// Schema imports

import * as content from './schemaTypes/content';
import * as singelton from './schemaTypes/singelton';

const contentSchemas = Object.values(content);
const singletonSchemas = Object.values(singelton);

// Document types that live together under the "Shop" sub-folder.
const SHOP_TYPES = ['ticket', 'product'];

const TOP_LEVEL_TYPES = ['member'];

const referenceSchemas = contentSchemas.filter(
  (schema) =>
    !SHOP_TYPES.includes(schema.name) && !TOP_LEVEL_TYPES.includes(schema.name),
);
const shopSchemas = contentSchemas.filter((schema) =>
  SHOP_TYPES.includes(schema.name),
);

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('PH Film & Media 2.0')
    .items([
      // Pages
      S.documentTypeListItem('page').title('Pages'),

      S.divider(),
      // Members — Filmklubben members (their own top-level section)
      S.documentTypeListItem('member').title('Members').icon(UsersIcon),

      // Content
      S.listItem()
        .title('Content (References)')
        .child(
          S.list()
            .title('Content (References)')
            .items([
              ...referenceSchemas.map((schema) =>
                S.documentTypeListItem(schema.name).title(
                  schema.title || schema.name,
                ),
              ),

              S.divider(),

              // Shop — tickets & products grouped together
              S.listItem()
                .title('Shop')
                .icon(BasketIcon)
                .child(
                  S.list()
                    .title('Shop')
                    .items(
                      shopSchemas.map((schema) =>
                        S.documentTypeListItem(schema.name).title(
                          schema.title || schema.name,
                        ),
                      ),
                    ),
                ),
            ]),
        ),

      S.divider(),

      // Global singletons
      ...singletonSchemas.map((schema) =>
        S.listItem()
          .title(schema.title || schema.name)
          .child(S.document().schemaType(schema.name).documentId(schema.name))
          .icon(schema.icon || undefined),
      ),
    ]);
