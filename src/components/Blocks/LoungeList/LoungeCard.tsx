'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type MotionProps } from 'framer-motion';
import SanityImage from '@/components/Media/SanityImage';
import VideoOverlay from '@/components/VideoOverlay/VideoOverlay';
import { extractVideoInfo } from '@/components/VideoOverlay/videoUtils';
import { ILoungeItem } from '.';

// Outlined play triangle, sized via className.
const PlayTriangle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox='0 0 80 80'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
  >
    <path
      d='M5.9375 2.1875C28.5139 14.7511 51.0902 27.3147 73.75 39.9141C59.9348 47.6144 46.1911 55.2789 32.3998 62.9672L5.9375 77.7718V2.1875Z'
      stroke='var(--color-white)'
      strokeWidth='2.38399'
      strokeMiterlimit='10'
    />
  </svg>
);

type LoungeCardProps = {
  lounge: ILoungeItem;
  number: number;
  index: number;
  revealRef: (el: HTMLDivElement | null) => void;
  revealProps: MotionProps;
};

const LoungeCard = ({
  lounge,
  number,
  index,
  revealRef,
  revealProps,
}: LoungeCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!lounge || !('_id' in lounge)) return null;
  const { title, link, loungeImage } = lounge;

  const externalLink = link?.externalLink ?? '';
  const { platform, id: videoId } = extractVideoInfo(externalLink);
  const isVideo = Boolean(platform && videoId);

  const isExternal = link?.linkType === 'externalLink';
  const internalSlug = link?.internalLink?.slug?.current?.trim();
  const href = isVideo
    ? null
    : isExternal
      ? externalLink || null
      : internalSlug
        ? internalSlug === '/'
          ? '/'
          : `/${internalSlug.replace(/^\/+/, '')}`
        : null;

  const openOverlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const loungeLabel = `Salongen #${number}`;

  const rootClassName =
    'group block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500';

  const renderImage = (playIconClassName: string) => (
    <div className='relative overflow-hidden rounded-lg'>
      {loungeImage?.media && (
        <SanityImage
          {...loungeImage}
          aspectRatio='16/9'
          className='transition-transform duration-500 ease-out group-hover:scale-105'
        />
      )}
      <span className='absolute inset-0 flex items-center justify-center'>
        <PlayTriangle className={playIconClassName} />
      </span>
    </div>
  );

  const content = (
    <>
      {/* Mobile layout */}
      <div className='flex items-start gap-4 lg:hidden'>
        <div className='w-[42%] shrink-0'>{renderImage('h-10 w-10')}</div>
        <div className='flex flex-1 h-full flex-col gap-3 pt-1'>
          <h3 className='text-b-21 !font-lato font-bold'>{title}</h3>
          <p className='text-b-14 text-gray'>{loungeLabel}</p>
        </div>
      </div>

      {/* Desktop layout */}
      <div className='hidden lg:grid lg:grid-cols-24 lg:items-stretch lg:gap-x-[2rem]'>
        <p className='text-b-16 text-gray lg:col-start-1 lg:col-span-5 lg:self-start'>
          {loungeLabel}
        </p>
        <div className='lg:col-start-6 lg:col-span-7 lg:self-start'>
          {renderImage('h-20 w-20 2xl:h-24 2xl:w-24')}
        </div>
        <h3 className='text-b-37 !font-lato font-bold lg:col-start-13 lg:col-span-12 lg:self-start lg:h-full lg:border-b lg:border-white/20'>
          {title}
        </h3>
      </div>
    </>
  );

  // The overlay (position: fixed) is kept OUTSIDE the reveal wrapper's transform.
  let inner: React.ReactNode;
  let overlay: React.ReactNode = null;

  if (isVideo && platform && videoId) {
    inner = (
      <button
        type='button'
        onClick={openOverlay}
        aria-label={`Play video for ${title ?? 'lounge item'}`}
        className={rootClassName}
      >
        {content}
      </button>
    );
    overlay = (
      <VideoOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        platform={platform}
        videoId={videoId}
      />
    );
  } else if (href) {
    inner = (
      <Link
        href={href}
        aria-label={title ?? 'Lounge item'}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={rootClassName}
      >
        {content}
      </Link>
    );
  } else {
    inner = <div className={rootClassName}>{content}</div>;
  }

  return (
    <>
      <motion.div ref={revealRef} data-index={index} {...revealProps}>
        {inner}
      </motion.div>
      {overlay}
    </>
  );
};

export default LoungeCard;
