'use client';
import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import SanityImage from '@/components/Media/SanityImage';
import type { FetchHeaderResult } from '../../../sanity.types';

type HeaderLogoProps = {
  header: FetchHeaderResult | null;
  variant?: 'mobile' | 'desktop' | 'both';
};

const HeaderLogo = ({ header, variant = 'both' }: HeaderLogoProps) => {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const mobileLogo = header?.mobileLogo;
  const desktopLogo = header?.desktopLogo;

  if (!mobileLogo && !desktopLogo) return null;

  // Determine which logos to show based on variant
  const showMobileLogo = variant === 'mobile' || variant === 'both';
  const showDesktopLogo = variant === 'desktop' || variant === 'both';

  return (
    <>
      {isHome ? (
        <h1 className='lg:flex lg:col-span-full lg:row-span-1'>
          {mobileLogo && showMobileLogo && (
            <Link
              href='/'
              className='w-fit lg:hidden'
              aria-current='page'
              aria-label='homepage | PH Film & Media'
            >
              <SanityImage
                {...mobileLogo}
                className='max-h-full w-auto object-contain'
                aspectRatio='4/5'
              />
            </Link>
          )}
          {desktopLogo && showDesktopLogo && (
            <Link
              href='/'
              className='w-full h-full hidden lg:block'
              aria-current='page'
              aria-label='homepage | PH Film & Media'
            >
              <SanityImage
                {...desktopLogo}
                className='max-h-full w-auto object-contain'
                aspectRatio='4/5'
              />
            </Link>
          )}
        </h1>
      ) : (
        <div className='lg:flex w-full lg:col-span-full lg:row-span-1'>
          {mobileLogo && showMobileLogo && (
            <Link
              href='/'
              className='w-fit lg:hidden'
              aria-label='PH Film & Media homepage'
            >
              <SanityImage
                {...mobileLogo}
                className='max-h-full w-auto object-contain'
                aspectRatio='4/5'
              />
            </Link>
          )}
          {desktopLogo && showDesktopLogo && (
            <Link
              href='/'
              className='w-full h-fit hidden lg:block'
              aria-label='PH Film & Media homepage'
            >
              <SanityImage
                {...desktopLogo}
                className='max-h-full w-auto object-contain'
                aspectRatio='4/5'
              />
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default HeaderLogo;
