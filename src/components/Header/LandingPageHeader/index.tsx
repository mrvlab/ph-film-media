'use client';
import React from 'react';
import MobileMenuBar from '../MobileMenuBar/MobileMenuBar';
import { FetchHeaderResult } from '../../../../sanity.types';
import { useHeaderHeight } from './useHeaderHeight';

const LandingPageHeader = ({ header }: { header: FetchHeaderResult }) => {
  const headerRef = useHeaderHeight();

  return (
    <nav
      ref={headerRef}
      className='max-lg:min-h-[5.148rem] max-lg:mt-5 z-50 fixed lg:relative lg:px-p-desktop lg:pt-6'
      role='navigation'
      aria-label='Main menu'
    >
      <div className='z-50 lg:py-5 lg:top-0 lg:w-full'>
        <MobileMenuBar header={header} />
      </div>
    </nav>
  );
};

export default LandingPageHeader;
