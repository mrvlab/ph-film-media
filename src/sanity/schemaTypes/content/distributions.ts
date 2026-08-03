import { PlayIcon } from '@sanity/icons/Play';
import { InlineElementIcon } from '@sanity/icons/InlineElement';
import { defineField, defineType } from 'sanity';

export const distributions = defineType({
  name: 'distributions',
  title: 'Distributions',
  type: 'document',
  icon: InlineElementIcon,
  groups: [
    {
      name: 'text',
      title: 'Text',
    },
    {
      name: 'buttons',
      title: 'Buttons',
    },
    {
      name: 'media',
      title: 'Media (Bilder)',
    },
  ],
  fields: [
    // ----- Text -----
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'text',
      validation: (Rule) => Rule.required().error('Title is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'text',
      options: { source: 'title' },
      validation: (Rule) => Rule.required().error('Slug is required.'),
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date (Premiär)',
      description: 'The release date of the movie.',
      type: 'date',
      group: 'text',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'richText',
      group: 'text',
    }),

    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      group: 'text',
      initialValue: 'minuter',
    }),

    defineField({
      name: 'languages',
      title: 'Languages',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'languages' }] }],
      group: 'text',
    }),

    defineField({
      name: 'directors',
      title: 'Directors (Regissörer)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'directors' }] }],
      group: 'text',
    }),
    defineField({
      name: 'writers',
      title: 'Writers (Skribenter)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'writers' }] }],
      group: 'text',
    }),
    defineField({
      name: 'actors',
      title: 'Actors (Medverkande)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'actors' }] }],
      group: 'text',
    }),
    // ----- Buttons -----
    defineField({
      name: 'ticket',
      title: 'Ticket',
      type: 'ticketType',
      group: 'buttons',
    }),
    defineField({
      name: 'button',
      title: 'Button',
      type: 'buttonType',
      group: 'buttons',
    }),
    // ----- Media -----
    defineField({
      name: 'trailer',
      title: 'Trailer',
      type: 'trailerType',
      group: 'media',
    }),
    defineField({
      name: 'movieBanner',
      title: 'Movie Banner',
      type: 'mediaType',
      group: 'media',
    }),
    defineField({
      name: 'moviePoster',
      title: 'Movie Poster',
      type: 'mediaType',
      group: 'media',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      updatedAt: '_updatedAt',
      moviePoster: 'moviePoster.media',
      movieBanner: 'movieBanner.media',
    },
    prepare({ title, updatedAt, moviePoster, movieBanner }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Movie',
        subtitle: `Last edited: ${formattedDate}`,
        media: moviePoster ? moviePoster : movieBanner ? movieBanner : PlayIcon,
      };
    },
  },
});
