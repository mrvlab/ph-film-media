import { Link } from 'next-view-transitions';
import type { IMenuLink } from '../Header/DesktopMenuBar/DesktopMenuBar';
import {
  getLinkHref,
  getLinkRel,
  getLinkTarget,
  getLinkText,
} from '../Header/DesktopMenuBar/utils';

type IFooterContactRow = {
  link: IMenuLink;
  /** Position in the row list — drives the desktop divider and mobile borders. */
  index: number;
  total: number;
};

/**
 * One cell of the footer's contact strip. On mobile the cells stack with white
 * rules between them; on desktop they sit in a four-column row whose only
 * vertical divider is the one at the halfway mark.
 */
const FooterContactRow = ({ link, index, total }: IFooterContactRow) => {
  const href = getLinkHref(link);
  const label = getLinkText(link);

  if (!href || !label) return null;

  const isExternal = /^https?:\/\/|^mailto:|^tel:/.test(href);
  const isLast = index === total - 1;

  // Desktop: a single divider halfway across, matching the design's 2 + 2 split.
  const dividerClass =
    index % 2 === 1 && !isLast ? 'lg:border-r lg:border-white/20' : '';
  const mobileBorderClass = `border-t border-white/20 ${isLast ? 'border-b' : ''} lg:border-t-0 lg:border-b-0`;

  const content = (
    <>
      <span className='text-b-16 uppercase'>{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src='/icons/arrow-up-right.svg'
        alt=''
        aria-hidden='true'
        className='size-6 shrink-0'
      />
    </>
  );

  const className = `flex items-center justify-between gap-4 py-4 pl-8 pr-4 text-white transition-opacity hover:opacity-70 ${mobileBorderClass} ${dividerClass}`;

  return (
    <li className='contents'>
      {isExternal ? (
        <a
          href={href}
          target={getLinkTarget(link)}
          rel={getLinkRel(link)}
          className={className}
        >
          {content}
        </a>
      ) : (
        <Link href={href} className={className}>
          {content}
        </Link>
      )}
    </li>
  );
};

export default FooterContactRow;
