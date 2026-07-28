import React from 'react';
import Marquee from 'react-fast-marquee';

type IInPartnerWith = {
  items?: Array<string> | null;
};

const InPartnerWith = ({ items }: IInPartnerWith) => {
  if (!items?.length) return null;

  return (
    <section
      className='bg-apricot sticky top-[var(--header-height-mobile)] lg:top-0 z-30 h-[3rem] lg:h-[4rem] flex items-center overflow-hidden'
      data-sanity-edit-target
    >
      <Marquee autoFill speed={40} className='w-full'>
        <ul className='flex items-center gap-16 pr-16'>
          {items.map((text, idx) => (
            <li
              key={idx}
              className='text-b-12 lg:text-b-16 font-oswald font-bold text-black uppercase whitespace-nowrap'
            >
              {text}
            </li>
          ))}
        </ul>
      </Marquee>
    </section>
  );
};

export default InPartnerWith;
