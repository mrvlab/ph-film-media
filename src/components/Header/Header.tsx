import MobileMenuBar from './MobileMenuBar/MobileMenuBar';
import { sanityFetch } from '@/sanity/lib/live';
import { fetchHeader } from '@/sanity/lib/queries';

import DesktopMenuBar from './DesktopMenuBar';

const Header = async () => {
  const { data: header } = await sanityFetch({ query: fetchHeader });

  return (
    <>
      <nav
        className='fixed max-lg:min-h-[5.148rem] max-lg:mt-5 z-40 lg:relative lg:grid lg:col-span-2 lg:row-span-full lg:pl-p-desktop lg:py-p-desktop'
        role='navigation'
        aria-label='Main menu'
      >
        <div className='z-50 lg:grid lg:grid-cols-1 lg:grid-rows-2'>
          <MobileMenuBar header={header} />
          <DesktopMenuBar header={header} />
        </div>
      </nav>
    </>
  );
};

export default Header;
