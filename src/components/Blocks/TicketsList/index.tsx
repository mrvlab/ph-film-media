import Image from 'next/image';

import { urlFor } from '@/sanity/lib/image';
import type {
  FetchHomeResult,
  FetchPageResult,
} from '../../../../sanity.types';
import { BuyTicketButton } from './BuyTicketButton';

export type ITicketsListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'ticketsList' }
>;

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Stockholm',
});

const TicketsList = (block: ITicketsListBlock) => {
  if (block._type !== 'ticketsList') return null;

  const tickets = block.tickets ?? [];
  if (tickets.length === 0) return null;

  return (
    <section
      key={block._key || 'ticketsList'}
      className='page-x-spacing space-y-6 lg:space-y-10 mb-2'
    >
      {block.heading ? (
        <h2 className='text-h-28 lg:text-h-37'>{block.heading}</h2>
      ) : null}

      <ul className='grid gap-4 lg:gap-6'>
        {tickets.map((ticket) => {
          if (!ticket || !('_id' in ticket) || !('title' in ticket))
            return null;

          const sold = ticket.seatsSold ?? 0;
          const total = ticket.totalSeats ?? 0;
          const soldOut = total > 0 && sold >= total;
          const when = ticket.date
            ? dateFormatter.format(new Date(ticket.date))
            : null;
          const venueTitle = ticket.venue?.trim() || null;
          const posterMedia = ticket.poster?.media?.asset
            ? ticket.poster.media
            : null;
          const bannerMedia = ticket.banner?.media?.asset
            ? ticket.banner.media
            : posterMedia;
          const posterUrl = posterMedia
            ? urlFor(posterMedia).width(1200).fit('max').url()
            : null;
          const bannerUrl = bannerMedia
            ? urlFor(bannerMedia).width(1600).fit('max').url()
            : null;
          const posterAlt = posterMedia?.alt ?? ticket.title ?? '';
          const bannerAlt = bannerMedia?.alt ?? ticket.title ?? '';

          return (
            <li
              key={ticket._id}
              className='flex flex-col p-2.5 overflow-hidden rounded-lg bg-dark-gray lg:flex-row lg:items-stretch'
            >
              {/* Mobile: poster (portrait) */}
              <div className='relative aspect-3/4 bg-black/30 lg:hidden'>
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={posterAlt}
                    fill
                    sizes='100vw'
                    className='object-cover rounded-sm'
                  />
                ) : (
                  <div className='absolute inset-0 grid place-items-center text-white/40 text-h-12 uppercase tracking-[0.12em]'>
                    Ingen poster
                  </div>
                )}
              </div>

              {/* Desktop: banner (landscape, falls back to poster) */}
              <div className='relative hidden bg-black/30 lg:order-2 lg:block lg:aspect-[16/9] lg:w-2/3 lg:shrink-0'>
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt={bannerAlt}
                    fill
                    sizes='(min-width: 1024px) 66vw, 100vw'
                    className='object-cover lg:rounded-sm'
                  />
                ) : (
                  <div className='absolute inset-0 grid place-items-center text-white/40 text-h-12 uppercase tracking-[0.12em]'>
                    Ingen banner
                  </div>
                )}
              </div>

              <div className='flex flex-1 flex-col gap-6 p-6 px-3.5 lg:order-1 lg:w-1/3 lg:px-10 lg:py-6'>
                <div className='space-y-3 lg:space-y-6'>
                  <span className='inline-block rounded-full border border-white/30 px-3 py-1 text-h-12 uppercase tracking-[0.12em]'>
                    Biljett
                  </span>
                  <h3 className='text-h-21 lg:text-h-37'>{ticket.title}</h3>
                  {when || venueTitle ? (
                    <div className='space-y-1 text-b-14 text-white/70 lg:text-b-16'>
                      {venueTitle ? <p>{venueTitle}</p> : null}
                      {when ? <p>{when}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className='mt-auto space-y-4'>
                  <p className='border-t border-white/15 pt-4 text-h-12 uppercase tracking-[0.12em] text-white'>
                    {ticket.price} {ticket.currency?.toUpperCase()}
                  </p>

                  {soldOut ? (
                    <button
                      type='button'
                      disabled
                      className='primary-button opacity-50 cursor-not-allowed'
                    >
                      Slutsåld
                    </button>
                  ) : (
                    <BuyTicketButton ticketId={ticket._id} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TicketsList;
