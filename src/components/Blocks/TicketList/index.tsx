import type {
  FetchHomeResult,
  FetchPageResult,
  SettingsQueryResult,
} from '../../../../sanity.types';
import { sanityFetch } from '@/sanity/lib/live';
import { fetchFooter, settingsQuery } from '@/sanity/lib/queries';
import { formatMembershipFee } from '@/lib/members/membershipFee';
import TrackListView from '@/components/Analytics/TrackListView';
import { toTicketItem } from './analyticsItem';
import Ticket from './Ticket';
import { TicketCarousel } from './TicketCarousel';
import { TicketColumn } from './TicketColumn';

export type ITicketListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'ticketList' }
>;

export type TicketLabels = NonNullable<SettingsQueryResult>['ticketLabels'];

// `columnLayout` is set by the page when this is the only block on /shop, so the
// tickets stack vertically as big cards instead of a peeking carousel — the page
// would otherwise look empty with a single horizontal module.
type ITicketListProps = ITicketListBlock & { columnLayout?: boolean };

const TicketList = async (block: ITicketListProps) => {
  if (block._type !== 'ticketList') return null;

  const columnLayout = block.columnLayout === true;

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

  // Rendered exactly once per block — the solo-/shop layout renders the cards
  // twice (mobile carousel + desktop column) and both mount, so a tracker in
  // each branch would report the impression twice.
  const trackedItems = tickets.map(toTicketItem).filter((item) => item !== null);
  const currency = tickets.find((t) => t && 'currency' in t)?.currency ?? null;
  const listTracker = (
    <TrackListView
      listId='tickets'
      listName='Visningar'
      items={trackedItems}
      currency={currency}
    />
  );

  const ticketCards = tickets.map((ticket, i) => (
    <Ticket
      key={('_id' in ticket && ticket._id) || i}
      ticket={ticket}
      labels={labels}
      contactEmail={contactEmail}
      membershipFeeLabel={membershipFeeLabel}
    />
  ));

  // One ticket → standalone big card.
  if (count === 1) {
    return (
      <section
        key={block._key || 'ticketList'}
        className={`page-x-spacing flex flex-col gap-2.5 h-fit uppercase lg:gap-10 ${bottomSpacingClass}`}
        data-sanity-edit-target
      >
        {listTracker}
        {sectionTitle ? (
          <h2 className='text-h-67 lg:text-h-37 !leading-[1]'>{sectionTitle}</h2>
        ) : null}
        {ticketCards}
      </section>
    );
  }

  // Many tickets → peeking carousel.
  const carousel = (
    <TicketCarousel heading={sectionTitle} className={bottomSpacingClass}>
      {ticketCards}
    </TicketCarousel>
  );

  if (!columnLayout)
    return (
      <>
        {listTracker}
        {carousel}
      </>
    );

  // Solo /shop block: keep the carousel on mobile, but stack the big cards as a
  // vertical column on desktop so the otherwise-empty page fills out.
  return (
    <>
      {listTracker}
      <div className='lg:hidden'>{carousel}</div>
      <section
        key={block._key || 'ticketList'}
        className={`hidden page-x-spacing h-fit uppercase lg:flex lg:flex-col lg:gap-16 ${bottomSpacingClass}`}
        data-sanity-edit-target
      >
        {sectionTitle ? (
          <h2 className='text-h-67 lg:text-h-37 !leading-[1]'>{sectionTitle}</h2>
        ) : null}
        <TicketColumn>{ticketCards}</TicketColumn>
      </section>
    </>
  );
};

export default TicketList;
