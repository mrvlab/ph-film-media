'use client';

import React, { useEffect, useState } from 'react';
import MobileMenuBar from './MobileMenuBar/MobileMenuBar';
import DesktopMenuBar from './DesktopMenuBar';
import type { FetchHeaderResult } from '../../../sanity.types';

type IHeaderNav = {
  header: FetchHeaderResult;
};

const HeaderNav: React.FC<IHeaderNav> = ({ header }) => {
  // Lives here (not in DesktopMenuBar) so the whole nav can be raised above
  // <main> while open — it's the stacking root for the in-flow backdrop/panel.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <nav
      className={`fixed max-lg:min-h-[5.148rem] max-lg:mt-5 z-40 lg:relative lg:grid lg:col-span-2 lg:row-span-full lg:pl-p-desktop lg:py-p-desktop ${
        isOpen ? 'lg:z-[1000]' : ''
      }`}
      role='navigation'
      aria-label='Main menu'
      data-sanity-edit-target
    >
      <div className='z-50 lg:grid lg:grid-cols-1 lg:grid-rows-1 lg:h-full'>
        <MobileMenuBar header={header} />
        <DesktopMenuBar
          header={header}
          isOpen={isOpen}
          onToggle={() => setIsOpen((prev) => !prev)}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </nav>
  );
};

export default HeaderNav;
