'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SanityImage from '@/components/Media/SanityImage';
import VideoOverlay from '@/components/VideoOverlay/VideoOverlay';
import { extractVideoInfo } from '@/components/VideoOverlay/videoUtils';
import { ILoungeItem } from '.';

// "2026-07-11" -> "JULY 11, 2026"
const formatLoungeDate = (date: string | null | undefined) => {
  if (!date) return '';
  return new Date(date)
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
};

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

const LoungeCard = ({ lounge }: { lounge: ILoungeItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!lounge || !('_id' in lounge)) return null;
  const { title, date, link, loungeImage } = lounge;

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

  const formattedDate = formatLoungeDate(date);

  const rootClassName =
    'group block w-full text-left border-b border-white/20 pb-8 pt-8 first:pt-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500';

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
        <div className='flex flex-1 flex-col gap-3 pt-1'>
          <h3 className='text-b-16 !font-lato font-bold'>{title}</h3>
          {formattedDate && (
            <p className='text-b-14 text-gray'>{formattedDate}</p>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className='hidden lg:grid lg:grid-cols-24 lg:items-center lg:gap-x-2'>
        {formattedDate && (
          <p className='text-b-16 text-gray lg:col-start-1 lg:col-span-3'>
            {formattedDate}
          </p>
        )}
        <div className='lg:col-start-4 lg:col-span-6'>
          {renderImage('h-20 w-20 2xl:h-24 2xl:w-24')}
        </div>
        <h3 className='text-b-37 !font-lato font-bold lg:col-start-11 lg:col-span-14'>
          {title}
        </h3>
      </div>
    </>
  );

  if (isVideo && platform && videoId) {
    return (
      <>
        <button
          type='button'
          onClick={openOverlay}
          aria-label={`Play video for ${title ?? 'lounge item'}`}
          className={rootClassName}
        >
          {content}
        </button>
        <VideoOverlay
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          platform={platform}
          videoId={videoId}
        />
      </>
    );
  }

  if (href) {
    return (
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
  }

  return <div className={rootClassName}>{content}</div>;
};

export default LoungeCard;
