'use client';

import React, { useState } from 'react';
import DesktopMenuBar from '@/components/Header/DesktopMenuBar';
import { FetchHeaderResult } from '../../../../sanity.types';

type ILandingPageNavItems = {
  isLandingPage: boolean;
  header: FetchHeaderResult;
};

const LandingPageNavItems = ({ header }: ILandingPageNavItems) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!header) return null;

  return (
    <div className='flex'>
      <DesktopMenuBar
        header={header}
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export default LandingPageNavItems;
