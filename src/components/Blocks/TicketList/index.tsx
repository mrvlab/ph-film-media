import type {
  FetchHomeResult,
  FetchPageResult,
  SettingsQueryResult,
} from '../../../../sanity.types';
import { sanityFetch } from '@/sanity/lib/live';
import { fetchFooter, settingsQuery } from '@/sanity/lib/queries';
import { formatMembershipFee } from '@/lib/members/membershipFee';
import Ticket from './Ticket';
import { TicketCarousel } from './TicketCarousel';

export type ITicketListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'ticketList' }
>;

export type TicketLabels = NonNullable<SettingsQueryResult>['ticketLabels'];

const TicketList = async (block: ITicketListBlock) => {
  if (block._type !== 'ticketList') return null;

  const tickets = block.tickets ?? [];
  if (tickets.length === 0) return null;
  const count = tickets.length;

  // Editable labels from Settings → Ticket Settings. This query is deduped with
  // the one the page already runs, so it's not an extra round-trip.
  const { data: settings } = await sanityFetch({ query: settingsQuery });
  const labels = settings?.ticketLabels ?? null;

  const { data: footer } = await sanityFetch({ query: fetchFooter });
  const contactEmail = footer?.email ?? null;

  const membershipFeeLabel = formatMembershipFee(
    settings?.membership?.fee,
    settings?.membership?.currency,
  );

  // Section title: plural for multiple, singular for one. Hidden via the block toggle.
  const showTitle = block.showTitle !== false;
  const sectionTitle = showTitle
    ? count > 1
      ? labels?.titlePlural || 'Visningar'
      : labels?.titleSingular || 'Visning'
    : null;

  // Bottom spacing defaults to true when unset (40px mobile / 80px desktop).
  const bottomSpacingClass = block.bottomSpacing !== false ? 'mb-20' : '';

  // The same Ticket card is used throughout; only the wrapper differs:
  // one ticket → standalone, many → peeking carousel.
  if (count > 1) {
    return (
      <TicketCarousel heading={sectionTitle} className={bottomSpacingClass}>
        {tickets.map((ticket, i) => (
          <Ticket
            key={('_id' in ticket && ticket._id) || i}
            ticket={ticket}
            labels={labels}
            contactEmail={contactEmail}
            membershipFeeLabel={membershipFeeLabel}
          />
        ))}
      </TicketCarousel>
    );
  }

  return (
    <section
      key={block._key || 'ticketList'}
      className={`page-x-spacing flex flex-col gap-2.5 h-fit uppercase lg:gap-3 ${bottomSpacingClass}`}
      data-sanity-edit-target
    >
      {sectionTitle ? (
        <h2 className='text-h-67 lg:text-h-37 !leading-[1]'>{sectionTitle}</h2>
      ) : null}

      <Ticket
        ticket={tickets[0]}
        labels={labels}
        contactEmail={contactEmail}
        membershipFeeLabel={membershipFeeLabel}
      />
    </section>
  );
};

export default TicketList;
