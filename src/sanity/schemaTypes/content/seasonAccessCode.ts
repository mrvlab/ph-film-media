import { LockIcon } from '@sanity/icons/Lock';
import { defineField, defineType } from 'sanity';

import {
  nextSeason,
  seasonEnd,
  seasonLabel,
  seasonOf,
  seasonRange,
} from '@/lib/members/seasons';

// Seasons an editor can pick: from the first online season up to a year ahead.
const FIRST_SEASON = '2025-H1';

const seasonOptions = () =>
  seasonRange(FIRST_SEASON, nextSeason(nextSeason(seasonOf())))
    .reverse()
    .map((season) => ({ title: `Säsong ${seasonLabel(season)}`, value: season }));

// A season code is history once its season has ended, so it's locked against
// edits (and delete/unpublish, see sanity.config.ts).
export function isPastSeasonCode(
  doc: Record<string, unknown> | null | undefined,
): boolean {
  return (
    !!doc &&
    doc.scope !== 'screening' &&
    typeof doc.season === 'string' &&
    seasonEnd(doc.season) < new Date().toISOString()
  );
}

export const seasonAccessCode = defineType({
  name: 'seasonAccessCode',
  title: 'Access codes',
  type: 'document',
  icon: LockIcon,
  readOnly: ({ document }) => isPastSeasonCode(document),
  fields: [
    defineField({
      name: 'scope',
      title: 'Used for',
      type: 'string',
      options: {
        list: [
          { title: 'Season', value: 'season' },
          { title: 'Single screening', value: 'screening' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'season',
      description:
        'A screening code is picked by hand on a ticket and replaces the season code there.',
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      options: { list: seasonOptions() },
      hidden: ({ document }) => document?.scope === 'screening',
      description:
        'Every screening in this season uses this code, based on its screening date.',
      validation: (Rule) =>
        Rule.custom(async (season, context) => {
          if (context.document?.scope === 'screening') return true;
          if (!season) return 'Pick a season.';
          const { getClient, document } = context;
          const client = getClient({ apiVersion: '2024-01-01' });
          const id = document?._id.replace(/^drafts\./, '');
          const count = await client.fetch<number>(
            `count(*[_type == "seasonAccessCode" && scope != "screening" && season == $season && !(_id in [$draft, $published])])`,
            { season, draft: `drafts.${id}`, published: id },
          );
          return count > 0 ? 'This season already has an access code.' : true;
        }),
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description:
        'Shared with members via the newsletter. Buyers enter it at checkout. Not case-sensitive.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Season (newest first)',
      name: 'seasonDesc',
      by: [{ field: 'season', direction: 'desc' }],
    },
  ],
  preview: {
    select: { scope: 'scope', season: 'season', code: 'code' },
    prepare({ scope, season, code }) {
      if (scope === 'screening' || !season) {
        return {
          title: code || 'Untitled code',
          subtitle: 'Single screening',
          media: LockIcon,
        };
      }
      const now = new Date().toISOString();
      const current = seasonOf();
      const state =
        season === current
          ? '🟢 Current'
          : seasonEnd(season) < now
            ? 'Past · Locked'
            : 'Upcoming';
      return {
        title: `Säsong ${seasonLabel(season)}`,
        subtitle: [code, state].filter(Boolean).join(' · '),
        media: LockIcon,
      };
    },
  },
});
