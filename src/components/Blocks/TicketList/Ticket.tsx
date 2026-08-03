import Image from 'next/image';

import { urlFor } from '@/sanity/lib/image';
import { BuyTicketCard } from './BuyTicketCard';
import { TicketGate } from './TicketGate';
import type { ITicketListBlock, TicketLabels } from '.';

type TicketData = NonNullable<ITicketListBlock['tickets']>[number];

const TZ = 'Europe/Stockholm';

const numericDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: TZ,
});

// Hero (single) — mobile "LÖR 11 JULI" + separate "10:30".
const weekday = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'short',
  timeZone: TZ,
});
const dayMonth = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  timeZone: TZ,
});
const timeOfDay = new Intl.DateTimeFormat('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TZ,
});

type TicketProps = {
  ticket: TicketData;
  labels?: TicketLabels;
  contactEmail?: string | null;
  membershipFeeLabel?: string;
};

/**
 * A single ticket card: poster + details on mobile, details + banner on desktop.
 * Rendered standalone when there's one ticket, or as a carousel slide when many.
 */
const Ticket = ({
  ticket,
  labels,
  contactEmail,
  membershipFeeLabel,
}: TicketProps) => {
  if (!ticket || !('_id' in ticket) || !('title' in ticket)) return null;

  // Editable labels (Settings → Ticket Settings) with Swedish fallbacks.
  // Price is intentionally not shown on the card — buyers see it at checkout.
  const viewingLabel = labels?.viewingLabel || 'Visning';
  const locationLabel = labels?.locationLabel || 'Plats';

  const venue = ticket.venue?.trim() || null;

  const sold = ticket.seatsSold ?? 0;
  const total = ticket.totalSeats ?? 0;
  const soldOut = total > 0 && sold >= total;

  const posterMedia = ticket.poster?.media?.asset ? ticket.poster.media : null;
  const bannerMedia = ticket.banner?.media?.asset
    ? ticket.banner.media
    : posterMedia;
  const posterUrl = posterMedia
    ? urlFor(posterMedia).width(1200).fit('max').url()
    : null;
  const bannerUrl = bannerMedia
    ? urlFor(bannerMedia).width(1920).fit('max').url()
    : null;
  const posterAlt = posterMedia?.alt ?? ticket.title ?? '';
  const bannerAlt = bannerMedia?.alt ?? ticket.title ?? '';

  const date = ticket.date ? new Date(ticket.date) : null;
  const desktopDate = date ? numericDate.format(date) : null;
  const mobileDate = date
    ? `${weekday.format(date)} ${dayMonth.format(date)}`.toUpperCase()
    : null;
  const time = date ? timeOfDay.format(date) : null;

  // Desktop pill. Purely visual: the whole desktop card (BuyTicketCard below)
  // is the actual button, so this is aria-hidden to avoid nesting two buttons.
  const action = soldOut ? (
    <div className='ticket-button cursor-not-allowed opacity-50'>
      <span>Slutsåld</span>
    </div>
  ) : (
    <div className='ticket-button' aria-hidden='true'>
      <span>Köp biljett</span>
    </div>
  );

  return (
    <TicketGate
      ticketId={ticket._id}
      contactEmail={contactEmail}
      membershipFeeLabel={membershipFeeLabel}
    >
      <div className='lg:flex lg:items-stretch'>
        {/* Mobile: the entire card opens the members-only gate */}
        <BuyTicketCard disabled={soldOut} className='lg:hidden'>
          {/* Poster (portrait) */}
          <div className='relative aspect-3/4 overflow-hidden rounded-lg bg-black/30'>
            {soldOut ? (
              <p className=' absolute top-2.5 right-2.5 z-10 bg-[#FF3131] text-white text-b-9 font-bold uppercase py-[0.5rem] px-2.5 rounded-lg w-fit'>
                Slutsåld
              </p>
            ) : null}
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={posterAlt}
                fill
                sizes='100vw'
                className='object-cover rounded-lg'
              />
            ) : (
              <div className='absolute inset-0 grid place-items-center text-white/40 text-h-12 uppercase tracking-[0.12em]'>
                Ingen poster
              </div>
            )}
          </div>

          {/* Details */}
          <div className='pt-2.5 space-y-4'>
            <h2 className='text-h-28 text-white/50'>{ticket.title}</h2>

            <div className='flex flex-col gap-[0.8rem]'>
              {mobileDate ? (
                <div className='flex items-baseline justify-between gap-4 text-b-16 uppercase'>
                  <p className='flex gap-2'>
                    <span className='font-bold text-white'>{mobileDate}</span>
                    {time ? (
                      <span className='text-white/40'> | {time}</span>
                    ) : null}
                  </p>
                </div>
              ) : null}

              {venue ? (
                <p className='text-b-16 font-bold uppercase text-white'>
                  {venue}
                </p>
              ) : null}
            </div>
          </div>
        </BuyTicketCard>

        {/* Desktop: the entire card (details + banner) opens the gate */}
        <BuyTicketCard
          disabled={soldOut}
          className='hidden lg:flex lg:items-stretch lg:w-full'
        >
          {/* details (left) */}
          <div className='lg:flex lg:w-1/3 lg:flex-col lg:gap-8 lg:justify-between lg:mr-[2.7rem] lg:border-b lg:border-white/15'>
            <div className='space-y-8'>
              <h2 className='text-h-28 font-bold'>{ticket.title}</h2>

              <dl className='space-y-2 text-b-16 2xl:text-b-21'>
                {desktopDate ? (
                  <div className='flex justify-between gap-8'>
                    <dt className='text-white/90'>{viewingLabel}</dt>
                    <dd className='text-right'>{desktopDate}</dd>
                  </div>
                ) : null}
                {venue ? (
                  <div className='flex justify-between gap-8'>
                    <dt className='text-white/90'>{locationLabel}</dt>
                    <dd className='text-right'>{venue}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className='flex justify-end pb-5'>
              <div className='flow-root'>{action}</div>
            </div>
          </div>

          {/* banner (landscape, falls back to poster) */}
          <div className='relative bg-black/30 lg:block lg:aspect-[16/9] lg:w-2/3'>
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt={bannerAlt}
                fill
                sizes='(min-width: 1024px) 66vw, 100vw'
                className='object-cover rounded-lg'
              />
            ) : (
              <div className='absolute inset-0 grid place-items-center text-white/40 text-h-12 uppercase tracking-[0.12em]'>
                Ingen banner
              </div>
            )}
          </div>
        </BuyTicketCard>
      </div>
    </TicketGate>
  );
};

export default Ticket;
