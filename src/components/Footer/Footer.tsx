import { sanityFetch } from '@/sanity/lib/live';
import { fetchFooter, fetchHeader, settingsQuery } from '@/sanity/lib/queries';
import { formatMembershipFee } from '@/lib/members/membershipFee';
import FooterContent from './FooterContent';

const Footer = async () => {
  // The menu column mirrors the main navigation, so it reads the same Sanity
  // list the header does — these fetches are deduped with the header's own.
  const [{ data: footer }, { data: header }, { data: settings }] =
    await Promise.all([
      sanityFetch({ query: fetchFooter }),
      sanityFetch({ query: fetchHeader }),
      sanityFetch({ query: settingsQuery }),
    ]);

  return (
    <FooterContent
      data={footer}
      menuLinks={header?.linkReference ?? null}
      membershipFeeLabel={formatMembershipFee(
        settings?.membership?.fee,
        settings?.membership?.currency,
      )}
    />
  );
};

export default Footer;
