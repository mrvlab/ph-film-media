import type {
  StructureBuilder,
  StructureResolver,
  StructureResolverContext,
} from 'sanity/structure';
import { BasketIcon } from '@sanity/icons/Basket';
import { CloseCircleIcon } from '@sanity/icons/CloseCircle';
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle';
import { ClockIcon } from '@sanity/icons/Clock';
import { UsersIcon } from '@sanity/icons/Users';

import { apiVersion } from './env';

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

// A membership lapses when its season ends (30 June / 31 December), so these
// lists re-sort themselves at each season change with no job flipping statuses.
const MEMBER_LISTS = [
  {
    id: 'members-current',
    title: 'Paid this season',
    icon: CheckmarkCircleIcon,
    filter: '_type == "member" && status == "active" && validUntil >= now()',
  },
  {
    id: 'members-expired',
    title: 'Expired (needs renewal)',
    icon: ClockIcon,
    filter:
      '_type == "member" && status == "active" && (!defined(validUntil) || validUntil < now())',
  },
  {
    id: 'members-disabled',
    title: 'Disabled',
    icon: CloseCircleIcon,
    filter: '_type == "member" && status == "disabled"',
  },
];

const ALL_MEMBERS_FILTER = '_type == "member"';

// Published members only, so an open draft doesn't count someone twice.
const countQuery = `{${[
  { id: 'all', filter: ALL_MEMBERS_FILTER },
  ...MEMBER_LISTS,
]
  .map(
    ({ id, filter }) =>
      `"${id}": count(*[${filter} && !(_id in path("drafts.**"))])`,
  )
  .join(', ')}}`;

const withCount = (title: string, count: number | undefined) =>
  count == null ? title : `${title} (${count})`;

// Counts are fetched each time the Members folder opens.
const membersListItem = (S: StructureBuilder, context: StructureResolverContext) =>
  S.listItem()
    .title('Members')
    .icon(UsersIcon)
    .child(async () => {
      const counts = await context
        .getClient({ apiVersion })
        .fetch<Record<string, number>>(countQuery)
        .catch(() => ({}) as Record<string, number>);
      return S.list()
        .title('Members')
        .items([
          S.documentTypeListItem('member').title(
            withCount('All members', counts.all),
          ),
          S.divider(),
          ...MEMBER_LISTS.map(({ id, title, icon, filter }) =>
            S.listItem()
              .id(id)
              .title(withCount(title, counts[id]))
              .icon(icon)
              .child(
                S.documentList()
                  .id(id)
                  .title(title)
                  .schemaType('member')
                  .filter(filter)
                  .defaultOrdering([{ field: 'validUntil', direction: 'desc' }]),
              ),
          ),
        ]);
    });

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('PH Film & Media 2.0')
    .items([
      // Pages
      S.documentTypeListItem('page').title('Pages'),

      S.divider(),
      // Members — Filmklubben members (their own top-level section)
      membersListItem(S, context),

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
