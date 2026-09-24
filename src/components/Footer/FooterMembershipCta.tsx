'use client';

import { TicketGate, useTicketGate } from '../Membership/TicketGate';

type IFooterMembershipCta = {
  label: string;
  contactEmail?: string | null;
  membershipFeeLabel?: string;
};

const CtaButton = ({ label }: { label: string }) => {
  const openGate = useTicketGate();

  return (
    <button
      type='button'
      onClick={openGate}
      className='primary-button flex w-full items-center justify-center px-8 py-4 text-b-16 lg:text-b-16'
    >
      <span>{label}</span>
    </button>
  );
};

/**
 * Footer membership CTA. Opens the same gate as a ticket, but in membership
 * mode: it sells the membership on its own, with no screening behind it.
 */
const FooterMembershipCta = ({
  label,
  contactEmail,
  membershipFeeLabel,
}: IFooterMembershipCta) => (
  <TicketGate
    mode='membership'
    contactEmail={contactEmail}
    membershipFeeLabel={membershipFeeLabel}
  >
    <CtaButton label={label} />
  </TicketGate>
);

export default FooterMembershipCta;
