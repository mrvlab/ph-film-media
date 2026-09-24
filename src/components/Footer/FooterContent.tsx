import { Link } from 'next-view-transitions';
import { FetchFooterResult } from '../../../sanity.types';
import type { IMenuLink } from '../Header/DesktopMenuBar/DesktopMenuBar';
import {
  getLinkHref,
  getLinkRel,
  getLinkTarget,
  getLinkText,
} from '../Header/DesktopMenuBar/utils';
import FooterContactRow from './FooterContactRow';
import FooterMembershipCta from './FooterMembershipCta';

const currentYear = new Date().getFullYear();

const MENU_HEADING = 'Meny';
const DEFAULT_CTA_LABEL = 'Bli medlem';
const DEFAULT_CTA_TEXT =
  'Visningarna är endast för medlemmar. Ett säsongsmedlemskap ger dig möjlighet att köpa biljetter till alla filmer vi visar, från första till sista visningen.';

type IFooterContent = {
  data: FetchFooterResult;
  /** The header's navigation list — the footer menu mirrors it. */
  menuLinks: IMenuLink[] | null;
  membershipFeeLabel?: string;
};

// Compares two hrefs ignoring case and a trailing slash, so "/shop" and
// "/shop/" are treated as the same destination.
const normalizeHref = (href: string) =>
  href.trim().toLowerCase().replace(/\/+$/, '');

const MenuLink = ({ link }: { link: IMenuLink }) => {
  const href = getLinkHref(link);
  const label = getLinkText(link);

  if (!href || !label) return null;

  const isExternal = /^https?:\/\/|^mailto:|^tel:/.test(href);
  const className =
    'block py-2 text-b-16 text-white/70 transition-colors duration-300 hover:text-white';

  return (
    <li>
      {isExternal ? (
        <a
          href={href}
          target={getLinkTarget(link)}
          rel={getLinkRel(link)}
          className={className}
        >
          {label}
        </a>
      ) : (
        <Link href={href} className={className}>
          {label}
        </Link>
      )}
    </li>
  );
};

const FooterContent = ({
  data,
  menuLinks,
  membershipFeeLabel,
}: IFooterContent) => {
  if (!data) return null;

  const { email, ctaText, ctaLabel, contactLinks, rights } = data;
  const rows = contactLinks ?? [];

  // The contact strip already links to the newsletter (and anything else an
  // editor adds there), so drop those destinations from the menu column rather
  // than listing them twice.
  const rowHrefs = new Set(
    rows.map((row) => normalizeHref(getLinkHref(row))).filter(Boolean),
  );
  const links = (menuLinks ?? []).filter(
    (link) => !rowHrefs.has(normalizeHref(getLinkHref(link))),
  );

  return (
    <footer className='page-x-spacing flex flex-col gap-8 pt-8 pb-10 lg:gap-0 lg:pt-20'>
      <div className='flex flex-col gap-8 lg:grid lg:grid-cols-4 lg:gap-0 lg:border-b lg:border-white/20'>
        {links.length > 0 ? (
          <div className='flex flex-col gap-4 lg:col-span-2 lg:p-8'>
            <h2 className='text-b-16 font-bold uppercase text-subtext lg:hidden'>
              {MENU_HEADING}
            </h2>
            {/* CSS columns fill top-to-bottom before wrapping, so the desktop
                split reads as two lists rather than alternating rows. */}
            <ul className='lg:columns-2 lg:gap-16'>
              {links.map((link, index) => (
                <MenuLink key={link._key ?? index} link={link} />
              ))}
            </ul>
          </div>
        ) : null}

        <div className='flex flex-col gap-4 lg:col-span-2 lg:p-8'>
          <p className='text-b-16 text-white'>{ctaText || DEFAULT_CTA_TEXT}</p>
          <FooterMembershipCta
            label={ctaLabel || DEFAULT_CTA_LABEL}
            contactEmail={email}
            membershipFeeLabel={membershipFeeLabel}
          />
        </div>
      </div>

      {rows.length > 0 ? (
        <ul className='flex flex-col lg:grid lg:grid-cols-4 lg:border-b lg:border-white/20'>
          {rows.map((link, index) => (
            <FooterContactRow
              key={link._key ?? index}
              link={link}
              index={index}
              total={rows.length}
            />
          ))}
        </ul>
      ) : null}

      <div className='flex items-center justify-between lg:px-8 lg:pt-8'>
        <p className='text-b-12 text-white'>
          © {currentYear}
          {rights ? ` ${rights}` : ''}
        </p>
      </div>
    </footer>
  );
};

export default FooterContent;
